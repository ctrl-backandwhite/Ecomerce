import { useMemo, useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  DollarSign, ShoppingCart, Users, Package,
  TrendingUp, TrendingDown, ArrowRight, Clock,
  AlertTriangle, Zap, Star, Target,
  ShoppingBag, RotateCcw, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Truck, XCircle, CreditCard,
  BarChart2, Tag, Gift, Headphones,
  RefreshCw, FileText,
} from "lucide-react";
import { Link } from "react-router";
import { orderRepository, type AdminOrder, type OrderStats } from "../../repositories/OrderRepository";
import { customerRepository } from "../../repositories/CustomerRepository";
import { reportsRepository, type RevenueByDay, type StatusCount } from "../../repositories/ReportsRepository";
import { useNexaProducts } from "../../hooks/useNexaProducts";
import { downloadCsv } from "../../utils/exportCsv";
import { exportToPdf } from "../../utils/exportPdf";
import { ExportMenu } from "../../components/admin/ExportMenu";
import { useLanguage } from "../../context/LanguageContext";

import { logger } from "../../lib/logger";

/* ═══════════════════════════════════════════════════════════════
   STATUS META
═══════════════════════════════════════════════════════════════ */
const STATUS_META: Record<string, { labelKey: string; color: string; dot: string; icon: React.ElementType }> = {
  DRAFT: { labelKey: "order.status.draft", color: "bg-gray-50 text-gray-600", dot: "bg-gray-400", icon: FileText },
  PENDING: { labelKey: "order.status.pending", color: "bg-amber-50 text-amber-700", dot: "bg-amber-400", icon: Clock },
  CONFIRMED: { labelKey: "order.status.confirmed", color: "bg-cyan-50 text-cyan-700", dot: "bg-cyan-400", icon: CheckCircle2 },
  PROCESSING: { labelKey: "order.status.processing", color: "bg-blue-50 text-blue-700", dot: "bg-blue-400", icon: RefreshCw },
  SHIPPED: { labelKey: "order.status.shipped", color: "bg-violet-50 text-violet-700", dot: "bg-violet-400", icon: Truck },
  IN_TRANSIT: { labelKey: "order.status.inTransit", color: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-400", icon: Truck },
  DELIVERED: { labelKey: "order.status.delivered", color: "bg-green-50 text-green-700", dot: "bg-green-400", icon: CheckCircle2 },
  CANCELLED: { labelKey: "order.status.cancelled", color: "bg-red-50 text-red-700", dot: "bg-red-400", icon: XCircle },
  REFUNDED: { labelKey: "order.status.refunded", color: "bg-orange-50 text-orange-700", dot: "bg-orange-400", icon: RefreshCw },
};

/* ═══════════════════════════════════════════════════════════════
   MOCK EXTRAS
═══════════════════════════════════════════════════════════════ */
// Mock activity feed. `titleKey` resolves through i18n; `body` stays with the
// literal transactional string (order numbers, customer names, amounts) since
// those don't translate.
const ACTIVITY_FEED = [
  { time: "19:42", icon: ShoppingBag, color: "bg-gray-500 text-white", titleKey: "admin.dash.activity.newOrder", body: "#NX-001284 · Laura Gómez · $1,899" },
  { time: "19:05", icon: CreditCard, color: "bg-green-100 text-green-700", titleKey: "admin.dash.activity.paymentConfirmed", body: "#NX-001283 · $349 via tarjeta" },
  { time: "18:20", icon: RotateCcw, color: "bg-orange-100 text-orange-600", titleKey: "admin.dash.activity.returnRequested", body: "#NX-001270 · Isabel Herrera · $1,599" },
  { time: "17:08", icon: Users, color: "bg-blue-100 text-blue-600", titleKey: "admin.dash.activity.newCustomer", body: "Andrés Ruiz" },
  { time: "15:40", icon: AlertTriangle, color: "bg-amber-100 text-amber-600", titleKey: "admin.dash.activity.lowStock", body: "Sony WH-1000XM5 · 3" },
  { time: "14:22", icon: Truck, color: "bg-violet-100 text-violet-600", titleKey: "admin.dash.activity.orderShipped", body: "#NX-001278 · Pablo Moreno" },
  { time: "12:08", icon: Star, color: "bg-yellow-100 text-yellow-600", titleKey: "admin.dash.activity.fiveStarReview", body: "Canon EOS R10" },
  { time: "10:55", icon: Tag, color: "bg-gray-100 text-gray-600", titleKey: "admin.dash.activity.couponUsed", body: "VERANO20" },
];

const INSIGHTS = [
  { tagKey: "admin.dash.insights.record.tag", tagColor: "bg-amber-50 text-amber-600", icon: Zap, iconBg: "bg-amber-100 text-amber-600", titleKey: "admin.dash.insights.record.title", bodyKey: "admin.dash.insights.record.body", value: "$11,200", delta: null, up: true },
  { tagKey: "admin.dash.insights.growth.tag", tagColor: "bg-green-50 text-green-600", icon: TrendingUp, iconBg: "bg-green-100 text-green-600", titleKey: "admin.dash.insights.growth.title", bodyKey: "admin.dash.insights.growth.body", value: null, delta: "+24%", up: true },
  { tagKey: "admin.dash.insights.milestone.tag", tagColor: "bg-violet-50 text-violet-600", icon: Star, iconBg: "bg-violet-100 text-violet-600", titleKey: "admin.dash.insights.milestone.title", bodyKey: "admin.dash.insights.milestone.body", value: "100", delta: null, up: true },
  { tagKey: "admin.dash.insights.customers.tag", tagColor: "bg-blue-50 text-blue-600", icon: Users, iconBg: "bg-blue-100 text-blue-600", titleKey: "admin.dash.insights.customers.title", bodyKey: "admin.dash.insights.customers.body", value: "+8", delta: null, up: true },
  { tagKey: "admin.dash.insights.goal.tag", tagColor: "bg-gray-100 text-gray-600", icon: Target, iconBg: "bg-gray-100 text-gray-600", titleKey: "admin.dash.insights.goal.title", bodyKey: "admin.dash.insights.goal.body", value: "87%", delta: null, up: true },
  { tagKey: "admin.dash.insights.ticket.tag", tagColor: "bg-green-50 text-green-600", icon: ArrowUpRight, iconBg: "bg-green-100 text-green-600", titleKey: "admin.dash.insights.ticket.title", bodyKey: "admin.dash.insights.ticket.body", value: null, delta: "+$120", up: true },
  { tagKey: "admin.dash.insights.attention.tag", tagColor: "bg-red-50 text-red-600", icon: AlertTriangle, iconBg: "bg-red-100 text-red-600", titleKey: "admin.dash.insights.attention.title", bodyKey: "admin.dash.insights.attention.body", value: "6.1%", delta: "+0.8%", up: false },
  { tagKey: "admin.dash.insights.topseller.tag", tagColor: "bg-gray-100 text-gray-600", icon: Headphones, iconBg: "bg-gray-500 text-white", titleKey: "admin.dash.insights.topseller.title", bodyKey: "admin.dash.insights.topseller.body", value: "203", delta: null, up: true },
];

const WEEKLY_ORDERS = [
  { day: "Lun", orders: 38, revenue: 4200 },
  { day: "Mar", orders: 52, revenue: 5840 },
  { day: "Mié", orders: 45, revenue: 3960 },
  { day: "Jue", orders: 61, revenue: 6720 },
  { day: "Vie", orders: 78, revenue: 8940 },
  { day: "Sáb", orders: 94, revenue: 11200 },
  { day: "Dom", orders: 43, revenue: 5320 },
];

const QUICK_ACTIONS = [
  { labelKey: "admin.dash.qa.newProduct", icon: Package, to: "/admin/products", accent: true },
  { labelKey: "admin.dash.qa.manageOrders", icon: ShoppingBag, to: "/admin/orders", accent: false },
  { labelKey: "admin.dash.qa.viewReports", icon: BarChart2, to: "/admin/reports", accent: false },
  { labelKey: "admin.dash.qa.coupons", icon: Tag, to: "/admin/coupons", accent: false },
  { labelKey: "admin.dash.qa.giftcards", icon: Gift, to: "/admin/gift-cards", accent: false },
  { labelKey: "admin.dash.qa.customers", icon: Users, to: "/admin/customers", accent: false },
];

/* ═══════════════════════════════════════════════════════════════
   TOOLTIP
═══════════════════════════════════════════════════════════════ */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-sm text-xs min-w-28">
      <p className="text-gray-400 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="text-gray-500 capitalize">{p.name === "revenue" ? "Ingresos" : p.name === "orders" ? "Órdenes" : p.name}</span>
          <span className="text-gray-900 tabular-nums">
            {p.name === "revenue" ? `$${p.value?.toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const LOCALE_TO_BCP47: Record<string, string> = { es: "es-ES", en: "en-US", pt: "pt-BR" };

export function Dashboard() {
  const { t, locale } = useLanguage();
  const intlLocale = LOCALE_TO_BCP47[locale] ?? "en-US";
  // ── Live products from store (same source as /home) ──────
  const { products } = useNexaProducts();

  // ── API state ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<OrderStats>({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, deliveredOrders: 0 });
  const [apiRecentOrders, setApiRecentOrders] = useState<AdminOrder[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [revenueSeries, setRevenueSeries] = useState<RevenueByDay[]>([]);
  const [statusDist, setStatusDist] = useState<StatusCount[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [orderStats, ordersPage, customersPage, revenue, status] = await Promise.all([
        orderRepository.getStats(),
        orderRepository.findAll({ size: 6, sortBy: "createdAt", ascending: false }),
        customerRepository.findAll({ size: 1 }),
        reportsRepository.findRevenueByDay().catch(() => [] as RevenueByDay[]),
        reportsRepository.findStatusDistribution().catch(() => [] as StatusCount[]),
      ]);
      setStats(orderStats);
      setApiRecentOrders(ordersPage.content);
      setTotalCustomers(customersPage.totalElements);
      setRevenueSeries(revenue);
      setStatusDist(status);
    } catch (err) { logger.warn("Suppressed error", err); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Computed values ──────────────────────────────────────
  const totalRevenue = stats.totalRevenue;
  const totalOrders = stats.totalOrders;
  const pendingOrders = stats.pendingOrders;
  const lowStock = products.filter(p => p.stock < 10).length;

  const todayRevenue = WEEKLY_ORDERS[WEEKLY_ORDERS.length - 2].revenue; // Sáb
  const todayOrders = WEEKLY_ORDERS[WEEKLY_ORDERS.length - 2].orders;
  const avgTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const convRate = 3.8;
  const pendingReturns = 3;

  const [exporting, setExporting] = useState(false);

  const recentOrders = useMemo(() =>
    [...apiRecentOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6),
    [apiRecentOrders]
  );

  function handleCsvExport() {
    setExporting(true);
    setTimeout(() => {
      downloadCsv(
        "nexa-dashboard-kpis.csv",
        ["Métrica", "Valor", "Variación"],
        [
          ["Ingresos hoy", `$${todayRevenue.toLocaleString()}`, "+18.2% vs. ayer"],
          ["Ingresos del mes", `$${totalRevenue.toLocaleString()}`, "+12.5% vs. mes anterior"],
          ["Órdenes hoy", todayOrders, "+8.2% vs. ayer"],
          ["Ticket promedio", `$${avgTicket}`, "+$120 vs. semana anterior"],
          ["Tasa de conversión", `${convRate}%`, "-0.3% vs. semana anterior"],
          ["Clientes nuevos (mes)", 84, "+5.1% vs. mes anterior"],
          ["Devoluciones pend.", pendingReturns, "Requieren revisión"],
          ["Total clientes", totalCustomers, ""],
          ["Total órdenes", totalOrders, ""],
          ["Productos stock bajo", lowStock, ""],
        ]
      );
      setTimeout(() => {
        downloadCsv(
          "nexa-dashboard-ordenes-recientes.csv",
          ["Número de orden", "Cliente", "Fecha", "Importe", "Estado"],
          recentOrders.map(o => [
            o.orderNumber, o.customer.name, o.date,
            `$${o.total.toLocaleString()}`,
            STATUS_META[o.status]?.labelKey ? t(STATUS_META[o.status].labelKey) : o.status,
          ])
        );
        setTimeout(() => {
          downloadCsv(
            "nexa-dashboard-semana.csv",
            ["Día", "Órdenes", "Ingresos"],
            WEEKLY_ORDERS.map(d => [d.day, d.orders, `$${d.revenue.toLocaleString()}`])
          );
          setExporting(false);
        }, 300);
      }, 300);
    }, 100);
  }

  async function handlePdfExport() {
    await exportToPdf({
      filename: "nexa-dashboard.pdf",
      title: "Dashboard",
      subtitle: "Vista general del negocio · Sábado, 14 de Marzo de 2026",
      sections: [
        { id: "dash-kpis", label: "KPIs principales" },
        { id: "dash-charts", label: "Ingresos por mes y categoría" },
        { id: "dash-weekly", label: "Órdenes e ingresos esta semana" },
        { id: "dash-activity", label: "Órdenes recientes y actividad" },
      ],
    });
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl text-gray-900 tracking-tight">{t("admin.dash.title")}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString(intlLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {t("admin.dash.subtitle")}</p>
        </div>
        <ExportMenu
          onCsv={handleCsvExport}
          onPdf={handlePdfExport}
          disabled={exporting}
        />
      </div>

      {/* ── Alert strip ────────────────────────────────────── */}
      {(lowStock > 0 || pendingOrders > 0) && (
        <div className="flex flex-wrap gap-2.5">
          {lowStock > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-xs text-amber-700"><strong>{lowStock}</strong> {t("admin.dash.lowStockAlert")}</span>
              <Link to="/admin/products" className="text-[11px] text-amber-600 underline ml-1">{t("admin.dash.lowStockReview")}</Link>
            </div>
          )}
          {pendingOrders > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-100 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-xs text-blue-700"><strong>{pendingOrders}</strong> {t("admin.dash.pendingOrdersAlert")}</span>
              <Link to="/admin/orders" className="text-[11px] text-blue-600 underline ml-1">{t("admin.dash.pendingOrdersManage")}</Link>
            </div>
          )}
        </div>
      )}

      {/* ── KPI Grid ────────────────────────────────────────── */}
      <div id="dash-kpis" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Ingresos hoy (accent) */}
        <div className="lg:col-span-2 bg-gray-700 border border-gray-600 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.dash.revenueToday")}</span>
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-2xl tracking-tight text-white tabular-nums">${todayRevenue.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-400" />
              <span className="text-[11px] text-green-400">+18.2%</span>
              <span className="text-[11px] text-gray-500">{t("admin.dash.vsYesterday")}</span>
            </div>
          </div>
        </div>

        {/* Ingresos mes */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.dash.revenueMonth")}</span>
            <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-xl tracking-tight text-gray-900 tabular-nums">${(totalRevenue / 1000).toFixed(1)}k</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" strokeWidth={1.5} />
              <span className="text-[11px] text-green-500">+12.5%</span>
              <span className="text-[11px] text-gray-400">{t("admin.dash.vsPrev")}</span>
            </div>
          </div>
        </div>

        {/* Órdenes hoy */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.dash.ordersToday")}</span>
            <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-xl tracking-tight text-gray-900 tabular-nums">{todayOrders}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" strokeWidth={1.5} />
              <span className="text-[11px] text-green-500">+8.2%</span>
              <span className="text-[11px] text-gray-400">{t("admin.dash.vsYesterday")}</span>
            </div>
          </div>
        </div>

        {/* Ticket promedio */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.dash.avgTicket")}</span>
            <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-xl tracking-tight text-gray-900 tabular-nums">${avgTicket}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3 text-green-500" />
              <span className="text-[11px] text-green-500">+$120</span>
              <span className="text-[11px] text-gray-400">{t("admin.dash.vsWeek")}</span>
            </div>
          </div>
        </div>

        {/* Conversión */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.dash.conversion")}</span>
            <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-xl tracking-tight text-gray-900 tabular-nums">{convRate}%</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3 text-red-400" strokeWidth={1.5} />
              <span className="text-[11px] text-red-400">-0.3%</span>
              <span className="text-[11px] text-gray-400">{t("admin.dash.vsWeek")}</span>
            </div>
          </div>
        </div>

        {/* Nuevos clientes */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.dash.newCustomers")}</span>
            <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-xl tracking-tight text-gray-900 tabular-nums">84</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" strokeWidth={1.5} />
              <span className="text-[11px] text-green-500">+5.1%</span>
              <span className="text-[11px] text-gray-400">{t("admin.dash.vsMonth")}</span>
            </div>
          </div>
        </div>

        {/* Devoluciones pendientes */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">{t("admin.dash.pendingReturns")}</span>
            <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5 text-orange-500" strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <p className="text-xl tracking-tight text-gray-900 tabular-nums">{pendingReturns}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[11px] text-gray-400">{t("admin.dash.requiresReview")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Insights / Novedades ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-900">{t("admin.dash.insights")}</p>
          <p className="text-[11px] text-gray-400">{t("admin.dash.last24h")}</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-hide">
          {INSIGHTS.map((ins, i) => {
            const Icon = ins.icon;
            return (
              <div
                key={i}
                className="flex-shrink-0 w-52 bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md tracking-wider ${ins.tagColor}`}>
                    {t(ins.tagKey)}
                  </span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ins.iconBg}`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-900">{t(ins.titleKey)}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{t(ins.bodyKey)}</p>
                </div>
                {(ins.value || ins.delta) && (
                  <div className={`flex items-center gap-1 text-xs tabular-nums ${ins.up ? "text-green-600" : "text-red-500"}`}>
                    {ins.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{ins.value ?? ins.delta}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Charts ──────────────────────────────────────────── */}
      <div id="dash-charts" className="grid lg:grid-cols-3 gap-4">

        {/* Revenue area chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm text-gray-900">{t("admin.dash.revenueByMonth")}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{t("admin.dash.last7months")}</p>
            </div>
            <TrendingUp className="w-4 h-4 text-gray-300" strokeWidth={1.5} />
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart
              data={revenueSeries.map(r => ({
                month: new Date(r.day).toLocaleDateString(intlLocale, { day: "2-digit", month: "short" }),
                revenue: Number(r.revenue) || 0,
              }))}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid key="dash-rev-grid" strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis key="dash-rev-xaxis" dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis key="dash-rev-yaxis" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip key="dash-rev-tooltip" content={<CustomTooltip />} />
              <Area key="dash-rev-area" type="monotone" dataKey="revenue" name="revenue" stroke="#111827" strokeWidth={1.5}
                fill="#111827" fillOpacity={0.06} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-900">{t("admin.dash.byCategory")}</p>
            <p className="text-[11px] text-gray-400">{t("admin.dash.thisMonth")}</p>
          </div>
          <div className="flex flex-col items-center justify-center h-[140px] text-center">
            <p className="text-xs text-gray-400">{t("admin.dash.noCategoryData")}</p>
          </div>
        </div>
      </div>

      {/* ── Weekly orders bar ────────────────────────────────── */}
      <div id="dash-weekly" className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm text-gray-900">{t("admin.dash.weeklyTitle")}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {t("admin.dash.weeklySummary")
                  .replace("{orders}", String(WEEKLY_ORDERS.reduce((s, d) => s + d.orders, 0)))
                  .replace("{revenue}", WEEKLY_ORDERS.reduce((s, d) => s + d.revenue, 0).toLocaleString())}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={WEEKLY_ORDERS} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid key="dash-bar-grid" strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis key="dash-bar-xaxis" dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis key="dash-bar-yaxis" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip key="dash-bar-tooltip" content={<CustomTooltip />} />
              <Bar key="dash-bar-revenue" dataKey="revenue" name="revenue" fill="#1f2937" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order status distribution */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-900">{t("admin.dash.orderStatus")}</p>
            <Link to="/admin/orders" className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1">
              {t("admin.common.view")} <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map(key => {
              // Prefer the dedicated status-distribution endpoint (counts every
              // order in the last 30 days) and fall back to the recent-orders
              // sample when the endpoint is unreachable or returns empty.
              const backendCount = statusDist.find(s => s.status === key)?.count ?? 0;
              const sampleCount = apiRecentOrders.filter(o => o.status === key).length;
              const count = statusDist.length > 0 ? backendCount : sampleCount;
              const total = statusDist.length > 0
                ? statusDist.reduce((sum, s) => sum + s.count, 0)
                : apiRecentOrders.length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const meta = STATUS_META[key];
              const Icon = meta.icon;
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color.split(" ")[0]}`}>
                    <Icon className={`w-3 h-3 ${meta.color.split(" ")[1]}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-gray-600">{t(meta.labelKey)}</span>
                      <span className="text-[11px] text-gray-400 tabular-nums">{count}</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${meta.dot}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-300 tabular-nums w-8 text-right flex-shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent orders + Activity feed ───────────────────── */}
      <div id="dash-activity" className="grid lg:grid-cols-5 gap-4">

        {/* Recent orders */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900">{t("admin.dash.recentOrders")}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{totalOrders} {t("admin.dash.inTotal")}</p>
            </div>
            <Link to="/admin/orders" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
              {t("admin.common.viewAll")} <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_70px] gap-3 px-5 py-2 bg-gray-50/60 border-b border-gray-50">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t("admin.dash.col.orderCustomer")}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider text-right">{t("admin.dash.col.amount")}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider text-center">{t("admin.dash.col.status")}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.map(order => {
              const meta = STATUS_META[order.status];
              return (
                <div key={order.id} className="grid grid-cols-[1fr_80px_70px] gap-3 items-center px-5 py-2.5 hover:bg-gray-50/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-900 font-mono">{order.orderNumber}</p>
                    <p className="text-[11px] text-gray-400 truncate">{order.customer.name} · {order.date.slice(5).replace("-", "/")}</p>
                  </div>
                  <p className="text-xs text-gray-900 text-right tabular-nums">${order.total.toLocaleString()}</p>
                  <div className="flex justify-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ${meta.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {t(meta.labelKey)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-2.5 border-t border-gray-50">
            <Link to="/admin/orders" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
              {t("admin.dash.viewAllOrders")} <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Activity feed (today) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900">{t("admin.dash.todayActivity")}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{new Date().toLocaleDateString(intlLocale, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-green-600">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {t("admin.dash.live")}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {ACTIVITY_FEED.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${item.color}`}>
                    <Icon className="w-3 h-3" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 truncate">{t(item.titleKey)}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.body}</p>
                  </div>
                  <span className="text-[10px] text-gray-300 flex-shrink-0 tabular-nums pt-0.5">{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick actions ────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-sm text-gray-900 mb-4">{t("admin.dash.quickActions")}</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(qa => {
            const Icon = qa.icon;
            return (
              <Link
                key={qa.to}
                to={qa.to}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-colors text-center group ${qa.accent
                  ? "bg-gray-600 border-gray-600 text-white hover:bg-gray-500"
                  : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${qa.accent ? "bg-white/10" : "bg-gray-50 border border-gray-100 group-hover:border-gray-200"
                  }`}>
                  <Icon className={`w-4 h-4 ${qa.accent ? "text-gray-300" : "text-gray-500"}`} strokeWidth={1.5} />
                </div>
                <span className={`text-[11px] leading-tight ${qa.accent ? "text-gray-300" : "text-gray-500"}`}>{t(qa.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}