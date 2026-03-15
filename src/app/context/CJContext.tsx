import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  getCJCategories,
  listCJProducts,
  getCJProductDetail,
  type CJCategory,
  type CJProduct,
  type CJProductDetail,
  type ListCJProductsParams,
} from "../services/cjApi";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos del contexto
// ─────────────────────────────────────────────────────────────────────────────

interface CJContextValue {
  // Categorías
  categories: CJCategory[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  loadCategories: () => Promise<void>;

  // Lista de productos
  products: CJProduct[];
  productsTotal: number;
  productsPage: number;
  productsPageSize: number;
  productsLoading: boolean;
  productsError: string | null;
  fetchProducts: (params?: ListCJProductsParams) => Promise<void>;

  // Detalle de producto
  productDetail: CJProductDetail | null;
  detailLoading: boolean;
  detailError: string | null;
  fetchProductDetail: (pid: string) => Promise<void>;
  clearDetail: () => void;

  // Parámetros de búsqueda activos
  activeParams: ListCJProductsParams;
  setActiveParams: (p: ListCJProductsParams) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contexto
// ─────────────────────────────────────────────────────────────────────────────

const CJContext = createContext<CJContextValue | null>(null);

export function CJProvider({ children }: { children: ReactNode }) {
  /* ── Categorías ─────────────────────────────────────────────── */
  const [categories,       setCategories]       = useState<CJCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError,  setCategoriesError]  = useState<string | null>(null);
  const catsLoaded = useRef(false);

  /* ── Lista productos ────────────────────────────────────────── */
  const [products,         setProducts]         = useState<CJProduct[]>([]);
  const [productsTotal,    setProductsTotal]    = useState(0);
  const [productsPage,     setProductsPage]     = useState(1);
  const [productsPageSize, setProductsPageSize] = useState(20);
  const [productsLoading,  setProductsLoading]  = useState(false);
  const [productsError,    setProductsError]    = useState<string | null>(null);

  /* ── Detalle ────────────────────────────────────────────────── */
  const [productDetail,  setProductDetail]  = useState<CJProductDetail | null>(null);
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [detailError,    setDetailError]    = useState<string | null>(null);

  /* ── Params activos ─────────────────────────────────────────── */
  const [activeParams, setActiveParams] = useState<ListCJProductsParams>({
    page: 1,
    size: 20,
  });

  /* ── Handlers ───────────────────────────────────────────────── */
  const loadCategories = useCallback(async () => {
    if (catsLoaded.current) return;
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const data = await getCJCategories();
      setCategories(Array.isArray(data) ? data : []);
      catsLoaded.current = true;
    } catch (err) {
      setCategoriesError(
        err instanceof Error ? err.message : "Error al cargar categorías",
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (params: ListCJProductsParams = {}) => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const result = await listCJProducts(params);
      setProducts(result.list ?? []);
      setProductsTotal(result.total ?? 0);
      setProductsPage(result.pageNum ?? 1);
      setProductsPageSize(result.pageSize ?? 20);
    } catch (err) {
      setProductsError(
        err instanceof Error ? err.message : "Error al cargar productos",
      );
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchProductDetail = useCallback(async (pid: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setProductDetail(null);
    try {
      const data = await getCJProductDetail(pid);
      setProductDetail(data);
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : "Error al cargar el producto",
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const clearDetail = useCallback(() => {
    setProductDetail(null);
    setDetailError(null);
  }, []);

  return (
    <CJContext.Provider
      value={{
        categories,
        categoriesLoading,
        categoriesError,
        loadCategories,
        products,
        productsTotal,
        productsPage,
        productsPageSize,
        productsLoading,
        productsError,
        fetchProducts,
        productDetail,
        detailLoading,
        detailError,
        fetchProductDetail,
        clearDetail,
        activeParams,
        setActiveParams,
      }}
    >
      {children}
    </CJContext.Provider>
  );
}

export function useCJ(): CJContextValue {
  const ctx = useContext(CJContext);
  if (!ctx) throw new Error("useCJ debe usarse dentro de <CJProvider>");
  return ctx;
}
