import { authFetch } from "../lib/authFetch";
import { nxFetch } from "../lib/nxFetch";
import { handleRes, wrapErr, buildParams } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { Page } from "../types/api";

export type ApiCampaignType = "PERCENTAGE" | "FIXED" | "FLASH" | "BUNDLE" | "BUY2GET1" | "FREE_SHIPPING";

export interface Campaign {
    id: string;
    name: string;
    type: ApiCampaignType;
    value: number | null;
    badge: string | null;
    badgeColor: string | null;
    startDate: string;
    endDate: string;
    appliesToCategories: string[] | null;
    appliesToProducts: string[] | null;
    active: boolean;
    description: string | null;
    minOrder: number | null;
    maxDiscount: number | null;
    buyQty: number | null;
    getQty: number | null;
    isFlash: boolean | null;
    showOnHome: boolean | null;
    priority: number | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface CampaignPayload {
    name: string;
    type: ApiCampaignType;
    value: number;
    badge?: string;
    badgeColor?: string;
    startDate: string;
    endDate: string;
    appliesToCategories?: string[];
    appliesToProducts?: string[];
    active?: boolean;
    description?: string;
    minOrder?: number;
    maxDiscount?: number | null;
    buyQty?: number;
    getQty?: number;
    isFlash?: boolean;
    showOnHome?: boolean;
    priority?: number;
}

class CampaignRepository {
    private url = `${API_BASE}/api/v1/campaigns`;

    async findActive(): Promise<Campaign[]> {
        try { return handleRes<Campaign[]>(await nxFetch(`${this.url}/active`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener las campañas activas"); }
    }

    async findAll(query: Record<string, unknown> = {}): Promise<Page<Campaign>> {
        try {
            const qs = buildParams(query);
            return handleRes<Page<Campaign>>(await authFetch(`${this.url}?${qs}`));
        } catch (err) { wrapErr(err, "No se pudieron obtener las campañas"); }
    }

    async findById(id: string): Promise<Campaign> {
        try { return handleRes<Campaign>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener la campaña"); }
    }

    async create(data: CampaignPayload): Promise<Campaign> {
        try {
            return handleRes<Campaign>(await authFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear la campaña"); }
    }

    async update(id: string, data: CampaignPayload): Promise<Campaign> {
        try {
            return handleRes<Campaign>(await authFetch(`${this.url}/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar la campaña"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la campaña"); }
    }

    async toggleActive(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}/toggle`, { method: "PATCH", headers: { accept: "*/*" } });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo cambiar el estado de la campaña"); }
    }
}

export const campaignRepository = new CampaignRepository();
