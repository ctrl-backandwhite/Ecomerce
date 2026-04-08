import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Percent, Globe,
  X, AlertTriangle, Info, FileText, Tag,
} from "lucide-react";
import { toast } from "sonner";
import { type TaxRate as ApiTaxRate, type TaxRatePayload, taxRepository } from "../../repositories/TaxRepository";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TaxRule {
  id: string;
  name: string;
  country: string;
  region: string;        // estado/provincia, vacío = todo el país
  rate: number;
  type: "standard" | "reduced" | "super_reduced" | "zero";
  applies: string;       // categorías o productos a los que aplica
  includesShipping: boolean;
  active: boolean;
  notes: string;
}

// ── Catálogos ─────────────────────────────────────────────────────────────────
const COUNTRIES = [
  "España", "Portugal", "Francia", "Alemania", "Italia", "Países Bajos",
  "Bélgica", "Austria", "Polonia", "Suecia", "Dinamarca", "Finlandia",
  "Irlanda", "Grecia", "República Checa", "Rumanía", "Hungría",
  "Reino Unido", "Suiza", "Noruega",
  "Estados Unidos", "Canadá", "México", "Brasil", "Argentina",
  "Colombia", "Chile", "Perú",
  "China", "Japón", "Corea del Sur", "Australia", "India",
  "Otro",
];

const CATEGORIES = [
  "General", "Electrónica", "Moda", "Calzado", "Gaming", "Audio",
  "Fotografía", "Wearables", "Hogar", "Accesorios",
  "Alimentación", "Libros", "Medicamentos", "Transporte",
  "Servicios digitales",
];

const TYPE_META: Record<TaxRule["type"], { label: string; bg: string; text: string; description: string }> = {
  standard: { label: "Estándar", bg: "bg-blue-50", text: "text-blue-700", description: "Tipo general, aplica a la mayoría de productos" },
  reduced: { label: "Reducido", bg: "bg-amber-50", text: "text-amber-700", description: "Tasa reducida para categorías específicas" },
  super_reduced: { label: "Superreducido", bg: "bg-violet-50", text: "text-violet-700", description: "Tasa mínima para bienes de primera necesidad" },
  zero: { label: "Exento (0%)", bg: "bg-gray-100", text: "text-gray-500", description: "Sin impuesto aplicado" },
};

// ── Datos iniciales ───────────────────────────────────────────────────────────
// Removed: data is now loaded from the API.

const COUNTRY_NAMES: Record<string, string> = {
  ES: "España", PT: "Portugal", FR: "Francia", DE: "Alemania",
  IT: "Italia", NL: "Países Bajos", BE: "Bélgica", AT: "Austria",
  PL: "Polonia", SE: "Suecia", DK: "Dinamarca", FI: "Finlandia",
  IE: "Irlanda", GR: "Grecia", CZ: "Rep. Checa", RO: "Rumanía",
  HU: "Hungría", GB: "Reino Unido", CH: "Suiza", NO: "Noruega",
  US: "Estados Unidos", CA: "Canadá", MX: "México", BR: "Brasil",
  AR: "Argentina", CO: "Colombia", CL: "Chile", PE: "Perú",
  CN: "China", JP: "Japón", KR: "Corea del Sur", AU: "Australia", IN: "India",
};

function buildTaxName(t: ApiTaxRate): string {
  const pct = (t.rate * 100).toFixed(t.rate * 100 % 1 === 0 ? 0 : 2);
  const region = t.region ?? "";
  const country = COUNTRY_NAMES[t.country] ?? t.country;
  if (region) return `${region} ${pct}%`;
  const cats = t.appliesToCategories ?? [];
  const catLabel = cats.includes("General") ? "General" : cats[0] ?? "";
  return `IVA ${catLabel} ${country} ${pct}%`.trim();
}

