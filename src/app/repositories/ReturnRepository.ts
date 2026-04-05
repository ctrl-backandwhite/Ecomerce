/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ReturnRepository                                            ║
 * ║    POST   /api/v1/returns           (create)                 ║
 * ║    GET    /api/v1/returns/me        (my returns)             ║
 * ║    GET    /api/v1/returns           (admin list)             ║
 * ║    GET    /api/v1/returns/{id}      (detail)                 ║
 * ║    PATCH  /api/v1/returns/{id}/status (update status)        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody, Page } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";
const BASE_URL = `${API_BASE}/api/v1/returns`;

export type ReturnStatus = "REQUESTED" | "REVIEWING" | "APPROVED" | "REJECTED" | "RETURNED" | "REFUNDED";

export interface Return {
    id: string;
    orderId: string;
    orderNumber: string;
    userId: string;
    reason: string;
    status: ReturnStatus;
    items: { productId: string; name: string; quantity: number }[];
    refundAmount: number | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface CreateReturnPayload {
    orderId: string;
    reason: string;
    items: { productId: string; quantity: number }[];
}

export interface ReturnQuery {
    page?: number;
    size?: number;
    status?: string;
    sortBy?: string;
    ascending?: boolean;
}

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

class ReturnRepository {
    async create(data: CreateReturnPayload): Promise<Return> {
        try {
            const res = await authFetch(BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Return>(res);
        } catch (err) { wrapErr(err, "No se pudo crear la devolución"); }
    }

    async getMyReturns(): Promise<Return[]> {
        try {
            const res = await authFetch(`${BASE_URL}/me`);
            return handleRes<Return[]>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener las devoluciones"); }
    }

    async findAll(query: ReturnQuery = {}): Promise<Page<Return>> {
        try {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== null) params.set(k, String(v));
            }
            const res = await authFetch(`${BASE_URL}?${params}`);
            return handleRes<Page<Return>>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener las devoluciones"); }
    }

    async findById(id: string): Promise<Return> {
        try {
            const res = await authFetch(`${BASE_URL}/${id}`);
            return handleRes<Return>(res);
        } catch (err) { wrapErr(err, `No se pudo obtener la devolución ${id}`); }
    }

    async updateStatus(id: string, status: ReturnStatus): Promise<void> {
        try {
            const res = await authFetch(`${BASE_URL}/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo actualizar el estado de la devolución"); }
    }
}

export const returnRepository = new ReturnRepository();
