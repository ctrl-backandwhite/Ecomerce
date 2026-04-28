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
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { API_BASE } from "../config/api";
import type { Page } from "../types/api";

const BASE_URL = `${API_BASE}/api/v1/payments`;

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type PaymentMethodType = "CARD" | "PAYPAL" | "USDT" | "BTC";

export interface Payment {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    /** Actual amount charged to the payment provider (e.g. in USDT/BTC) */
    settlementAmount: number | null;
    /** Currency used for settlement (e.g. "USDT", "BTC", "USD") */
    settlementCurrency: string | null;
    /** Exchange rate from display currency to settlement currency */
    exchangeRate: number | null;
    paymentMethod: PaymentMethodType;
    status: PaymentStatus;
    providerRef: string | null;
    errorMessage: string | null;
    cryptoAddress: string | null;
    cryptoExpiresAt: string | null;
    qrCodeUrl: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface ProcessPaymentPayload {
    orderId: string;
    userId: string;
    email?: string;
    amount: number;
    currency?: string;
    paymentMethod: "CARD" | "PAYPAL" | "USDT" | "BTC";
    idempotencyKey?: string;
    /** Stripe payment method ID (pm_xxxx) created by Stripe.js. Required for real CARD payments. */
    stripePaymentMethodId?: string;
}

export interface Refund {
    id: string;
    paymentId: string;
    amount: number;
    reason: string;
    status: "PENDING" | "COMPLETED" | "FAILED";
    createdAt: string;
}

export interface PaymentQuery {
    page?: number;
    size?: number;
    status?: string;
    sortBy?: string;
    ascending?: boolean;
}

class PaymentRepository {
    async processPayment(data: ProcessPaymentPayload): Promise<Payment> {
        try {
            const res = await authFetch(`${BASE_URL}/process`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const payment = await handleRes<Payment>(res);
            // Defensive: if the backend ever returns 200 with a FAILED
            // payment (older deployments), surface it as an error so the
            // checkout stops before calling confirmOrder.
            if (payment?.status === "FAILED") {
                throw new Error("Gateway rejected the payment");
            }
            return payment;
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

    async createCryptoPayment(data: { orderId: string; network: string; currency: string }): Promise<Payment> {
        try {
            const res = await authFetch(`${BASE_URL}/crypto/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Payment>(res);
        } catch (err) { wrapErr(err, "No se pudo crear el pago cripto"); }
    }

    async verifyCryptoPayment(id: string): Promise<Payment> {
        try {
            const res = await authFetch(`${BASE_URL}/crypto/${id}/verify`);
            return handleRes<Payment>(res);
        } catch (err) { wrapErr(err, "No se pudo verificar el pago cripto"); }
    }

    /** PayPal two-step flow — step 1. Creates the PayPal order on the backend
     *  and returns the approveUrl. The frontend redirects the buyer to that
     *  URL; after approval PayPal redirects back to /checkout/paypal-return. */
    async initiatePayPal(data: ProcessPaymentPayload): Promise<{
        paymentId: string; paypalOrderId: string; approveUrl: string;
    }> {
        try {
            const res = await authFetch(`${BASE_URL}/paypal/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<{ paymentId: string; paypalOrderId: string; approveUrl: string }>(res);
        } catch (err) { wrapErr(err, "No se pudo iniciar el pago con PayPal"); }
    }

    /** PayPal two-step flow — step 2. Captures an already-approved order. */
    async capturePayPal(paypalOrderId: string): Promise<Payment> {
        try {
            const res = await authFetch(`${BASE_URL}/paypal/orders/${paypalOrderId}/capture`, {
                method: "POST",
            });
            const payment = await handleRes<Payment>(res);
            if (payment?.status === "FAILED") {
                throw new Error("PayPal rechazó el pago");
            }
            return payment;
        } catch (err) { wrapErr(err, "No se pudo capturar el pago con PayPal"); }
    }
}

export const paymentRepository = new PaymentRepository();
