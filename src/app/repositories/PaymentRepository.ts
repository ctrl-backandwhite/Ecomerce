/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  PaymentRepository                                           ║
 * ║    POST /api/v1/payments/process                             ║
 * ║    GET  /api/v1/payments/{id}                                ║
 * ║    GET  /api/v1/payments/order/{orderId}                     ║
 * ║    GET  /api/v1/payments                                     ║
 * ║    POST /api/v1/payments/{id}/refund                         ║
 * ║    GET  /api/v1/payments/{id}/refunds                        ║
 * ║    POST /api/v1/payments/crypto/create                       ║
 * ║    GET  /api/v1/payments/crypto/{id}/verify                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody, Page } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";
const BASE_URL = `${API_BASE}/api/v1/payments`;

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface Payment {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    method: string;
    status: PaymentStatus;
    transactionId: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface ProcessPaymentPayload {
    orderId: string;
    method: "STRIPE" | "PAYPAL" | "CRYPTO";
    returnUrl?: string;
}

export interface Refund {
    id: string;
    paymentId: string;
    amount: number;
    reason: string;
    status: "PENDING" | "COMPLETED" | "FAILED";
    createdAt: string;
}

export interface CryptoPayment {
    id: string;
    address: string;
    amount: number;
    currency: string;
    network: string;
    expiresAt: string;
    status: "AWAITING" | "CONFIRMED" | "EXPIRED";
}

export interface PaymentQuery {
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

class PaymentRepository {
    async processPayment(data: ProcessPaymentPayload): Promise<Payment> {
        try {
            const res = await authFetch(`${BASE_URL}/process`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Payment>(res);
        } catch (err) { wrapErr(err, "No se pudo procesar el pago"); }
    }

    async findById(id: string): Promise<Payment> {
        try {
            const res = await authFetch(`${BASE_URL}/${id}`);
            return handleRes<Payment>(res);
        } catch (err) { wrapErr(err, `No se pudo obtener el pago ${id}`); }
    }

    async findByOrderId(orderId: string): Promise<Payment> {
        try {
            const res = await authFetch(`${BASE_URL}/order/${orderId}`);
            return handleRes<Payment>(res);
        } catch (err) { wrapErr(err, "No se pudo obtener el pago del pedido"); }
    }

    async findAll(query: PaymentQuery = {}): Promise<Page<Payment>> {
        try {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== null) params.set(k, String(v));
            }
            const res = await authFetch(`${BASE_URL}?${params}`);
            return handleRes<Page<Payment>>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener los pagos"); }
    }

    async refund(paymentId: string, amount: number, reason: string): Promise<Refund> {
        try {
            const res = await authFetch(`${BASE_URL}/${paymentId}/refund`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, reason }),
            });
            return handleRes<Refund>(res);
        } catch (err) { wrapErr(err, "No se pudo procesar el reembolso"); }
    }

    async findRefunds(paymentId: string): Promise<Refund[]> {
        try {
            const res = await authFetch(`${BASE_URL}/${paymentId}/refunds`);
            return handleRes<Refund[]>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener los reembolsos"); }
    }

    async createCryptoPayment(data: { orderId: string; network: string; currency: string }): Promise<CryptoPayment> {
        try {
            const res = await authFetch(`${BASE_URL}/crypto/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<CryptoPayment>(res);
        } catch (err) { wrapErr(err, "No se pudo crear el pago cripto"); }
    }

    async verifyCryptoPayment(id: string): Promise<CryptoPayment> {
        try {
            const res = await authFetch(`${BASE_URL}/crypto/${id}/verify`);
            return handleRes<CryptoPayment>(res);
        } catch (err) { wrapErr(err, "No se pudo verificar el pago cripto"); }
    }
}

export const paymentRepository = new PaymentRepository();