function mapApiToUi(t: ApiTaxRate): TaxRule {
  const pct = t.rate * 100;
  let uiType: TaxRule["type"] = "standard";
  if (pct === 0) uiType = "zero";
  else if (pct <= 5) uiType = "super_reduced";
  else if (pct < 15) uiType = "reduced";

  return {
    id: t.id,
    name: buildTaxName(t),
    country: COUNTRY_NAMES[t.country] ?? t.country,
    region: t.region ?? "",
    rate: pct,
    type: uiType,
    applies: (t.appliesToCategories ?? []).join(", ") || "General",
    includesShipping: true,
    active: t.active,
    notes: "",
  };
}

function countryToCode(name: string): string {
  const entry = Object.entries(COUNTRY_NAMES).find(([, v]) => v === name);
  return entry ? entry[0] : name;
}

function uiToPayload(r: TaxRule): TaxRatePayload {
  return {
    country: countryToCode(r.country),
    region: r.region || undefined,
    rate: r.rate / 100,
    type: r.type === "zero" ? "FIXED" : "PERCENTAGE",
    appliesToCategories: r.applies.split(",").map(s => s.trim()).filter(Boolean),
    active: r.active,
  };
}

const emptyRule: Omit<TaxRule, "id"> = {
  name: "", country: "España", region: "", rate: 21,
  type: "standard", applies: "General",
  includesShipping: true, active: true, notes: "",
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const inp = "w-full h-7 px-2.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300";
const lbl = "block text-[11px] text-gray-500 mb-1";

// ─────────────────────────────────────────────────────────────────────────────
// Tax Rule Modal
// ─────────────────────────────────────────────────────────────────────────────
interface TaxModalProps {
  initial: Omit<TaxRule, "id"> & { id?: string };
  existingCountries: string[];
  onSave: (data: Omit<TaxRule, "id"> & { id?: string }) => void;
  onClose: () => void;
}

function TaxModal({ initial, onSave, onClose }: TaxModalProps) {
  const [form, setForm] = useState({ ...initial });
  const [appliesInput, setAppliesInput] = useState(initial.applies);
  const [selectedCats, setSelectedCats] = useState<string[]>(
    initial.applies === "General" ? [] : initial.applies.split(", ").filter(Boolean),
  );
  const isEdit = Boolean((initial as any).id);

  const set = (field: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Sync category chips → form.applies
  const toggleCat = (cat: string) => {
    const next = selectedCats.includes(cat)
      ? selectedCats.filter(c => c !== cat)
      : [...selectedCats, cat];
    setSelectedCats(next);
    const val = next.length === 0 ? "General" : next.join(", ");
    setAppliesInput(val);
    set("applies", val);
  };

  const handleAppliesInput = (v: string) => {
    setAppliesInput(v);
    set("applies", v);
    setSelectedCats([]);          // manual input deselects chips
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!form.country.trim()) { toast.error("El país es obligatorio"); return; }
    if (form.rate < 0 || form.rate > 100) { toast.error("La tasa debe estar entre 0 y 100"); return; }
    if (!form.applies.trim()) { toast.error("Especifica a qué aplica"); return; }
    onSave(form);
  };

  const tm = TYPE_META[form.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[94vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-500 flex items-center justify-center">
              <Percent className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm text-gray-900">
              {isEdit ? "Editar regla fiscal" : "Nueva regla fiscal"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Live preview badge */}
          <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
            <div className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${tm.bg} ${tm.text} flex-shrink-0`}>
              <Percent className="w-3 h-3" />
              {form.rate}%
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-900 truncate">{form.name || "Nombre de la regla"}</p>
              <p className="text-[10px] text-gray-400">
                {form.country}{form.region ? ` · ${form.region}` : ""} · {tm.label}
              </p>
            </div>
            <div className={`ml-auto flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${form.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.active ? "bg-green-400" : "bg-gray-300"}`} />
              {form.active ? "Activa" : "Inactiva"}
            </div>
          </div>

          {/* ── Sección 1: Identificación ── */}
          <fieldset className="space-y-3">
            <legend className="text-[10px] text-gray-400 uppercase tracking-widest">Identificación</legend>

            <div>
              <label className={lbl}>Nombre de la regla *</label>
              <input
                className={inp}
                placeholder="Ej: IVA General España, TVA France…"
                value={form.name}
                onChange={e => set("name", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>País *</label>
                <select
                  className={inp}
                  value={form.country}
                  onChange={e => set("country", e.target.value)}
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Región / Estado <span className="text-gray-300">(opcional)</span></label>
                <input
                  className={inp}
                  placeholder="Ej: California, Cataluña…"
                  value={form.region}
                  onChange={e => set("region", e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <div className="h-px bg-gray-100" />

          {/* ── Sección 2: Tasa e impuesto ── */}
          <fieldset className="space-y-3">
            <legend className="text-[10px] text-gray-400 uppercase tracking-widest">Tasa e impuesto</legend>

            {/* Type selector */}
            <div>
              <label className={lbl}>Tipo de impuesto *</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TYPE_META) as [TaxRule["type"], typeof TYPE_META[TaxRule["type"]]][]).map(
                  ([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        set("type", key);
                        if (key === "zero") set("rate", 0);
                      }}
                      className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${form.type === key
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <span className={`mt-0.5 inline-flex text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                      <p className="text-[10px] text-gray-400 leading-snug">{meta.description}</p>
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Rate */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className={lbl}>Tasa impositiva (%) *</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    disabled={form.type === "zero"}
                    className={inp + " pr-7 disabled:bg-gray-50 disabled:text-gray-300"}
                    placeholder="21"
                    value={form.type === "zero" ? 0 : form.rate}
                    onChange={e => set("rate", parseFloat(e.target.value) || 0)}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
              </div>

              {/* Rate reference chips */}
              <div className="pb-0.5">
                <p className={lbl}>Tasas comunes</p>
                <div className="flex flex-wrap gap-1.5">
                  {[4, 10, 16, 19, 20, 21, 23, 25].map(r => (
                    <button
                      key={r}
                      type="button"
                      disabled={form.type === "zero"}
                      onClick={() => set("rate", r)}
                      className={`h-6 px-2 text-[11px] rounded-lg border transition-colors disabled:opacity-30 ${form.rate === r
                        ? "bg-gray-600 text-white border-gray-600"
                        : "border-gray-200 text-gray-500 hover:border-gray-400"
                        }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          <div className="h-px bg-gray-100" />

          {/* ── Sección 3: Aplicación ── */}
          <fieldset className="space-y-3">
            <legend className="text-[10px] text-gray-400 uppercase tracking-widest">Ámbito de aplicación</legend>

            <div>
              <label className={lbl}>Aplica a (categorías o productos) *</label>
              <div className="relative">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                <input
                  className={inp + " pl-7"}
                  placeholder="Ej: Electrónica, Moda, General…"
                  value={appliesInput}
                  onChange={e => handleAppliesInput(e.target.value)}
                />
              </div>
              {/* Quick-select chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCat(cat)}
                    className={`h-6 px-2 text-[11px] rounded-lg border transition-colors ${selectedCats.includes(cat)
                      ? "bg-gray-600 text-white border-gray-600"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Shipping toggle */}
            <button
              type="button"
              onClick={() => set("includesShipping", !form.includesShipping)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-colors text-left ${form.includesShipping
                ? "border-blue-200 bg-blue-50"
                : "border-gray-200 bg-gray-50"
                }`}
            >
              <div
                className={`relative rounded-full transition-colors flex-shrink-0 ${form.includesShipping ? "bg-blue-400" : "bg-gray-200"}`}
                style={{ width: 32, height: 18 }}
              >
                <span
                  className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${form.includesShipping ? "left-[calc(100%-16px)]" : "left-0.5"}`}
                />
              </div>
              <div>
                <p className={`text-xs ${form.includesShipping ? "text-blue-800" : "text-gray-500"}`}>
                  Aplica también al coste de envío
                </p>
                <p className="text-[10px] text-gray-400">
                  {form.includesShipping ? "El impuesto se calculará sobre subtotal + envío" : "Solo se aplica sobre el subtotal de productos"}
                </p>
              </div>
            </button>
          </fieldset>

          <div className="h-px bg-gray-100" />

          {/* ── Sección 4: Estado y notas ── */}
          <fieldset className="space-y-3">
            <legend className="text-[10px] text-gray-400 uppercase tracking-widest">Estado y notas</legend>

            <button
              type="button"
              onClick={() => set("active", !form.active)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-colors text-left ${form.active
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-gray-50"
                }`}
            >
              <div
                className={`relative rounded-full transition-colors flex-shrink-0 ${form.active ? "bg-green-400" : "bg-gray-200"}`}
                style={{ width: 32, height: 18 }}
              >
                <span
                  className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${form.active ? "left-[calc(100%-16px)]" : "left-0.5"}`}
                />
              </div>
              <div>
                <p className={`text-xs ${form.active ? "text-green-800" : "text-gray-500"}`}>
                  {form.active ? "Regla fiscal activa" : "Regla fiscal inactiva"}
                </p>
                <p className="text-[10px] text-gray-400">
                  {form.active
                    ? "Se aplicará automáticamente en nuevos pedidos"
                    : "No se aplicará en el checkout"}
                </p>
              </div>
            </button>

            <div>
              <label className={lbl}>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Notas internas <span className="text-gray-300">(opcional)</span>
                </span>
              </label>
              <textarea
                rows={2}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300 resize-none"
                placeholder="Ej: Varía por municipio, revisar anualmente…"
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
              />
            </div>
          </fieldset>

          {/* Warning */}
          {isEdit && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
              <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-[11px] text-amber-700">
                Los pedidos ya procesados conservan la tasa aplicada en el momento de la compra. Los cambios solo afectan a nuevos pedidos.
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-7 px-4 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit as any}
            className="h-7 px-4 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {isEdit ? "Guardar cambios" : "Crear regla fiscal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete confirmation
// ─────────────────────────────────────────────────────────────────────────────
function DeleteDialog({
  name,
  onConfirm,
  onClose,
}: {
  name: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm text-gray-900 text-center mb-1">¿Eliminar "{name}"?</h3>
        <p className="text-xs text-gray-400 text-center mb-5">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-8 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-8 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export function AdminTaxes() {
  const [rules, setRules] = useState<TaxRule[]>([]);

  const [modal, setModal] = useState<{
    open: boolean;
    data: (Omit<TaxRule, "id"> & { id?: string }) | null;
  }>({ open: false, data: null });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const loadRules = useCallback(async () => {
    try {
      const data = await taxRepository.findAll();
      setRules(data.map(mapApiToUi));
    } catch {
      toast.error("Error al cargar reglas fiscales");
    }
  }, []);

  useEffect(() => { loadRules(); }, [loadRules]);

  const countries = [...new Set(rules.map(r => r.country))];

  /* ── CRUD ────────────────────────────────────────────────── */
  const openNew = () => setModal({ open: true, data: { ...emptyRule } });
  const openEdit = (r: TaxRule) => setModal({ open: true, data: { ...r } });

  const handleSave = async (data: Omit<TaxRule, "id"> & { id?: string }) => {
    try {
      if (data.id) {
        const updated = await taxRepository.update(data.id, uiToPayload(data as TaxRule));
        setRules(prev => prev.map(r => r.id === data.id ? mapApiToUi(updated) : r));
        toast.success("Regla fiscal actualizada");
      } else {
        const created = await taxRepository.create(uiToPayload(data as TaxRule));
        setRules(prev => [...prev, mapApiToUi(created)]);
        toast.success("Regla fiscal creada");
      }
      setModal({ open: false, data: null });
    } catch {
      toast.error("Error al guardar regla fiscal");
    }
  };

  const toggleActive = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    try {
      await taxRepository.update(id, uiToPayload({ ...rule, active: !rule.active }));
      setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await taxRepository.delete(deleteTarget.id);
      setRules(prev => prev.filter(r => r.id !== deleteTarget.id));
      toast.success("Regla eliminada");
      setDeleteTarget(null);
    } catch {
      toast.error("Error al eliminar regla");
    }
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Gestión de impuestos</h1>
          <p className="text-xs text-gray-400 mt-0.5">Configura las tasas de IVA y reglas fiscales por país</p>
        </div>
        <button
          onClick={openNew}
          className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
          title="Nueva regla fiscal"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Reglas fiscales", value: rules.length },
          { label: "Países cubiertos", value: countries.length },
          { label: "Reglas activas", value: rules.filter(r => r.active).length },
          { label: "Tasa máxima", value: `${Math.max(...rules.map(r => r.rate))}%` },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Percent className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg text-gray-900 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="hidden lg:grid grid-cols-[2fr_1.2fr_0.7fr_1fr_1.5fr_0.8fr_auto] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
          {[
            { label: "Nombre", cls: "text-left" },
            { label: "País / Región", cls: "text-left" },
            { label: "Tasa", cls: "text-right" },
            { label: "Tipo", cls: "text-left" },
            { label: "Aplica a", cls: "text-left" },
            { label: "Estado", cls: "text-left" },
            { label: "", cls: "text-right" },
          ].map(h => (
            <p key={h.label} className={`text-[10px] text-gray-400 uppercase tracking-wider ${h.cls}`}>{h.label}</p>
          ))}
        </div>

        {rules.length === 0 && (
          <div className="py-12 text-center text-xs text-gray-400">
            <Percent className="w-8 h-8 mx-auto mb-2 text-gray-200" strokeWidth={1} />
            No hay reglas fiscales. Crea la primera.
          </div>
        )}

        {rules.map((r, i) => {
          const tm = TYPE_META[r.type];
          return (
            <div
              key={r.id}
              className={`flex flex-col lg:grid lg:grid-cols-[2fr_1.2fr_0.7fr_1fr_1.5fr_0.8fr_auto] gap-2 lg:gap-3 px-4 py-3.5 items-start lg:items-center ${i !== rules.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              {/* Name + notes indicator */}
              <div className="min-w-0">
                <p className="text-xs text-gray-900">{r.name}</p>
                {r.notes && (
                  <p className="text-[10px] text-gray-400 truncate">{r.notes}</p>
                )}
              </div>

              {/* Country + region */}
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                <p className="text-xs text-gray-500 truncate">
                  {r.country}{r.region ? ` · ${r.region}` : ""}
                </p>
              </div>

              {/* Rate */}
              <p className="text-xs text-gray-900 text-right tabular-nums">{r.rate}%</p>

              {/* Type badge */}
              <span className={`inline-flex text-[11px] px-2 py-0.5 rounded-full w-fit ${tm.bg} ${tm.text}`}>
                {tm.label}
              </span>

              {/* Applies */}
              <p className="text-xs text-gray-500 truncate">{r.applies}</p>

              {/* Status */}
              <button
                onClick={() => toggleActive(r.id)}
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full w-fit transition-colors ${r.active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${r.active ? "bg-green-400" : "bg-gray-300"}`} />
                {r.active ? "Activo" : "Inactivo"}
              </button>

              {/* Actions */}
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => openEdit(r)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: r.id, name: r.name })}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Quick add row */}
        {rules.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50">
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Plus className="w-3 h-3" /> Añadir regla fiscal
            </button>
          </div>
        )}
      </div>

      {/* Warning note */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-xs text-amber-700">
          Los cambios en las reglas fiscales afectan solo a nuevos pedidos. Los pedidos ya procesados conservan la tasa aplicada en el momento de la compra.
        </p>
      </div>

      {/* Modals */}
      {modal.open && modal.data && (
        <TaxModal
          initial={modal.data}
          existingCountries={countries}
          onSave={handleSave}
          onClose={() => setModal({ open: false, data: null })}
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