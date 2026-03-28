import { useRef } from "react";
import { Printer, Download, X, CheckCircle2, Clock, AlertTriangle, Ban } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { InvoiceStatus } from "../data/invoices";

/* ── Types ─────────────────────────────────────────────────── */
export interface InvoiceLine {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  dueDate?: string;
  status: InvoiceStatus;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  lines: InvoiceLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  notes?: string;
}

/* ── Status meta ───────────────────────────────────────────── */
const STATUS_META: Record<InvoiceStatus, { label: string; bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
  paid:    { label: "PAGADA",   bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200", icon: CheckCircle2  },
  pending: { label: "PENDIENTE",bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200", icon: Clock         },
  overdue: { label: "VENCIDA",  bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",   icon: AlertTriangle },
  void:    { label: "ANULADA",  bg: "bg-gray-100",  text: "text-gray-500",   border: "border-gray-200",  icon: Ban           },
};

/* ── Helpers ─────────────────────────────────────────────── */
function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

function buildQRValue(data: InvoiceData): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://nexa.com";
  return [
    `${base}/verificar-factura/${data.invoiceNumber}`,
    `Factura: ${data.invoiceNumber}`,
    `Orden: ${data.orderNumber}`,
    `Cliente: ${data.customer.name}`,
    `Total: $${fmt(data.total)}`,
    `Fecha: ${data.date}`,
  ].join("\n");
}

/* ── Print styles injected once ────────────────────────────── */
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #invoice-printable, #invoice-printable * { visibility: visible !important; }
  #invoice-printable { position: fixed !important; inset: 0 !important; background: white !important; padding: 32px !important; }
  #invoice-no-print { display: none !important; }
}
`;

/* ── Main component ─────────────────────────────────────────── */
export function InvoiceDocument({
  data,
  onClose,
  mode = "page",
}: {
  data: InvoiceData;
  onClose?: () => void;
  mode?: "page" | "modal";
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const sm = STATUS_META[data.status];
  const StatusIcon = sm.icon;
  const qrValue = buildQRValue(data);

  function handlePrint() {
    // Inject style once
    if (!document.getElementById("invoice-print-style")) {
      const style = document.createElement("style");
      style.id = "invoice-print-style";
      style.textContent = PRINT_STYLE;
      document.head.appendChild(style);
    }
    window.print();
  }

  const wrapper = mode === "modal"
    ? "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
    : "min-h-screen bg-gray-50 py-10 px-4";

  const inner = mode === "modal"
    ? "relative w-full max-w-3xl"
    : "max-w-3xl mx-auto";

  return (
    <div className={wrapper}>
      <div className={inner}>

        {/* Action bar (not printed) */}
        <div id="invoice-no-print" className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 h-8 px-4 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 h-8 px-4 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Descargar PDF
            </button>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ─── Invoice document ─── */}
        <div id="invoice-printable" ref={printRef}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
        >

          {/* Header */}
          <div className="px-10 pt-10 pb-8 border-b border-gray-100">
            <div className="flex items-start justify-between">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs tracking-widest">N</span>
                  </div>
                  <span className="text-xl text-gray-900 tracking-widest">NX036</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">info@nexa.com · +1 234 567 890</p>
                <p className="text-xs text-gray-400">Calle Principal 123 · New York, NY 10001 · US</p>
              </div>

              {/* Invoice meta */}
              <div className="text-right">
                <p className="text-2xl text-gray-900 tracking-tight mb-1">Factura</p>
                <p className="text-base text-gray-700 font-mono">{data.invoiceNumber}</p>
                <div className={`inline-flex items-center gap-1.5 mt-2 text-xs px-3 py-1 rounded-full border ${sm.bg} ${sm.text} ${sm.border}`}>
                  <StatusIcon className="w-3 h-3" strokeWidth={1.5} />
                  {sm.label}
                </div>
              </div>
            </div>
          </div>

          {/* Billing info */}
          <div className="px-10 py-7 grid grid-cols-2 gap-6 border-b border-gray-100">
            {/* Bill to */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3">Facturar a</p>
              <p className="text-sm text-gray-900">{data.customer.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{data.customer.email}</p>
              {data.customer.phone && <p className="text-xs text-gray-500 mt-0.5">{data.customer.phone}</p>}
              {data.customer.address && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-48">{data.customer.address}</p>
              )}
            </div>

            {/* Invoice details */}
            <div className="text-right space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Nº Orden</span>
                <span className="text-xs text-gray-700 font-mono">{data.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Fecha emisión</span>
                <span className="text-xs text-gray-700">{fmtDate(data.date)}</span>
              </div>
              {data.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Fecha vencimiento</span>
                  <span className={`text-xs ${data.status === "overdue" ? "text-red-600" : "text-gray-700"}`}>{fmtDate(data.dueDate)}</span>
                </div>
              )}
              {data.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Método de pago</span>
                  <span className="text-xs text-gray-700">{data.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="px-10 py-7">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 pb-3 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Descripción</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider text-center w-16">Cantidad</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider text-right w-24">Precio unit.</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider text-right w-24">Total</p>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {data.lines.map((line, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-3.5 items-start">
                  <div>
                    <p className="text-sm text-gray-900">{line.name}</p>
                    {line.sku && <p className="text-xs text-gray-400 mt-0.5 font-mono">{line.sku}</p>}
                  </div>
                  <p className="text-sm text-gray-600 text-center w-16">{line.quantity}</p>
                  <p className="text-sm text-gray-600 text-right w-24">${fmt(line.unitPrice)}</p>
                  <p className="text-sm text-gray-900 text-right w-24">${fmt(line.total)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="px-10 pb-8">
            <div className="ml-auto max-w-xs space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">${fmt(data.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Envío</span>
                <span className={data.shipping === 0 ? "text-green-600" : "text-gray-900"}>
                  {data.shipping === 0 ? "Gratuito" : `$${fmt(data.shipping)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IVA (10%)</span>
                <span className="text-gray-900">${fmt(data.tax)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-sm text-gray-900">Total</span>
                <span className="text-xl text-gray-900 tracking-tight">${fmt(data.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="mx-10 mb-8 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Notas</p>
              <p className="text-xs text-gray-600">{data.notes}</p>
            </div>
          )}

          {/* QR + Footer */}
          <div className="px-10 py-5 border-t border-gray-100 bg-gray-50/50 flex items-end justify-between gap-6">
            {/* Legal */}
            <div className="space-y-1">
              <p className="text-[10px] text-gray-400">NX036 Commerce S.L. · CIF: B-12345678 · info@nexa.com</p>
              <p className="text-[10px] text-gray-400">{data.invoiceNumber} · Página 1 de 1</p>
              <p className="text-[10px] text-gray-300 mt-2 max-w-xs leading-relaxed">
                Documento generado electrónicamente. Escanea el código QR para verificar la autenticidad de esta factura.
              </p>
            </div>

            {/* QR block */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                <QRCodeSVG
                  value={qrValue}
                  size={80}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  level="M"
                  marginSize={0}
                />
              </div>
              <p className="text-[9px] text-gray-400 tracking-wide text-center">Verificar factura</p>
              <p className="text-[8px] text-gray-300 font-mono text-center">{data.invoiceNumber}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}