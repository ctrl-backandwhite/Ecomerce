/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ShippingRepository                                          ║
 * ║    GET  /api/v1/shipping/options                             ║
 * ║    CRUD /api/v1/shipping/carriers                            ║
 * ║    CRUD /api/v1/shipping/rules                               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { Page } from "../types/api";

const BASE_URL = `${API_BASE}/api/v1/shipping`;

/** Shape returned by the backend */
interface ApiShippingOption {
    ruleId: string;
    carrierName: string;
    rate: number;
    estimatedDays: number;
    freeShipping: boolean;
    freeAbove: number | null;
}

export interface ShippingOption {
    id: string;
    name: string;
    carrier: string;
    estimatedDays: number;
    price: number;
    freeAbove: number | null;
}

export interface Carrier {
    id: string;
    name: string;
    code: string;
    logoUrl: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string | null;
}

export interface CarrierPayload {
    name: string;
    code: string;
    logoUrl?: string;
    active?: boolean;
}

export interface ShippingRule {
    id: string;
    carrierId: string;
    zone: string | null;
    weightMin: number | null;
    weightMax: number | null;
    priceMin: number | null;
    priceMax: number | null;
    rate: number;
    freeAbove: number | null;
    estimatedDays: number;
    active: boolean;
    carrierName: string;
    createdAt: string;
    updatedAt: string | null;
}

export interface ShippingRulePayload {
    carrierId: string;
    zone?: string;
    weightMin?: number;
    weightMax?: number;
    priceMin?: number;
    priceMax?: number;
    rate: number;
    freeAbove?: number;
    estimatedDays?: number;
    active?: boolean;
}

class ShippingRepository {
    // Options (authenticated — user is at checkout)
    async getOptions(query: Record<string, string> = {}): Promise<ShippingOption[]> {
        try {
            const params = new URLSearchParams(query);
            const res = await authFetch(`${BASE_URL}/options?${params}`);
            const body = await handleRes<{ options: ApiShippingOption[] }>(res);
            return (body.options ?? []).map((o) => ({
                id: o.ruleId,
                name: o.carrierName,
                carrier: o.carrierName,
                estimatedDays: o.estimatedDays,
                price: o.freeShipping ? 0 : Number(o.rate),
                freeAbove: o.freeAbove != null ? Number(o.freeAbove) : null,
            }));
        } catch (err) { wrapErr(err, "No se pudieron obtener las opciones de envío"); }
    }

    // Carriers (admin)
    async findAllCarriers(): Promise<Carrier[]> {
        try {
            const res = await authFetch(`${BASE_URL}/carriers`);
            const page = await handleRes<Page<Carrier>>(res);
            return page.content;
        } catch (err) { wrapErr(err, "No se pudieron obtener los transportistas"); }
    }

    async findCarrierById(id: string): Promise<Carrier> {
        try {
            const res = await authFetch(`${BASE_URL}/carriers/${id}`);
            return handleRes<Carrier>(res);
        } catch (err) { wrapErr(err, "No se pudo obtener el transportista"); }
    }

    async createCarrier(data: CarrierPayload): Promise<Carrier> {
        try {
            const res = await authFetch(`${BASE_URL}/carriers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Carrier>(res);
        } catch (err) { wrapErr(err, "No se pudo crear el transportista"); }
    }

    async updateCarrier(id: string, data: CarrierPayload): Promise<Carrier> {
        try {
            const res = await authFetch(`${BASE_URL}/carriers/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Carrier>(res);
        } catch (err) { wrapErr(err, "No se pudo actualizar el transportista"); }
    }

    async deleteCarrier(id: string): Promise<void> {
        try {
            const res = await authFetch(`${BASE_URL}/carriers/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el transportista"); }
    }

    // Rules (admin)
    async findAllRules(): Promise<ShippingRule[]> {
        try {
            const res = await authFetch(`${BASE_URL}/rules`);
            const page = await handleRes<Page<ShippingRule>>(res);
            return page.content;
        } catch (err) { wrapErr(err, "No se pudieron obtener las reglas de envío"); }
    }

    async findRuleById(id: string): Promise<ShippingRule> {
        try {
            const res = await authFetch(`${BASE_URL}/rules/${id}`);
            return handleRes<ShippingRule>(res);
        } catch (err) { wrapErr(err, "No se pudo obtener la regla"); }
    }

    async createRule(data: ShippingRulePayload): Promise<ShippingRule> {
        try {
            const res = await authFetch(`${BASE_URL}/rules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<ShippingRule>(res);
        } catch (err) { wrapErr(err, "No se pudo crear la regla"); }
    }

    async updateRule(id: string, data: ShippingRulePayload): Promise<ShippingRule> {
        try {
            const res = await authFetch(`${BASE_URL}/rules/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<ShippingRule>(res);
        } catch (err) { wrapErr(err, "No se pudo actualizar la regla"); }
    }

    async deleteRule(id: string): Promise<void> {
        try {
            const res = await authFetch(`${BASE_URL}/rules/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la regla"); }
    }
}

export const shippingRepository = new ShippingRepository();
