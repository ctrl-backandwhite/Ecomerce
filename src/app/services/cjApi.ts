/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  Supplier API — Integración NEXA                                 ║
 * ║                                                                  ║
 * ║  ⚠️  SEGURIDAD: En producción mueve la API key a .env           ║
 * ║       VITE_CJ_API_KEY=tu_clave                                   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

// ⚠️ Reemplaza por import.meta.env.VITE_CJ_API_KEY en producción
const CJ_API_KEY =
  (import.meta as any).env?.VITE_CJ_API_KEY ??
  "CJ5236391@api@1dfb48a4f5834860a21e24f39493580b";

// ── LocalStorage keys ──────────────────────────────────────────────
const LS_ACCESS  = "nexa_cj_access_token";
const LS_EXPIRY  = "nexa_cj_token_expiry";
const LS_REFRESH = "nexa_cj_refresh_token";

// ── API envelope ───────────────────────────────────────────────────
interface CJEnvelope<T> {
  code: number;
  result: boolean;
  message: string;
  data: T;
}

// ── Auth payload ───────────────────────────────────────────────────
interface CJAuthData {
  accessToken: string;
  accessTokenExpiryDate: string;   // "YYYY-MM-DD HH:mm:ss"
  refreshToken: string;
  refreshTokenExpiryDate: string;
  email: string;
  roleName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  try {
    const token  = localStorage.getItem(LS_ACCESS);
    const expiry = localStorage.getItem(LS_EXPIRY);
    if (!token || !expiry) return null;
    // Buffer de 5 minutos antes del vencimiento
    const expiryMs = new Date(expiry.replace(" ", "T")).getTime();
    if (expiryMs - 5 * 60_000 <= Date.now()) return null;
    return token;
  } catch {
    return null;
  }
}

function storeTokens(auth: CJAuthData): void {
  try {
    localStorage.setItem(LS_ACCESS,  auth.accessToken);
    localStorage.setItem(LS_EXPIRY,  auth.accessTokenExpiryDate);
    localStorage.setItem(LS_REFRESH, auth.refreshToken);
  } catch { /* ignore en entornos sin localStorage */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

/**
 * In-flight singleton for token acquisition.
 *
 * Problem solved: if two API calls fire simultaneously and both find no valid
 * token in localStorage (e.g. on app boot), without this guard they would each
 * call fetchNewAccessToken() independently — wasting one auth round-trip and
 * potentially causing a race where the second call overwrites the first token.
 *
 * Solution: the first caller creates a promise and stores it here; every
 * subsequent caller awaits the SAME promise. When it resolves, all callers
 * get the same token. The reference is cleared when the promise settles so
 * the next legitimate refresh starts a fresh promise.
 */
let _tokenInflight: Promise<string> | null = null;

/** Obtiene un token nuevo usando la API key */
async function fetchNewAccessToken(): Promise<string> {
  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  });
  if (!res.ok) throw new Error(`CJ Auth HTTP ${res.status}`);
  const json: CJEnvelope<CJAuthData> = await res.json();
  if (!json.result) throw new Error(json.message || "CJ auth fallida");
  storeTokens(json.data);
  return json.data.accessToken;
}

