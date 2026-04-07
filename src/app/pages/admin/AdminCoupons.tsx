import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search, Plus, Pencil, Trash2, X, Copy, Check,
  Tag, Percent, DollarSign, Calendar, Users,
  ToggleLeft, ToggleRight, Infinity as InfinityIcon,
  AlertTriangle, TrendingUp, Gift, Clock, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "../../components/admin/Pagination";
import { type Coupon as ApiCoupon, type CouponPayload, type CouponUsageRecord, couponRepository } from "../../repositories/CouponRepository";

/* ── Types ────────────────────────────────────────────────── */
interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "freeShipping";
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  status: "active" | "inactive" | "expired";
  description: string;
  createdAt: string;
}

/* ── Mock data ───────────────────────────────────────────── */
const INITIAL_COUPONS: Coupon[] = [
  { id: "c1", code: "WELCOME10", type: "percentage", value: 10, minOrder: 0, maxUses: null, usedCount: 47, expiresAt: null, status: "active", description: "Descuento de bienvenida para nuevos clientes", createdAt: "2025-01-15" },
  { id: "c2", code: "SUMMER25", type: "percentage", value: 25, minOrder: 100, maxUses: 200, usedCount: 183, expiresAt: "2025-08-31", status: "active", description: "Campaña de verano 2025", createdAt: "2025-06-01" },
  { id: "c3", code: "SAVE50", type: "fixed", value: 50, minOrder: 200, maxUses: 100, usedCount: 100, expiresAt: "2025-12-31", status: "inactive", description: "Descuento fijo de $50 en pedidos grandes", createdAt: "2025-03-10" },
  { id: "c4", code: "NX0362025", type: "percentage", value: 15, minOrder: 50, maxUses: null, usedCount: 312, expiresAt: "2025-12-31", status: "active", description: "Código anual de la tienda NX036", createdAt: "2025-01-01" },
  { id: "c5", code: "FLASH20", type: "percentage", value: 20, minOrder: 0, maxUses: 50, usedCount: 50, expiresAt: "2025-03-01", status: "expired", description: "Oferta flash de 24 horas", createdAt: "2025-02-28" },
  { id: "c6", code: "TECH30", type: "percentage", value: 30, minOrder: 300, maxUses: 75, usedCount: 28, expiresAt: "2026-01-01", status: "active", description: "Descuento en tecnología de gama alta", createdAt: "2025-09-01" },
  { id: "c7", code: "FREESHIP", type: "fixed", value: 15, minOrder: 75, maxUses: null, usedCount: 89, expiresAt: null, status: "active", description: "Cubre el costo de envío estándar", createdAt: "2025-04-20" },
  { id: "c8", code: "VIP100", type: "fixed", value: 100, minOrder: 500, maxUses: 20, usedCount: 7, expiresAt: "2026-06-30", status: "active", description: "Cupón exclusivo para clientes VIP", createdAt: "2025-11-01" },
  { id: "c9", code: "BLACKFRI40", type: "percentage", value: 40, minOrder: 150, maxUses: 500, usedCount: 500, expiresAt: "2025-11-30", status: "expired", description: "Black Friday 2025", createdAt: "2025-11-25" },
  { id: "c10", code: "LOYALTY5", type: "percentage", value: 5, minOrder: 0, maxUses: null, usedCount: 204, expiresAt: null, status: "inactive", description: "Programa de fidelización — uso interno", createdAt: "2025-05-12" },
];

const EMPTY_FORM: Omit<Coupon, "id" | "usedCount" | "createdAt"> = {
  code: "", type: "percentage", value: 10, minOrder: 0,
  maxUses: null, expiresAt: null, status: "active", description: "",
};

