/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  CJ Dropshipping API — Integración NEXA                         ║
 * ║                                                                  ║
 * ║  Docs: https://developers.cjdropshipping.com                    ║
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

/** Devuelve siempre un token válido (caché → refresh → nuevo) */
async function getValidToken(): Promise<string> {
  const cached = getStoredToken();
  if (cached) return cached;
  const rt = localStorage.getItem(LS_REFRESH);
  return rt ? doRefreshToken() : fetchNewAccessToken();
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
  if (!json.result) throw new Error(json.message || "Error en CJ API");
  return json.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────────────────────────

export interface CJCategory {
  categoryId: string;
  categoryName: string;
  categoryEnName?: string;
  categoryType?: number;
  parentId?: string;
  productCount?: number;
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
  list: CJProduct[];
  total: number;
  pageNum: number;
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

/** Obtiene la lista de categorías CJ */
export async function getCJCategories(): Promise<CJCategory[]> {
  return cjFetch<CJCategory[]>("GET", "/product/getCategory");
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

  return cjFetch<CJProductListResult>("GET", "/product/listV2", q);
}

/** Detalle completo de un producto por PID */
export async function getCJProductDetail(pid: string): Promise<CJProductDetail> {
  return cjFetch<CJProductDetail>("GET", "/product/query", { pid });
}
