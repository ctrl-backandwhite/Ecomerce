/**
 * StoreContext – fuente única de verdad para productos, categorías y marcas.
 * El panel de administración escribe aquí y la tienda pública lee desde aquí.
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  products as initialProducts,
  type Product,
} from "../data/products";
import { categories as initialCategories, type Category } from "../data/adminData";
import { brands as initialBrands, type Brand } from "../data/brands";
import { attributes as initialAttributes, type Attribute } from "../data/attributes";

// ── Types ──────────────────────────────────────────────────────
interface StoreContextType {
  // Products
  products: Product[];
  saveProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;

  // Categories
  categories: Category[];
  saveCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (cats: Category[]) => void;

  // Brands
  brands: Brand[];
  saveBrand: (b: Brand) => void;
  deleteBrand: (id: string) => void;

  // Attributes
  attributes: Attribute[];
  saveAttribute: (a: Attribute) => void;
  deleteAttribute: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────
export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [attributes, setAttributes] = useState<Attribute[]>(initialAttributes);

  // ── Products ──
  function saveProduct(p: Product) {
    setProducts((prev) => {
      const exists = prev.find((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
    });
  }
  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Categories ──
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

  // ── Brands ──
  function saveBrand(b: Brand) {
    setBrands((prev) => {
      const exists = prev.find((x) => x.id === b.id);
      return exists ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b];
    });
  }
  function deleteBrand(id: string) {
    setBrands((prev) => prev.filter((b) => b.id !== id));
  }

  // ── Attributes ──
  function saveAttribute(a: Attribute) {
    setAttributes((prev) => {
      const exists = prev.find((x) => x.id === a.id);
      return exists ? prev.map((x) => (x.id === a.id ? a : x)) : [...prev, a];
    });
  }
  function deleteAttribute(id: string) {
    setAttributes((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <StoreContext.Provider
      value={{
        products, saveProduct, deleteProduct,
        categories, saveCategory, deleteCategory, reorderCategories,
        brands, saveBrand, deleteBrand,
        attributes, saveAttribute, deleteAttribute,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
