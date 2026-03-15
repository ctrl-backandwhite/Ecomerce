import { useState } from "react";
import {
  Plus, Pencil, Trash2, Truck, Globe, MapPin, Check,
  X, AlertTriangle, Package, Clock, DollarSign,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────
interface Carrier {
  id: string;
  name: string;
  logo: string;        // 2-char initials shown in the avatar
  trackingUrl: string; // e.g. https://track.ups.com/?number={code}
  zones: string;
  minDays: number;
  maxDays: number;
  freeAbove: number | null;
  baseCost: number;
  active: boolean;
}

interface ShippingRule {
  id: string;
  zone: string;
  carrier: string;
  weightFrom: number;
  weightTo: number;
  price: number;
}

const ZONES = [
  "España",
  "Portugal",
  "Unión Europea",
  "Reino Unido",
  "LATAM",
  "Estados Unidos",
  "Resto del mundo",
];

// ── Initial mock data ────────────────────────────────────────
const initCarriers: Carrier[] = [
  { id: "c1", name: "NEXA Express",  logo: "NE", trackingUrl: "",                                        zones: "España y Portugal",  minDays: 1,  maxDays: 1,  freeAbove: 100,  baseCost: 4.99,  active: true  },
  { id: "c2", name: "Standard",      logo: "ST", trackingUrl: "",                                        zones: "España y Portugal",  minDays: 3,  maxDays: 5,  freeAbove: 50,   baseCost: 2.99,  active: true  },
  { id: "c3", name: "UPS Int.",       logo: "UP", trackingUrl: "https://www.ups.com/track?tracknum={code}", zones: "Unión Europea",     minDays: 5,  maxDays: 7,  freeAbove: null, baseCost: 9.99,  active: true  },
  { id: "c4", name: "FedEx Global",  logo: "FX", trackingUrl: "https://www.fedex.com/en-us/tracking.html", zones: "Internacional",     minDays: 7,  maxDays: 14, freeAbove: null, baseCost: 14.99, active: true  },
  { id: "c5", name: "Correos",       logo: "CO", trackingUrl: "https://www.correos.es/ss/Satellite/site/aplicacion-track_&_trace-1363070409932/sidioma=es_ES", zones: "España", minDays: 5, maxDays: 10, freeAbove: null, baseCost: 3.50, active: false },
];

const initRules: ShippingRule[] = [
  { id: "r1", zone: "España",          carrier: "NEXA Express", weightFrom: 0, weightTo: 30, price: 4.99  },
  { id: "r2", zone: "España",          carrier: "Standard",     weightFrom: 0, weightTo: 30, price: 2.99  },
  { id: "r3", zone: "Portugal",        carrier: "Standard",     weightFrom: 0, weightTo: 20, price: 5.99  },
  { id: "r4", zone: "Unión Europea",   carrier: "UPS Int.",      weightFrom: 0, weightTo: 20, price: 9.99  },
  { id: "r5", zone: "LATAM",           carrier: "FedEx Global", weightFrom: 0, weightTo: 15, price: 14.99 },
  { id: "r6", zone: "Resto del mundo", carrier: "FedEx Global", weightFrom: 0, weightTo: 10, price: 19.99 },
];

// ── Empty form states ────────────────────────────────────────
const emptyCarrier: Omit<Carrier, "id"> = {
  name: "", logo: "", trackingUrl: "", zones: "",
  minDays: 1, maxDays: 3, freeAbove: null, baseCost: 0, active: true,
};

const emptyRule: Omit<ShippingRule, "id"> = {
  zone: ZONES[0], carrier: "", weightFrom: 0, weightTo: 30, price: 0,
};

// ── Shared input style ───────────────────────────────────────
const inp = "w-full h-7 px-2.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300";
const lbl = "block text-[11px] text-gray-500 mb-1";

// ─────────────────────────────────────────────────────────────
// Carrier modal
// ─────────────────────────────────────────────────────────────
interface CarrierModalProps {
  initial: Omit<Carrier, "id"> & { id?: string };
  onSave: (data: Omit<Carrier, "id"> & { id?: string }) => void;
  onClose: () => void;
}

function CarrierModal({ initial, onSave, onClose }: CarrierModalProps) {
  const [form, setForm] = useState({ ...initial });
  const isEdit = Boolean(initial.id);

  const set = (field: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!form.logo.trim()) { toast.error("Las iniciales son obligatorias"); return; }
    if (!form.zones.trim()) { toast.error("La cobertura es obligatoria"); return; }
    if (form.minDays < 1)  { toast.error("Los días mínimos deben ser ≥ 1"); return; }
    if (form.maxDays < form.minDays) { toast.error("Los días máximos deben ser ≥ mínimos"); return; }
    if (form.baseCost < 0) { toast.error("La tarifa base no puede ser negativa"); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-500 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm text-gray-900">
              {isEdit ? "Editar transportista" : "Nuevo transportista"}
            </h2>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-gray-500 flex items-center justify-center text-white text-xs flex-shrink-0">
              {form.logo || "??"}
            </div>
            <div>
              <p className="text-sm text-gray-900">{form.name || "Nombre del transportista"}</p>
              <p className="text-[11px] text-gray-400">
                {form.zones || "Cobertura"} · {form.minDays}–{form.maxDays} días
              </p>
            </div>
            <div className={`ml-auto flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full ${form.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.active ? "bg-green-400" : "bg-gray-300"}`} />
              {form.active ? "Activo" : "Inactivo"}
            </div>
          </div>

          {/* Identificación */}
          <fieldset className="space-y-3">
            <legend className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Identificación</legend>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={lbl}>Nombre del transportista *</label>
                <input
                  className={inp}
                  placeholder="Ej: MRW, Seur, GLS…"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                />
              </div>
              <div>
                <label className={lbl}>Iniciales (avatar) *</label>
                <input
                  className={inp}
                  placeholder="MR"
                  maxLength={3}
                  value={form.logo}
                  onChange={e => set("logo", e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <div>
              <label className={lbl}>URL de seguimiento (usa {"{code}"} como placeholder)</label>
              <input
                className={inp}
                placeholder="https://tracking.carrier.com/?id={code}"
                value={form.trackingUrl}
                onChange={e => set("trackingUrl", e.target.value)}
              />
              {form.trackingUrl && !form.trackingUrl.includes("{code}") && (
                <p className="text-[10px] text-amber-500 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  Recuerda incluir {"{code}"} donde va el número de seguimiento
                </p>
              )}
            </div>
          </fieldset>

          <div className="h-px bg-gray-100" />

          {/* Cobertura y tiempos */}
          <fieldset className="space-y-3">
            <legend className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Cobertura y plazos</legend>
            <div>
              <label className={lbl}>Zonas de cobertura *</label>
              <input
                className={inp}
                placeholder="Ej: España y Portugal"
                value={form.zones}
                onChange={e => set("zones", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Días mínimos de entrega *</label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                  <input
                    type="number" min={1} max={60}
                    className={inp + " pl-7"}
                    value={form.minDays}
                    onChange={e => set("minDays", Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className={lbl}>Días máximos de entrega *</label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                  <input
                    type="number" min={1} max={60}
                    className={inp + " pl-7"}
                    value={form.maxDays}
                    onChange={e => set("maxDays", Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <div className="h-px bg-gray-100" />

          {/* Tarifas */}
          <fieldset className="space-y-3">
            <legend className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Tarifas</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Tarifa base *</label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                  <input
                    type="number" min={0} step={0.01}
                    className={inp + " pl-7"}
                    placeholder="0.00"
                    value={form.baseCost}
                    onChange={e => set("baseCost", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <label className={lbl}>Envío gratis a partir de (dejar vacío = nunca)</label>
                <div className="relative">
                  <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                  <input
                    type="number" min={0} step={1}
                    className={inp + " pl-7"}
                    placeholder="—"
                    value={form.freeAbove ?? ""}
                    onChange={e => set("freeAbove", e.target.value === "" ? null : Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <div className="h-px bg-gray-100" />

          {/* Estado */}
          <fieldset>
            <legend className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Estado</legend>
            <button
              type="button"
              onClick={() => set("active", !form.active)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-colors text-left ${
                form.active
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className={`w-8 h-4.5 rounded-full relative transition-colors flex-shrink-0 ${form.active ? "bg-green-400" : "bg-gray-200"}`}
                style={{ height: "18px" }}>
                <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${form.active ? "left-[calc(100%-16px)]" : "left-0.5"}`} />
              </div>
              <div>
                <p className={`text-xs ${form.active ? "text-green-800" : "text-gray-500"}`}>
                  {form.active ? "Transportista activo" : "Transportista inactivo"}
                </p>
                <p className="text-[10px] text-gray-400">
                  {form.active ? "Los clientes podrán seleccionarlo en el checkout" : "No aparecerá en el checkout"}
                </p>
              </div>
            </button>
          </fieldset>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
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
            {isEdit ? "Guardar cambios" : "Crear transportista"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Rule modal
// ─────────────────────────────────────────────────────────────
interface RuleModalProps {
  initial: Omit<ShippingRule, "id"> & { id?: string };
  carriers: Carrier[];
  onSave: (data: Omit<ShippingRule, "id"> & { id?: string }) => void;
  onClose: () => void;
}

function RuleModal({ initial, carriers, onSave, onClose }: RuleModalProps) {
  const [form, setForm] = useState({ ...initial });
  const isEdit = Boolean(initial.id);
  const set = (field: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.carrier) { toast.error("Selecciona un transportista"); return; }
    if (form.weightTo <= form.weightFrom) { toast.error("El peso máximo debe ser mayor que el mínimo"); return; }
    if (form.price < 0) { toast.error("El precio no puede ser negativo"); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-500 flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm text-gray-900">{isEdit ? "Editar regla" : "Nueva regla de tarifa"}</h2>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Zona *</label>
              <select className={inp} value={form.zone} onChange={e => set("zone", e.target.value)}>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Transportista *</label>
              <select className={inp} value={form.carrier} onChange={e => set("carrier", e.target.value)}>
                <option value="">Seleccionar…</option>
                {carriers.filter(c => c.active).map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Peso desde (kg) *</label>
              <input
                type="number" min={0} step={0.1}
                className={inp}
                value={form.weightFrom}
                onChange={e => set("weightFrom", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className={lbl}>Peso hasta (kg) *</label>
              <input
                type="number" min={0} step={0.1}
                className={inp}
                value={form.weightTo}
                onChange={e => set("weightTo", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Precio del envío (€) *</label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
              <input
                type="number" min={0} step={0.01}
                className={inp + " pl-7"}
                placeholder="0.00"
                value={form.price}
                onChange={e => set("price", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <button type="button" onClick={onClose} className="h-7 px-4 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit as any} className="h-7 px-4 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
            {isEdit ? "Guardar cambios" : "Crear regla"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Confirm delete dialog
// ─────────────────────────────────────────────────────────────
function DeleteDialog({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm text-gray-900 text-center mb-1">¿Eliminar "{name}"?</h3>
        <p className="text-xs text-gray-400 text-center mb-5">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-8 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 h-8 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
export function AdminShipping() {
  const [carriers, setCarriers] = useState<Carrier[]>(initCarriers);
  const [rules, setRules]       = useState<ShippingRule[]>(initRules);
  const [tab, setTab]           = useState<"carriers" | "rules" | "zones">("carriers");

  // Carrier modal state
  const [carrierModal, setCarrierModal] = useState<{
    open: boolean;
    data: (Omit<Carrier, "id"> & { id?: string }) | null;
  }>({ open: false, data: null });

  // Rule modal state
  const [ruleModal, setRuleModal] = useState<{
    open: boolean;
    data: (Omit<ShippingRule, "id"> & { id?: string }) | null;
  }>({ open: false, data: null });

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ type: "carrier" | "rule"; id: string; name: string } | null>(null);

  /* ── Carrier CRUD ───────────────────────────────────── */
  const openNewCarrier  = () => setCarrierModal({ open: true, data: { ...emptyCarrier } });
  const openEditCarrier = (c: Carrier) => setCarrierModal({ open: true, data: { ...c } });

  const saveCarrier = (data: Omit<Carrier, "id"> & { id?: string }) => {
    if (data.id) {
      setCarriers(prev => prev.map(c => c.id === data.id ? { ...c, ...data } as Carrier : c));
      toast.success("Transportista actualizado");
    } else {
      setCarriers(prev => [...prev, { ...data, id: `c-${Date.now()}` } as Carrier]);
      toast.success("Transportista creado");
    }
    setCarrierModal({ open: false, data: null });
  };

  const confirmDeleteCarrier = (c: Carrier) =>
    setDeleteTarget({ type: "carrier", id: c.id, name: c.name });

  const toggleActive = (id: string) => {
    setCarriers(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    toast.success("Estado actualizado");
  };

  /* ── Rule CRUD ──────────────────────────────────────── */
  const openNewRule  = () => setRuleModal({ open: true, data: { ...emptyRule, carrier: carriers.find(c => c.active)?.name ?? "" } });
  const openEditRule = (r: ShippingRule) => setRuleModal({ open: true, data: { ...r } });

  const saveRule = (data: Omit<ShippingRule, "id"> & { id?: string }) => {
    if (data.id) {
      setRules(prev => prev.map(r => r.id === data.id ? { ...r, ...data } as ShippingRule : r));
      toast.success("Regla actualizada");
    } else {
      setRules(prev => [...prev, { ...data, id: `r-${Date.now()}` } as ShippingRule]);
      toast.success("Regla creada");
    }
    setRuleModal({ open: false, data: null });
  };

  const confirmDeleteRule = (r: ShippingRule) =>
    setDeleteTarget({ type: "rule", id: r.id, name: `${r.zone} — ${r.carrier}` });

  /* ── Confirm delete ─────────────────────────────────── */
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "carrier") {
      setCarriers(prev => prev.filter(c => c.id !== deleteTarget.id));
      toast.success("Transportista eliminado");
    } else {
      setRules(prev => prev.filter(r => r.id !== deleteTarget.id));
      toast.success("Regla eliminada");
    }
    setDeleteTarget(null);
  };

  // ── Render ───────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Envíos y transportistas</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gestiona métodos de envío, tarifas y zonas de cobertura</p>
        </div>
        {tab === "carriers" && (
          <button
            onClick={openNewCarrier}
            className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
            title="Nuevo transportista"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
        {tab === "rules" && (
          <button
            onClick={openNewRule}
            className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
            title="Nueva regla"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Transportistas",   value: carriers.length,                       icon: Truck  },
          { label: "Activos",          value: carriers.filter(c => c.active).length, icon: Check  },
          { label: "Zonas cubiertas",  value: ZONES.length,                          icon: Globe  },
          { label: "Reglas de tarifa", value: rules.length,                          icon: MapPin },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <s.icon className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg text-gray-900 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["carriers", "rules", "zones"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-7 px-4 text-xs rounded-lg transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
          >
            {t === "carriers" ? "Transportistas" : t === "rules" ? "Tarifas" : "Zonas"}
          </button>
        ))}
      </div>

      {/* ── Carriers tab ── */}
      {tab === "carriers" && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="hidden lg:grid grid-cols-[2fr_1.5fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
            {[
              { label: "Transportista", cls: "text-left"   },
              { label: "Cobertura",     cls: "text-left"   },
              { label: "Días",          cls: "text-center" },
              { label: "Gratis +",      cls: "text-right"  },
              { label: "Tarifa base",   cls: "text-right"  },
              { label: "Estado",        cls: "text-left"   },
              { label: "",              cls: "text-right"  },
            ].map(h => (
              <p key={h.label} className={`text-[10px] text-gray-400 uppercase tracking-wider ${h.cls}`}>{h.label}</p>
            ))}
          </div>

          {carriers.length === 0 && (
            <div className="py-12 text-center text-xs text-gray-400">
              <Truck className="w-8 h-8 mx-auto mb-2 text-gray-200" strokeWidth={1} />
              No hay transportistas. Crea el primero.
            </div>
          )}

          {carriers.map((c, i) => (
            <div
              key={c.id}
              className={`flex flex-col lg:grid lg:grid-cols-[2fr_1.5fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-2 lg:gap-3 px-4 py-3.5 items-start lg:items-center ${i !== carriers.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              {/* Name + logo */}
              <div className="flex items-center gap-2.5 w-full lg:w-auto">
                <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center text-[10px] text-white flex-shrink-0">
                  {c.logo}
                </div>
                <div>
                  <p className="text-xs text-gray-900">{c.name}</p>
                  {c.trackingUrl && (
                    <p className="text-[10px] text-gray-400 truncate max-w-[180px]">Tracking configurado</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 lg:block">{c.zones}</p>
              <p className="text-xs text-gray-500 text-center">{c.minDays}–{c.maxDays} días</p>
              <p className="text-xs text-gray-500 text-right tabular-nums">{c.freeAbove != null ? `€${c.freeAbove}` : "—"}</p>
              <p className="text-xs text-gray-900 text-right tabular-nums">€{c.baseCost.toFixed(2)}</p>

              {/* Status toggle */}
              <button
                onClick={() => toggleActive(c.id)}
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full transition-colors ${c.active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${c.active ? "bg-green-400" : "bg-gray-300"}`} />
                {c.active ? "Activo" : "Inactivo"}
              </button>

              {/* Actions */}
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => openEditCarrier(c)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => confirmDeleteCarrier(c)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Empty CTA */}
          {carriers.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-50">
              <button
                onClick={openNewCarrier}
                className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
              >
                <Plus className="w-3 h-3" /> Añadir transportista
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Rules tab ── */}
      {tab === "rules" && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="hidden lg:grid grid-cols-[1.5fr_1.5fr_1fr_1fr_0.8fr_auto] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
            {[
              { label: "Zona",          cls: "text-left"   },
              { label: "Transportista", cls: "text-left"   },
              { label: "Peso desde",    cls: "text-right"  },
              { label: "Peso hasta",    cls: "text-right"  },
              { label: "Precio",        cls: "text-right"  },
              { label: "",              cls: "text-right"  },
            ].map(h => (
              <p key={h.label} className={`text-[10px] text-gray-400 uppercase tracking-wider ${h.cls}`}>{h.label}</p>
            ))}
          </div>

          {rules.length === 0 && (
            <div className="py-12 text-center text-xs text-gray-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-200" strokeWidth={1} />
              No hay reglas de tarifa. Crea la primera.
            </div>
          )}

          {rules.map((r, i) => (
            <div
              key={r.id}
              className={`flex flex-col lg:grid lg:grid-cols-[1.5fr_1.5fr_1fr_1fr_0.8fr_auto] gap-2 lg:gap-3 px-4 py-3 items-start lg:items-center ${i !== rules.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <p className="text-xs text-gray-900">{r.zone}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-gray-500 flex items-center justify-center text-[9px] text-white flex-shrink-0">
                  {carriers.find(c => c.name === r.carrier)?.logo ?? "??"}
                </div>
                <p className="text-xs text-gray-500">{r.carrier}</p>
              </div>
              <p className="text-xs text-gray-500 text-right tabular-nums">{r.weightFrom} kg</p>
              <p className="text-xs text-gray-500 text-right tabular-nums">{r.weightTo} kg</p>
              <p className="text-xs text-gray-900 text-right tabular-nums">€{r.price.toFixed(2)}</p>
              <div className="flex gap-1 justify-end">
                <button onClick={() => openEditRule(r)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
                <button onClick={() => confirmDeleteRule(r)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
              </div>
            </div>
          ))}

          {rules.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-50">
              <button onClick={openNewRule} className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                <Plus className="w-3 h-3" /> Añadir regla
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Zones tab ── */}
      {tab === "zones" && (
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ZONES.map(zone => {
              const count = rules.filter(r => r.zone === zone).length;
              return (
                <div key={zone} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs text-gray-900">{zone}</p>
                      <p className="text-[10px] text-gray-400">{count} regla{count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${count > 0 ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                    {count > 0 ? "Configurada" : "Sin reglas"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {carrierModal.open && carrierModal.data && (
        <CarrierModal
          initial={carrierModal.data}
          onSave={saveCarrier}
          onClose={() => setCarrierModal({ open: false, data: null })}
        />
      )}

      {ruleModal.open && ruleModal.data && (
        <RuleModal
          initial={ruleModal.data}
          carriers={carriers}
          onSave={saveRule}
          onClose={() => setRuleModal({ open: false, data: null })}
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