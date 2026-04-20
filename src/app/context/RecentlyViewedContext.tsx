import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "../types/product";
import { useAuth } from "./AuthContext";

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
