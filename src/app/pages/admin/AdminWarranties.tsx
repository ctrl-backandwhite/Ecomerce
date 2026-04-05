import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Shield, Plus, Pencil, Trash2, X, Check, AlertTriangle,
  Package, Phone, Mail, Clock, Wrench, Truck,
  CheckCircle, XCircle, ChevronDown, Search,
  ShieldCheck, ShieldAlert, ShieldOff, Info,
} from "lucide-react";
import { toast } from "sonner";
import { warrantyRepository } from "../../repositories/WarrantyRepository";

/* ── Types ── */
type WarrantyType = "MANUFACTURER" | "STORE" | "EXTENDED" | "LIMITED";

interface Warranty {
  id: string;
  name: string;
  type: WarrantyType;
  durationMonths: number;
  coverage: string;
  conditions: string;
  includesLabor: boolean;
  includesParts: boolean;
  includesPickup: boolean;
  repairLimit: number | null;
  contactPhone: string;
  contactEmail: string;
  active: boolean;
  productsCount: number;
}

const WARRANTY_TYPE_META: Record<WarrantyType, { label: string; bg: string; text: string }> = {
  MANUFACTURER: { label: "Fabricante", bg: "bg-blue-50", text: "text-blue-700" },
  STORE: { label: "Tienda", bg: "bg-green-50", text: "text-green-700" },
  EXTENDED: { label: "Extendida", bg: "bg-purple-50", text: "text-purple-700" },
  LIMITED: { label: "Limitada", bg: "bg-amber-50", text: "text-amber-700" },
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const inp = "w-full h-7 px-2.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300";
const lbl = "block text-[11px] text-gray-500 mb-1";

const emptyWarranty: Omit<Warranty, "id" | "productsCount"> = {
  name: "",
  type: "STORE",
  durationMonths: 24,
  coverage: "",
  conditions: "",
  includesLabor: true,
  includesParts: true,
  includesPickup: false,
  repairLimit: null,
  contactPhone: "+34 91 123 45 67",
  contactEmail: "garantias@nx036.com",
  active: true,
};

// ── Duration helper ───────────────────────────────────────────────────────────
function durationLabel(months: number): string {
  if (months === 0) return "Sin período";
  if (months < 12) return `${months} mes${months > 1 ? "es" : ""}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} año${years > 1 ? "s" : ""}` : `${years}a ${rem}m`;
}

// ── Boolean badge ─────────────────────────────────────────────────────────────
function BoolBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${value ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
      {value ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete dialog
// ─────────────────────────────────────────────────────────────────────────────
function DeleteDialog({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm text-gray-900 text-center mb-1">¿Eliminar "{name}"?</h3>
        <p className="text-xs text-gray-400 text-center mb-5">Esta acción no se puede deshacer y desviculará la garantía de todos los productos.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-8 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 h-8 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Warranty Panel (create / edit)
// ─────────────────────────────────────────────────────────────────────────────
interface WarrantyPanelProps {
  initial: (Omit<Warranty, "id" | "productsCount"> & { id?: string });
  onSave: (data: Omit<Warranty, "id" | "productsCount"> & { id?: string }) => void;
  onClose: () => void;
}

function WarrantyPanel({ initial, onSave, onClose }: WarrantyPanelProps) {
  const [form, setForm] = useState({ ...initial });
  const [tab, setTab] = useState<"general" | "cobertura" | "contacto">("general");
  const isEdit = Boolean(initial.id);

  const set = (field: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return false; }
    if (!form.coverage.trim()) { toast.error("La cobertura es obligatoria"); return false; }
    if (form.durationMonths < 0) { toast.error("La duración no puede ser negativa"); return false; }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form);
  };

  const tm = WARRANTY_TYPE_META[form.type];

  // Quick duration presets
  const DURATION_PRESETS = [6, 12, 24, 36, 48, 60];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg ${tm.bg} flex items-center justify-center`}>
              <Shield className={`w-3.5 h-3.5 ${tm.text}`} strokeWidth={1.5} />
            </div>
            <h2 className="text-sm text-gray-900">
              {isEdit ? "Editar garantía" : "Nueva garantía"}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {([
            { id: "general", label: "General" },
            { id: "cobertura", label: "Cobertura" },
            { id: "contacto", label: "Contacto" },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 h-9 text-xs transition-colors ${tab === t.id ? "bg-white text-gray-900 border-b-2 border-gray-900" : "text-gray-500 hover:text-gray-700 bg-gray-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Live preview strip */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          <div className={`w-8 h-8 rounded-xl ${tm.bg} flex items-center justify-center flex-shrink-0`}>
            <Shield className={`w-4 h-4 ${tm.text}`} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-900 truncate">{form.name || "Nombre de la garantía"}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] px-1.5 py-px rounded ${tm.bg} ${tm.text}`}>{tm.label}</span>
              <span className="text-[10px] text-gray-400">{durationLabel(form.durationMonths)}</span>
            </div>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${form.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {form.active ? "Activa" : "Inactiva"}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── GENERAL ── */}
          {tab === "general" && (
            <>
              <div>
                <label className={lbl}>Nombre de la garantía *</label>
                <input
                  className={inp}
                  placeholder="Ej: Garantía oficial Samsung 2 años"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                />
              </div>

              <div>
                <label className={lbl}>Tipo *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(WARRANTY_TYPE_META) as [WarrantyType, typeof WARRANTY_TYPE_META[WarrantyType]][]).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set("type", key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${form.type === key ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className={`w-5 h-5 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                        <Shield className={`w-3 h-3 ${meta.text}`} strokeWidth={1.5} />
                      </div>
                      <p className="text-xs text-gray-900">{meta.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={lbl}>Duración (meses)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number" min={0}
                      className={inp}
                      value={form.durationMonths}
                      onChange={e => set("durationMonths", Number(e.target.value))}
                    />
                  </div>
                  <span className="flex items-center text-xs text-gray-400 flex-shrink-0">
                    = {durationLabel(form.durationMonths)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {DURATION_PRESETS.map(v => (
                    <button key={v} type="button"
                      onClick={() => set("durationMonths", v)}
                      className={`h-6 px-2.5 text-[11px] rounded-lg border transition-colors ${form.durationMonths === v ? "bg-gray-600 text-white border-gray-600" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
                    >
                      {durationLabel(v)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <label className={lbl}>Número máximo de reparaciones</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => set("repairLimit", null)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${form.repairLimit === null ? "bg-gray-600 text-white border-gray-600" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
                    >
                      Sin límite
                    </button>
                  </div>
                  <input
                    type="number" min={1} max={10}
                    className={inp + " max-w-24"}
                    placeholder="Ej: 2"
                    value={form.repairLimit ?? ""}
                    onChange={e => set("repairLimit", e.target.value === "" ? null : Number(e.target.value))}
                  />
                  {form.repairLimit !== null && (
                    <span className="text-xs text-gray-400 flex-shrink-0">reparación{form.repairLimit !== 1 ? "es" : ""}</span>
                  )}
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Estado */}
              <button
                type="button"
                onClick={() => set("active", !form.active)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border text-left transition-colors ${form.active ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
              >
                <div className={`relative rounded-full flex-shrink-0 transition-colors ${form.active ? "bg-green-400" : "bg-gray-200"}`} style={{ width: 32, height: 18 }}>
                  <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${form.active ? "left-[calc(100%-16px)]" : "left-0.5"}`} />
                </div>
                <div>
                  <p className={`text-xs ${form.active ? "text-green-800" : "text-gray-500"}`}>
                    {form.active ? "Garantía activa" : "Garantía inactiva"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {form.active ? "Se puede asociar a productos" : "No disponible para nuevas asociaciones"}
                  </p>
                </div>
              </button>
            </>
          )}

          {/* ── COBERTURA ── */}
          {tab === "cobertura" && (
            <>
              <div>
                <label className={lbl}>Resumen de cobertura *</label>
                <input
                  className={inp}
                  placeholder="Ej: Defectos de fabricación en hardware y batería"
                  value={form.coverage}
                  onChange={e => set("coverage", e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1">Texto corto visible en la ficha del producto.</p>
              </div>

              <div>
                <label className={lbl}>Términos y condiciones completos</label>
                <textarea
                  rows={8}
                  className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 transition-colors resize-none placeholder:text-gray-300 leading-relaxed"
                  placeholder="Descripción detallada de qué cubre, qué excluye, proceso de reclamación…"
                  value={form.conditions}
                  onChange={e => set("conditions", e.target.value)}
                />
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <label className={lbl}>Incluye</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { field: "includesLabor" as const, label: "Mano de obra", icon: Wrench },
                    { field: "includesParts" as const, label: "Piezas / recambios", icon: Package },
                    { field: "includesPickup" as const, label: "Recogida a domicilio", icon: Truck },
                  ].map(opt => (
                    <button
                      key={opt.field}
                      type="button"
                      onClick={() => set(opt.field, !form[opt.field])}
                      className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all ${form[opt.field] ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${form[opt.field] ? "bg-green-100" : "bg-gray-100"}`}>
                        <opt.icon className={`w-3.5 h-3.5 ${form[opt.field] ? "text-green-600" : "text-gray-400"}`} strokeWidth={1.5} />
                      </div>
                      <p className={`text-[10px] text-center leading-tight ${form[opt.field] ? "text-green-800" : "text-gray-500"}`}>{opt.label}</p>
                      {form[opt.field]
                        ? <Check className="w-3 h-3 text-green-500" strokeWidth={2.5} />
                        : <XCircle className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                      }
                    </button>
                  ))}
                </div>
              </div>

              {/* What's covered summary */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Resumen de cobertura</p>
                {[
                  { value: form.includesLabor, label: "Mano de obra" },
                  { value: form.includesParts, label: "Piezas y recambios" },
                  { value: form.includesPickup, label: "Recogida a domicilio" },
                  { value: form.repairLimit === null, label: "Reparaciones ilimitadas" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    {item.value
                      ? <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" strokeWidth={2} />
                      : <XCircle className="w-3 h-3 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                    }
                    <p className={`text-xs ${item.value ? "text-gray-700" : "text-gray-400"}`}>{item.label}</p>
                  </div>
                ))}
                {form.repairLimit !== null && (
                  <div className="flex items-center gap-2">
                    <Info className="w-3 h-3 text-amber-400 flex-shrink-0" strokeWidth={1.5} />
                    <p className="text-xs text-amber-700">Máximo {form.repairLimit} reparación{form.repairLimit !== 1 ? "es" : ""}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── CONTACTO ── */}
          {tab === "contacto" && (
            <>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[11px] text-blue-700">
                  Estos datos se muestran al cliente en la ficha del producto y en los emails de garantía.
                </p>
              </div>

              <div>
                <label className={lbl}>Teléfono de soporte</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                  <input
                    type="tel"
                    className={inp + " pl-7"}
                    placeholder="+34 91 123 45 67"
                    value={form.contactPhone}
                    onChange={e => set("contactPhone", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>Email de soporte</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                  <input
                    type="email"
                    className={inp + " pl-7"}
                    placeholder="garantias@nx036.com"
                    value={form.contactEmail}
                    onChange={e => set("contactEmail", e.target.value)}
                  />
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Preview how it looks on product page */}
              <div>
                <p className={lbl}>Vista previa en ficha de producto</p>
                <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl ${tm.bg} flex items-center justify-center flex-shrink-0`}>
                      <Shield className={`w-4 h-4 ${tm.text}`} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-900">{form.name || "Garantía"}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{form.coverage || "Descripción de cobertura"}</p>
                    </div>
                    <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${tm.bg} ${tm.text}`}>
                      {durationLabel(form.durationMonths)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.includesLabor && <BoolBadge value={true} label="Mano de obra" />}
                    {form.includesParts && <BoolBadge value={true} label="Piezas" />}
                    {form.includesPickup && <BoolBadge value={true} label="Recogida domicilio" />}
                    {form.repairLimit === null
                      ? <BoolBadge value={true} label="Reparaciones ilimitadas" />
                      : <BoolBadge value={false} label={`Máx. ${form.repairLimit} reparación${form.repairLimit !== 1 ? "es" : ""}`} />
                    }
                  </div>
                  {form.contactPhone && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <Phone className="w-3 h-3" strokeWidth={1.5} />
                      {form.contactPhone}
                      {form.contactEmail && <> · <Mail className="w-3 h-3" strokeWidth={1.5} /> {form.contactEmail}</>}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex gap-1">
            {["general", "cobertura", "contacto"].map((t, idx) => (
              <button key={t} onClick={() => setTab(t as any)}
                className={`w-2 h-2 rounded-full transition-colors ${tab === t ? "bg-gray-600" : "bg-gray-200"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-7 px-4 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="flex items-center gap-1.5 h-7 px-4 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
              <Check className="w-3.5 h-3.5" />
              {isEdit ? "Guardar" : "Crear garantía"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export function AdminWarranties() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [filterType, setFilterType] = useState<WarrantyType | "all">("all");

  const loadWarranties = useCallback(async () => {
    setLoading(true);
    try { setWarranties(await warrantyRepository.findAll()); }
    catch { toast.error("Error al cargar las garantías"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadWarranties(); }, [loadWarranties]);
  const [panelData, setPanelData] = useState<
    | { mode: "new"; data: Omit<Warranty, "id" | "productsCount"> }
    | { mode: "edit"; data: Warranty }
    | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const visible = useMemo(() => {
    let r = [...warranties];
    if (filterType !== "all") r = r.filter(w => w.type === filterType);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      r = r.filter(w => w.name.toLowerCase().includes(q) || w.coverage.toLowerCase().includes(q));
    }
    return r;
  }, [warranties, filterType, searchQ]);

  /* ── CRUD ─────────────────────────────────────────── */
  const handleToggleActive = async (w: Warranty) => {
    try {
      await warrantyRepository.toggleActive(w.id);
      toast.success(w.active ? "Garantía desactivada" : "Garantía activada");
      await loadWarranties();
    } catch { toast.error("Error al cambiar el estado"); }
  };

  const handleSave = async (data: Omit<Warranty, "id" | "productsCount"> & { id?: string }) => {
    try {
      if (data.id) {
        const prev = warranties.find(w => w.id === data.id);
        await warrantyRepository.update(data.id, data as any);
        if (prev && prev.active !== data.active) {
          await warrantyRepository.toggleActive(data.id);
        }
        toast.success("Garantía actualizada");
      } else {
        await warrantyRepository.create(data as any);
        toast.success("Garantía creada");
      }
      await loadWarranties();
    } catch { toast.error("Error al guardar la garantía"); }
    setPanelData(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await warrantyRepository.delete(deleteTarget.id);
      await loadWarranties();
      toast.success("Garantía eliminada");
    } catch { toast.error("Error al eliminar la garantía"); }
    setDeleteTarget(null);
  };

  const totalProducts = warranties.reduce((s, w) => s + w.productsCount, 0);
  const activeCount = warranties.filter(w => w.active).length;

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Garantías de producto</h1>
          <p className="text-xs text-gray-400 mt-0.5">Define y gestiona las garantías disponibles para asociar a tus productos</p>
        </div>
        <button
          onClick={() => setPanelData({ mode: "new", data: { ...emptyWarranty } })}
          className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
          title="Nueva garantía"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Garantías", value: warranties.length, icon: Shield },
          { label: "Activas", value: activeCount, icon: ShieldCheck },
          { label: "Productos cubiertos", value: totalProducts, icon: Package },
          { label: "Con recogida", value: warranties.filter(w => w.includesPickup).length, icon: Truck },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              <s.icon className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg text-gray-900 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["all", "MANUFACTURER", "STORE", "EXTENDED", "LIMITED"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`h-7 px-3 text-xs rounded-lg transition-colors ${filterType === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "all" ? "Todas" : WARRANTY_TYPE_META[t].label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
          <input
            className="w-full h-9 pl-7 pr-3 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
            placeholder="Buscar garantías…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="hidden lg:grid grid-cols-[2.5fr_1fr_0.8fr_1.4fr_0.8fr_0.7fr_auto] gap-3 px-5 py-2.5 bg-gray-50/60 border-b border-gray-100">
          {[
            { label: "Garantía", cls: "text-left" },
            { label: "Tipo", cls: "text-left" },
            { label: "Duración", cls: "text-center" },
            { label: "Cobertura incluye", cls: "text-left" },
            { label: "Productos", cls: "text-right" },
            { label: "Estado", cls: "text-left" },
            { label: "", cls: "text-right" },
          ].map(h => (
            <p key={h.label} className={`text-[10px] text-gray-400 uppercase tracking-wider ${h.cls}`}>{h.label}</p>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="py-14 text-center">
            <ShieldOff className="w-8 h-8 mx-auto mb-2 text-gray-200" strokeWidth={1} />
            <p className="text-xs text-gray-400">No hay garantías{filterType !== "all" ? " en este tipo" : ""}.</p>
          </div>
        )}

        {visible.map((w, i) => {
          const meta = WARRANTY_TYPE_META[w.type];
          return (
            <div
              key={w.id}
              className={`flex flex-col lg:grid lg:grid-cols-[2.5fr_1fr_0.8fr_1.4fr_0.8fr_0.7fr_auto] gap-2 lg:gap-3 px-5 py-3.5 items-start lg:items-center hover:bg-gray-50/60 transition-colors ${i !== visible.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              {/* Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                  <Shield className={`w-3.5 h-3.5 ${meta.text}`} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-900 truncate">{w.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{w.coverage}</p>
                </div>
              </div>

              {/* Type */}
              <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full w-fit ${meta.bg} ${meta.text}`}>
                {meta.label}
              </span>

              {/* Duration */}
              <div className="flex items-center justify-center gap-1 text-xs text-gray-700">
                <Clock className="w-3 h-3 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                {durationLabel(w.durationMonths)}
              </div>

              {/* Includes */}
              <div className="flex flex-wrap gap-1">
                {w.includesLabor && <BoolBadge value={true} label="Mano obra" />}
                {w.includesParts && <BoolBadge value={true} label="Piezas" />}
                {w.includesPickup && <BoolBadge value={true} label="Recogida" />}
                {w.repairLimit === null && <BoolBadge value={true} label="Ilimitado" />}
              </div>

              {/* Products count */}
              <div className="flex items-center justify-end gap-1 text-xs text-gray-700">
                <Package className="w-3 h-3 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                {w.productsCount}
              </div>

              {/* Status – clickable toggle */}
              <button
                onClick={() => handleToggleActive(w)}
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full w-fit cursor-pointer hover:opacity-80 transition-opacity ${w.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                title={w.active ? "Clic para desactivar" : "Clic para activar"}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${w.active ? "bg-green-400" : "bg-gray-300"}`} />
                {w.active ? "Activa" : "Inactiva"}
              </button>

              {/* Actions */}
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => setPanelData({ mode: "edit", data: w })}
                  className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: w.id, name: w.name })}
                  className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {visible.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50">
            <button
              onClick={() => setPanelData({ mode: "new", data: { ...emptyWarranty } })}
              className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Plus className="w-3 h-3" /> Añadir garantía
            </button>
          </div>
        )}
      </div>

      {/* Panels */}
      {panelData && (
        <WarrantyPanel
          initial={panelData.mode === "edit" ? panelData.data : panelData.data}
          onSave={handleSave}
          onClose={() => setPanelData(null)}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          name={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}