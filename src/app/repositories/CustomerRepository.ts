/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CustomerRepository (Admin)                                  ║
 * ║                                                              ║
 * ║    GET /api/v1/customers           (list)                    ║
 * ║    GET /api/v1/customers/{userId}  (detail)                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody, Page } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";
const BASE_URL = `${API_BASE}/api/v1/customers`;

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Repository ───────────────────────────────────────────────────────────────

class CustomerRepository {
    async findAll(query: CustomerQuery = {}): Promise<Page<Customer>> {
        try {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== null) params.set(k, String(v));
            }
            const res = await authFetch(`${BASE_URL}?${params}`);
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try { const e: ApiErrorBody = await res.json(); msg = e.message || msg; } catch { /* */ }
                throw new ApiError(res.status, msg);
            }
            return (await res.json()) as Page<Customer>;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError("No se pudieron obtener los clientes", err instanceof Error ? err : undefined);
        }
    }

    async findById(userId: string): Promise<Customer> {
        try {
            const res = await authFetch(`${BASE_URL}/${userId}`);
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try { const e: ApiErrorBody = await res.json(); msg = e.message || msg; } catch { /* */ }
                throw new ApiError(res.status, msg);
            }
            return (await res.json()) as Customer;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(`No se pudo obtener el cliente ${userId}`, err instanceof Error ? err : undefined);
        }
    }
}

export const customerRepository = new CustomerRepository();
