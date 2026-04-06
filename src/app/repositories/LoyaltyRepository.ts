import { authFetch } from "../lib/authFetch";
import { handleRes, wrapErr, buildParams } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { Page } from "../types/api";

export type LoyaltyAction = "PURCHASE" | "REVIEW" | "REFERRAL" | "REGISTRATION" | "REDEMPTION";

export interface LoyaltyTier {
    id: string;
    name: string;
    minPoints: number;
    maxPoints: number;
    multiplier: number;
    benefits: { label: string }[];
    createdAt: string;
    updatedAt: string;
}

export interface LoyaltyTierPayload {
    name: string;
    minPoints: number;
    maxPoints: number;
    multiplier: number;
    benefits: { label: string }[];
}

export interface LoyaltyRule {
    id: string;
    action: LoyaltyAction;
    pointsPerUnit: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LoyaltyRulePayload {
    action: LoyaltyAction;
    pointsPerUnit: number;
    active?: boolean;
}

export interface LoyaltyBalance {
    userId: string;
    balance: number;
}

export interface LoyaltyHistory {
    id: string;
    userId: string;
    type: "EARN" | "REDEEM" | "ADJUST" | "EXPIRE";
    points: number;
    description: string;
    orderId: string | null;
    createdAt: string;
}

class LoyaltyRepository {
    private url = `${API_BASE}/api/v1/loyalty`;

    // Tiers
    async findAllTiers(): Promise<LoyaltyTier[]> {
        try { return handleRes<LoyaltyTier[]>(await authFetch(`${this.url}/tiers`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los niveles"); }
    }

    async createTier(data: LoyaltyTierPayload): Promise<LoyaltyTier> {
        try {
            return handleRes<LoyaltyTier>(await authFetch(`${this.url}/tiers`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear el nivel"); }
    }

    async updateTier(id: string, data: LoyaltyTierPayload): Promise<LoyaltyTier> {
        try {
            return handleRes<LoyaltyTier>(await authFetch(`${this.url}/tiers/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar el nivel"); }
    }

    async deleteTier(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/tiers/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el nivel"); }
    }

    // Rules
    async findAllRules(): Promise<LoyaltyRule[]> {
        try { return handleRes<LoyaltyRule[]>(await authFetch(`${this.url}/rules`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener las reglas"); }
    }

    async createRule(data: LoyaltyRulePayload): Promise<LoyaltyRule> {
        try {
            return handleRes<LoyaltyRule>(await authFetch(`${this.url}/rules`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear la regla"); }
    }

    async updateRule(id: string, data: LoyaltyRulePayload): Promise<LoyaltyRule> {
        try {
            return handleRes<LoyaltyRule>(await authFetch(`${this.url}/rules/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar la regla"); }
    }

    async deleteRule(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/rules/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la regla"); }
    }

    // User loyalty
    async getBalance(): Promise<LoyaltyBalance> {
        try { return handleRes<LoyaltyBalance>(await authFetch(`${this.url}/balance`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el saldo de puntos"); }
    }

    async getRedemptionRate(): Promise<{ pointsPerDollar: number }> {
        try { return handleRes<{ pointsPerDollar: number }>(await authFetch(`${this.url}/redemption-rate`)); }
        catch (err) { wrapErr(err, "No se pudo obtener la tasa de canjeo"); }
    }

    async redeemPoints(points: number, description: string, orderId?: string): Promise<LoyaltyHistory> {
        try {
            return handleRes<LoyaltyHistory>(await authFetch(`${this.url}/redeem`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ points, description, orderId: orderId ?? null }),
            }));
        } catch (err) { wrapErr(err, "No se pudieron canjear los puntos"); }
    }

    async getHistory(query: Record<string, unknown> = {}): Promise<Page<LoyaltyHistory>> {
        try {
            const qs = buildParams(query);
            return handleRes<Page<LoyaltyHistory>>(await authFetch(`${this.url}/history?${qs}`));
        } catch (err) { wrapErr(err, "No se pudo obtener el historial"); }
    }
}

export const loyaltyRepository = new LoyaltyRepository();
