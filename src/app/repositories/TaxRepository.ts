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
import { API_BASE } from "../config/api";
import type { ApiErrorBody } from "../types/api";

import { logger } from "../lib/logger";

export interface TaxRate {
    id: string;
    country: string;
    region: string | null;
    rate: number;
    type: "PERCENTAGE" | "FIXED";
    active: boolean;
    appliesToCategories: string[];
    createdAt: string;
    updatedAt: string | null;
}

export interface TaxRatePayload {
    country: string;
    region?: string;
    rate: number;
    type: "PERCENTAGE" | "FIXED";
    appliesToCategories?: string[];
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
                try { const e: ApiErrorBody = await res.json(); msg = e.message || msg; } catch (err) { logger.warn("Suppressed error", err); }
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
