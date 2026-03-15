/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  StoreContext — Fuente única de verdad para NEXA             ║
 * ║                                                              ║
 * ║  Products y Categories se cargan desde la API de CJ         ║
 * ║  Dropshipping a través de la capa de repositorios.          ║
 * ║                                                              ║
 * ║  Brands y Attributes permanecen en estado local hasta que   ║
 * ║  exista un endpoint específico.                              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

import { productRepository }  from "../repositories/CJProductRepository";
import { categoryRepository } from "../repositories/CJCategoryRepository";
import { toAppError }         from "../lib/AppError";
import { brands as initialBrands }         from "../data/brands";
import { attributes as initialAttributes } from "../data/attributes";

import type { Product }   from "../data/products";
import type { Category }  from "../data/adminData";
import type { Brand }     from "../data/brands";
import type { Attribute } from "../data/attributes";
import type { ProductQuery } from "../repositories/IProductRepository";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_PAGE_SIZE = 40;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true for any browser-level network/CORS failure. */
function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg === "Failed to fetch" ||
    msg.includes("NetworkError") ||
    msg.includes("CORS") ||
    msg.includes("Network request failed") ||
    msg.includes("net::")
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────────────────────

interface StoreContextType {
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  productsTotal: number;
  /** "api" when live CJ data is loaded; "mock" when running on local fallback data. */
  dataSource: "api" | "mock" | "loading";

  refreshProducts: (query?: ProductQuery) => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  getProductById: (id: string) => Promise<Product | null>;
  saveProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;

  categories: Category[];
  categoriesLoading: boolean;
  saveCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (cats: Category[]) => void;

  brands: Brand[];
  saveBrand: (b: Brand) => void;
  deleteBrand: (id: string) => void;

  attributes: Attribute[];
  saveAttribute: (a: Attribute) => void;
  deleteAttribute: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context & provider
// ─────────────────────────────────────────────────────────────────────────────

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {

  // ── Product state ─────────────────────────────────────────────────────────
  const [products,        setProducts]        = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError,   setProductsError]   = useState<string | null>(null);
  const [productsTotal,   setProductsTotal]   = useState(0);
  const [dataSource,      setDataSource]      = useState<"api" | "mock" | "loading">("loading");

  const currentPage  = useRef(1);
  const currentQuery = useRef<ProductQuery>({});
  const hasMore      = useRef(false);

  // ── Category state ────────────────────────────────────────────────────────
  const [categories,        setCategories]        = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // ── Local state ───────────────────────────────────────────────────────────
  const [brands,     setBrands]     = useState<Brand[]>(initialBrands);
  const [attributes, setAttributes] = useState<Attribute[]>(initialAttributes);

