import { authFetch } from "../lib/authFetch";
import { nxFetch } from "../lib/nxFetch";
import { handleRes, wrapErr, buildParams } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { Page } from "../types/api";

export interface GiftCardDesign {
    id: string;
    name: string;
    from: string;
    to: string;
    accent: string;
    patternClass: string;
    emoji: string;
    active: boolean;
}

export interface GiftCard {
    id: string;
    code: string;
    designId: string;
    buyerId: string;
    recipientName: string | null;
    recipientEmail: string | null;
    originalAmount: number;
    balance: number;
    message: string | null;
    status: "PENDING" | "ACTIVE" | "USED" | "EXPIRED" | "VOID";
    sendDate: string | null;
    expiryDate: string | null;
    activatedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface GiftCardTransaction {
    id: string;
    giftCardId: string;
    type: "PURCHASE" | "REDEMPTION" | "REFUND";
    amount: number;
    orderId: string | null;
    createdAt: string;
}

export interface GiftCardPurchasePayload {
    designId: string;
    amount: number;
    recipientEmail?: string;
    message?: string;
}

class GiftCardRepository {
    private url = `${API_BASE}/api/v1/gift-cards`;

    // Public
    async findActiveDesigns(): Promise<GiftCardDesign[]> {
        try { return handleRes<GiftCardDesign[]>(await nxFetch(`${this.url}/designs/active`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los diseños"); }
    }

    async purchase(data: GiftCardPurchasePayload): Promise<GiftCard> {
        try {
            return handleRes<GiftCard>(await authFetch(`${this.url}/purchase`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo comprar la tarjeta regalo"); }
    }

    async findByCode(code: string): Promise<GiftCard> {
        try { return handleRes<GiftCard>(await authFetch(`${this.url}/code/${code}`)); }
        catch (err) { wrapErr(err, "No se encontró la tarjeta regalo"); }
    }

    async getBalance(code: string): Promise<{ balance: number }> {
        try {
            const raw = await handleRes<number>(await authFetch(`${this.url}/code/${code}/balance`));
            return { balance: typeof raw === "number" ? raw : (raw as any).balance ?? 0 };
        }
        catch (err) { wrapErr(err, "No se pudo obtener el saldo"); }
    }

    async redeem(data: { code: string; amount: number; orderId: string }): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/redeem`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo canjear la tarjeta regalo"); }
    }

    // Admin
    async findAllDesigns(): Promise<GiftCardDesign[]> {
        try { return handleRes<GiftCardDesign[]>(await authFetch(`${this.url}/designs`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los diseños"); }
    }

    async createDesign(data: Partial<GiftCardDesign>): Promise<GiftCardDesign> {
        try {
            return handleRes<GiftCardDesign>(await authFetch(`${this.url}/designs`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear el diseño"); }
    }

    async updateDesign(id: string, data: Partial<GiftCardDesign>): Promise<GiftCardDesign> {
        try {
            return handleRes<GiftCardDesign>(await authFetch(`${this.url}/designs/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar el diseño"); }
    }

    async deleteDesign(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/designs/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el diseño"); }
    }

    async findAll(query: Record<string, unknown> = {}): Promise<Page<GiftCard>> {
        try {
            const qs = buildParams(query);
            return handleRes<Page<GiftCard>>(await authFetch(`${this.url}?${qs}`));
        } catch (err) { wrapErr(err, "No se pudieron obtener las tarjetas regalo"); }
    }

    async findById(id: string): Promise<GiftCard> {
        try { return handleRes<GiftCard>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener la tarjeta regalo"); }
    }

    async findTransactions(id: string): Promise<GiftCardTransaction[]> {
        try { return handleRes<GiftCardTransaction[]>(await authFetch(`${this.url}/${id}/transactions`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener las transacciones"); }
    }
}

export const adminGiftCardRepository = new GiftCardRepository();
