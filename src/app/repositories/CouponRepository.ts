/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CouponRepository                                            ║
 * ║    POST   /api/v1/coupons/validate                           ║
 * ║    GET    /api/v1/coupons           (admin list)             ║
 * ║    GET    /api/v1/coupons/{id}                               ║
 * ║    POST   /api/v1/coupons           (create)                 ║
 * ║    PUT    /api/v1/coupons/{id}      (update)                 ║
 * ║    DELETE /api/v1/coupons/{id}                               ║
 * ║    PATCH  /api/v1/coupons/{id}/toggle                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { BaseRepository } from "./BaseRepository";
import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { ApiErrorBody, Page } from "../types/api";

import { logger } from "../lib/logger";

export interface Coupon {
    id: string;
    code: string;
    description?: string | null;
    type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
    value: number;
    minOrderAmount: number | null;
    maxUses: number | null;
    usedCount: number;
    maxUsesPerUser?: number | null;
    validFrom: string;
    validUntil: string;
    active: boolean;
    appliesToCategories?: string[] | null;
    appliesToProducts?: string[] | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface CouponPayload {
    code: string;
    description?: string;
    type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
    value: number;
    minOrderAmount?: number;
    maxUses?: number;
    maxUsesPerUser?: number;
    validFrom: string;
    validUntil: string;
    active: boolean;
    appliesToCategories?: string[];
    appliesToProducts?: string[];
}

export interface CouponValidation {
    valid: boolean;
    coupon?: Coupon;
    discount?: number;
    message?: string;
}

class CouponRepository extends BaseRepository<Coupon, CouponPayload, CouponPayload> {
    constructor() {
        super("/api/v1/coupons");
    }

    /** Override: backend returns Page<Coupon>, unwrap .content */
    async findAll(query: Record<string, unknown> = {}): Promise<Coupon[]> {
        try {
            const qs = this.buildParams({ size: 200, ...query });
            const url = qs ? `${this.baseUrl}?${qs}` : this.baseUrl;
            const res = await authFetch(url);
            const page = await this.handleResponse<Page<Coupon>>(res);
            return page.content;
        } catch (err) {
            this.wrapError(err, "No se pudo obtener los cupones");
        }
    }

    async validate(code: string, orderTotal: number): Promise<CouponValidation> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/coupons/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, orderTotal }),
            });
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try { const e: ApiErrorBody = await res.json(); msg = e.message || msg; } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, msg);
            }
            return (await res.json()) as CouponValidation;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError("No se pudo validar el cupón", err instanceof Error ? err : undefined);
        }
    }

    async toggleActive(id: string): Promise<void> {
        return this.patch(id, "toggle");
    }
}

export const couponRepository = new CouponRepository();
