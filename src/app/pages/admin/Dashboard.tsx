import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  DollarSign, ShoppingCart, Users, Package,
  TrendingUp, TrendingDown, ArrowRight, Clock,
  CheckCircle2, Truck, AlertCircle,
} from "lucide-react";
import { Link } from "react-router";
import { orders } from "../../data/orders";
import { products } from "../../data/products";
import { customers } from "../../data/customers";
import { dashboardStats } from "../../data/adminData";

const STATUS_META = {
  pending:    { label: "Pendiente",   color: "bg-amber-50 text-amber-700",   dot: "bg-amber-400"  },
  processing: { label: "Procesando",  color: "bg-blue-50 text-blue-700",     dot: "bg-blue-400"   },
  shipped:    { label: "Enviado",     color: "bg-violet-50 text-violet-700", dot: "bg-violet-400" },
  delivered:  { label: "Entregado",   color: "bg-green-50 text-green-700",   dot: "bg-green-400"  },
  cancelled:  { label: "Cancelado",   color: "bg-red-50 text-red-700",       dot: "bg-red-400"    },
};

function StatCard({
  icon: Icon, label, value, delta, deltaLabel, accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delta: number;
  deltaLabel: string;
  accent?: boolean;
}) {
  const positive = delta >= 0;
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-4 ${accent ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-100"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs tracking-wide ${accent ? "text-gray-400" : "text-gray-400"}`}>{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? "bg-white/10" : "bg-gray-50 border border-gray-100"}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-gray-300" : "text-gray-500"}`} strokeWidth={1.5} />
        </div>
      </div>
      <div>
        <p className={`text-2xl tracking-tight ${accent ? "text-white" : "text-gray-900"}`}>{value}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {positive ? (
            <TrendingUp className="w-3 h-3 text-green-500" strokeWidth={1.5} />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400" strokeWidth={1.5} />
          )}
          <span className={`text-xs ${positive ? "text-green-500" : "text-red-400"}`}>
            {positive ? "+" : ""}{delta}%
          </span>
          <span className={`text-xs ${accent ? "text-gray-500" : "text-gray-400"}`}>{deltaLabel}</span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub, link }: { title: string; sub?: string; link?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-sm text-gray-900">{title}</h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {link && (
        <Link to={link} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
          Ver todo <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-sm text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-gray-900">${p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

export function Dashboard() {
  const totalRevenue  = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders   = orders.length;
  const totalCustomers = customers.length;
  const totalProducts  = products.length;
  const lowStock       = products.filter((p) => p.stock < 10).length;
  const pendingOrders  = orders.filter((o) => o.status === "pending").length;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-7 max-w-[1400px]">

      {/* ── Greeting ── */}
      <div>
        <h1 className="text-xl text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-xs text-gray-400 mt-1">Jueves, 12 de Marzo de 2026 · Vista general del negocio</p>
      </div>

      {/* ── Alert strip ── */}
      {(lowStock > 0 || pendingOrders > 0) && (
        <div className="flex flex-wrap gap-3">
          {lowStock > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-xs text-amber-700">
                <strong>{lowStock} productos</strong> con stock bajo (&lt;10 unidades)
              </span>
              <Link to="/admin/productos" className="text-[11px] text-amber-600 underline ml-1">Revisar</Link>
            </div>
          )}
          {pendingOrders > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-xs text-blue-700">
                <strong>{pendingOrders} órdenes</strong> pendientes de procesamiento
              </span>
              <Link to="/admin/ordenes" className="text-[11px] text-blue-600 underline ml-1">Gestionar</Link>
            </div>
          )}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Ingresos totales"
          value={`$${(totalRevenue / 1000).toFixed(1)}K`}
          delta={12.5}
          deltaLabel="vs mes anterior"
          accent
        />
        <StatCard
          icon={ShoppingCart}
          label="Total órdenes"
          value={totalOrders.toString()}
          delta={8.2}
          deltaLabel="vs mes anterior"
        />
        <StatCard
          icon={Users}
          label="Clientes"
          value={totalCustomers.toString()}
          delta={5.1}
          deltaLabel="vs mes anterior"
        />
        <StatCard
          icon={Package}
          label="Productos activos"
          value={totalProducts.toString()}
          delta={-2.3}
          deltaLabel="vs mes anterior"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Revenue trend */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <SectionHeader title="Ingresos por mes" sub="Últimos 7 meses" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dashboardStats.revenueByMonth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#111827" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={1.5} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <SectionHeader title="Ventas por categoría" />
          <div className="flex items-center justify-center mb-3">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={dashboardStats.categoryRevenue} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {dashboardStats.categoryRevenue.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 11, border: "1px solid #f3f4f6", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {dashboardStats.categoryRevenue.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-xs text-gray-500">{c.name}</span>
                </div>
                <span className="text-xs text-gray-900">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row: recent orders + top products ── */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Recent orders */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 pt-5 pb-0">
            <SectionHeader title="Órdenes recientes" sub={`${totalOrders} en total`} link="/admin/ordenes" />
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => {
              const meta = STATUS_META[order.status];
              return (
                <div key={order.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-900 font-mono">{order.orderNumber}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${meta.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{order.customer.name} · {order.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-900">${order.total.toLocaleString()}</p>
                    <p className="text-[11px] text-gray-400">{order.items} ítem{order.items !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-gray-50">
            <Link to="/admin/ordenes" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
              Ver todas las órdenes <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Top products */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 pt-5 pb-0">
            <SectionHeader title="Top Productos" sub="Por ingresos generados" link="/admin/productos" />
          </div>
          <div className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dashboardStats.topProducts} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#111827" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t border-gray-50 divide-y divide-gray-50">
            {dashboardStats.topProducts.slice(0, 3).map((p, i) => (
              <div key={p.name} className="px-5 py-2.5 flex items-center gap-3">
                <span className="text-[11px] text-gray-300 w-4 flex-shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-400">{p.sales} ventas</p>
                </div>
                <p className="text-xs text-gray-900 flex-shrink-0">${p.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Order status bar ── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <SectionHeader title="Estado de órdenes" sub="Distribución actual" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map((key) => {
            const count = orders.filter((o) => o.status === key).length;
            const pct   = Math.round((count / orders.length) * 100) || 0;
            const meta  = STATUS_META[key];
            return (
              <div key={key} className={`rounded-xl border px-4 py-3 ${meta.color.split(" ")[0]} border-transparent`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <span className="text-[11px] text-gray-500">{meta.label}</span>
                </div>
                <p className="text-xl text-gray-900">{count}</p>
                <p className="text-[11px] text-gray-400">{pct}% del total</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}