/* ── Status meta ─────────────────────────────────────────── */
const STATUS_META = {
  active: { label: "Activo", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  inactive: { label: "Inactivo", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  expired: { label: "Expirado", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
};

/* ── Helpers ─────────────────────────────────────────────── */

function mapApiToUi(a: ApiCoupon): Coupon {
  const expired = a.validUntil ? new Date(a.validUntil) < new Date() : false;
  let status: Coupon["status"] = "active";
  if (expired) status = "expired";
  else if (!a.active) status = "inactive";
  return {
    id: a.id,
    code: a.code,
    type: a.type === "PERCENTAGE" ? "percentage" : a.type === "FREE_SHIPPING" ? "freeShipping" : "fixed",
    value: a.value,
    minOrder: a.minOrderAmount ?? 0,
    maxUses: a.maxUses ?? null,
    usedCount: a.usedCount ?? 0,
    expiresAt: a.validUntil ?? null,
    status,
    description: a.description ?? "",
    createdAt: a.createdAt,
  };
}

/** Ensure a date string is a valid ISO-8601 Instant (with time+Z). */
function toInstant(d: string): string {
  if (d.includes("T")) return d.endsWith("Z") ? d : `${d}Z`;
  return `${d}T00:00:00Z`;
}

function uiToPayload(c: Coupon): CouponPayload {
  return {
    code: c.code,
    description: c.description || undefined,
    type: c.type === "percentage" ? "PERCENTAGE" : c.type === "freeShipping" ? "FREE_SHIPPING" : "FIXED",
    value: c.value,
    minOrderAmount: c.minOrder || undefined,
    maxUses: c.maxUses ?? undefined,
    validFrom: toInstant(c.createdAt ?? new Date().toISOString()),
    validUntil: toInstant(c.expiresAt ?? new Date(Date.now() + 365 * 86400000).toISOString()),
    active: c.status === "active",
  };
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function usagePercent(used: number, max: number | null) {
  if (max === null) return null;
  return Math.round((used / max) * 100);
}

/* ── Copy button ─────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 text-gray-300 hover:text-gray-600 transition-colors"
      title="Copiar código"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ── Modal ───────────────────────────────────────────────── */
function CouponModal({
  coupon, onSave, onClose,
}: {
  coupon: Partial<Coupon> & { id?: string };
  onSave: (c: Coupon) => void;
  onClose: () => void;
}) {
  const isNew = !coupon.id;
  const [form, setForm] = useState<Omit<Coupon, "id" | "usedCount" | "createdAt">>({
    code: coupon.code ?? "",
    type: coupon.type ?? "percentage",
    value: coupon.value ?? 10,
    minOrder: coupon.minOrder ?? 0,
    maxUses: coupon.maxUses ?? null,
    expiresAt: coupon.expiresAt ?? null,
    status: coupon.status ?? "active",
    description: coupon.description ?? "",
  });
  const [unlimited, setUnlimited] = useState(coupon.maxUses === null || coupon.maxUses === undefined ? true : false);
  const [noExpiry, setNoExpiry] = useState(!coupon.expiresAt);

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  function handleSave() {
    if (!form.code.trim()) { toast.error("El código es obligatorio"); return; }
    if (form.value <= 0) { toast.error("El valor debe ser mayor a 0"); return; }
    if (form.type === "percentage" && form.value > 100) { toast.error("El porcentaje no puede superar 100"); return; }
    if (form.type === "freeShipping") form.value = 0;

    const computed: Coupon = {
      id: coupon.id ?? "",
      usedCount: coupon.usedCount ?? 0,
      createdAt: coupon.createdAt ?? new Date().toISOString().slice(0, 10),
      ...form,
      code: form.code.toUpperCase().trim(),
      maxUses: unlimited ? null : form.maxUses,
      expiresAt: noExpiry ? null : form.expiresAt,
    };
    onSave(computed);
  }

  const inp = "w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-2.5 h-7 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300";
  const lbl = "block text-[11px] text-gray-400 mb-1";
  const row = "grid grid-cols-2 gap-3";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-500 flex items-center justify-center">
              <Gift className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-gray-900">{isNew ? "Nuevo cupón" : "Editar cupón"}</p>
              {!isNew && <p className="text-[11px] text-gray-400 font-mono mt-0.5">{coupon.code}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Código */}
          <div>
            <label className={lbl}>Código del cupón *</label>
            <input
              className={`${inp} uppercase font-mono tracking-widest`}
              placeholder="Ej: DESCUENTO20"
              value={form.code}
              onChange={e => set("code", e.target.value.toUpperCase())}
            />
          </div>

          {/* Tipo + Valor */}
          <div className={row}>
            <div>
              <label className={lbl}>Tipo de descuento</label>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden h-7">
                {(["percentage", "fixed", "freeShipping"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => set("type", t)}
                    className={`flex-1 flex items-center justify-center gap-1 text-[11px] transition-colors ${form.type === t ? "bg-gray-600 text-white" : "text-gray-500 hover:bg-gray-50"
                      }`}
                  >
                    {t === "percentage" ? <Percent className="w-3 h-3" /> : t === "freeShipping" ? <Gift className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                    {t === "percentage" ? "%" : t === "freeShipping" ? "Envío" : "Fijo"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={lbl}>{form.type === "percentage" ? "Porcentaje (%)" : form.type === "freeShipping" ? "Valor (no aplica)" : "Monto ($)"}</label>
              <input
                type="number" min={0} max={form.type === "percentage" ? 100 : undefined}
                className={inp}
                value={form.value}
                onChange={e => set("value", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Pedido mínimo */}
          <div>
            <label className={lbl}>Pedido mínimo ($) <span className="text-gray-300">— 0 = sin mínimo</span></label>
            <input
              type="number" min={0}
              className={inp}
              value={form.minOrder}
              onChange={e => set("minOrder", Number(e.target.value))}
            />
          </div>

          {/* Usos máximos */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`${lbl} mb-0`}>Usos máximos</label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <span className="text-[11px] text-gray-400">Ilimitado</span>
                <button
                  onClick={() => setUnlimited(v => !v)}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {unlimited
                    ? <ToggleRight className="w-4 h-4 text-gray-900" />
                    : <ToggleLeft className="w-4 h-4" />}
                </button>
              </label>
            </div>
            {!unlimited && (
              <input
                type="number" min={1}
                className={inp}
                value={form.maxUses ?? ""}
                onChange={e => set("maxUses", Number(e.target.value) || null)}
                placeholder="Ej: 100"
              />
            )}
            {unlimited && (
              <div className="h-7 flex items-center gap-1.5 text-[11px] text-gray-400 border border-dashed border-gray-200 rounded-lg px-2.5">
                <InfinityIcon className="w-3 h-3" /> Sin límite de usos
              </div>
            )}
          </div>

          {/* Vencimiento */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`${lbl} mb-0`}>Fecha de vencimiento</label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <span className="text-[11px] text-gray-400">Sin vencimiento</span>
                <button
                  onClick={() => setNoExpiry(v => !v)}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {noExpiry
                    ? <ToggleRight className="w-4 h-4 text-gray-900" />
                    : <ToggleLeft className="w-4 h-4" />}
                </button>
              </label>
            </div>
            {!noExpiry && (
              <input
                type="date"
                className={inp}
                value={form.expiresAt ?? ""}
                onChange={e => set("expiresAt", e.target.value || null)}
              />
            )}
            {noExpiry && (
              <div className="h-7 flex items-center gap-1.5 text-[11px] text-gray-400 border border-dashed border-gray-200 rounded-lg px-2.5">
                <Calendar className="w-3 h-3" /> No expira
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className={lbl}>Descripción interna</label>
            <textarea
              rows={2}
              className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300 resize-none"
              placeholder="Para uso interno, no visible al cliente"
              value={form.description}
              onChange={e => set("description", e.target.value)}
            />
          </div>

          {/* Estado */}
          <div>
            <label className={lbl}>Estado</label>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden h-7">
              {(["active", "inactive"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => set("status", s)}
                  className={`flex-1 text-[11px] transition-colors ${form.status === s ? "bg-gray-600 text-white" : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  {s === "active" ? "Activo" : "Inactivo"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="h-7 px-3 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="h-7 px-4 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3 h-3" />
            {isNew ? "Crear cupón" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Usages modal ────────────────────────────────────────── */
function UsagesModal({
  coupon, onClose,
}: {
  coupon: Coupon;
  onClose: () => void;
}) {
  const [usages, setUsages] = useState<CouponUsageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    couponRepository.getUsages(coupon.id)
      .then(setUsages)
      .catch(() => toast.error("Error al cargar el historial"))
      .finally(() => setLoading(false));
  }, [coupon.id]);

  function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  }

  function fmtTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-gray-900">Historial de uso</p>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">{coupon.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="py-12 text-center">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Cargando historial…</p>
            </div>
          )}

          {!loading && usages.length === 0 && (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" strokeWidth={1} />
              <p className="text-sm text-gray-400">Sin registros de uso</p>
              <p className="text-xs text-gray-300 mt-1">Este cupón aún no ha sido utilizado</p>
            </div>
          )}

          {!loading && usages.length > 0 && (
            <div>
              {/* Column headers */}
              <div className="grid grid-cols-[1.2fr_1fr_0.7fr] gap-3 px-6 py-2.5 border-b border-gray-100 bg-gray-50/60">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Usuario</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Pedido</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider text-right">Fecha / Hora</p>
              </div>

              {usages.map((u, i) => (
                <div
                  key={`${u.userId}-${u.usedAt}`}
                  className={`grid grid-cols-[1.2fr_1fr_0.7fr] gap-3 px-6 py-3 items-center hover:bg-gray-50/60 transition-colors ${i !== usages.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                >
                  {/* User */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-700 truncate" title={u.userId}>{u.userId}</span>
                  </div>

                  {/* Order */}
                  <div className="flex items-center gap-1 min-w-0">
                    <ExternalLink className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    <span className="text-xs text-gray-500 font-mono truncate" title={u.orderId}>
                      {u.orderId.slice(0, 8)}…
                    </span>
                    <CopyBtn text={u.orderId} />
                  </div>

                  {/* Date + time */}
                  <div className="text-right">
                    <p className="text-xs text-gray-700 tabular-nums">{fmtDate(u.usedAt)}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-gray-300" />
                      <span className="text-[11px] text-gray-400 tabular-nums">{fmtTime(u.usedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-[11px] text-gray-400">
            {usages.length} uso{usages.length !== 1 ? "s" : ""} registrado{usages.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onClose}
            className="h-7 px-3 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete confirm ─────────────────────────────────────── */
function DeleteConfirm({ code, onConfirm, onClose }: { code: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-sm text-gray-900 mb-1">¿Eliminar cupón?</p>
        <p className="text-xs text-gray-400 mb-5">
          El cupón <span className="font-mono text-gray-700">{code}</span> será eliminado permanentemente.
        </p>
        <div className="flex gap-2 justify-center">
          <button onClick={onClose} className="h-7 px-4 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="h-7 px-4 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [_loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusF] = useState<"all" | Coupon["status"]>("all");
  const [typeFilter, setTypeF] = useState<"all" | "percentage" | "fixed" | "freeShipping">("all");
  const [modal, setModal] = useState<{ open: boolean; coupon: Partial<Coupon> } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [usagesCoupon, setUsagesCoupon] = useState<Coupon | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await couponRepository.findAll({ size: 500 });
      setCoupons(res.map(mapApiToUi));
    } catch { toast.error("Error al cargar los cupones"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return coupons.filter(c => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (q && !c.code.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [coupons, search, statusFilter, typeFilter]);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total: coupons.length,
    active: coupons.filter(c => c.status === "active").length,
    totalUses: coupons.reduce((s, c) => s + c.usedCount, 0),
    expiring: coupons.filter(c => {
      if (!c.expiresAt || c.status !== "active") return false;
      const days = (new Date(c.expiresAt).getTime() - Date.now()) / 86400000;
      return days >= 0 && days <= 7;
    }).length,
  }), [coupons]);

  async function handleSave(coupon: Coupon) {
    try {
      const payload = uiToPayload(coupon);
      if (coupon.id) {
        const updated = await couponRepository.update(coupon.id, payload);
        setCoupons(prev => prev.map(c => c.id === coupon.id ? mapApiToUi(updated) : c));
        toast.success("Cupón actualizado");
      } else {
        const created = await couponRepository.create(payload);
        setCoupons(prev => [mapApiToUi(created), ...prev]);
        toast.success("Cupón creado");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Error al guardar el cupón");
    }
    setModal(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const c = coupons.find(x => x.id === deleteId);
    try {
      await couponRepository.delete(deleteId);
      setCoupons(prev => prev.filter(x => x.id !== deleteId));
      toast.success(`Cupón ${c?.code} eliminado`);
    } catch { toast.error("Error al eliminar el cupón"); }
    setDeleteId(null);
  }

  async function toggleStatus(id: string) {
    try {
      await couponRepository.toggleActive(id);
      setCoupons(prev => prev.map(c => {
        if (c.id !== id) return c;
        const next: Coupon["status"] = c.status === "active" ? "inactive" : "active";
        toast.success(`Cupón ${next === "active" ? "activado" : "desactivado"}`);
        return { ...c, status: next };
      }));
    } catch { toast.error("Error al cambiar el estado del cupón"); }
  }

  const deleteTarget = coupons.find(c => c.id === deleteId);

  useEffect(() => setPage(1), [search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Cupones</h1>
          <p className="text-xs text-gray-400 mt-0.5">{coupons.length} cupones en total</p>
        </div>
        <button
          onClick={() => setModal({ open: true, coupon: EMPTY_FORM })}
          className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
          title="Nuevo cupón"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total cupones", value: stats.total, icon: Tag, color: "text-gray-700" },
          { label: "Activos", value: stats.active, icon: Check, color: "text-green-600" },
          { label: "Usos totales", value: stats.totalUses, icon: TrendingUp, color: "text-blue-600" },
          { label: "Expiran pronto", value: stats.expiring, icon: Calendar, color: "text-amber-600" },
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

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
          <input
            className="w-full h-7 pl-8 pr-7 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300"
            placeholder="Buscar por código o descripción…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusF(e.target.value as any)}
          className="h-7 px-2.5 text-xs text-gray-600 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="expired">Expirados</option>
        </select>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeF(e.target.value as any)}
          className="h-7 px-2.5 text-xs text-gray-600 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
        >
          <option value="all">Todos los tipos</option>
          <option value="percentage">Porcentaje</option>
          <option value="fixed">Monto fijo</option>
          <option value="freeShipping">Envío gratis</option>
        </select>

        {/* Result count */}
        <span className="text-xs text-gray-400 ml-1">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Table head */}
        <div className="grid grid-cols-[1.8fr_1fr_1fr_1.2fr_1fr_0.8fr_80px] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
          {[
            { label: "Código", cls: "text-left" },
            { label: "Descuento", cls: "text-left" },
            { label: "Pedido mín.", cls: "text-right" },
            { label: "Usos", cls: "text-left" },
            { label: "Vencimiento", cls: "text-center" },
            { label: "Estado", cls: "text-left" },
            { label: "", cls: "text-right" },
          ].map(h => (
            <p key={h.label} className={`text-[10px] text-gray-400 uppercase tracking-wider ${h.cls}`}>{h.label}</p>
          ))}
        </div>

        <div className="overflow-auto flex-1">
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Tag className="w-8 h-8 text-gray-200 mx-auto mb-2" strokeWidth={1} />
              <p className="text-sm text-gray-400">No se encontraron cupones</p>
              <p className="text-xs text-gray-300 mt-1">Prueba con otro filtro o crea uno nuevo</p>
            </div>
          )}

          {paginated.map((c, i) => {
            const sm = STATUS_META[c.status];
            const pct = usagePercent(c.usedCount, c.maxUses);
            const expiring = c.expiresAt && c.status === "active" &&
              (new Date(c.expiresAt).getTime() - Date.now()) / 86400000 <= 7 &&
              !isExpired(c.expiresAt);

            return (
              <div
                key={c.id}
                className={`grid grid-cols-[1.8fr_1fr_1fr_1.2fr_1fr_0.8fr_80px] gap-3 px-4 py-3 items-center transition-colors hover:bg-gray-50/60 ${i !== paginated.length - 1 ? "border-b border-gray-50" : ""
                  }`}
              >
                {/* Código */}
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-mono text-xs text-gray-900 tracking-wider truncate">{c.code}</span>
                  <CopyBtn text={c.code} />
                </div>

                {/* Descuento */}
                <div className="flex items-center">
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${c.type === "percentage" ? "bg-blue-50 text-blue-700" : c.type === "freeShipping" ? "bg-green-50 text-green-700" : "bg-violet-50 text-violet-700"
                    }`}>
                    {c.type === "percentage"
                      ? <><Percent className="w-2.5 h-2.5" />{c.value}%</>
                      : c.type === "freeShipping"
                        ? <><Gift className="w-2.5 h-2.5" />Envío gratis</>
                        : <><DollarSign className="w-2.5 h-2.5" />${c.value}</>}
                  </span>
                </div>

                {/* Pedido mínimo */}
                <p className="text-xs text-gray-500 text-right tabular-nums">
                  {c.minOrder > 0 ? `$${c.minOrder}` : <span className="text-gray-300">—</span>}
                </p>

                {/* Usos */}
                <div className="min-w-0">
                  <button
                    onClick={() => setUsagesCoupon(c)}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 transition-colors group"
                    title="Ver historial de uso"
                  >
                    <Users className="w-3 h-3 text-gray-300 group-hover:text-blue-400 flex-shrink-0" />
                    <span className="tabular-nums group-hover:underline">{c.usedCount}</span>
                    {c.maxUses !== null
                      ? <span className="text-gray-400 tabular-nums">/ {c.maxUses}</span>
                      : <InfinityIcon className="w-3 h-3 text-gray-300" />}
                  </button>
                  {pct !== null && (
                    <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden w-20">
                      <div
                        className={`h-full rounded-full ${pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-green-400"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Vencimiento */}
                <div className="flex items-center justify-center gap-1">
                  {expiring && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Expira pronto" />}
                  <span className={`text-xs tabular-nums ${expiring ? "text-amber-600" : "text-gray-500"}`}>
                    {formatDate(c.expiresAt)}
                  </span>
                </div>

                {/* Estado */}
                <div className="flex items-center">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${sm.bg} ${sm.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                    {sm.label}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-1">
                  {/* Toggle active/inactive */}
                  {c.status !== "expired" && (
                    <button
                      onClick={() => toggleStatus(c.id)}
                      title={c.status === "active" ? "Desactivar" : "Activar"}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {c.status === "active"
                        ? <ToggleRight className="w-3.5 h-3.5 text-green-500" />
                        : <ToggleLeft className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button
                    onClick={() => setModal({ open: true, coupon: c })}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* Modals */}
      {modal?.open && (
        <CouponModal
          coupon={modal.coupon}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {deleteId && deleteTarget && (
        <DeleteConfirm
          code={deleteTarget.code}
          onConfirm={handleDelete}
          onClose={() => setDeleteId(null)}
        />
      )}
      {usagesCoupon && (
        <UsagesModal
          coupon={usagesCoupon}
          onClose={() => setUsagesCoupon(null)}
        />
      )}
    </div>
  );
}