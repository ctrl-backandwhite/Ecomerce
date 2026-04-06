import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, ReactNode,
} from "react";
import { Product } from "../types/product";
import { useAuth } from "./AuthContext";
import { cartRepository } from "../repositories/CartRepository";
import type { CartItemDto, AddItemPayload } from "../repositories/CartRepository";
import { nexaProductRepository } from "../repositories/NexaProductRepository";
import { mapNexaProduct } from "../mappers/NexaProductMapper";

/* ── Public types ─────────────────────────────────────────── */

export interface CartItem extends Product {
  quantity: number;
  productId: string;
  variantId?: string;
  selectedAttrs?: Record<string, string>;
  /** Backend cart_items.id — used for PUT/DELETE on /cart/items/{id} */
  backendItemId?: string;
}

interface AddToCartOptions {
  quantity?: number;
  variantId?: string;
  selectedAttrs?: Record<string, string>;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (product: Product, options?: AddToCartOptions) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

/* ── localStorage helpers (anonymous cart) ─────────────────── */

const STORAGE_KEY = "nx036_guest_cart";
const AUTH_CART_FLAG = "nx036_cart_is_auth";

function loadGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch { return []; }
}

function saveGuestCart(items: CartItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* quota */ }
}

function clearGuestCart() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_CART_FLAG);
  } catch { /* */ }
}

function markCartAsAuth() {
  try { localStorage.setItem(AUTH_CART_FLAG, "1"); } catch { /* */ }
}

function isCartFromAuth(): boolean {
  try { return localStorage.getItem(AUTH_CART_FLAG) === "1"; } catch { return false; }
}

/* ── Product cache (keeps enriched data across backend syncs) ── */

const productCache = new Map<string, Partial<Product>>();

function cacheProduct(productId: string, data: Partial<Product>) {
  productCache.set(productId.toUpperCase(), data);
}

function getCachedProduct(productId: string): Partial<Product> | undefined {
  return productCache.get(productId.toUpperCase());
}

/* ── DTO → CartItem mapper (merges with cache if available) ── */

function dtoToCartItem(dto: CartItemDto): CartItem {
  const cartId = dto.variantId ? `${dto.productId}::${dto.variantId}` : dto.productId;
  const cached = getCachedProduct(dto.productId);
  return {
    id: cartId,
    productId: dto.productId,
    variantId: dto.variantId ?? undefined,
    backendItemId: dto.id,
    name: cached?.name ?? dto.productName,
    image: cached?.image ?? dto.productImage ?? "",
    price: cached?.price ?? dto.unitPrice,
    quantity: dto.quantity,
    selectedAttrs: dto.selectedAttrs ?? undefined,
    category: cached?.category ?? "",
    description: cached?.description ?? "",
    rating: cached?.rating ?? 0,
    reviews: cached?.reviews ?? 0,
    sku: cached?.sku ?? "",
    stock: cached?.stock ?? 0,
    slug: cached?.slug ?? "",
    brand: cached?.brand ?? "",
    shortDescription: cached?.shortDescription ?? "",
    taxClass: cached?.taxClass ?? "",
    subcategory: cached?.subcategory ?? "",
    keywords: cached?.keywords ?? [],
    images: cached?.images ?? [],
    barcode: cached?.barcode ?? "",
    stockStatus: cached?.stockStatus ?? "in_stock",
    manageStock: cached?.manageStock ?? false,
    allowBackorder: cached?.allowBackorder ?? false,
    attributes: cached?.attributes ?? [],
    variants: cached?.variants ?? [],
    weight: cached?.weight ?? 0,
    dimensions: cached?.dimensions ?? { length: 0, width: 0, height: 0 },
    shippingClass: cached?.shippingClass ?? "",
    metaTitle: cached?.metaTitle ?? "",
    metaDescription: cached?.metaDescription ?? "",
    status: cached?.status ?? "active",
    visibility: cached?.visibility ?? "public",
    featured: cached?.featured ?? false,
  };
}

/* ── Enrich cart items from product catalog (fresh prices/names) ── */

