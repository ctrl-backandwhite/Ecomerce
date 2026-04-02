/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  OrderRepository                                             ║
 * ║                                                              ║
 * ║  Public + Admin order operations:                            ║
 * ║    POST   /api/v1/orders             (create order)          ║
 * ║    GET    /api/v1/orders/me          (my orders)             ║
 * ║    GET    /api/v1/orders/me/{id}     (my order detail)       ║
 * ║    POST   /api/v1/orders/me/{id}/cancel (cancel)             ║
 * ║    GET    /api/v1/orders             (admin: list all)       ║
 * ║    GET    /api/v1/orders/{id}        (admin: by id)          ║
 * ║    PATCH  /api/v1/orders/{id}/status (admin: update status)  ║
 * ║    GET    /api/v1/orders/stats       (admin: stats)          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody, Page } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";
const BASE_URL = `${API_BASE}/api/v1/orders`;

// ── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface OrderItem {
    id: string;
    productId: string;
    variantId: string | null;
    name: string;
    image: string | null;
    price: number;
    quantity: number;
    category: string | null;
}

export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    status: OrderStatus;
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    shippingAddress: string | null;
    trackingCode: string | null;
    couponCode: string | null;
    paymentMethod: string | null;
    date: string;
    createdAt: string;
    updatedAt: string | null;
}

/** Admin view (lighter) */
export interface AdminOrder {
    id: string;
    orderNumber: string;
    customer: { name: string; email: string };
    date: string;
    status: OrderStatus;
    total: number;
    items: number;
}

export interface CreateOrderPayload {
    shippingAddressId: string;
    paymentMethodId: string;
    couponCode?: string;
    notes?: string;
}

export interface OrderQuery {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    ascending?: boolean;
}

export interface OrderStats {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    deliveredOrders: number;
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

class OrderRepository {
    // ── Public / User ──────────────────────────────────────────────

    async createOrder(data: CreateOrderPayload): Promise<Order> {
        try {
            const res = await authFetch(BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Order>(res);
        } catch (err) { wrapErr(err, "No se pudo crear el pedido"); }
    }

    async getMyOrders(page = 0, size = 10): Promise<Page<Order>> {
        try {
            const params = new URLSearchParams({ page: String(page), size: String(size) });
            const res = await authFetch(`${BASE_URL}/me?${params}`);
            return handleRes<Page<Order>>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener los pedidos"); }
    }

    async getMyOrder(id: string): Promise<Order> {
        try {
            const res = await authFetch(`${BASE_URL}/me/${id}`);
            return handleRes<Order>(res);
        } catch (err) { wrapErr(err, `No se pudo obtener el pedido ${id}`); }
    }

    async cancelOrder(id: string): Promise<void> {
        try {
            const res = await authFetch(`${BASE_URL}/me/${id}/cancel`, { method: "POST" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo cancelar el pedido"); }
    }

    // ── Admin ──────────────────────────────────────────────────────

    async findAll(query: OrderQuery = {}): Promise<Page<AdminOrder>> {
        try {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== null) params.set(k, String(v));
            }
            const res = await authFetch(`${BASE_URL}?${params}`);
            return handleRes<Page<AdminOrder>>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener los pedidos"); }
    }

    async findById(id: string): Promise<Order> {
        try {
            const res = await authFetch(`${BASE_URL}/${id}`);
            return handleRes<Order>(res);
        } catch (err) { wrapErr(err, `No se pudo obtener el pedido ${id}`); }
    }

    async updateStatus(id: string, status: OrderStatus): Promise<void> {
        try {
            const res = await authFetch(`${BASE_URL}/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo actualizar el estado del pedido"); }
    }

    async getStats(): Promise<OrderStats> {
        try {
            const res = await authFetch(`${BASE_URL}/stats`);
            return handleRes<OrderStats>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener las estadísticas"); }
    }
}

export const orderRepository = new OrderRepository();
