/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  StoreContext — Fuente única de verdad para NEXA             ║
 * ║                                                              ║
 * ║  Products, Categories, Brands y Attributes se gestionan      ║
 * ║  localmente en mock hasta que exista un backend propio.       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";

import { toAppError } from "../lib/AppError";
import { brands as initialBrands } from "../data/brands";
import { attributes as initialAttributes } from "../data/attributes";

import type { Product } from "../data/products";
import type { Category } from "../data/adminData";
import type { Brand } from "../data/brands";
import type { Attribute } from "../data/attributes";

// ─────────────────────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────────────────────

interface StoreContextType {
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  productsTotal: number;
  /** "mock" until a backend API is available. */
  dataSource: "api" | "mock" | "loading";

  refreshProducts: () => Promise<void>;
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

// Persist the context object on globalThis so Vite's Fast Refresh / HMR does
// not recreate it on every hot-reload.  Without this, StoreContext.tsx being
// refreshed would call createContext() again, producing a new object that the
// already-mounted <StoreProvider> (rendered with the OLD object) doesn't
// provide — causing every useStore() call to see `undefined`.
declare global {
  // eslint-disable-next-line no-var
  var __NEXA_StoreContext: ReturnType<typeof createContext<StoreContextType | undefined>> | undefined;
}

const StoreContext: React.Context<StoreContextType | undefined> =
  globalThis.__NEXA_StoreContext ??
  (globalThis.__NEXA_StoreContext = createContext<StoreContextType | undefined>(undefined));

export function StoreProvider({ children }: { children: ReactNode }) {

  // ── Product state ─────────────────────────────────────────────────────────
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsTotal, setProductsTotal] = useState(0);
  const [dataSource, setDataSource] = useState<"api" | "mock" | "loading">("loading");

  const currentPage = useRef(1);
  const hasMore = useRef(false);

  // ── Category state ────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // ── Local state ───────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [attributes, setAttributes] = useState<Attribute[]>(initialAttributes);

  // ── Bootstrap on mount ────────────────────────────────────────────────────
  useEffect(() => {
    refreshProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Products — currently mock data ───────────────────────────────────────
  const products = rawProducts;

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    setDataSource("loading");
    currentPage.current = 1;

    try {
      // TODO: Replace with real API call when backend is ready
      setRawProducts([]);
      setProductsTotal(0);
      hasMore.current = false;
      setDataSource("mock");
    } catch (err) {
      const appErr = toAppError(err);
      setProductsError(appErr.message);
      setRawProducts([]);
      setDataSource("mock");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadMoreProducts = useCallback(async () => {
    // TODO: Implement when backend API is ready
  }, []);

  const getProductById = useCallback(
    async (id: string): Promise<Product | null> => {
      // TODO: Replace with real API call when backend is ready
      return products.find((p) => p.id === id || p.slug === id) ?? null;
    },
    [products],
  );

  function saveProduct(p: Product) {
    setRawProducts((prev) => {
      const exists = prev.find((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
    });
  }

  function deleteProduct(id: string) {
    setRawProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Category actions ──────────────────────────────────────────────────────

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
        // `products` is the ENRICHED version (category UUIDs → names)
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