/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  TaxRepository                                               ║
 * ║    GET  /api/v1/taxes/calculate                              ║
 * ║    CRUD /api/v1/taxes                                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { BaseRepository } from "./BaseRepository";
import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";

export interface TaxRate {
    id: string;
    name: string;
    country: string;
    state: string | null;
    rate: number;
    type: "PERCENTAGE" | "FIXED";
    active: boolean;
    createdAt: string;
    updatedAt: string | null;
}

export interface TaxRatePayload {
    name: string;
    country: string;
    state?: string;
    rate: number;
    type: "PERCENTAGE" | "FIXED";
    active?: boolean;
}

export interface TaxCalculation {
    subtotal: number;
    taxAmount: number;
    total: number;
    appliedRates: { name: string; rate: number; amount: number }[];
}

class TaxRepository extends BaseRepository<TaxRate, TaxRatePayload, TaxRatePayload> {
    constructor() {
        super("/api/v1/taxes");
    }

    async calculate(query: { subtotal: number; country: string; state?: string }): Promise<TaxCalculation> {
        try {
            const params = new URLSearchParams();
            params.set("subtotal", String(query.subtotal));
            params.set("country", query.country);
            if (query.state) params.set("state", query.state);
            const res = await authFetch(`${API_BASE}/api/v1/taxes/calculate?${params}`);
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try { const e: ApiErrorBody = await res.json(); msg = e.message || msg; } catch { /* */ }
                throw new ApiError(res.status, msg);
            }
            return (await res.json()) as TaxCalculation;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError("No se pudo calcular el impuesto", err instanceof Error ? err : undefined);
        }
    }
}

export const taxRepository = new TaxRepository();
