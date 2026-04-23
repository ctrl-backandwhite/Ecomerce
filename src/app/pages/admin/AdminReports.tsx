import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import React from "react";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, RotateCcw,
  XCircle, Download, ChevronDown, Calendar, Filter,
  ArrowUpRight, ArrowDownRight, Check, Minus,
  CreditCard, Banknote, Wallet, Package,
  AlertTriangle,
} from "lucide-react";
import { useNexaProducts } from "../../hooks/useNexaProducts";
import { downloadCsv } from "../../utils/exportCsv";
import { exportToPdf } from "../../utils/exportPdf";
import { ExportMenu } from "../../components/admin/ExportMenu";
import { useLanguage } from "../../context/LanguageContext";

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════════════ */

// ── Today (hourly) ───────────────────────────────────────────
const DATA_TODAY = [
  { label: "06h", ingresos: 0, devoluciones: 0, canceladas: 0 },
  { label: "07h", ingresos: 420, devoluciones: 0, canceladas: 0 },
  { label: "08h", ingresos: 890, devoluciones: 0, canceladas: 60 },
  { label: "09h", ingresos: 1340, devoluciones: 120, canceladas: 0 },
  { label: "10h", ingresos: 2180, devoluciones: 0, canceladas: 180 },
  { label: "11h", ingresos: 2960, devoluciones: 240, canceladas: 0 },
  { label: "12h", ingresos: 1780, devoluciones: 0, canceladas: 90 },
  { label: "13h", ingresos: 980, devoluciones: 60, canceladas: 0 },
  { label: "14h", ingresos: 2340, devoluciones: 0, canceladas: 120 },
  { label: "15h", ingresos: 3120, devoluciones: 180, canceladas: 0 },
  { label: "16h", ingresos: 2890, devoluciones: 0, canceladas: 60 },
  { label: "17h", ingresos: 3640, devoluciones: 120, canceladas: 200 },
  { label: "18h", ingresos: 4210, devoluciones: 0, canceladas: 0 },
  { label: "19h", ingresos: 3780, devoluciones: 300, canceladas: 0 },
  { label: "20h", ingresos: 2940, devoluciones: 0, canceladas: 90 },
  { label: "21h", ingresos: 1820, devoluciones: 60, canceladas: 0 },
  { label: "22h", ingresos: 960, devoluciones: 0, canceladas: 0 },
  { label: "23h", ingresos: 430, devoluciones: 0, canceladas: 0 },
];

// ── This week (daily) ────────────────────────────────────────
const DATA_WEEK = [
  { label: "Lun 10", ingresos: 4200, devoluciones: 320, canceladas: 280 },
  { label: "Mar 11", ingresos: 5840, devoluciones: 180, canceladas: 460 },
  { label: "Mié 12", ingresos: 3960, devoluciones: 420, canceladas: 120 },
  { label: "Jue 13", ingresos: 6720, devoluciones: 240, canceladas: 380 },
  { label: "Vie 14", ingresos: 8940, devoluciones: 560, canceladas: 200 },
  { label: "Sáb 15", ingresos: 11200, devoluciones: 680, canceladas: 540 },
  { label: "Dom 16", ingresos: 5320, devoluciones: 300, canceladas: 160 },
];

// ── This month (daily) ───────────────────────────────────────
const DATA_MONTH = Array.from({ length: 16 }, (_, i) => ({
  label: `${i + 1} Mar`,
  ingresos: Math.round(800 + Math.random() * 4200 + (i > 7 ? 800 : 0)),
  devoluciones: Math.round(80 + Math.random() * 420),
  canceladas: Math.round(40 + Math.random() * 280),
}));
// Force last entry to be today's partial
DATA_MONTH[DATA_MONTH.length - 1] = { label: "16 Mar", ingresos: 3840, devoluciones: 240, canceladas: 160 };

