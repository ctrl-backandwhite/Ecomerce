/* ── Invoice types ──────────────────────────────────────────── */

export type InvoiceStatus = "paid" | "pending" | "overdue" | "void";

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
    orderNumber: string;
    date: string;
    dueDate: string;
    status: InvoiceStatus;
    customer: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    lines: InvoiceLine[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
}
