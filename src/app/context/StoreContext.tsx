/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  StoreContext — Fuente única de verdad para NX036             ║
 * ║                                                              ║
 * ║  Products, Categories, Brands y Attributes se gestionan      ║
 * ║  localmente en mock hasta que exista un backend propio.       ║
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

import { toAppError } from "../lib/AppError";
import { brandRepository, type Brand } from "../repositories/BrandRepository";
import { attributeRepository, type Attribute } from "../repositories/AttributeRepository";

import type { Product } from "../types/product";
import type { Category } from "../types/admin";

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

const StoreContext = createContext<StoreContextType | undefined>(undefined);

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
  const [categoriesLoading] = useState(false);

  // ── Brands & Attributes (from real API) ──────────────────────────────────
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // ── Bootstrap on mount ────────────────────────────────────────────────────
  useEffect(() => {
    refreshProducts();
    brandRepository.findAll().then(setBrands).catch(() => { });
    attributeRepository.findAll().then(setAttributes).catch(() => { });
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

  async function saveBrand(b: Brand) {
    try {
      const exists = brands.find((x) => x.id === b.id);
      if (exists) {
        const updated = await brandRepository.update(b.id, { name: b.name, slug: b.slug, logoUrl: b.logoUrl ?? undefined, websiteUrl: b.websiteUrl ?? undefined, description: b.description ?? undefined });
        setBrands((prev) => prev.map((x) => (x.id === b.id ? updated : x)));
      } else {
        const created = await brandRepository.create({ name: b.name, slug: b.slug, logoUrl: b.logoUrl ?? undefined, websiteUrl: b.websiteUrl ?? undefined, description: b.description ?? undefined });
        setBrands((prev) => [...prev, created]);
      }
    } catch {
      setBrands((prev) => {
        const exists = prev.find((x) => x.id === b.id);
        return exists ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b];
      });
    }
  }
  async function deleteBrand(id: string) {
    try {
      await brandRepository.delete(id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setBrands((prev) => prev.filter((b) => b.id !== id));
    }
  }

  async function saveAttribute(a: Attribute) {
    try {
      const exists = attributes.find((x) => x.id === a.id);
      if (exists) {
        const updated = await attributeRepository.update(a.id, { name: a.name, slug: a.slug, type: a.type, values: a.values.map(v => ({ value: v.value, color: v.color ?? undefined })) });
        setAttributes((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
      } else {
        const created = await attributeRepository.create({ name: a.name, slug: a.slug, type: a.type, values: a.values.map(v => ({ value: v.value, color: v.color ?? undefined })) });
        setAttributes((prev) => [...prev, created]);
      }
    } catch {
      setAttributes((prev) => {
        const exists = prev.find((x) => x.id === a.id);
        return exists ? prev.map((x) => (x.id === a.id ? a : x)) : [...prev, a];
      });
    }
  }
  async function deleteAttribute(id: string) {
    try {
      await attributeRepository.delete(id);
      setAttributes((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setAttributes((prev) => prev.filter((a) => a.id !== id));
    }
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