  // ── Bootstrap on mount ────────────────────────────────────────────────────
  useEffect(() => {
    refreshProducts({});
    loadCategoriesInternal();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Product actions ───────────────────────────────────────────────────────

  const refreshProducts = useCallback(async (query: ProductQuery = {}) => {
    setProductsLoading(true);
    setProductsError(null);
    setDataSource("loading");
    currentPage.current  = 1;
    currentQuery.current = query;

    try {
      // ── Attempt live CJ API ──────────────────────────────────────────────
      const page = await productRepository.findMany({
        ...query,
        page:  1,
        limit: INITIAL_PAGE_SIZE,
      });
      setProducts(page.items);
      setProductsTotal(page.total);
      hasMore.current = page.hasMore;
      setDataSource("api");
    } catch (err) {
      const appErr = toAppError(err);

      if (isNetworkError(err)) {
        // ── CORS / offline → graceful fallback to mock data ──────────────
        console.info(
          "[StoreContext] CJ API unreachable (CORS / network). Falling back to mock data.",
        );
        try {
          const { products: mockProducts } = await import("../data/products");
          let result = [...mockProducts];
          // Apply basic client-side filters so the UX still makes sense
          if (query.search) {
            const q = query.search.toLowerCase();
            result = result.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q),
            );
          }
          setProducts(result);
          setProductsTotal(result.length);
          hasMore.current = false;
          setDataSource("mock");
          setProductsError(null);
        } catch {
          setProducts([]);
          setProductsError("No se pudo cargar el catálogo.");
          setDataSource("mock");
        }
      } else {
        // ── Other API errors (auth, 5xx, etc.) ───────────────────────────
        setProductsError(appErr.message);
        setProducts([]);
        setDataSource("mock");
      }
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadMoreProducts = useCallback(async () => {
    if (productsLoading || !hasMore.current || dataSource !== "api") return;

    const nextPage = currentPage.current + 1;
    setProductsLoading(true);

    try {
      const page = await productRepository.findMany({
        ...currentQuery.current,
        page:  nextPage,
        limit: INITIAL_PAGE_SIZE,
      });
      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const fresh = page.items.filter((p) => !existingIds.has(p.id));
        return [...prev, ...fresh];
      });
      currentPage.current = nextPage;
      hasMore.current     = page.hasMore;
    } catch (err) {
      console.warn("[StoreContext] loadMoreProducts:", toAppError(err).message);
    } finally {
      setProductsLoading(false);
    }
  }, [productsLoading, dataSource]);

  const getProductById = useCallback(
    async (id: string): Promise<Product | null> => {
      try {
        if (dataSource === "api") {
          return await productRepository.findById(id);
        }
        // Fallback: return from in-memory list
        return products.find((p) => p.id === id || p.slug === id) ?? null;
      } catch (err) {
        if (isNetworkError(err)) {
          return products.find((p) => p.id === id || p.slug === id) ?? null;
        }
        console.warn("[StoreContext] getProductById:", toAppError(err).message);
        return products.find((p) => p.id === id || p.slug === id) ?? null;
      }
    },
    [products, dataSource],
  );

  function saveProduct(p: Product) {
    setProducts((prev) => {
      const exists = prev.find((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
    });
  }

  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Category actions ──────────────────────────────────────────────────────

  async function loadCategoriesInternal() {
    setCategoriesLoading(true);
    try {
      // ── Attempt live CJ API ──────────────────────────────────────────────
      const cats = await categoryRepository.findAll();
      setCategories(cats);
    } catch (err) {
      if (isNetworkError(err)) {
        // ── CORS / offline → graceful fallback ───────────────────────────
        console.info(
          "[StoreContext] CJ categories unreachable. Falling back to mock categories.",
        );
        try {
          const { categories: mockCats } = await import("../data/adminData");
          setCategories(mockCats);
        } catch {
          // leave empty — not critical
        }
      } else {
        console.warn("[StoreContext] loadCategories:", toAppError(err).message);
      }
    } finally {
      setCategoriesLoading(false);
    }
  }

  function saveCategory(c: Category) {
    setCategories((prev) => {
      const exists = prev.find((x) => x.id === c.id);
      return exists ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c];
    });
  }

  function deleteCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function reorderCategories(cats: Category[]) {
    setCategories(cats);
  }

  // ── Brand / Attribute helpers ─────────────────────────────────────────────

  function saveBrand(b: Brand) {
    setBrands((prev) => {
      const exists = prev.find((x) => x.id === b.id);
      return exists ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b];
    });
  }
  function deleteBrand(id: string) {
    setBrands((prev) => prev.filter((b) => b.id !== id));
  }

  function saveAttribute(a: Attribute) {
    setAttributes((prev) => {
      const exists = prev.find((x) => x.id === a.id);
      return exists ? prev.map((x) => (x.id === a.id ? a : x)) : [...prev, a];
    });
  }
  function deleteAttribute(id: string) {
    setAttributes((prev) => prev.filter((a) => a.id !== id));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <StoreContext.Provider
      value={{
        products, productsLoading, productsError, productsTotal, dataSource,
        refreshProducts, loadMoreProducts, getProductById,
        saveProduct, deleteProduct,
        categories, categoriesLoading,
        saveCategory, deleteCategory, reorderCategories,
        brands, saveBrand, deleteBrand,
        attributes, saveAttribute, deleteAttribute,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}