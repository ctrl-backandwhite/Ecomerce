/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  GiftCardRepository                                          ║
 * ║                                                              ║
 * ║  GET  /api/v1/gift-cards/my/sent                             ║
 * ║  GET  /api/v1/gift-cards/my/received                         ║
 * ║  GET  /api/v1/gift-cards/code/{code}                         ║
 * ║  POST /api/v1/gift-cards/purchase                            ║
 * ║  GET  /api/v1/gift-cards/designs/active                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { API_BASE } from "../config/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type GCApiStatus = "PENDING" | "ACTIVE" | "USED" | "EXPIRED" | "VOID";

export interface GiftCardApiDto {
    id: string;
    code: string;
    designId: string | null;
    originalAmount: number;
    balance: number;
    status: GCApiStatus;
    buyerId: string | null;
    recipientName: string | null;
    recipientEmail: string | null;
    message: string | null;
    sendDate: string | null;      // "YYYY-MM-DD"
    expiryDate: string | null;    // "YYYY-MM-DD"
    activatedAt: string | null;
    /** False while a scheduled card is waiting for its sendDate. */
    emailSent: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GiftCardDesignApiDto {
    id: string;
    name: string;
    gradientConfig: Record<string, string> | null;
    emoji: string | null;
    active: boolean;
}

export interface GiftCardPurchasePayload {
    designId?: string;
    amount: number;
    recipientName: string;
    recipientEmail: string;
    message?: string;
    sendDate?: string;     // "YYYY-MM-DD"
    expiryDate?: string;   // "YYYY-MM-DD"
}

// ── Repository ────────────────────────────────────────────────────────────────

class GiftCardRepository {
    /** Tarjetas enviadas por el usuario autenticado (buyerId = me) */
    async getMySent(): Promise<GiftCardApiDto[]> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/gift-cards/my/sent`);
            return handleRes<GiftCardApiDto[]>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener las tarjetas enviadas"); }
    }

    /** Tarjetas recibidas por el email del usuario autenticado */
    async getMyReceived(): Promise<GiftCardApiDto[]> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/gift-cards/my/received`);
            return handleRes<GiftCardApiDto[]>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener las tarjetas recibidas"); }
    }

    /** Consulta una tarjeta por código (activación manual) */
    async getByCode(code: string): Promise<GiftCardApiDto> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/gift-cards/code/${encodeURIComponent(code)}`);
            return handleRes<GiftCardApiDto>(res);
        } catch (err) { wrapErr(err, "Código de tarjeta no válido"); }
    }

    /** Reclama una tarjeta por código (la asocia al usuario autenticado) */
    async claimByCode(code: string): Promise<GiftCardApiDto> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/gift-cards/claim/${encodeURIComponent(code)}`, {
                method: "POST",
            });
            return handleRes<GiftCardApiDto>(res);
        } catch (err) { wrapErr(err, "No se pudo activar la tarjeta"); }
    }

    /** Compra y envía una gift card */
    async purchase(data: GiftCardPurchasePayload): Promise<GiftCardApiDto> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/gift-cards/purchase`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<GiftCardApiDto>(res);
        } catch (err) { wrapErr(err, "No se pudo completar la compra"); }
    }

    /** Diseños activos disponibles */
    async getActiveDesigns(): Promise<GiftCardDesignApiDto[]> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/gift-cards/designs/active`);
            return handleRes<GiftCardDesignApiDto[]>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener los diseños"); }
    }
}

export const giftCardRepository = new GiftCardRepository();

// ── Mappers ────────────────────────────────────────────────────────────────────

function isoToSlash(iso: string | null): string {
    if (!iso) return "—";
    // "YYYY-MM-DD" → "DD/MM/YYYY"
    const d = iso.slice(0, 10);
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
}

function instantToSlash(instant: string | null): string {
    if (!instant) return "—";
    return isoToSlash(instant.slice(0, 10));
}

function statusToFrontend(s: GCApiStatus): "pending" | "active" | "used" | "expired" {
    if (s === "PENDING") return "pending";
    if (s === "ACTIVE") return "active";
    if (s === "USED") return "used";
    return "expired";
}

function sentStatus(s: GCApiStatus, activatedAt: string | null, emailSent: boolean,
    sendDate: string | null): "delivered" | "scheduled" | "pending" | "redeemed" {
    if (s === "USED") return "redeemed";
    if (activatedAt) return "delivered";
    if (!emailSent && sendDate) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (new Date(sendDate) >= today) return "scheduled";
    }
    return "pending";
}

import type { ReceivedGiftCard, SentGiftCard } from "../types/giftcard";

export function toReceivedGiftCard(dto: GiftCardApiDto): ReceivedGiftCard {
    return {
        id: dto.id,
        code: dto.code,
        balance: Number(dto.balance),
        originalAmount: Number(dto.originalAmount),
        fromName: "NX036",
        fromEmail: dto.buyerId ?? "—",
        message: dto.message ?? "",
        receivedDate: dto.activatedAt ? instantToSlash(dto.activatedAt) : instantToSlash(dto.createdAt),
        expiryDate: isoToSlash(dto.expiryDate),
        designId: dto.designId ?? "classic",
        status: statusToFrontend(dto.status),
        isActivated: true,
    };
}

export function toSentGiftCard(dto: GiftCardApiDto): SentGiftCard {
    return {
        id: dto.id,
        code: dto.code,
        amount: Number(dto.originalAmount),
        toName: dto.recipientName ?? "—",
        toEmail: dto.recipientEmail ?? "—",
        message: dto.message ?? "",
        sentDate: instantToSlash(dto.createdAt),
        scheduledDate: dto.sendDate ? isoToSlash(dto.sendDate) : undefined,
        designId: dto.designId ?? "classic",
        status: sentStatus(dto.status, dto.activatedAt, dto.emailSent, dto.sendDate),
    };
}