// ── This year (monthly) ──────────────────────────────────────
const DATA_YEAR = [
  { label: "Ene", ingresos: 31500, devoluciones: 1890, canceladas: 2100 },
  { label: "Feb", ingresos: 34200, devoluciones: 2050, canceladas: 1840 },
  { label: "Mar", ingresos: 38900, devoluciones: 2340, canceladas: 2160 },
  { label: "Abr", ingresos: 0, devoluciones: 0, canceladas: 0 },
  { label: "May", ingresos: 0, devoluciones: 0, canceladas: 0 },
  { label: "Jun", ingresos: 0, devoluciones: 0, canceladas: 0 },
  { label: "Jul", ingresos: 0, devoluciones: 0, canceladas: 0 },
  { label: "Ago", ingresos: 0, devoluciones: 0, canceladas: 0 },
  { label: "Sep", ingresos: 0, devoluciones: 0, canceladas: 0 },
  { label: "Oct", ingresos: 0, devoluciones: 0, canceladas: 0 },
  { label: "Nov", ingresos: 0, devoluciones: 0, canceladas: 0 },
  { label: "Dic", ingresos: 0, devoluciones: 0, canceladas: 0 },
];

// ── Transactions ledger ──────────────────────────────────────
type TxStatus = "completada" | "pendiente" | "procesando" | "enviada" | "cancelada" | "reembolsada";
type TxType = "venta" | "devolucion" | "cancelacion";
type PayMethod = "tarjeta" | "transferencia" | "efectivo";

interface Transaction {
  id: string;
  date: string;
  order: string;
  customer: string;
  amount: number;
  discount: number;
  type: TxType;
  status: TxStatus;
  pay: PayMethod;
}

const RAW_TRANSACTIONS: Transaction[] = [
  { id: "t01", date: "2026-03-16", order: "#NX-001284", customer: "Laura Gómez", amount: 1899, discount: 0, type: "venta", status: "completada", pay: "tarjeta" },
  { id: "t02", date: "2026-03-16", order: "#NX-001283", customer: "Andrés Ruiz", amount: 349, discount: 35, type: "venta", status: "enviada", pay: "tarjeta" },
  { id: "t03", date: "2026-03-16", order: "#NX-001282", customer: "Sofía Torres", amount: 249, discount: 0, type: "devolucion", status: "reembolsada", pay: "tarjeta" },
  { id: "t04", date: "2026-03-15", order: "#NX-001281", customer: "Carlos Mendoza", amount: 4299, discount: 215, type: "venta", status: "completada", pay: "transferencia" },
  { id: "t05", date: "2026-03-15", order: "#NX-001280", customer: "Ana Jiménez", amount: 799, discount: 0, type: "venta", status: "pendiente", pay: "efectivo" },
  { id: "t06", date: "2026-03-15", order: "#NX-001279", customer: "Miguel Fernández", amount: 1249, discount: 0, type: "cancelacion", status: "cancelada", pay: "tarjeta" },
  { id: "t07", date: "2026-03-15", order: "#NX-001278", customer: "Elena Castillo", amount: 2999, discount: 300, type: "venta", status: "completada", pay: "tarjeta" },
  { id: "t08", date: "2026-03-14", order: "#NX-001277", customer: "Pablo Moreno", amount: 599, discount: 0, type: "venta", status: "enviada", pay: "tarjeta" },
  { id: "t09", date: "2026-03-14", order: "#NX-001276", customer: "Isabel Herrera", amount: 1599, discount: 160, type: "venta", status: "procesando", pay: "transferencia" },
  { id: "t10", date: "2026-03-14", order: "#NX-001275", customer: "Roberto García", amount: 449, discount: 0, type: "devolucion", status: "reembolsada", pay: "tarjeta" },
  { id: "t11", date: "2026-03-14", order: "#NX-001274", customer: "Lucía Martínez", amount: 3499, discount: 350, type: "venta", status: "completada", pay: "tarjeta" },
  { id: "t12", date: "2026-03-13", order: "#NX-001273", customer: "Diego López", amount: 899, discount: 0, type: "cancelacion", status: "cancelada", pay: "efectivo" },
  { id: "t13", date: "2026-03-13", order: "#NX-001272", customer: "Marta Sánchez", amount: 6999, discount: 700, type: "venta", status: "completada", pay: "tarjeta" },
  { id: "t14", date: "2026-03-13", order: "#NX-001271", customer: "Javier Navarro", amount: 299, discount: 0, type: "venta", status: "enviada", pay: "tarjeta" },
  { id: "t15", date: "2026-03-12", order: "#NX-001270", customer: "Carmen Reyes", amount: 1299, discount: 130, type: "venta", status: "completada", pay: "transferencia" },
  { id: "t16", date: "2026-03-12", order: "#NX-001269", customer: "Alejandro Gil", amount: 799, discount: 0, type: "devolucion", status: "reembolsada", pay: "tarjeta" },
  { id: "t17", date: "2026-03-12", order: "#NX-001268", customer: "Natalia Romero", amount: 4899, discount: 490, type: "venta", status: "completada", pay: "tarjeta" },
  { id: "t18", date: "2026-03-11", order: "#NX-001267", customer: "Francisco Cruz", amount: 2199, discount: 0, type: "venta", status: "procesando", pay: "tarjeta" },
  { id: "t19", date: "2026-03-11", order: "#NX-001266", customer: "Raquel Blanco", amount: 349, discount: 0, type: "cancelacion", status: "cancelada", pay: "tarjeta" },
  { id: "t20", date: "2026-03-11", order: "#NX-001265", customer: "Tomás Vega", amount: 1049, discount: 105, type: "venta", status: "completada", pay: "transferencia" },
  { id: "t21", date: "2026-03-10", order: "#NX-001264", customer: "Pilar Serrano", amount: 5699, discount: 570, type: "venta", status: "enviada", pay: "tarjeta" },
  { id: "t22", date: "2026-03-10", order: "#NX-001263", customer: "Marcos Molina", amount: 699, discount: 0, type: "devolucion", status: "reembolsada", pay: "tarjeta" },
  { id: "t23", date: "2026-03-10", order: "#NX-001262", customer: "Beatriz Ortega", amount: 2499, discount: 250, type: "venta", status: "completada", pay: "efectivo" },
  { id: "t24", date: "2026-03-09", order: "#NX-001261", customer: "Víctor Delgado", amount: 1799, discount: 0, type: "venta", status: "completada", pay: "tarjeta" },
  { id: "t25", date: "2026-03-09", order: "#NX-001260", customer: "Silvia Mora", amount: 349, discount: 0, type: "cancelacion", status: "cancelada", pay: "tarjeta" },
  { id: "t26", date: "2026-03-08", order: "#NX-001259", customer: "Ernesto Ríos", amount: 3199, discount: 320, type: "venta", status: "completada", pay: "transferencia" },
  { id: "t27", date: "2026-03-07", order: "#NX-001258", customer: "Gloria Peña", amount: 899, discount: 0, type: "devolucion", status: "reembolsada", pay: "tarjeta" },
  { id: "t28", date: "2026-03-06", order: "#NX-001257", customer: "Héctor Santos", amount: 7499, discount: 750, type: "venta", status: "completada", pay: "tarjeta" },
  { id: "t29", date: "2026-03-05", order: "#NX-001256", customer: "Verónica Fuentes", amount: 599, discount: 0, type: "cancelacion", status: "cancelada", pay: "efectivo" },
  { id: "t30", date: "2026-03-04", order: "#NX-001255", customer: "Guillermo Castro", amount: 4599, discount: 460, type: "venta", status: "completada", pay: "tarjeta" },
];

