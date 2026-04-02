/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CartRepository                                              ║
 * ║                                                              ║
 * ║  Server-side cart via mic-orderservice:                       ║
 * ║    GET    /api/v1/cart              (get active cart)         ║
 * ║    POST   /api/v1/cart/items        (add item)               ║
 * ║    PUT    /api/v1/cart/items/{id}   (update quantity)         ║
 * ║    DELETE /api/v1/cart/items/{id}   (remove item)             ║
 * ║    DELETE /api/v1/cart              (clear cart)              ║
 * ║    POST   /api/v1/cart/merge        (merge guest cart)        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";
const BASE_URL = `${API_BASE}/api/v1/cart`;

// ── Types ────────────────────────────────────────────────────────────────────

export interface CartItemDto {
    id: string;
    productId: string;
    variantId: string | null;
    name: string;
    image: string | null;
    price: number;
    quantity: number;
    selectedAttrs: Record<string, string> | null;
}

export interface Cart {
    id: string;
    userId: string;
    items: CartItemDto[];
    totalItems: number;
    totalPrice: number;
    createdAt: string;
    updatedAt: string;
}

export interface AddItemPayload {
    productId: string;
    variantId?: string;
    quantity: number;
    selectedAttrs?: Record<string, string>;
}

export interface MergeCartPayload {
    items: AddItemPayload[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function handleRes<R>(res: Response): Promise<R> {
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const e: ApiErrorBody = await res.json(); msg = e.message || msg; } catch { /* */ }
        throw new ApiError(res.status, msg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as R);
}

function wrapErr(err: unknown, msg: string): never {
    if (err instanceof ApiError) throw err;
    throw new NetworkError(msg, err instanceof Error ? err : undefined);
}

// ── Repository ───────────────────────────────────────────────────────────────

class CartRepository {
    async getActiveCart(): Promise<Cart> {
        try {
            const res = await authFetch(BASE_URL);
            return handleRes<Cart>(res);
        } catch (err) { wrapErr(err, "No se pudo obtener el carrito"); }
    }

    async addItem(data: AddItemPayload): Promise<Cart> {
        try {
            const res = await authFetch(`${BASE_URL}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Cart>(res);
        } catch (err) { wrapErr(err, "No se pudo agregar al carrito"); }
    }

    async updateItemQuantity(itemId: string, quantity: number): Promise<Cart> {
        try {
            const res = await authFetch(`${BASE_URL}/items/${itemId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity }),
            });
            return handleRes<Cart>(res);
        } catch (err) { wrapErr(err, "No se pudo actualizar la cantidad"); }
    }

    async removeItem(itemId: string): Promise<Cart> {
        try {
            const res = await authFetch(`${BASE_URL}/items/${itemId}`, { method: "DELETE" });
            return handleRes<Cart>(res);
        } catch (err) { wrapErr(err, "No se pudo eliminar el artículo"); }
    }

    async clearCart(): Promise<void> {
        try {
            const res = await authFetch(BASE_URL, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo vaciar el carrito"); }
    }

    async mergeCart(data: MergeCartPayload): Promise<Cart> {
        try {
            const res = await authFetch(`${BASE_URL}/merge`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Cart>(res);
        } catch (err) { wrapErr(err, "No se pudo fusionar el carrito"); }
    }
}

export const cartRepository = new CartRepository();