/** Renueva el token usando el refreshToken almacenado */
async function doRefreshToken(): Promise<string> {
  const rt = localStorage.getItem(LS_REFRESH);
  if (!rt) return fetchNewAccessToken();
  try {
    const res = await fetch(`${CJ_BASE}/authentication/refreshAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return fetchNewAccessToken();
    const json: CJEnvelope<CJAuthData> = await res.json();
    if (!json.result) return fetchNewAccessToken();
    storeTokens(json.data);
    return json.data.accessToken;
  } catch {
    return fetchNewAccessToken();
  }
}

/**
 * Devuelve siempre un token válido.
 *
 * Priority chain:
 *   1. localStorage hit (not expired) → return immediately, zero network calls
 *   2. In-flight promise exists        → reuse it (deduplicates concurrent requests)
 *   3. refreshToken in storage         → attempt silent refresh
 *   4. Fallback                        → full re-authentication with API key
 */
async function getValidToken(): Promise<string> {
  // Fast path — valid token already in localStorage
  const cached = getStoredToken();
  if (cached) return cached;

  // Deduplicate concurrent callers: if a fetch is already in flight, await it
  if (_tokenInflight) return _tokenInflight;

  // Start a new acquisition and store the promise so concurrent callers share it
  const rt = localStorage.getItem(LS_REFRESH);
  _tokenInflight = (rt ? doRefreshToken() : fetchNewAccessToken()).finally(() => {
    _tokenInflight = null; // clear once settled so the next refresh starts fresh
  });

  return _tokenInflight;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch genérico con auto-retry en 401
// ─────────────────────────────────────────────────────────────────────────────

async function cjFetch<T>(
  method: "GET" | "POST",
  path: string,
  queryOrBody?: Record<string, string | number | boolean>,
  retry = true,
): Promise<T> {
  const token = await getValidToken();

  let url = `${CJ_BASE}${path}`;
  if (method === "GET" && queryOrBody) {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(queryOrBody).map(([k, v]) => [k, String(v)]),
      ),
    );
    url += `?${params}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      "CJ-Access-Token": token,
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "POST" && queryOrBody
      ? { body: JSON.stringify(queryOrBody) }
      : {}),
  });

  // Si el token expiró en el servidor, borramos caché y reintentamos una vez
  if (res.status === 401 && retry) {
    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_EXPIRY);
    return cjFetch<T>(method, path, queryOrBody, false);
  }

  if (!res.ok) throw new Error(`CJ HTTP ${res.status}`);

  const json: CJEnvelope<T> = await res.json();
  if (!json.result) throw new Error(json.message || "Error en la API del proveedor");
  return json.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────────────────────────

// ── Categorías — estructura jerárquica que devuelve /product/getCategory ──────

/** Categoría hoja (nivel 3) */
export interface CJCategoryLeaf {
  categoryId:   string;
  categoryName: string;
}

/** Categoría de segundo nivel */
export interface CJCategorySecond {
  categorySecondId:   string;
  categorySecondName: string;
  categorySecondList: CJCategoryLeaf[];
}

/** Categoría raíz (nivel 1) */
export interface CJCategoryFirst {
  categoryFirstId:   string;
  categoryFirstName: string;
  categoryFirstList: CJCategorySecond[];
}

/**
 * Forma aplanada que expone la capa de repositorio al resto de la app.
 * `level` permite reconstruir el árbol si es necesario.
 */
export interface CJCategory {
  categoryId:   string;
  categoryName: string;
  parentId:     string | null;
  level:        1 | 2 | 3;
}

// ── Respuesta cruda de la API (envuelta en CJEnvelope<CJCategoryFirst[]>) ─────
type CJCategoryApiResponse = CJCategoryFirst[];

// ── Función de aplanamiento ───────────────────────────────────────────────────
/**
 * Convierte la jerarquía de 3 niveles en una lista plana de CJCategory.
 * Útil tanto para el resultado de la API real como para los datos de mock.
 */
export function flattenCJCategories(data: CJCategoryApiResponse): CJCategory[] {
  const result: CJCategory[] = [];

  for (const first of data ?? []) {
    result.push({
      categoryId:   first.categoryFirstId,
      categoryName: first.categoryFirstName,
      parentId:     null,
      level:        1,
    });

    for (const second of first.categoryFirstList ?? []) {
      result.push({
        categoryId:   second.categorySecondId,
        categoryName: second.categorySecondName,
        parentId:     first.categoryFirstId,
        level:        2,
      });

      for (const leaf of second.categorySecondList ?? []) {
        result.push({
          categoryId:   leaf.categoryId,
          categoryName: leaf.categoryName,
          parentId:     second.categorySecondId,
          level:        3,
        });
      }
    }
  }

  return result;
}

