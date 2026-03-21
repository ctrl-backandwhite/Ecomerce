import { createContext, useContext, useState, type ReactNode } from "react";
import type { Product } from "../data/products";
import { toast } from "sonner";

const MAX = 4;

interface CompareContextType {
  items: Product[];
  add: (p: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  const add = (p: Product) => {
    if (items.find(i => i.id === p.id)) { toast.info("Ya está en la comparación"); return; }
    if (items.length >= MAX) { toast.error(`Máximo ${MAX} productos`); return; }
    setItems(prev => [...prev, p]);
    toast.success(`${p.name.slice(0, 28)}… añadido a comparar`);
  };

  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clear   = () => setItems([]);
  const has     = (id: string) => items.some(i => i.id === id);

  return (
    <CompareContext.Provider value={{ items, add, remove, clear, has }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}