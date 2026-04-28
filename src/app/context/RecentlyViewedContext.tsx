import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import type { Product } from "../types/product";
import { useAuth } from "./AuthContext";
import { nexaProductRepository } from "../repositories/NexaProductRepository";
import { mapNexaProduct } from "../mappers/NexaProductMapper";
import { useLanguage } from "./LanguageContext";
import { logger } from "../lib/logger";

const BASE_KEY = "nexa_recently_viewed";
const MAX = 8;

interface RecentlyViewedContextType {
  viewed: Product[];
  track: (p: Product) => void;
  clear: () => void;
}

const Ctx = createContext<RecentlyViewedContextType | undefined>(undefined);

function storageKey(userId: string | null | undefined): string {
  const suffix = userId ? `user:${userId}` : "guest";
  return `${BASE_KEY}:${suffix}`;
}

function readFromStorage(key: string): Product[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Per-user recently-viewed products, persisted in localStorage under a
 * user-scoped key so two customers sharing a browser (or the same person
 * logging in and out of different accounts) never see each other's
 * history. Guests get their own `guest` bucket; on login, the guest list
 * is merged into the user bucket once so the session doesn't start empty.
 */
export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ? String(user.id) : null;
  const { locale } = useLanguage();
  const apiLocale = locale === "pt" ? "pt-BR" : locale;

  const [viewed, setViewed] = useState<Product[]>(() => readFromStorage(storageKey(userId)));

  // When the authenticated user changes, swap to their bucket and — the first
  // time an actual user shows up — merge whatever the guest accumulated in
  // this browser into the user bucket.
  useEffect(() => {
    const userKey = storageKey(userId);
    let next = readFromStorage(userKey);

    if (userId) {
      const guestList = readFromStorage(storageKey(null));
      if (guestList.length > 0 && next.length === 0) {
        next = guestList.slice(0, MAX);
        localStorage.setItem(userKey, JSON.stringify(next));
        localStorage.removeItem(storageKey(null));
      }
    }

    setViewed(next);
  }, [userId]);

  // Persist back to the bucket the active user owns.
  useEffect(() => {
    localStorage.setItem(storageKey(userId), JSON.stringify(viewed));
  }, [viewed, userId]);

  // Mirror current viewed in a ref so the currency-change listener can read
  // the latest list without re-binding (and re-firing) on every track.
  const viewedRef = useRef<Product[]>(viewed);
  useEffect(() => { viewedRef.current = viewed; }, [viewed]);

  // Re-hydrate prices when the user switches currency. The viewed list is
  // persisted with the price baked in, so a stored entry from a previous
  // COP session keeps showing COP-shape numbers under a USD label until we
  // refetch from the catalog (which converts via X-Currency).
  useEffect(() => {
    function refreshPrices() {
      const ids = viewedRef.current.map((p) => p.id).filter(Boolean);
      if (ids.length === 0) {
        window.dispatchEvent(new Event("currency:ack"));
        return;
      }
      Promise.all(
        ids.map((id) =>
          nexaProductRepository
            .findById(id, apiLocale)
            .then((raw) => mapNexaProduct(raw))
            .catch((err) => {
              logger.warn(`[RecentlyViewed] refresh failed for ${id}`, err);
              return null;
            }),
        ),
      ).then((fresh) => {
        const byId = new Map<string, Product>();
        fresh.forEach((p) => { if (p) byId.set(p.id, p); });
        setViewed((prev) =>
          prev.map((p) => {
            const updated = byId.get(p.id);
            // Preserve the originalPrice-stripping policy from `track`.
            return updated ? { ...updated, originalPrice: undefined } : p;
          }),
        );
        window.dispatchEvent(new Event("currency:ack"));
      });
    }
    window.addEventListener("currency:changed", refreshPrices);
    return () => window.removeEventListener("currency:changed", refreshPrices);
  }, [apiLocale]);

  const track = (p: Product) => {
    // Strip volatile pricing so a stale originalPrice captured during a past
    // campaign doesn't make the product show a phantom discount next time
    // it surfaces on the home grid or the suggestions rail.
    const clean: Product = { ...p, originalPrice: undefined };
    setViewed((prev) => {
      const filtered = prev.filter((i) => i.id !== clean.id);
      return [clean, ...filtered].slice(0, MAX);
    });
  };

  const clear = () => setViewed([]);

  return <Ctx.Provider value={{ viewed, track, clear }}>{children}</Ctx.Provider>;
}

export function useRecentlyViewed() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  return ctx;
}