async function enrichCartItems(cartItems: CartItem[]): Promise<CartItem[]> {
  if (cartItems.length === 0) return cartItems;

  const enriched = await Promise.all(
    cartItems.map(async (item) => {
      try {
        const raw = await nexaProductRepository.findById(item.productId);
        const product = mapNexaProduct(raw);
        // Persist in cache so future dtoToCartItem calls keep the data
        cacheProduct(item.productId, product);
        return {
          ...item,
          name: product.name,
          image: product.image,
          price: product.price,
          description: product.description,
          category: product.category,
          rating: product.rating,
          reviews: product.reviews,
          sku: product.sku,
          stock: product.stock,
        };
      } catch (err) {
        console.warn(`[Cart] Failed to enrich product ${item.productId}:`, err);
        return item;
      }
    }),
  );
  return enriched;
}

/* ── Composite-key helper ──────────────────────────────────── */

function cartKey(productId: string, variantId?: string) {
  return variantId ? `${productId}::${variantId}` : productId;
}

/* ── Context ───────────────────────────────────────────────── */

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  // On mount: if cached cart was from an auth session but we're not authenticated
  // anymore (e.g. user logged out via page reload), discard it.
  const [items, setItems] = useState<CartItem[]>(() => {
    if (isCartFromAuth()) {
      // Will be resolved once authLoading finishes
      return [];
    }
    return loadGuestCart();
  });
  const [isLoading, setIsLoading] = useState(false);
  const prevAuth = useRef<boolean | null>(null); // null = first mount
  const hydrated = useRef(false);

  /* ── Load cart on mount / auth change ──────────────────── */
  useEffect(() => {
    if (authLoading) return;

    // Detect actual auth transitions (not just page refresh)
    const justLoggedIn = isAuthenticated && prevAuth.current === false;
    const justLoggedOut = !isAuthenticated && prevAuth.current === true;

    // Update ref AFTER reading the transitions
    prevAuth.current = isAuthenticated;

    if (!isAuthenticated) {
      if (justLoggedOut || isCartFromAuth()) {
        // User logged out (in-place or via page reload) → clear cached cart
        clearGuestCart();
        setItems([]);
      } else if (hydrated.current) {
        // Anonymous user, page refresh → reload and enrich guest cart
        const guest = loadGuestCart();
        setItems(guest);
        if (guest.length > 0) {
          enrichCartItems(guest).then((enriched) => setItems(enriched));
        }
      }
      hydrated.current = true;
      return;
    }
    hydrated.current = true;

    // Authenticated: fetch backend cart (merge guest cart only on real login)
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        // If the user just logged in and had guest items → merge first
        const guestItems = loadGuestCart();
        if (justLoggedIn && guestItems.length > 0) {
          const payload: AddItemPayload[] = guestItems.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            quantity: it.quantity,
            unitPrice: it.price,
            productName: it.name,
            productImage: it.image,
            selectedAttrs: it.selectedAttrs,
          }));
          await cartRepository.mergeCart({ items: payload });
        }

        const cart = await cartRepository.getActiveCart();
        if (!cancelled) {
          const backendItems = cart.items.map(dtoToCartItem);
          if (backendItems.length > 0) {
            // Show items immediately, then enrich with fresh catalog data
            setItems(backendItems);
            enrichCartItems(backendItems).then((enriched) => {
              if (!cancelled) setItems(enriched);
            });
          } else {
            // Backend returned empty — recover from localStorage cache
            const cached = loadGuestCart();
            if (cached.length > 0) {
              console.warn("[Cart] Backend empty, recovering", cached.length, "items from cache");
              setItems(cached);
              enrichCartItems(cached).then((enriched) => {
                if (!cancelled) setItems(enriched);
              });
            } else {
              setItems([]);
            }
          }
        }
      } catch (err) {
        console.error("[Cart] Failed to fetch backend cart:", err);
        // Fall back to localStorage cache so the UX doesn't break
        if (!cancelled) setItems(loadGuestCart());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, authLoading]);

  /* ── Persist cart to localStorage (cache for all users) ── */
  useEffect(() => {
    // Skip the very first render — items already came from localStorage
    if (!hydrated.current) return;
    // Always save to localStorage — serves as cache even for auth users
    saveGuestCart(items);
    // Mark whether this cache belongs to an auth session
    if (isAuthenticated) markCartAsAuth();
  }, [items, isAuthenticated]);

  /* ── Add to cart ───────────────────────────────────────── */
  const addToCart = useCallback(
    (product: Product, options?: AddToCartOptions) => {
      const qty = options?.quantity ?? 1;
      const cid = cartKey(product.id, options?.variantId);

      // Cache the product so backend sync responses stay enriched
      cacheProduct(product.id, product);

      // Optimistic local update
      setItems((prev) => {
        const existing = prev.find((i) => i.id === cid);
        if (existing) {
          return prev.map((i) =>
            i.id === cid ? { ...i, quantity: i.quantity + qty } : i,
          );
        }
        return [
          ...prev,
          {
            ...product,
            id: cid,
            productId: product.id,
            variantId: options?.variantId,
            selectedAttrs: options?.selectedAttrs,
            quantity: qty,
          },
        ];
      });

      // Backend sync with rollback on failure (M-11)
      if (isAuthenticated) {
        const snapshot = [...items]; // capture pre-update state for rollback
        cartRepository
          .addItem({
            productId: product.id,
            variantId: options?.variantId,
            quantity: qty,
            unitPrice: product.price,
            productName: product.name,
            productImage: product.image,
            selectedAttrs: options?.selectedAttrs,
          })
          .then((cart) => {
            if (cart.items.length > 0) setItems(cart.items.map(dtoToCartItem));
          })
          .catch((err) => {
            console.warn("[Cart] addItem backend sync failed, rolling back:", err);
            setItems(snapshot); // rollback to pre-update state
          });
      }
    },
    [isAuthenticated],
  );

  /* ── Remove from cart ──────────────────────────────────── */
  const removeFromCart = useCallback(
    (cartId: string) => {
      // Capture snapshot for rollback (M-11)
      const snapshot = [...items];
      let backendId: string | undefined;
      setItems((prev) => {
        const item = prev.find((i) => i.id === cartId);
        backendId = item?.backendItemId;
        return prev.filter((i) => i.id !== cartId);
      });

      if (isAuthenticated && backendId) {
        cartRepository
          .removeItem(backendId)
          .then((cart) => setItems(cart.items.map(dtoToCartItem)))
          .catch((err) => {
            console.warn("[Cart] removeItem backend sync failed, rolling back:", err);
            setItems(snapshot);
          });
      }
    },
    [isAuthenticated, items],
  );

  /* ── Update quantity ───────────────────────────────────── */
  const updateQuantity = useCallback(
    (cartId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(cartId);
        return;
      }

      // Capture snapshot for rollback (M-11)
      const snapshot = [...items];
      let backendId: string | undefined;
      setItems((prev) => {
        const item = prev.find((i) => i.id === cartId);
        backendId = item?.backendItemId;
        return prev.map((i) => (i.id === cartId ? { ...i, quantity } : i));
      });

      if (isAuthenticated && backendId) {
        cartRepository
          .updateItemQuantity(backendId, quantity)
          .then((cart) => setItems(cart.items.map(dtoToCartItem)))
          .catch((err) => {
            console.warn("[Cart] updateQuantity backend sync failed, rolling back:", err);
            setItems(snapshot);
          });
      }
    },
    [isAuthenticated, removeFromCart, items],
  );

  /* ── Clear cart ────────────────────────────────────────── */
  const clearCart = useCallback(() => {
    setItems([]);
    clearGuestCart();

    if (isAuthenticated) {
      cartRepository.clearCart().catch(() => { /* best effort */ });
    }
  }, [isAuthenticated]);

  /* ── Derived totals ────────────────────────────────────── */
  const getTotalItems = useCallback(
    () => items.reduce((t, i) => t + i.quantity, 0),
    [items],
  );

  const getTotalPrice = useCallback(
    () => items.reduce((t, i) => t + i.price * i.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}