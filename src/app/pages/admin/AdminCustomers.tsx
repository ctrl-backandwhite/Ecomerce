import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search, Eye, Users, DollarSign, ShoppingCart,
  UserCheck, UserX, X, Mail, Phone, Calendar,
  TrendingUp, ArrowUpDown,
} from "lucide-react";
import { type Customer, customerRepository } from "../../repositories/CustomerRepository";
import { toast } from "sonner";
import { Pagination } from "../../components/admin/Pagination";

function StatusBadge({ status }: { status: "ACTIVE" | "INACTIVE" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "ACTIVE" ? "bg-green-400" : "bg-gray-300"}`} />
      {status === "ACTIVE" ? "Activo" : "Inactivo"}
    </span>
  );
}

/* ── Customer detail drawer ──────────────────────────── */
function CustomerDrawer({
  customer, onClose, onToggleStatus,
}: {
  customer: Customer;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
}) {
  const avgOrder = customer.orders > 0 ? Math.round(customer.totalSpent / customer.orders) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-gray-900">Detalle del cliente</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-500 rounded-full flex items-center justify-center text-white text-lg tracking-widest flex-shrink-0">
              {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="text-sm text-gray-900">{customer.name}</p>
              <StatusBadge status={customer.status} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pedidos", value: customer.orders },
              { label: "Total gastado", value: `$${customer.totalSpent.toLocaleString()}` },
              { label: "Ticket medio", value: `$${avgOrder}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-sm text-gray-900">{value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Contacto</p>
            <div className="space-y-3">
              {[
                { icon: Mail, value: customer.email },
                { icon: Phone, value: customer.phone },
                { icon: Calendar, value: `Miembro desde ${customer.joinDate}` },
              ].map(({ icon: Icon, value }) => (
                <div key={value} className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                  </div>
                  {value}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Acciones</p>
            <div className="space-y-2">
              <button
                onClick={() => { onToggleStatus(customer.id); toast.success("Estado del cliente actualizado"); }}
                className={`w-full flex items-center gap-2.5 text-xs px-4 py-2.5 rounded-xl border transition-colors ${customer.status === "ACTIVE"
                    ? "text-red-600 border-red-100 bg-red-50 hover:bg-red-100"
                    : "text-green-600 border-green-100 bg-green-50 hover:bg-green-100"
                  }`}
              >
                {customer.status === "ACTIVE"
                  ? <><UserX className="w-3.5 h-3.5" strokeWidth={1.5} /> Desactivar cuenta</>
                  : <><UserCheck className="w-3.5 h-3.5" strokeWidth={1.5} /> Activar cuenta</>
                }
              </button>
              <button
                onClick={() => { toast.success("Correo enviado"); }}
                className="w-full flex items-center gap-2.5 text-xs px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" strokeWidth={1.5} /> Enviar correo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────── */
export function AdminCustomers() {
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusF] = useState<"all" | "ACTIVE" | "INACTIVE">("all");
  const [selectedCustomer, setSel] = useState<Customer | null>(null);
  const [sortKey, setSortKey] = useState<"name" | "orders" | "totalSpent" | "joinDate">("totalSpent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerRepository.findAll({ size: 500 });
      setList(res.content);
    } catch { toast.error("Error al cargar los clientes"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const filtered = useMemo(() => {
    let l = [...list];
    if (search) l = l.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") l = l.filter((c) => c.status === statusFilter);
    l.sort((a, b) => {
      const va = a[sortKey] as any;
      const vb = b[sortKey] as any;
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return l;
  }, [list, search, statusFilter, sortKey, sortDir]);

  useEffect(() => setPage(1), [search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleToggleStatus(id: string) {
    setList((prev) => prev.map((c) => c.id === id ? { ...c, status: c.status === "ACTIVE" ? "INACTIVE" as const : "ACTIVE" as const } : c));
    setSel((prev) => prev?.id === id ? { ...prev, status: prev.status === "ACTIVE" ? "INACTIVE" as const : "ACTIVE" as const } : prev);
  }

  function handleSort(k: typeof sortKey) {
    if (sortKey === k) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  }

  const totalSpent = list.reduce((s, c) => s + c.totalSpent, 0);
  const activeCount = list.filter((c) => c.status === "ACTIVE").length;

  const SortBtn = ({ k, label }: { k: typeof sortKey; label: string }) => (
    <button onClick={() => handleSort(k)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-gray-900" : ""}`} strokeWidth={1.5} />
    </button>
  );

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* Header */}
      <div>
        <h1 className="text-xl text-gray-900 tracking-tight">Clientes</h1>
        <p className="text-xs text-gray-400 mt-1">{list.length} clientes registrados</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Total clientes", value: list.length },
          { icon: UserCheck, label: "Activos", value: activeCount },
          { icon: DollarSign, label: "Ingresos totales", value: `$${totalSpent.toLocaleString()}` },
          { icon: TrendingUp, label: "Ticket promedio", value: `$${Math.round(totalSpent / (list.reduce((s, c) => s + c.orders, 0) || 1)).toLocaleString()}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">{label}</p>
              <p className="text-sm text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex flex-wrap items-center gap-3">
        {/* Status pills */}
        <div className="flex gap-1.5">
          {(["all", "ACTIVE", "INACTIVE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusF(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${statusFilter === s ? "bg-gray-600 text-white border-gray-600" : "border-gray-200 text-gray-500 hover:border-gray-400"
                }`}
            >
              {s === "all" ? "Todos" : s === "ACTIVE" ? "Activos" : "Inactivos"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o email..." className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-gray-400 placeholder-gray-300" />
        </div>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} clientes</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs text-gray-400 font-normal"><SortBtn k="name" label="Cliente" /></th>
                <th className="text-left px-4 py-3.5 text-xs text-gray-400 font-normal hidden sm:table-cell">Email</th>
                <th className="text-right px-4 py-3.5 text-xs text-gray-400 font-normal"><SortBtn k="orders" label="Pedidos" /></th>
                <th className="text-right px-4 py-3.5 text-xs text-gray-400 font-normal hidden md:table-cell"><SortBtn k="totalSpent" label="Total gastado" /></th>
                <th className="text-center px-4 py-3.5 text-xs text-gray-400 font-normal hidden lg:table-cell"><SortBtn k="joinDate" label="Miembro desde" /></th>
                <th className="text-left px-4 py-3.5 text-xs text-gray-400 font-normal">Estado</th>
                <th className="text-right px-5 py-3.5 text-xs text-gray-400 font-normal">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-[11px] tracking-widest flex-shrink-0">
                        {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs text-gray-900">{c.name}</p>
                        <p className="text-[11px] text-gray-400 sm:hidden">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 hidden sm:table-cell">{c.email}</td>
                  <td className="px-4 py-3.5 text-right text-xs text-gray-700 tabular-nums">{c.orders}</td>
                  <td className="px-4 py-3.5 text-right text-xs text-gray-900 hidden md:table-cell tabular-nums">${c.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-400 hidden lg:table-cell">{c.joinDate}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => setSel(c)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors ml-auto">
                      <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-8 h-8 text-gray-200 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-400">No hay clientes que coincidan</p>
            </div>
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {selectedCustomer && (
        <CustomerDrawer
          customer={selectedCustomer}
          onClose={() => setSel(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
}