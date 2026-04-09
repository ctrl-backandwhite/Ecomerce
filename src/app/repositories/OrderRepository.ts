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
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { Page } from "../types/api";

const BASE_URL = `${API_BASE}/api/v1/orders`;

// ── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "DRAFT" | "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export interface OrderItem {
    id: string;
    productId: string;
    sku: string;
    productName: string;
    productImage: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    status: OrderStatus;
    items: OrderItem[];
    subtotal: number;
    shippingCost: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    currencyCode: string;
    exchangeRateToUsd: number;
    shippingAddress: Record<string, unknown> | null;
    billingAddress: Record<string, unknown> | null;
    paymentMethod: string | null;
    paymentRef: string | null;
    notes: string | null;
    couponId: string | null;
    giftCardCode: string | null;
    giftCardAmount: number;
    loyaltyPointsUsed: number;
    loyaltyDiscount: number;
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
    shippingAddress: Record<string, unknown>;
    billingAddress?: Record<string, unknown>;
    paymentMethod: string;
    couponCode?: string;
    giftCardCode?: string;
    giftCardAmount?: number;
    loyaltyPointsUsed?: number;
    loyaltyDiscount?: number;
    currencyCode?: string;
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

    async confirmOrder(id: string): Promise<Order> {
        try {
            const res = await authFetch(`${BASE_URL}/me/${id}/confirm`, { method: "POST" });
            return handleRes<Order>(res);
        } catch (err) { wrapErr(err, "No se pudo confirmar el pedido"); }
    }

    // ── Admin ──────────────────────────────────────────────────────

    async findAll(query: OrderQuery = {}): Promise<Page<AdminOrder>> {
        try {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== null) params.set(k, String(v));
            }
            const res = await authFetch(`${BASE_URL}?${params}`);
            const raw = await handleRes<Page<Order>>(res);
            return {
                ...raw,
                content: (raw.content ?? []).map((o) => ({
                    id: o.id,
                    orderNumber: o.orderNumber ?? o.id,
                    customer: {
                        name: (o.shippingAddress as Record<string, string> | null)?.fullName
                            ?? (o.shippingAddress as Record<string, string> | null)?.name
                            ?? o.userId ?? "—",
                        email: (o.shippingAddress as Record<string, string> | null)?.email ?? "—",
                    },
                    date: o.createdAt,
                    status: o.status,
                    total: o.total ?? 0,
                    items: Array.isArray(o.items) ? o.items.length : 0,
                })),
            };
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
