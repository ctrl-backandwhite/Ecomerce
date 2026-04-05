/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  InvoiceRepository                                           ║
 * ║    GET  /api/v1/invoices/me            (my invoices)         ║
 * ║    GET  /api/v1/invoices/order/{id}    (by order)            ║
 * ║    GET  /api/v1/invoices               (admin list)          ║
 * ║    GET  /api/v1/invoices/{id}          (detail)              ║
 * ║    POST /api/v1/invoices               (create)              ║
 * ║    PUT  /api/v1/invoices/{id}          (update)              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody, Page } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";
const BASE_URL = `${API_BASE}/api/v1/invoices`;

export type InvoiceStatus = "PAID" | "PENDING" | "OVERDUE" | "VOID";

export interface InvoiceLine {
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    orderId: string;
    orderNumber: string;
    issueDate: string;
    dueDate: string;
    status: InvoiceStatus;
    customerSnapshot: { name: string; email?: string; phone?: string; address?: string };
    lines: InvoiceLine[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    paymentMethod: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface InvoicePayload {
    orderId: string;
    dueDate: string;
    notes?: string;
}

export interface InvoiceQuery {
    page?: number;
    size?: number;
    status?: string;
    search?: string;
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

class InvoiceRepository {
    async getMyInvoices(): Promise<Invoice[]> {
        try {
            const res = await authFetch(`${BASE_URL}/me`);
            const body = await handleRes<Page<Invoice> | Invoice[]>(res);
            return Array.isArray(body) ? body : (body as Page<Invoice>).content;
        } catch (err) { wrapErr(err, "No se pudieron obtener las facturas"); }
    }

    async findByOrderId(orderId: string): Promise<Invoice> {
        try {
            const res = await authFetch(`${BASE_URL}/order/${orderId}`);
            return handleRes<Invoice>(res);
        } catch (err) { wrapErr(err, `No se pudo obtener la factura del pedido ${orderId}`); }
    }

    async findAll(query: InvoiceQuery = {}): Promise<Page<Invoice>> {
        try {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== null) params.set(k, String(v));
            }
            const res = await authFetch(`${BASE_URL}?${params}`);
            return handleRes<Page<Invoice>>(res);
        } catch (err) { wrapErr(err, "No se pudieron obtener las facturas"); }
    }

    async findById(id: string): Promise<Invoice> {
        try {
            const res = await authFetch(`${BASE_URL}/${id}`);
            return handleRes<Invoice>(res);
        } catch (err) { wrapErr(err, `No se pudo obtener la factura ${id}`); }
    }

    async create(data: InvoicePayload): Promise<Invoice> {
        try {
            const res = await authFetch(BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Invoice>(res);
        } catch (err) { wrapErr(err, "No se pudo crear la factura"); }
    }

    async update(id: string, data: Partial<InvoicePayload>): Promise<Invoice> {
        try {
            const res = await authFetch(`${BASE_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<Invoice>(res);
        } catch (err) { wrapErr(err, `No se pudo actualizar la factura ${id}`); }
    }

    async markPaid(id: string): Promise<Invoice> {
        try {
            const inv = await this.findById(id);
            const payload = {
                orderId: inv.orderId,
                status: "PAID",
                issueDate: inv.issueDate,
                dueDate: inv.dueDate,
                subtotal: inv.subtotal,
                shipping: inv.shipping,
                tax: inv.tax,
                total: inv.total,
                paymentMethod: inv.paymentMethod,
                customerSnapshot: inv.customerSnapshot,
                lines: inv.lines,
                notes: inv.notes,
            };
            const res = await authFetch(`${BASE_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            return handleRes<Invoice>(res);
        } catch (err) { wrapErr(err, `No se pudo marcar como pagada la factura ${id}`); }
    }

    async markVoid(id: string): Promise<Invoice> {
        try {
            const inv = await this.findById(id);
            const payload = {
                orderId: inv.orderId,
                status: "VOID",
                issueDate: inv.issueDate,
                dueDate: inv.dueDate,
                subtotal: inv.subtotal,
                shipping: inv.shipping,
                tax: inv.tax,
                total: inv.total,
                paymentMethod: inv.paymentMethod,
                customerSnapshot: inv.customerSnapshot,
                lines: inv.lines,
                notes: inv.notes,
            };
            const res = await authFetch(`${BASE_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            return handleRes<Invoice>(res);
        } catch (err) { wrapErr(err, `No se pudo anular la factura ${id}`); }
    }
}

export const invoiceRepository = new InvoiceRepository();
