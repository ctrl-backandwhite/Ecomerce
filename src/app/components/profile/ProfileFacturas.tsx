import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
    FileText, Search, Eye, Download, Printer,
    CheckCircle2, Clock, AlertTriangle, Ban, X,
    ChevronLeft, ChevronRight,
} from "lucide-react";
import { invoiceRepository, type Invoice, type InvoiceStatus } from "../../repositories/InvoiceRepository";
import { InvoiceDocument } from "../InvoiceDocument";
import type { InvoiceStatus as DocStatus } from "../../types/invoice";
import { toast } from "sonner";
import { useCurrency } from "../../context/CurrencyContext";

/* ── Status helpers ────────────────────────────────────────── */
const STATUS_META: Record<InvoiceStatus, { label: string; bg: string; text: string; dot: string; icon: typeof CheckCircle2 }> = {
    PAID: { label: "Pagada", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400", icon: CheckCircle2 },
    PENDING: { label: "Pendiente", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", icon: Clock },
    OVERDUE: { label: "Vencida", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400", icon: AlertTriangle },
    VOID: { label: "Anulada", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-300", icon: Ban },
};

function fmtPrice(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s: string) {
    return new Date(s).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

/** Map backend Invoice → InvoiceDocument data shape */
function toDocData(inv: Invoice) {
    return {
        invoiceNumber: inv.invoiceNumber,
        orderNumber: inv.orderNumber ?? "",
        date: inv.issueDate,
        dueDate: inv.dueDate,
        status: inv.status.toLowerCase() as DocStatus,
        customer: {
            name: inv.customerSnapshot?.name ?? "",
            email: inv.customerSnapshot?.email ?? "",
            phone: inv.customerSnapshot?.phone,
            address: inv.customerSnapshot?.address,
        },
        lines: (inv.lines ?? []).map((l) => ({
            name: String(l.name ?? ""),
            sku: String(l.sku ?? ""),
            quantity: Number(l.quantity ?? 0),
            unitPrice: Number(l.unitPrice ?? 0),
            total: Number(l.total ?? 0),
        })),
        subtotal: inv.subtotal,
        shipping: inv.shipping,
        tax: inv.tax,
        total: inv.total,
        discountAmount: inv.discountAmount ?? 0,
        giftCardAmount: inv.giftCardAmount ?? 0,
        loyaltyDiscount: inv.loyaltyDiscount ?? 0,
        paymentMethod: inv.paymentMethod,
        notes: inv.notes ?? undefined,
    };
}

/* ── Component ─────────────────────────────────────────────── */
const PAGE_SIZE = 8;

export function ProfileFacturas() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const { formatPrice } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
    const [preview, setPreview] = useState<Invoice | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        invoiceRepository
            .getMyInvoices()
            .then((data) => { if (!cancelled) setInvoices(Array.isArray(data) ? data : (data as any).content ?? []); })
            .catch(() => { if (!cancelled) toast.error("Error al cargar las facturas"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => setPage(1), [search, statusFilter]);

    /* ── Filtered ────────────────────────────────────────────── */
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return invoices.filter((inv) => {
            if (statusFilter !== "all" && inv.status !== statusFilter) return false;
            if (q &&
                !inv.invoiceNumber.toLowerCase().includes(q) &&
                !(inv.orderNumber ?? "").toLowerCase().includes(q)
            ) return false;
            return true;
        });
    }, [invoices, search, statusFilter]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    /* ── Stats ───────────────────────────────────────────────── */
    const stats = useMemo(() => ({
        total: invoices.length,
        paid: invoices.filter((i) => i.status === "PAID").length,
        pending: invoices.filter((i) => i.status === "PENDING").length,
        totalAmount: invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0),
    }), [invoices]);

    /* ── Loading skeleton ────────────────────────────────────── */
    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    /* ── Empty state ─────────────────────────────────────────── */
    if (invoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-gray-900 mb-1">Sin facturas todavía</p>
                <p className="text-xs text-gray-400">Las facturas se generan automáticamente al realizar un pedido.</p>
            </div>
        );
    }

    return (
        <>
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-base text-gray-900">Mis Facturas</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {stats.total} factura{stats.total !== 1 ? "s" : ""} · {formatPrice(stats.totalAmount)} facturado
                    </p>
                </div>
            </div>

            {/* ── Stats cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                    { label: "Total", value: stats.total, color: "text-gray-900" },
                    { label: "Pagadas", value: stats.paid, color: "text-green-600" },
                    { label: "Pendientes", value: stats.pending, color: "text-amber-600" },
                    { label: "Facturado", value: formatPrice(stats.totalAmount), color: "text-gray-900" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                        <p className={`text-lg font-light ${color}`}>{value}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Filters ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por número de factura u orden…"
                        className="w-full h-9 pl-9 pr-3 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>

                <div className="flex gap-1.5">
                    {(["all", "PAID", "PENDING", "OVERDUE", "VOID"] as const).map((s) => {
                        const active = statusFilter === s;
                        const label = s === "all" ? "Todas" : STATUS_META[s].label;
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`h-9 px-3 text-[11px] rounded-lg border transition-colors ${active
                                    ? "border-gray-900 bg-gray-900 text-white"
                                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                    }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Invoice list ────────────────────────────────────── */}
            <div className="space-y-2">
                {paginated.map((inv) => {
                    const sm = STATUS_META[inv.status];
                    const SmIcon = sm.icon;
                    return (
                        <div
                            key={inv.id}
                            className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex items-center gap-4 hover:shadow-sm transition-shadow group"
                        >
                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${sm.bg}`}>
                                <FileText className={`w-4 h-4 ${sm.text}`} strokeWidth={1.5} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-xs text-gray-900 font-mono truncate">{inv.invoiceNumber}</p>
                                    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${sm.bg} ${sm.text}`}>
                                        <SmIcon className="w-2.5 h-2.5" />
                                        {sm.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                    <span>Orden: {inv.orderNumber ?? "—"}</span>
                                    <span>·</span>
                                    <span>{fmtDate(inv.issueDate)}</span>
                                </div>
                            </div>

                            {/* Amount */}
                            <p className="text-sm text-gray-900 tabular-nums flex-shrink-0">{formatPrice(inv.total)}</p>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setPreview(inv)}
                                    title="Ver factura"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <Eye className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Pagination ──────────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-gray-500">{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* ── Invoice preview modal (portal) ──────────────────── */}
            {preview &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/50 p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setPreview(null); }}
                    >
                        <div className="relative w-full max-w-3xl my-8">
                            <InvoiceDocument
                                data={toDocData(preview)}
                                onClose={() => setPreview(null)}
                                mode="page"
                            />
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