// ── Category breakdown ────────────────────────────────────────
const CATEGORY_DATA = [
  { name: "Electrónica", value: 42, color: "#1f2937" },
  { name: "Audio", value: 20, color: "#4b5563" },
  { name: "Calzado", value: 18, color: "#9ca3af" },
  { name: "Fotografía", value: 11, color: "#d1d5db" },
  { name: "Accesorios", value: 9, color: "#e5e7eb" },
];

// ── Top products ─────────────────────────────────────────────
const TOP_PRODUCTS = [
  { name: "iPhone 15 Pro Max", sales: 148, revenue: 224252, growth: 12 },
  { name: "Samsung Galaxy S24 Ultra", sales: 112, revenue: 151088, growth: 8 },
  { name: "Sony WH-1000XM5", sales: 203, revenue: 76937, growth: 24 },
  { name: "Dell XPS 15", sales: 67, revenue: 127233, growth: -3 },
  { name: "Canon EOS R10", sales: 89, revenue: 80011, growth: 15 },
];

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
type Period = "today" | "week" | "month" | "year" | "custom";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  year: "Este año",
  custom: "Rango",
};

const STATUS_META: Record<TxStatus, { label: string; labelKey: string; dot: string; bg: string; text: string }> = {
  completada: { label: "Completada", labelKey: "admin.reports.txStatus.completed", dot: "bg-green-400", bg: "bg-green-50", text: "text-green-700" },
  enviada: { label: "Enviada", labelKey: "admin.reports.txStatus.shipped", dot: "bg-violet-400", bg: "bg-violet-50", text: "text-violet-700" },
  procesando: { label: "Procesando", labelKey: "admin.reports.txStatus.processing", dot: "bg-blue-400", bg: "bg-blue-50", text: "text-blue-700" },
  pendiente: { label: "Pendiente", labelKey: "admin.reports.txStatus.pending", dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
  cancelada: { label: "Cancelada", labelKey: "admin.reports.txStatus.cancelled", dot: "bg-red-400", bg: "bg-red-50", text: "text-red-700" },
  reembolsada: { label: "Reembolsada", labelKey: "admin.reports.txStatus.refunded", dot: "bg-orange-400", bg: "bg-orange-50", text: "text-orange-700" },
};

const TYPE_META: Record<TxType, { label: string; labelKey: string; icon: React.ElementType; color: string }> = {
  venta: { label: "Venta", labelKey: "admin.reports.txType.sale", icon: ShoppingBag, color: "text-gray-900" },
  devolucion: { label: "Devolución", labelKey: "admin.reports.txType.return", icon: RotateCcw, color: "text-orange-600" },
  cancelacion: { label: "Cancelación", labelKey: "admin.reports.txType.cancellation", icon: XCircle, color: "text-red-500" },
};

const PAY_META: Record<PayMethod, { icon: React.ElementType }> = {
  tarjeta: { icon: CreditCard },
  transferencia: { icon: Banknote },
  efectivo: { icon: Wallet },
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
function fmt(n: number) {
  return `$${n.toLocaleString("es-ES", { minimumFractionDigits: 0 })}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-36">
      <p className="text-gray-400 mb-1.5 text-[11px]">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-500 capitalize">{p.name}</span>
          </div>
          <span className="text-gray-900 tabular-nums">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export function AdminReports() {
  const { t } = useLanguage();
  const PERIOD_I18N: Record<Period, string> = {
    today: t("admin.reports.period.today"),
    week: t("admin.reports.period.week"),
    month: t("admin.reports.period.month"),
    year: t("admin.reports.period.year"),
    custom: t("admin.reports.period.custom"),
  };
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState("2026-02-01");
  const [customTo, setCustomTo] = useState("2026-03-16");
  const [statusFilter, setStatusFilter] = useState<TxStatus | "todas">("todas");
  const [typeFilter, setTypeFilter] = useState<TxType | "todas">("todas");
  const [showFilters, setShowFilters] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const TX_PER_PAGE = 8;

  // ── Live products (same source as /home) ─────────────────
  const { products } = useNexaProducts();
  const LOW_STOCK = products.filter(p => p.stock <= 10 && p.stockStatus !== "out_of_stock").slice(0, 5);
  const OUT_OF_STOCK = products.filter(p => p.stockStatus === "out_of_stock").slice(0, 4);

  // ── Chart data by period ────────────────────────────────
  const chartData = useMemo(() => {
    switch (period) {
      case "today": return DATA_TODAY;
      case "week": return DATA_WEEK;
      case "year": return DATA_YEAR;
      case "custom": return DATA_MONTH; // simplified: same as month
      default: return DATA_MONTH;
    }
  }, [period]);

  // ── Filtered transactions ────────────────────────────────
  const filteredTx = useMemo(() => {
    return RAW_TRANSACTIONS.filter(tx => {
      if (statusFilter !== "todas" && tx.status !== statusFilter) return false;
      if (typeFilter !== "todas" && tx.type !== typeFilter) return false;
      return true;
    });
  }, [statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredTx.length / TX_PER_PAGE);
  const pageTx = filteredTx.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE);

  // ── Aggregate KPIs from filtered tx ─────────────────────
  const kpis = useMemo(() => {
    const ventas = filteredTx.filter(t => t.type === "venta");
    const devoluciones = filteredTx.filter(t => t.type === "devolucion");
    const cancelaciones = filteredTx.filter(t => t.type === "cancelacion");

    const bruto = ventas.reduce((s, t) => s + t.amount, 0);
    const descuentos = ventas.reduce((s, t) => s + t.discount, 0);
    const devolTotal = devoluciones.reduce((s, t) => s + t.amount, 0);
    const cancelTotal = cancelaciones.reduce((s, t) => s + t.amount, 0);
    const neto = bruto - descuentos - devolTotal;
    const margen = bruto > 0 ? ((neto / bruto) * 100).toFixed(1) : "0.0";

    return {
      bruto, descuentos, devolTotal, cancelTotal, neto, margen,
      numVentas: ventas.length, numDev: devoluciones.length, numCancel: cancelaciones.length
    };
  }, [filteredTx]);

  // ── Chart aggregates ─────────────────────────────────────
  const chartTotals = useMemo(() => ({
    ingresos: chartData.reduce((s, d) => s + d.ingresos, 0),
    devoluciones: chartData.reduce((s, d) => s + d.devoluciones, 0),
    canceladas: chartData.reduce((s, d) => s + d.canceladas, 0),
  }), [chartData]);

  // Reset page when filters change
  const handleStatusFilter = (s: TxStatus | "todas") => { setStatusFilter(s); setTxPage(1); };
  const handleTypeFilter = (t: TxType | "todas") => { setTypeFilter(t); setTxPage(1); };

  function handleCsvExport() {
    setExporting(true);
    setTimeout(() => {
      downloadCsv(
        `nexa-reportes-kpis-${period}.csv`,
        ["Métrica", "Valor"],
        [
          ["Período", PERIOD_LABELS[period]],
          ["Ingresos brutos", fmt(kpis.bruto)],
          ["Descuentos aplicados", fmt(kpis.descuentos)],
          ["Devoluciones", fmt(kpis.devolTotal)],
          ["Cancelaciones", fmt(kpis.cancelTotal)],
          ["Ingresos netos", fmt(kpis.neto)],
          ["Margen neto", `${kpis.margen}%`],
          ["Núm. ventas", kpis.numVentas],
          ["Núm. devoluciones", kpis.numDev],
          ["Núm. cancelaciones", kpis.numCancel],
          ["Filtro estado", statusFilter],
          ["Filtro tipo", typeFilter],
        ]
      );
      setTimeout(() => {
        downloadCsv(
          `nexa-reportes-transacciones-${period}.csv`,
          ["ID", "Fecha", "Orden", "Cliente", "Importe", "Descuento", "Neto", "Tipo", "Estado", "Método de pago"],
          filteredTx.map(tx => [
            tx.id, tx.date, tx.order, tx.customer,
            tx.amount, tx.discount, tx.amount - tx.discount,
            TYPE_META[tx.type].label, STATUS_META[tx.status].label,
            tx.pay === "tarjeta" ? "Tarjeta" : tx.pay === "transferencia" ? "Transferencia" : "Efectivo",
          ])
        );
        setTimeout(() => {
          downloadCsv(
            `nexa-reportes-top-productos-${period}.csv`,
            ["Producto", "Unidades vendidas", "Ingresos", "Crecimiento"],
            TOP_PRODUCTS.map(p => [p.name, p.sales, fmt(p.revenue), `${p.growth > 0 ? "+" : ""}${p.growth}%`])
          );
          setExporting(false);
        }, 300);
      }, 300);
    }, 100);
  }

  async function handlePdfExport() {
    await exportToPdf({
      filename: `nexa-reportes-${period}.pdf`,
      title: "Balance Contable",
      subtitle: `Histórico de ventas · Período: ${PERIOD_LABELS[period]} · NX036 Store`,
      sections: [
        { id: "rpt-kpis", label: "Resumen contable" },
        { id: "rpt-chart", label: "Evolución de ingresos" },
        { id: "rpt-products", label: "Top productos y ventas por categoría" },
        { id: "rpt-ledger", label: "Libro mayor de transacciones" },
        { id: "rpt-stock", label: "Alertas de stock" },
      ],
    });
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">{t("admin.reports.title")}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{t("admin.reports.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 h-7 px-3 text-xs border rounded-lg transition-colors ${showFilters ? "bg-gray-600 text-white border-gray-600" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t("admin.common.filter")}
          </button>
          <ExportMenu
            onCsv={handleCsvExport}
            onPdf={handlePdfExport}
            disabled={exporting}
          />
        </div>
      </div>

      {/* ── Period selector ─────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl p-1.5 flex flex-wrap gap-1">
        {(["today", "week", "month", "year", "custom"] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex items-center gap-1.5 h-7 px-3.5 text-xs rounded-lg transition-colors ${period === p ? "bg-gray-600 text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
          >
            {p === "custom" && <Calendar className="w-3 h-3" strokeWidth={1.5} />}
            {PERIOD_I18N[p]}
          </button>
        ))}

        {/* Custom range pickers */}
        {period === "custom" && (
          <div className="flex items-center gap-1.5 ml-auto">
            <input
              type="date" value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="h-7 px-2.5 text-xs border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-gray-400 bg-gray-50"
            />
            <Minus className="w-3 h-3 text-gray-300 flex-shrink-0" />
            <input
              type="date" value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="h-7 px-2.5 text-xs border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-gray-400 bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* ── Filter bar (collapsible) ─────────────────────────── */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-wrap gap-4">
          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Estado</span>
            {([
              { v: "todas", label: "Todas" },
              { v: "completada", label: "Completada" },
              { v: "enviada", label: "Enviada" },
              { v: "procesando", label: "Procesando" },
              { v: "pendiente", label: "Pendiente" },
              { v: "cancelada", label: "Cancelada" },
              { v: "reembolsada", label: "Reembolsada" },
            ] as { v: TxStatus | "todas"; label: string }[]).map(opt => (
              <button
                key={opt.v}
                onClick={() => handleStatusFilter(opt.v)}
                className={`h-6 px-2.5 text-[11px] rounded-full border transition-colors ${statusFilter === opt.v
                    ? "bg-gray-600 text-white border-gray-600"
                    : "text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                  }`}
              >
                {opt.v !== "todas" && (
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_META[opt.v as TxStatus]?.dot ?? ""}`} />
                )}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <span className="w-px bg-gray-100 self-stretch hidden md:block" />

          {/* Type filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider">{t("admin.reports.ledger.col.type")}</span>
            {([
              { v: "todas", label: t("admin.common.all"), icon: null },
              { v: "venta", label: t("admin.reports.txType.sale"), icon: ShoppingBag },
              { v: "devolucion", label: t("admin.reports.kpi.returns"), icon: RotateCcw },
              { v: "cancelacion", label: t("admin.reports.kpi.cancellations"), icon: XCircle },
            ] as { v: TxType | "todas"; label: string; icon: any }[]).map(opt => (
              <button
                key={opt.v}
                onClick={() => handleTypeFilter(opt.v)}
                className={`h-6 px-2.5 text-[11px] rounded-full border transition-colors flex items-center gap-1.5 ${typeFilter === opt.v
                    ? "bg-gray-600 text-white border-gray-600"
                    : "text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                  }`}
              >
                {opt.icon && <opt.icon className="w-3 h-3" strokeWidth={1.5} />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Accounting summary ───────────────────────────────── */}
      <div id="rpt-kpis" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Ingresos brutos */}
        <div className="lg:col-span-2 bg-gray-700 border border-gray-600 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.reports.kpi.grossRevenue")}</span>
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-2xl tracking-tight text-white tabular-nums">{fmt(kpis.bruto)}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{kpis.numVentas} {t("admin.reports.kpi.salesRecorded")}</p>
          </div>
        </div>
        {/* Descuentos */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.reports.kpi.discounts")}</span>
            <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-xl tracking-tight text-amber-600 tabular-nums">-{fmt(kpis.descuentos)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{t("admin.reports.kpi.couponsApplied")}</p>
          </div>
        </div>
        {/* Devoluciones */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.reports.kpi.returns")}</span>
            <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5 text-orange-500" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-xl tracking-tight text-orange-600 tabular-nums">-{fmt(kpis.devolTotal)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{kpis.numDev} {t("admin.reports.kpi.returnsCount")}</p>
          </div>
        </div>
        {/* Cancelaciones */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.reports.kpi.cancellations")}</span>
            <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-xl tracking-tight text-red-600 tabular-nums">{fmt(kpis.cancelTotal)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{kpis.numCancel} {t("admin.reports.kpi.cancelledCount")}</p>
          </div>
        </div>
        {/* Ingresos netos */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.reports.kpi.net")}</span>
            <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-xl tracking-tight text-green-700 tabular-nums">{fmt(kpis.neto)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{t("admin.reports.kpi.margin")} {kpis.margen}%</p>
          </div>
        </div>
      </div>

      {/* ── Main chart ───────────────────────────────────────── */}
      <div id="rpt-chart" className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-gray-900">{t("admin.reports.history")} · {PERIOD_I18N[period]}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {t("admin.reports.kpi.grossRevenue")} {fmt(chartTotals.ingresos)} ·
              {t("admin.reports.chart.returns")} {fmt(chartTotals.devoluciones)} ·
              {t("admin.reports.chart.cancelled")} {fmt(chartTotals.canceladas)}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-gray-600 rounded inline-block" />{t("admin.reports.col.revenue")}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-orange-400 rounded inline-block" />{t("admin.reports.chart.returns")}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-red-400 rounded inline-block" />{t("admin.reports.chart.cancelled")}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid key="rpt-grid" strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis key="rpt-xaxis" dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis key="rpt-yaxis" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
            <Tooltip key="rpt-tooltip" content={<CustomTooltip />} />
            <Area key="rpt-area-ingresos" type="monotone" dataKey="ingresos" name="ingresos" stroke="#1f2937" strokeWidth={1.5} fill="#1f2937" fillOpacity={0.06} dot={false} />
            <Line key="rpt-line-devoluciones" type="monotone" dataKey="devoluciones" name="devoluciones" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
            <Line key="rpt-line-canceladas" type="monotone" dataKey="canceladas" name="canceladas" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Category + Top products ──────────────────────────── */}
      <div id="rpt-products" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top products */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-900">{t("admin.reports.topProducts")}</p>
            <p className="text-xs text-gray-400">{PERIOD_LABELS[period]}</p>
          </div>
          {/* Header */}
          <div className="grid grid-cols-[1fr_60px_80px_60px] gap-3 px-5 py-2 bg-gray-50/60">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t("admin.reports.col.product")}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider text-right">{t("admin.reports.col.units")}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider text-right">{t("admin.reports.col.revenue")}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider text-right">{t("admin.reports.col.growth")}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.name} className="grid grid-cols-[1fr_60px_80px_60px] gap-3 items-center px-5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[11px] text-gray-300 w-4 flex-shrink-0">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-900 truncate">{p.name}</p>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden w-24 mt-1">
                      <div className={`h-full rounded-full ${p.sales < 50 ? "bg-red-400" : "bg-amber-400"}`}
                        style={{ width: `${(p.sales / 210) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-right tabular-nums">{p.sales}</p>
                <p className="text-xs text-gray-900 text-right tabular-nums">${(p.revenue / 1000).toFixed(1)}k</p>
                <div className={`flex items-center justify-end gap-0.5 text-xs tabular-nums ${p.growth >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {p.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(p.growth)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category donut */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm text-gray-900 mb-4">{t("admin.reports.salesByCategory")}</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie key="rpt-pie" data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
                dataKey="value" strokeWidth={0}>
                {CATEGORY_DATA.map((entry) => <Cell key={`report-cat-${entry.name}`} fill={entry.color} />)}
              </Pie>
              <Tooltip key="rpt-pie-tooltip" formatter={(v: any) => `${v}%`} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #f3f4f6" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {CATEGORY_DATA.map(c => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-xs text-gray-500">{c.name}</span>
                </div>
                <span className="text-xs text-gray-900 tabular-nums">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Transaction ledger ───────────────────────────────── */}
      <div id="rpt-ledger" className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {/* Ledger header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <p className="text-sm text-gray-900">{t("admin.reports.ledger")}</p>
            <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
              {filteredTx.length} {t("admin.reports.ledger.records")}
            </span>
          </div>
          {/* Active filters hint */}
          {(statusFilter !== "todas" || typeFilter !== "todas") && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {statusFilter !== "todas" && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_META[statusFilter].bg} ${STATUS_META[statusFilter].text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[statusFilter].dot}`} />
                  {t(STATUS_META[statusFilter].labelKey)}
                </span>
              )}
              {typeFilter !== "todas" && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {t(TYPE_META[typeFilter].labelKey)}
                </span>
              )}
              <button
                onClick={() => { handleStatusFilter("todas"); handleTypeFilter("todas"); }}
                className="text-[11px] text-gray-400 hover:text-gray-700 underline transition-colors"
              >
                {t("admin.reports.ledger.clearFilters")}
              </button>
            </div>
          )}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[80px_110px_1fr_130px_90px_90px_100px] gap-3 px-5 py-2 bg-gray-50/60 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t("admin.reports.ledger.col.date")}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t("admin.reports.ledger.col.order")}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t("admin.reports.ledger.col.customer")}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t("admin.reports.ledger.col.type")}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider text-right">{t("admin.reports.ledger.col.amount")}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider text-right">{t("admin.reports.ledger.col.discount")}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider text-center">{t("admin.reports.ledger.col.status")}</p>
        </div>

        {/* Table rows */}
        {pageTx.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            {t("admin.reports.ledger.noMatches")}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pageTx.map(tx => {
              const sm = STATUS_META[tx.status];
              const tm = TYPE_META[tx.type];
              const PayIcon = PAY_META[tx.pay].icon;
              return (
                <div key={tx.id} className="grid grid-cols-[80px_110px_1fr_130px_90px_90px_100px] gap-3 items-center px-5 py-2.5 hover:bg-gray-50/50 transition-colors">
                  {/* Fecha */}
                  <p className="text-[11px] text-gray-400 text-center">
                    {tx.date.slice(5).replace("-", "/")}
                  </p>
                  {/* Orden */}
                  <p className="text-[11px] text-gray-700 font-mono truncate">{tx.order}</p>
                  {/* Cliente */}
                  <p className="text-xs text-gray-700 truncate">{tx.customer}</p>
                  {/* Tipo + pago */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <tm.icon className={`w-3.5 h-3.5 flex-shrink-0 ${tm.color}`} strokeWidth={1.5} />
                    <span className="text-[11px] text-gray-500 truncate">{t(tm.labelKey)}</span>
                    <PayIcon className="w-3 h-3 text-gray-300 flex-shrink-0 ml-auto" strokeWidth={1.5} />
                  </div>
                  {/* Importe */}
                  <p className={`text-xs text-right tabular-nums font-mono ${tx.type !== "venta" ? "text-red-500" : "text-gray-900"}`}>
                    {tx.type !== "venta" ? "-" : ""}{fmt(tx.amount)}
                  </p>
                  {/* Descuento */}
                  <p className="text-[11px] text-right tabular-nums text-amber-600">
                    {tx.discount > 0 ? `-${fmt(tx.discount)}` : <span className="text-gray-200">—</span>}
                  </p>
                  {/* Estado */}
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${sm.bg} ${sm.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sm.dot}`} />
                      {t(sm.labelKey)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[11px] text-gray-400">
              {(txPage - 1) * TX_PER_PAGE + 1}–{Math.min(txPage * TX_PER_PAGE, filteredTx.length)} de {filteredTx.length}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setTxPage(n)}
                  className={`w-6 h-6 rounded-lg text-[11px] transition-colors ${txPage === n ? "bg-gray-600 text-white" : "text-gray-400 hover:bg-gray-100"
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Accounting summary footer */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3.5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{t("admin.reports.kpi.grossRevenue")}</p>
            <p className="text-sm text-gray-900 tabular-nums">{fmt(kpis.bruto)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{t("admin.reports.kpi.discounts")}</p>
            <p className="text-sm text-amber-600 tabular-nums">-{fmt(kpis.descuentos)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{t("admin.reports.kpi.returns")}</p>
            <p className="text-sm text-orange-600 tabular-nums">-{fmt(kpis.devolTotal)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{t("admin.reports.kpi.net")}</p>
            <p className="text-sm text-green-700 tabular-nums">{fmt(kpis.neto)}</p>
          </div>
        </div>
      </div>

      {/* ── Stock alerts ─────────────────────────────────────── */}
      <div id="rpt-stock" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />
            <p className="text-sm text-gray-900">{t("admin.reports.lowStock")}</p>
            <span className="ml-auto text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{LOW_STOCK.length}</span>
          </div>
          {LOW_STOCK.length === 0
            ? <div className="py-8 text-center text-xs text-gray-400">Sin alertas</div>
            : <div className="divide-y divide-gray-50">
              {LOW_STOCK.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
                  <p className="text-xs text-gray-700 truncate flex-1">{p.name}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.stock <= 3 ? "bg-red-400" : "bg-amber-400"}`}
                        style={{ width: `${(p.stock / 10) * 100}%` }} />
                    </div>
                    <span className={`text-xs w-6 text-right tabular-nums ${p.stock <= 3 ? "text-red-500" : "text-amber-600"}`}>{p.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />
            <p className="text-sm text-gray-900">{t("admin.reports.outOfStock")}</p>
            <span className="ml-auto text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{OUT_OF_STOCK.length}</span>
          </div>
          {OUT_OF_STOCK.length === 0
            ? <div className="py-8 text-center text-xs text-gray-400">{t("admin.reports.stock.allInStock")}</div>
            : <div className="divide-y divide-gray-50">
              {OUT_OF_STOCK.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-700 truncate">{p.name}</p>
                    <p className="text-[11px] text-gray-400">{p.brand} · {p.sku}</p>
                  </div>
                  <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0 ml-3">{t("admin.reports.stock.out")}</span>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

    </div>
  );
}