import { useState, useEffect, useMemo } from "react";
import {
  Search, X, Eye, Ban, Download, FileText,
  CheckCircle2, Clock, AlertTriangle, DollarSign,
  Printer, Plus,
} from "lucide-react";
import { invoices as initialInvoices, type Invoice, type InvoiceStatus } from "../../data/invoices";
import { InvoiceDocument } from "../../components/InvoiceDocument";
import { toast } from "sonner";
import { Pagination } from "../../components/admin/Pagination";

/* ── Status meta ───────────────────────────────────────────── */
const STATUS_META: Record<InvoiceStatus, { label: string; bg: string; text: string; dot: string; icon: typeof CheckCircle2 }> = {
  paid:    { label: "Pagada",    bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400",  icon: CheckCircle2  },
  pending: { label: "Pendiente", bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  icon: Clock         },
  overdue: { label: "Vencida",   bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-400",    icon: AlertTriangle },
  void:    { label: "Anulada",   bg: "bg-gray-100",  text: "text-gray-500",   dot: "bg-gray-300",   icon: Ban           },
};

/* ── Void confirm ───────────────────────────────────────────── */
function VoidConfirm({ invoice, onConfirm, onCancel }: { invoice: Invoice; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
          <Ban className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-sm text-gray-900 mb-1">¿Anular factura?</p>
        <p className="text-xs text-gray-400 mb-1">{invoice.invoiceNumber} · {invoice.customer.name}</p>
        <p className="text-xs text-gray-400 mb-5">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2 justify-center">
          <button onClick={onCancel} className="h-7 px-4 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="h-7 px-4 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Anular factura</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────── */
export function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState<"all" | InvoiceStatus>("all");
  const [preview,  setPreview]  = useState<Invoice | null>(null);
  const [voidId,   setVoidId]   = useState<string | null>(null);
  const [page,     setPage]     = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => setPage(1), [search, statusF]);

  /* ── Filtered list ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter(inv => {
      if (statusF !== "all" && inv.status !== statusF) return false;
      if (q &&
        !inv.invoiceNumber.toLowerCase().includes(q) &&
        !inv.orderNumber.toLowerCase().includes(q) &&
        !inv.customer.name.toLowerCase().includes(q) &&
        !inv.customer.email.toLowerCase().includes(q)
      ) return false;
      return true;
    });
  }, [invoices, search, statusF]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Stats ─────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total:   invoices.length,
    paid:    invoices.filter(i => i.status === "paid").length,
    pending: invoices.filter(i => i.status === "pending").length,
    overdue: invoices.filter(i => i.status === "overdue").length,
    revenue: invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0),
  }), [invoices]);

  function handleVoid(id: string) {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "void" } : inv));
    toast.success("Factura anulada");
    setVoidId(null);
  }

  function handleMarkPaid(id: string) {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "paid" } : inv));
    toast.success("Factura marcada como pagada");
  }

  /* ── Invoice data adapter for InvoiceDocument ──────────────── */
  function toDocData(inv: Invoice) {
    return {
      invoiceNumber: inv.invoiceNumber,
      orderNumber:   inv.orderNumber,
      date:          inv.date,
      dueDate:       inv.dueDate,
      status:        inv.status,
      customer:      inv.customer,
      lines:         inv.lines,
      subtotal:      inv.subtotal,
      shipping:      inv.shipping,
      tax:           inv.tax,
      total:         inv.total,
      paymentMethod: inv.paymentMethod,
      notes:         inv.notes,
    };
  }

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Facturas</h1>
          <p className="text-xs text-gray-400 mt-0.5">{invoices.length} facturas en total</p>
        </div>
        <button
          onClick={() => toast.info("La factura se genera automáticamente al confirmar un pedido")}
          className="w-9 h-9 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
          title="Nueva factura"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total facturas",      value: stats.total,                              icon: FileText,     color: "text-gray-700"   },
          { label: "Pagadas",             value: stats.paid,                               icon: CheckCircle2, color: "text-green-600"  },
          { label: "Pendientes/Vencidas", value: stats.pending + stats.overdue,            icon: Clock,        color: "text-amber-600"  },
          { label: "Total facturado",     value: `$${stats.revenue.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-gray-900" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              <s.icon className={`w-4 h-4 ${s.color}`} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg text-gray-900 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
          <input
            className="w-full h-7 pl-8 pr-7 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300"
            placeholder="Buscar por nº factura, orden o cliente…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <select
          value={statusF}
          onChange={e => setStatusF(e.target.value as any)}
          className="h-7 px-2.5 text-xs text-gray-600 border border-gray-200 rounded-lg bg-white focus:outline-none"
        >
          <option value="all">Todos los estados</option>
          <option value="paid">Pagadas</option>
          <option value="pending">Pendientes</option>
          <option value="overdue">Vencidas</option>
          <option value="void">Anuladas</option>
        </select>
        <span className="text-xs text-gray-400 ml-1">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="grid grid-cols-[1.2fr_1fr_1.5fr_0.9fr_0.9fr_0.8fr_0.8fr_96px] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
          {[
            { label: "Nº Factura",  cls: "text-left"   },
            { label: "Nº Orden",    cls: "text-left"   },
            { label: "Cliente",     cls: "text-left"   },
            { label: "Emisión",     cls: "text-center" },
            { label: "Vencimiento", cls: "text-center" },
            { label: "Total",       cls: "text-right"  },
            { label: "Estado",      cls: "text-left"   },
            { label: "",            cls: "text-right"  },
          ].map(h => (
            <p key={h.label} className={`text-[10px] text-gray-400 uppercase tracking-wider ${h.cls}`}>{h.label}</p>
          ))}
        </div>

        <div className="overflow-auto flex-1">
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" strokeWidth={1} />
              <p className="text-sm text-gray-400">No se encontraron facturas</p>
            </div>
          )}

          {paginated.map((inv, i) => {
            const sm = STATUS_META[inv.status];
            return (
              <div
                key={inv.id}
                className={`grid grid-cols-[1.2fr_1fr_1.5fr_0.9fr_0.9fr_0.8fr_0.8fr_96px] gap-3 px-4 py-3 items-center hover:bg-gray-50/60 transition-colors ${i !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                {/* Invoice number */}
                <p className="text-xs text-gray-900 font-mono text-left">{inv.invoiceNumber}</p>

                {/* Order number */}
                <p className="text-xs text-gray-500 font-mono text-left">{inv.orderNumber}</p>

                {/* Customer */}
                <div className="min-w-0">
                  <p className="text-xs text-gray-900 truncate">{inv.customer.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{inv.customer.email}</p>
                </div>

                {/* Emission date */}
                <p className="text-xs text-gray-500 text-center">
                  {new Date(inv.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" })}
                </p>

                {/* Due date */}
                <p className={`text-xs text-center ${inv.status === "overdue" ? "text-red-600" : "text-gray-500"}`}>
                  {new Date(inv.dueDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" })}
                </p>

                {/* Total */}
                <p className="text-xs text-gray-900 text-right tabular-nums">
                  ${inv.total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                </p>

                {/* Status */}
                <div className="flex items-center">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full ${sm.bg} ${sm.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                    {sm.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => setPreview(inv)}
                    title="Ver factura"
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => { setPreview(inv); setTimeout(() => window.print(), 300); }}
                    title="Imprimir"
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => toast.info("Descargar PDF")}
                    title="Descargar PDF"
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  {inv.status === "pending" && (
                    <button
                      onClick={() => handleMarkPaid(inv.id)}
                      title="Marcar como pagada"
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  )}
                  {inv.status !== "voided" && (
                    <button
                      onClick={() => setVoidId(inv.id)}
                      title="Anular"
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* Preview modal */}
      {preview && (
        <InvoiceDocument
          data={toDocData(preview)}
          mode="modal"
          onClose={() => setPreview(null)}
        />
      )}

      {/* Void confirm */}
      {voidId && (() => {
        const inv = invoices.find(i => i.id === voidId)!;
        return (
          <VoidConfirm
            invoice={inv}
            onConfirm={() => handleVoid(voidId)}
            onCancel={() => setVoidId(null)}
          />
        );
      })()}
    </div>
  );
}