export interface CJProduct {
  pid: string;
  productNameEn: string;
  productImage: string;
  sellPrice: number;
  productWeight?: number;
  categoryId?: string;
  categoryName?: string;
  productType?: string;
  remark?: string;
}

/**
 * Producto en la respuesta de /product/listV2.
 *
 * La API real usa nombres de campo diferentes a los del endpoint /product/query.
 *   • `id`        (en vez de `pid`)
 *   • `nameEn`    (en vez de `productNameEn`)
 *   • `bigImage`  (en vez de `productImage`)
 *   • `sellPrice` es string:  "3.69"  o  "4.36 -- 6.14"  (rango min–max)
 */
export interface CJProductListItem {
  id:                     string;
  nameEn:                 string;
  sku:                    string;
  bigImage:               string;
  /** Precio como string: valor único o rango separado por " -- " */
  sellPrice:              string | null;
  categoryId?:            string;
  warehouseInventoryNum?: number;
  listedNum?:             number;
  productType?:           string;
  isVideo?:               number;
  isPersonalized?:        number;
}

export interface CJProductVariant {
  vid: string;
  variantImage?: string;
  variantSku: string;
  variantPrice: number;
  variantStock: number;
  variantNameEn?: string;
  variantKey?: string;
  variantName?: string;
}

export interface CJProductDetail extends CJProduct {
  description?: string;
  productUnit?: string;
  productSku?: string;
  productImages?: string[];
  variants?: CJProductVariant[];
  productDimensionUnit?: string;
  productDimensionLength?: number;
  productDimensionWidth?: number;
  productDimensionHeight?: number;
}

export interface CJProductListResult {
  items:    CJProductListItem[];
  total:    number;
  pageNum:  number;
  pageSize: number;
}

export interface ListCJProductsParams {
  page?: number;
  size?: number;
  keyWord?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  orderBy?: "PRICE_ASC" | "PRICE_DESC" | "CREATED_AT";
}

// ─────────────────────────────────────────────────────────────────────────────
// Funciones públicas
// ─────────────────────────────────────────────────────────────────────────────

/** Obtiene la lista de categorías CJ y la aplana en un solo nivel */
export async function getCJCategories(): Promise<CJCategory[]> {
  const raw = await cjFetch<CJCategoryApiResponse>("GET", "/product/getCategory");
  return flattenCJCategories(raw);
}

/** Lista productos con paginación y filtros */
export async function listCJProducts(
  params: ListCJProductsParams = {},
): Promise<CJProductListResult> {
  const q: Record<string, string | number> = {
    page: params.page ?? 1,
    size: params.size ?? 20,
  };
  if (params.keyWord)                q.keyWord    = params.keyWord;
  if (params.categoryId)             q.categoryId = params.categoryId;
  if (params.minPrice !== undefined) q.minPrice   = params.minPrice;
  if (params.maxPrice !== undefined) q.maxPrice   = params.maxPrice;
  if (params.orderBy)                q.orderBy    = params.orderBy;

  // La API real devuelve data.content[0].productList + paginación con totalRecords / pageNumber
  const raw = await cjFetch<{
    pageSize:     number;
    pageNumber:   number;
    totalRecords: number;
    totalPages:   number;
    content: Array<{ productList: CJProductListItem[] }>;
  }>("GET", "/product/listV2", q);

  const items = raw.content?.[0]?.productList ?? [];

  return {
    items,
    total:    raw.totalRecords ?? 0,
    pageNum:  raw.pageNumber   ?? 1,
    pageSize: raw.pageSize     ?? (params.size ?? 20),
  };
}

/** Detalle completo de un producto por PID */
export async function getCJProductDetail(pid: string): Promise<CJProductDetail> {
  return cjFetch<CJProductDetail>("GET", "/product/query", { pid });
}