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
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";

// ── Types ─────────────────────────────────────────────────────────────────────

export type GCApiStatus = "ACTIVE" | "USED" | "EXPIRED" | "VOID";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function handleRes<R>(res: Response): Promise<R> {
    if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
            const e: ApiErrorBody = await res.json();
            errorMsg = e.message || errorMsg;
        } catch { /* */ }
        throw new ApiError(res.status, errorMsg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as R);
}

function wrapErr(err: unknown, msg: string): never {
    if (err instanceof ApiError) throw err;
    throw new NetworkError(msg, err instanceof Error ? err : undefined);
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

function statusToFrontend(s: GCApiStatus): "active" | "used" | "expired" {
    if (s === "ACTIVE") return "active";
    if (s === "USED") return "used";
    return "expired";
}

function sentStatus(s: GCApiStatus): "delivered" | "pending" | "redeemed" {
    if (s === "USED") return "redeemed";
    return "delivered";
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
        status: sentStatus(dto.status),
    };
}
