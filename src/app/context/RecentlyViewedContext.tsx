import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "../data/products";

const KEY   = "nexa_recently_viewed";
const MAX   = 8;

interface RecentlyViewedContextType {
  viewed: Product[];
  track: (p: Product) => void;
}

const Ctx = createContext<RecentlyViewedContextType | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [viewed, setViewed] = useState<Product[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(viewed));
  }, [viewed]);

  const track = (p: Product) => {
    setViewed(prev => {
      const filtered = prev.filter(i => i.id !== p.id);
      return [p, ...filtered].slice(0, MAX);
    });
  };

  return <Ctx.Provider value={{ viewed, track }}>{children}</Ctx.Provider>;
}

export function useRecentlyViewed() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  return ctx;
}
