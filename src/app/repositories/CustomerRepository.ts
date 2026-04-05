/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CustomerRepository (Admin)                                  ║
 * ║                                                              ║
 * ║    GET /api/v1/users               (list – auth service)     ║
 * ║    GET /api/v1/users/{id}          (detail)                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody, Page } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";
const BASE_URL = `${API_BASE}/api/v1/users`;
const ORDERS_URL = `${API_BASE}/api/v1/orders`;

// ── Backend shape ────────────────────────────────────────────────────────────
interface UserDtoOut {
    id: number;
    name: string | null;
    lastName: string | null;
    nickName: string | null;
    email: string;
    enabled: boolean;
    createdAt: string | null;
}

interface OrderDtoOut {
    userId: string;
    total: number;
    status: string;
}

// ── Frontend shape ───────────────────────────────────────────────────────────

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    orders: number;
    totalSpent: number;
    joinDate: string;
    status: "ACTIVE" | "INACTIVE";
}

export interface CustomerQuery {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    ascending?: boolean;
}

// ── Mapper ───────────────────────────────────────────────────────────────────
function toCustomer(u: UserDtoOut, orderStats: Map<string, { count: number; total: number }>): Customer {
    const first = u.name ?? "";
    const last = u.lastName ?? "";
    const fullName = [first, last].filter(Boolean).join(" ") || u.nickName || u.email;
    const uid = String(u.id);
    const stats = orderStats.get(uid) ?? { count: 0, total: 0 };
    return {
        id: uid,
        name: fullName,
        email: u.email ?? "",
        phone: null,
        orders: stats.count,
        totalSpent: stats.total,
        joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" }) : "—",
        status: u.enabled ? "ACTIVE" : "INACTIVE",
    };
}

/** Fetch all orders and aggregate count + total per userId */
async function fetchOrderStats(): Promise<Map<string, { count: number; total: number }>> {
    const map = new Map<string, { count: number; total: number }>();
    try {
        const res = await authFetch(`${ORDERS_URL}?size=10000`);
        if (!res.ok) return map;
        const data = await res.json();
        const orders: OrderDtoOut[] = data?.content ?? data ?? [];
        for (const o of orders) {
            if (!o.userId) continue;
            const prev = map.get(o.userId) ?? { count: 0, total: 0 };
            prev.count += 1;
            prev.total += o.total ?? 0;
            map.set(o.userId, prev);
        }
    } catch { /* non‑critical */ }
    return map;
}

// ── Repository ───────────────────────────────────────────────────────────────

class CustomerRepository {
    async findAll(_query: CustomerQuery = {}): Promise<Page<Customer>> {
        try {
            const [usersRes, orderStats] = await Promise.all([
                authFetch(BASE_URL),
                fetchOrderStats(),
            ]);
            if (!usersRes.ok) {
                let msg = `HTTP ${usersRes.status}`;
                try { const e: ApiErrorBody = await usersRes.json(); msg = e.message || msg; } catch { /* */ }
                throw new ApiError(usersRes.status, msg);
            }
            const users: UserDtoOut[] = await usersRes.json();
            const customers = users.map(u => toCustomer(u, orderStats));
            return {
                content: customers,
                totalElements: customers.length,
                totalPages: 1,
                number: 0,
                size: customers.length,
            };
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError("No se pudieron obtener los clientes", err instanceof Error ? err : undefined);
        }
    }

    async findById(userId: string): Promise<Customer> {
        try {
            const [userRes, orderStats] = await Promise.all([
                authFetch(`${BASE_URL}/${userId}`),
                fetchOrderStats(),
            ]);
            if (!userRes.ok) {
                let msg = `HTTP ${userRes.status}`;
                try { const e: ApiErrorBody = await userRes.json(); msg = e.message || msg; } catch { /* */ }
                throw new ApiError(userRes.status, msg);
            }
            return toCustomer(await userRes.json(), orderStats);
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(`No se pudo obtener el cliente ${userId}`, err instanceof Error ? err : undefined);
        }
    }
}

export const customerRepository = new CustomerRepository();
