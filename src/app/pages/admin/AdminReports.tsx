import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, DollarSign, ShoppingBag, Users,
  RotateCcw, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Package, Download,
} from "lucide-react";
import { products } from "../../data/products";

/* ── Mock data ─────────────────────────────────────────────── */
const MONTHLY_REVENUE = [
  { month: "Ago",  revenue: 18400, orders: 142, returns: 8  },
  { month: "Sep",  revenue: 22100, orders: 167, returns: 11 },
  { month: "Oct",  revenue: 26800, orders: 201, returns: 14 },
  { month: "Nov",  revenue: 41200, orders: 318, returns: 22 },
  { month: "Dic",  revenue: 58700, orders: 452, returns: 31 },
  { month: "Ene",  revenue: 31500, orders: 243, returns: 17 },
  { month: "Feb",  revenue: 34200, orders: 264, returns: 15 },
  { month: "Mar",  revenue: 38900, orders: 297, returns: 18 },
];

const TOP_PRODUCTS = [
  { name: "iPhone 15 Pro Max",      sales: 148, revenue: 224252, growth: 12  },
  { name: "Samsung Galaxy S24 Ultra",sales: 112, revenue: 151088, growth: 8  },
  { name: "Sony WH-1000XM5",        sales: 203, revenue: 76937,  growth: 24 },
  { name: "Dell XPS 15",            sales: 67,  revenue: 127233, growth: -3  },
  { name: "Canon EOS R10",          sales: 89,  revenue: 80011,  growth: 15  },
];

const CATEGORY_DATA = [
  { name: "Electrónica",  value: 42, color: "#1f2937" },
  { name: "Calzado",      value: 18, color: "#6b7280" },
  { name: "Audio",        value: 20, color: "#9ca3af" },
  { name: "Fotografía",   value: 11, color: "#d1d5db" },
  { name: "Accesorios",   value: 9,  color: "#e5e7eb" },
];

const DAILY_ORDERS = [
  { day: "L",  orders: 38 },
  { day: "M",  orders: 52 },
  { day: "X",  orders: 45 },
  { day: "J",  orders: 61 },
  { day: "V",  orders: 78 },
  { day: "S",  orders: 94 },
  { day: "D",  orders: 43 },
];

/* ── Low-stock products ─────────────────────────────────────── */
const LOW_STOCK = products
  .filter(p => p.stock <= 10 && p.stockStatus !== "out_of_stock")
  .slice(0, 6);

const OUT_OF_STOCK = products.filter(p => p.stockStatus === "out_of_stock").slice(0, 4);

/* ── Helpers ───────────────────────────────────────────────── */
const KPI = [
  { label: "Ingresos (mes)",   value: "$38,900",  delta: +14.2, icon: DollarSign,  accent: true  },
  { label: "Órdenes (mes)",    value: "297",       delta: +12.5, icon: ShoppingBag, accent: false },
  { label: "Clientes nuevos",  value: "84",        delta: +6.3,  icon: Users,       accent: false },
  { label: "Tasa devolución",  value: "6.1%",      delta: -0.8,  icon: RotateCcw,   accent: false },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="text-gray-400 mb-1.5">{label}</p>
      {payload.map((p: any, idx: number) => (
        <p key={p.name ?? idx} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name === "revenue" ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────── */
export function AdminReports() {
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Reportes</h1>
          <p className="text-xs text-gray-400 mt-0.5">Últimos 8 meses · Actualizado hoy</p>
        </div>
        <button className="flex items-center gap-1.5 h-7 px-3 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-3.5 h-3.5" /> Exportar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI.map(k => (
          <div key={k.label} className={`rounded-xl border p-4 flex flex-col gap-3 ${k.accent ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">{k.label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${k.accent ? "bg-white/10" : "bg-gray-50 border border-gray-100"}`}>
                <k.icon className={`w-3.5 h-3.5 ${k.accent ? "text-gray-300" : "text-gray-500"}`} strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <p className={`text-2xl tracking-tight ${k.accent ? "text-white" : "text-gray-900"}`}>{k.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {k.delta >= 0
                  ? <ArrowUpRight className="w-3 h-3 text-green-500" />
                  : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                <span className={`text-[11px] ${k.delta >= 0 ? "text-green-500" : "text-red-400"}`}>
                  {k.delta > 0 ? "+" : ""}{k.delta}%
                </span>
                <span className="text-[11px] text-gray-400">vs. mes anterior</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart + Orders bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-900">Ingresos mensuales</p>
            <TrendingUp className="w-4 h-4 text-gray-300" strokeWidth={1.5} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_REVENUE} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rptRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1f2937" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#1f2937" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#1f2937" strokeWidth={1.5}
                fill="url(#rptRevGrad)" dot={{ r: 3, fill: "#1f2937", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily orders bar */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm text-gray-900 mb-5">Órdenes por día (última semana)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DAILY_ORDERS} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" fill="#1f2937" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products + Category pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top products */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-900">Productos más vendidos</p>
            <p className="text-xs text-gray-400">Este mes</p>
          </div>
          <div className="divide-y divide-gray-50">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.name} className="flex items-center gap-4 px-5 py-3">
                <span className="text-[11px] text-gray-300 w-4 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-900 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden max-w-32">
                      <div className="h-full bg-gray-900 rounded-full" style={{ width: `${(p.sales / 210) * 100}%` }} />
                    </div>
                    <span className="text-[11px] text-gray-400">{p.sales} uds.</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-900">${p.revenue.toLocaleString()}</p>
                  <div className={`flex items-center justify-end gap-0.5 text-[11px] ${p.growth >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {p.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(p.growth)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category distribution */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-sm text-gray-900 mb-4">Ventas por categoría</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                dataKey="value" strokeWidth={0}>
                {CATEGORY_DATA.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {CATEGORY_DATA.map(c => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-xs text-gray-600">{c.name}</span>
                </div>
                <span className="text-xs text-gray-900">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Low stock */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
            <p className="text-sm text-gray-900">Stock bajo</p>
            <span className="ml-auto text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{LOW_STOCK.length} productos</span>
          </div>
          {LOW_STOCK.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">Sin alertas de stock bajo</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {LOW_STOCK.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
                  <p className="text-xs text-gray-700 truncate flex-1">{p.name}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.stock <= 3 ? "bg-red-400" : "bg-amber-400"}`}
                        style={{ width: `${(p.stock / 10) * 100}%` }} />
                    </div>
                    <span className={`text-xs w-6 text-right ${p.stock <= 3 ? "text-red-500" : "text-amber-600"}`}>{p.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Out of stock */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-red-500" strokeWidth={1.5} />
            <p className="text-sm text-gray-900">Sin stock</p>
            <span className="ml-auto text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{OUT_OF_STOCK.length} productos</span>
          </div>
          {OUT_OF_STOCK.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">Todos los productos tienen stock</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {OUT_OF_STOCK.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-700 truncate">{p.name}</p>
                    <p className="text-[11px] text-gray-400">{p.brand} · {p.sku}</p>
                  </div>
                  <span className="text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0 ml-3">Sin stock</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}