import { useState, useMemo } from "react";
import {
  Plus, X, Check, Pencil, Trash2, AlertTriangle,
  Package, Truck, Navigation, Home, ClipboardCheck,
  RotateCcw, Clock, Wrench, Camera, Phone, MapPin,
  Bell, Search, Warehouse, ChevronUp, ChevronDown,
  Zap, ArrowRight, RefreshCw, ShieldCheck, CheckCircle2,
  Settings, Mail, Layers, Activity,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
type FlowType     = "delivery" | "return" | "exchange" | "quality" | "custom";
type TriggerType  = "auto" | "manual" | "carrier" | "timed";
type StepIconName =
  | "package" | "clipboard" | "truck" | "navigation" | "home" | "check"
  | "rotate"  | "clock"     | "wrench"| "camera"     | "phone"| "mappin"
  | "bell"    | "warehouse" | "search"| "shield"     | "star" | "refresh";

interface FlowStep {
  id: string;
  position: number;
  name: string;
  statusLabel: string;
  icon: StepIconName;
  color: string;
  description: string;
  slaHours: number;
  triggerType: TriggerType;
  triggerDelayHours: number;
  requiresPhoto: boolean;
  requiresSignature: boolean;
  sendEmail: boolean;
  emailNote: string;
  sendSMS: boolean;
  isTerminal: boolean;
}

interface DeliveryFlow {
  id: string;
  name: string;
  description: string;
  type: FlowType;
  shippingMethods: string[];
  steps: FlowStep[];
  active: boolean;
  isDefault: boolean;
  createdAt: string;
  ordersCount: number;
}

// ── Catalogues ─────────────────────────────────────────────────────────────────
const FLOW_TYPE_META: Record<FlowType, { label: string; icon: React.ElementType; bg: string; text: string; desc: string }> = {
  delivery: { label: "Entrega",        icon: Truck,         bg: "bg-blue-50",   text: "text-blue-600",   desc: "Flujo estándar de entrega de pedidos" },
  return:   { label: "Devolución",     icon: RotateCcw,     bg: "bg-red-50",    text: "text-red-600",    desc: "Gestión de devoluciones y recogidas" },
  exchange: { label: "Cambio",         icon: RefreshCw,     bg: "bg-violet-50", text: "text-violet-600", desc: "Cambio de producto por otro artículo" },
  quality:  { label: "Control calidad",icon: ShieldCheck,   bg: "bg-green-50",  text: "text-green-600",  desc: "Inspección y control de calidad" },
  custom:   { label: "Personalizado",  icon: Settings,      bg: "bg-gray-100",  text: "text-gray-600",   desc: "Flujo de trabajo personalizado" },
};

const SHIPPING_METHODS = [
  { id: "standard",      label: "Envío estándar (3–5 días)" },
  { id: "express",       label: "Envío express (24h)" },
  { id: "sameday",       label: "Entrega el mismo día" },
  { id: "pickup",        label: "Recogida en tienda" },
  { id: "heavy",         label: "Envío voluminoso / pesado" },
  { id: "international", label: "Envío internacional" },
];

const TRIGGER_META: Record<TriggerType, { label: string; desc: string; color: string }> = {
  auto:    { label: "Automático",    desc: "Avanza al completarse la acción anterior",  color: "bg-green-100 text-green-700"  },
  manual:  { label: "Manual",        desc: "Requiere acción del equipo para avanzar",   color: "bg-amber-100 text-amber-700"  },
  carrier: { label: "Transportista", desc: "Avanza con evento de tracking del carrier", color: "bg-blue-100 text-blue-700"    },
  timed:   { label: "Programado",    desc: "Avanza automáticamente tras X horas",       color: "bg-violet-100 text-violet-700"},
};

const STEP_ICONS: { name: StepIconName; Icon: React.ElementType }[] = [
  { name: "package",   Icon: Package       },
  { name: "clipboard", Icon: ClipboardCheck},
  { name: "truck",     Icon: Truck         },
  { name: "navigation",Icon: Navigation    },
  { name: "home",      Icon: Home          },
  { name: "check",     Icon: CheckCircle2  },
  { name: "rotate",    Icon: RotateCcw     },
  { name: "clock",     Icon: Clock         },
  { name: "wrench",    Icon: Wrench        },
  { name: "camera",    Icon: Camera        },
  { name: "phone",     Icon: Phone         },
  { name: "mappin",    Icon: MapPin        },
  { name: "bell",      Icon: Bell          },
  { name: "warehouse", Icon: Warehouse     },
  { name: "search",    Icon: Search        },
  { name: "shield",    Icon: ShieldCheck   },
  { name: "refresh",   Icon: RefreshCw     },
];

const STEP_COLORS = ["#6366f1","#3b82f6","#0ea5e9","#14b8a6","#10b981","#22c55e","#f59e0b","#f97316","#ef4444","#8b5cf6","#ec4899","#111827"];

function getStepIcon(name: StepIconName): React.ElementType {
  return STEP_ICONS.find(s => s.name === name)?.Icon ?? Package;
}

// ── Templates ─────────────────────────────────────────────────────────────────
function makeStep(overrides: Partial<FlowStep> & { name: string; position: number }): FlowStep {
  return {
    id: `step-${Date.now()}-${Math.random()}`,
    statusLabel: overrides.name,
    icon: "package",
    color: "#6366f1",
    description: "",
    slaHours: 24,
    triggerType: "auto",
    triggerDelayHours: 0,
    requiresPhoto: false,
    requiresSignature: false,
    sendEmail: false,
    emailNote: "",
    sendSMS: false,
    isTerminal: false,
    ...overrides,
  };
}

const TEMPLATES: Record<FlowType, FlowStep[]> = {
  delivery: [
    makeStep({ position: 1, name: "Pedido confirmado",             statusLabel: "Confirmado",          icon: "clipboard", color: "#6366f1", triggerType: "auto",    slaHours: 0,  sendEmail: true }),
    makeStep({ position: 2, name: "En preparación",                statusLabel: "Preparando",          icon: "package",   color: "#f59e0b", triggerType: "manual",  slaHours: 24  }),
    makeStep({ position: 3, name: "Recogido por transportista",    statusLabel: "Recogido",            icon: "truck",     color: "#3b82f6", triggerType: "carrier", slaHours: 4   }),
    makeStep({ position: 4, name: "En tránsito",                   statusLabel: "En camino",           icon: "navigation",color: "#0ea5e9", triggerType: "carrier", slaHours: 48  }),
    makeStep({ position: 5, name: "En reparto local",              statusLabel: "En reparto",          icon: "mappin",    color: "#8b5cf6", triggerType: "carrier", slaHours: 8   }),
    makeStep({ position: 6, name: "Entregado",                     statusLabel: "Entregado",           icon: "home",      color: "#10b981", triggerType: "carrier", slaHours: 0,  sendEmail: true, isTerminal: true }),
  ],
  return: [
    makeStep({ position: 1, name: "Devolución solicitada",         statusLabel: "Solicitada",          icon: "rotate",    color: "#ef4444", triggerType: "auto",    slaHours: 0,  sendEmail: true }),
    makeStep({ position: 2, name: "Recogida programada",           statusLabel: "Recogida prog.",      icon: "truck",     color: "#f97316", triggerType: "manual",  slaHours: 24  }),
    makeStep({ position: 3, name: "Paquete recogido",              statusLabel: "En tránsito",         icon: "package",   color: "#3b82f6", triggerType: "carrier", slaHours: 48  }),
    makeStep({ position: 4, name: "Recibido en almacén",           statusLabel: "Recibido",            icon: "warehouse", color: "#6366f1", triggerType: "manual",  slaHours: 4   }),
    makeStep({ position: 5, name: "Inspeccionado",                 statusLabel: "Inspeccionado",       icon: "search",    color: "#f59e0b", triggerType: "manual",  slaHours: 24, requiresPhoto: true }),
    makeStep({ position: 6, name: "Reembolso procesado",           statusLabel: "Reembolsado",         icon: "check",     color: "#10b981", triggerType: "auto",    slaHours: 72, sendEmail: true, isTerminal: true }),
  ],
  exchange: [
    makeStep({ position: 1, name: "Cambio solicitado",             statusLabel: "Solicitado",          icon: "refresh",   color: "#8b5cf6", triggerType: "auto",    slaHours: 0,  sendEmail: true }),
    makeStep({ position: 2, name: "Recogida del artículo",         statusLabel: "Recogida prog.",      icon: "truck",     color: "#f97316", triggerType: "manual",  slaHours: 24  }),
    makeStep({ position: 3, name: "Artículo recibido",             statusLabel: "Recibido",            icon: "warehouse", color: "#6366f1", triggerType: "carrier", slaHours: 48  }),
    makeStep({ position: 4, name: "Nuevo artículo preparado",      statusLabel: "Preparando envío",    icon: "package",   color: "#f59e0b", triggerType: "manual",  slaHours: 24  }),
    makeStep({ position: 5, name: "Nuevo artículo enviado",        statusLabel: "Enviado",             icon: "navigation",color: "#0ea5e9", triggerType: "auto",    slaHours: 0,  sendEmail: true }),
    makeStep({ position: 6, name: "Entregado",                     statusLabel: "Entregado",           icon: "home",      color: "#10b981", triggerType: "carrier", slaHours: 0,  isTerminal: true }),
  ],
  quality: [
    makeStep({ position: 1, name: "Artículo recibido",             statusLabel: "Recibido",            icon: "warehouse", color: "#6366f1", triggerType: "auto",    slaHours: 0   }),
    makeStep({ position: 2, name: "En inspección visual",          statusLabel: "En inspección",       icon: "search",    color: "#f59e0b", triggerType: "manual",  slaHours: 4,  requiresPhoto: true }),
    makeStep({ position: 3, name: "Control técnico",               statusLabel: "Control técnico",     icon: "wrench",    color: "#3b82f6", triggerType: "manual",  slaHours: 8   }),
    makeStep({ position: 4, name: "Aprobado / Rechazado",          statusLabel: "Revisado",            icon: "check",     color: "#10b981", triggerType: "manual",  slaHours: 1,  isTerminal: true }),
  ],
  custom: [],
};

// ── Initial flows ─────────────────────────────────────────────────────────────
const initFlows: DeliveryFlow[] = [
  {
    id: "f1", name: "Entrega estándar",          description: "Flujo por defecto para todos los pedidos con envío estándar.",
    type: "delivery", shippingMethods: ["standard"], steps: TEMPLATES.delivery.map(s => ({ ...s, id: `f1-${s.position}` })),
    active: true,  isDefault: true,  createdAt: "01/01/2026", ordersCount: 3841,
  },
  {
    id: "f2", name: "Entrega express 24h",       description: "Flujo optimizado para envíos express con SLAs reducidos.",
    type: "delivery", shippingMethods: ["express"], steps: [
      ...TEMPLATES.delivery.slice(0, 5).map((s, i) => ({ ...s, id: `f2-${i}`, slaHours: Math.max(1, Math.floor(s.slaHours / 2)) })),
      { ...TEMPLATES.delivery[5], id: "f2-5" },
    ],
    active: true,  isDefault: false, createdAt: "15/01/2026", ordersCount: 912,
  },
  {
    id: "f3", name: "Devolución estándar",        description: "Proceso de devolución con recogida a domicilio.",
    type: "return",   shippingMethods: [],          steps: TEMPLATES.return.map(s  => ({ ...s, id: `f3-${s.position}` })),
    active: true,  isDefault: true,  createdAt: "01/01/2026", ordersCount: 189,
  },
  {
    id: "f4", name: "Control de calidad",         description: "Inspección técnica para artículos devueltos.",
    type: "quality",  shippingMethods: [],          steps: TEMPLATES.quality.map(s => ({ ...s, id: `f4-${s.position}` })),
    active: true,  isDefault: false, createdAt: "20/02/2026", ordersCount: 47,
  },
];

const emptyFlow: Omit<DeliveryFlow, "id" | "createdAt" | "ordersCount"> = {
  name: "", description: "", type: "delivery",
  shippingMethods: [], steps: [], active: true, isDefault: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const inp = "w-full h-7 px-2.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300";
const lbl = "block text-[11px] text-gray-500 mb-1";

// ─────────────────────────────────────────────────────────────────────────────
// Step Editor (inline accordion)
// ─────────────────────────────────────────────────────────────────────────────
interface StepEditorProps {
  step: FlowStep;
  isFirst: boolean;
  isLast: boolean;
  onChange: (updated: FlowStep) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function StepEditor({ step, isFirst, isLast, onChange, onDelete, onMoveUp, onMoveDown }: StepEditorProps) {
  const [open, setOpen] = useState(false);
  const StepIcon = getStepIcon(step.icon);
  const tm = TRIGGER_META[step.triggerType];

  const set = (field: keyof FlowStep, value: any) =>
    onChange({ ...step, [field]: value });

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? "border-gray-300 shadow-sm" : "border-gray-200"}`}>
      {/* Step header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {/* Position & icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] text-gray-500 flex items-center justify-center flex-shrink-0">
            {step.position}
          </span>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: step.color + "22" }}
          >
            <StepIcon className="w-3.5 h-3.5" style={{ color: step.color }} strokeWidth={1.5} />
          </div>
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-900 truncate">{step.name || "Paso sin nombre"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] px-1.5 py-px rounded ${tm.color}`}>{tm.label}</span>
            {step.slaHours > 0 && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" strokeWidth={1.5} />
                SLA {step.slaHours}h
              </span>
            )}
            {step.sendEmail && <Mail className="w-2.5 h-2.5 text-blue-400" strokeWidth={2} />}
            {step.requiresPhoto && <Camera className="w-2.5 h-2.5 text-violet-400" strokeWidth={2} />}
            {step.isTerminal && <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-px rounded">Final</span>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={onMoveUp}   disabled={isFirst} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-30 rounded transition-colors"><ChevronUp   className="w-3 h-3" /></button>
          <button onClick={onMoveDown} disabled={isLast}  className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-30 rounded transition-colors"><ChevronDown className="w-3 h-3" /></button>
          <button onClick={onDelete}                      className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ml-1 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Step body */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Nombre del paso *</label>
              <input className={inp} placeholder="Ej: En preparación" value={step.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Etiqueta de estado (cliente)</label>
              <input className={inp} placeholder="Ej: Preparando tu pedido" value={step.statusLabel} onChange={e => set("statusLabel", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={lbl}>Descripción interna</label>
            <input className={inp} placeholder="Notas para el equipo…" value={step.description} onChange={e => set("description", e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Icon picker */}
            <div>
              <label className={lbl}>Icono</label>
              <div className="flex flex-wrap gap-1">
                {STEP_ICONS.map(({ name, Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => set("icon", name)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${step.icon === name ? "ring-2 ring-gray-900 bg-gray-100" : "bg-white border border-gray-200 hover:border-gray-400"}`}
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className={lbl}>Color</label>
              <div className="flex flex-wrap gap-1">
                {STEP_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("color", c)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${step.color === c ? "border-gray-900 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* SLA */}
            <div>
              <label className={lbl}>SLA (horas máx.)</label>
              <div className="relative">
                <input type="number" min={0} className={inp + " pr-5"} value={step.slaHours} onChange={e => set("slaHours", Number(e.target.value))} />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">h</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">0 = sin límite</p>
            </div>
          </div>

          {/* Trigger */}
          <div>
            <label className={lbl}>Cómo avanza al siguiente paso</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(TRIGGER_META) as [TriggerType, typeof TRIGGER_META[TriggerType]][]).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set("triggerType", key)}
                  className={`flex flex-col items-start px-2.5 py-2 rounded-lg border text-left transition-all ${step.triggerType === key ? "border-gray-900 bg-white" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <span className={`text-[10px] px-1.5 py-px rounded ${meta.color}`}>{meta.label}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{meta.desc}</p>
                </button>
              ))}
            </div>
            {step.triggerType === "timed" && (
              <div className="flex items-center gap-2 mt-2">
                <label className="text-[11px] text-gray-500 flex-shrink-0">Avanzar tras:</label>
                <div className="relative w-20">
                  <input type="number" min={1} className={inp + " w-20 pr-4"} value={step.triggerDelayHours} onChange={e => set("triggerDelayHours", Number(e.target.value))} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">h</span>
                </div>
                <span className="text-[11px] text-gray-400">del paso anterior</span>
              </div>
            )}
          </div>

          {/* Flags */}
          <div>
            <label className={lbl}>Requisitos y acciones</label>
            <div className="flex flex-wrap gap-2">
              {[
                { field: "requiresPhoto"     as const, label: "Foto obligatoria",   icon: Camera },
                { field: "requiresSignature" as const, label: "Firma del cliente",  icon: Settings },
                { field: "sendEmail"         as const, label: "Notificación email", icon: Mail  },
                { field: "sendSMS"           as const, label: "Notificación SMS",   icon: Phone },
                { field: "isTerminal"        as const, label: "Paso final",         icon: CheckCircle2 },
              ].map(opt => (
                <button
                  key={opt.field}
                  type="button"
                  onClick={() => set(opt.field, !step[opt.field])}
                  className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${step[opt.field] ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
                >
                  <opt.icon className="w-3 h-3" strokeWidth={1.5} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {step.sendEmail && (
            <div>
              <label className={lbl}>Nota para el email de notificación</label>
              <input className={inp} placeholder="Mensaje personalizado al cliente…" value={step.emailNote} onChange={e => set("emailNote", e.target.value)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flow Panel (create / edit)
// ─────────────────────────────────────────────────────────────────────────────
interface FlowPanelProps {
  initial: Omit<DeliveryFlow, "id" | "createdAt" | "ordersCount"> & { id?: string };
  onSave: (data: Omit<DeliveryFlow, "id" | "createdAt" | "ordersCount"> & { id?: string }) => void;
  onClose: () => void;
}

function FlowPanel({ initial, onSave, onClose }: FlowPanelProps) {
  const [form, setForm] = useState({ ...initial });
  const [tab, setTab]   = useState<"config" | "steps" | "automation">("config");
  const isEdit = Boolean((initial as any).id);

  const set = (field: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const setSteps = (steps: FlowStep[]) =>
    setForm(prev => ({ ...prev, steps: steps.map((s, i) => ({ ...s, position: i + 1 })) }));

  const toggleMethod = (id: string) => {
    const next = form.shippingMethods.includes(id)
      ? form.shippingMethods.filter(m => m !== id)
      : [...form.shippingMethods, id];
    set("shippingMethods", next);
  };

  const applyTemplate = (type: FlowType) => {
    const tpl = TEMPLATES[type].map(s => ({ ...s, id: `new-${s.position}-${Date.now()}` }));
    setForm(prev => ({ ...prev, type, steps: tpl }));
    setTab("steps");
    toast.info(`Plantilla "${FLOW_TYPE_META[type].label}" aplicada`);
  };

  const addStep = () => {
    const newStep = makeStep({
      id: `step-${Date.now()}`,
      position: form.steps.length + 1,
      name: `Paso ${form.steps.length + 1}`,
    });
    setSteps([...form.steps, newStep]);
  };

  const updateStep = (idx: number, updated: FlowStep) => {
    const next = [...form.steps];
    next[idx] = updated;
    setSteps(next);
  };

  const deleteStep = (idx: number) => {
    setSteps(form.steps.filter((_, i) => i !== idx));
  };

  const moveStep = (idx: number, dir: "up" | "down") => {
    const next = [...form.steps];
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSteps(next);
  };

  const validate = () => {
    if (!form.name.trim())       { toast.error("El nombre es obligatorio"); return false; }
    if (form.steps.length === 0) { toast.error("El flujo debe tener al menos un paso"); return false; }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form);
  };

  const tm = FLOW_TYPE_META[form.type];
  const TypeIcon = tm.icon;

  const totalSLA = form.steps.reduce((s, st) => s + st.slaHours, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg ${tm.bg} flex items-center justify-center`}>
              <TypeIcon className={`w-3.5 h-3.5 ${tm.text}`} strokeWidth={1.5} />
            </div>
            <h2 className="text-sm text-gray-900">
              {isEdit ? "Editar flujo" : "Nuevo flujo de trabajo"}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {([
            { id: "config",     label: `Configuración` },
            { id: "steps",      label: `Pasos (${form.steps.length})` },
            { id: "automation", label: "Automatizaciones" },
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

        {/* Live summary strip */}
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full ${tm.bg} ${tm.text}`}>
            <TypeIcon className="w-3 h-3" strokeWidth={1.5} />
            {tm.label}
          </span>
          <p className="text-xs text-gray-700 truncate flex-1">{form.name || "Nombre del flujo"}</p>
          <span className="text-[10px] text-gray-400 flex items-center gap-1 flex-shrink-0">
            <Layers className="w-3 h-3" strokeWidth={1.5} />{form.steps.length} pasos
          </span>
          {totalSLA > 0 && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" strokeWidth={1.5} />SLA total: {totalSLA}h
            </span>
          )}
          <span className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${form.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {form.active ? "Activo" : "Inactivo"}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── CONFIG ── */}
          {tab === "config" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Nombre del flujo *</label>
                  <input className={inp} placeholder="Ej: Entrega estándar, Express 24h…" value={form.name} onChange={e => set("name", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Descripción interna</label>
                  <input className={inp} placeholder="Cuándo se usa este flujo…" value={form.description} onChange={e => set("description", e.target.value)} />
                </div>
              </div>

              <div>
                <label className={lbl}>Tipo de flujo *</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(Object.entries(FLOW_TYPE_META) as [FlowType, typeof FLOW_TYPE_META[FlowType]][]).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set("type", key)}
                        className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all ${form.type === key ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center`}>
                          <Icon className={`w-3.5 h-3.5 ${meta.text}`} strokeWidth={1.5} />
                        </div>
                        <p className="text-[10px] text-gray-700 leading-tight">{meta.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Templates */}
              {form.steps.length === 0 && (
                <div className="border border-dashed border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-3 text-center">Empieza desde una plantilla o crea los pasos manualmente en la pestaña "Pasos"</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(Object.entries(FLOW_TYPE_META) as [FlowType, any][]).filter(([k]) => k !== "custom").map(([key, meta]) => {
                      const Icon = meta.icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => applyTemplate(key)}
                          className={`flex items-center gap-1.5 h-7 px-3 text-xs border rounded-lg transition-colors ${meta.bg} ${meta.text} border-transparent hover:opacity-80`}
                        >
                          <Icon className="w-3 h-3" strokeWidth={1.5} />
                          Plantilla {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-100" />

              {/* Shipping methods */}
              <div>
                <label className={lbl}>Métodos de envío que usan este flujo</label>
                <div className="space-y-1.5">
                  {SHIPPING_METHODS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMethod(m.id)}
                      className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl border text-left transition-all ${form.shippingMethods.includes(m.id) ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${form.shippingMethods.includes(m.id) ? "bg-gray-900 border-gray-900" : "border-gray-300"}`}>
                        {form.shippingMethods.includes(m.id) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </div>
                      <p className="text-xs text-gray-700">{m.label}</p>
                    </button>
                  ))}
                </div>
                {form.shippingMethods.length === 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">Sin asignar — se usará como flujo manual o genérico.</p>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => set("active", !form.active)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors ${form.active ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                  <div className={`relative rounded-full flex-shrink-0 ${form.active ? "bg-green-400" : "bg-gray-200"}`} style={{ width: 28, height: 16 }}>
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${form.active ? "left-[calc(100%-14px)]" : "left-0.5"}`} />
                  </div>
                  <p className={`text-xs ${form.active ? "text-green-800" : "text-gray-500"}`}>{form.active ? "Flujo activo" : "Flujo inactivo"}</p>
                </button>
                <button type="button" onClick={() => set("isDefault", !form.isDefault)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors ${form.isDefault ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                  <div className={`relative rounded-full flex-shrink-0 ${form.isDefault ? "bg-blue-400" : "bg-gray-200"}`} style={{ width: 28, height: 16 }}>
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${form.isDefault ? "left-[calc(100%-14px)]" : "left-0.5"}`} />
                  </div>
                  <p className={`text-xs ${form.isDefault ? "text-blue-800" : "text-gray-500"}`}>{form.isDefault ? "Flujo por defecto" : "No predeterminado"}</p>
                </button>
              </div>
            </>
          )}

          {/* ── STEPS ── */}
          {tab === "steps" && (
            <div className="space-y-2">
              {form.steps.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-gray-200" strokeWidth={1} />
                  <p className="text-xs text-gray-400 mb-3">Sin pasos definidos</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {(Object.entries(FLOW_TYPE_META) as [FlowType, any][]).filter(([k]) => k !== "custom").map(([key, meta]) => {
                      const Icon = meta.icon;
                      return (
                        <button key={key} type="button" onClick={() => applyTemplate(key)}
                          className={`flex items-center gap-1.5 h-7 px-3 text-xs border rounded-lg ${meta.bg} ${meta.text} border-transparent hover:opacity-80 transition-opacity`}>
                          <Icon className="w-3 h-3" strokeWidth={1.5} />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  {/* Visual pipeline */}
                  <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
                    {form.steps.map((s, idx) => {
                      const Icon = getStepIcon(s.icon);
                      return (
                        <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                          <div className="flex flex-col items-center gap-0.5">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: s.color + "22" }}
                            >
                              <Icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={1.5} />
                            </div>
                            <p className="text-[9px] text-gray-400 text-center max-w-12 leading-tight truncate">{s.name}</p>
                          </div>
                          {idx < form.steps.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0 mb-3" strokeWidth={1.5} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {form.steps.map((step, idx) => (
                    <StepEditor
                      key={step.id}
                      step={step}
                      isFirst={idx === 0}
                      isLast={idx === form.steps.length - 1}
                      onChange={updated => updateStep(idx, updated)}
                      onDelete={() => deleteStep(idx)}
                      onMoveUp={() => moveStep(idx, "up")}
                      onMoveDown={() => moveStep(idx, "down")}
                    />
                  ))}
                </>
              )}

              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-2 w-full h-9 px-3 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-gray-500 hover:text-gray-700 transition-colors justify-center mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir paso
              </button>
            </div>
          )}

          {/* ── AUTOMATION ── */}
          {tab === "automation" && (
            <>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[11px] text-blue-700">
                  Las automatizaciones globales del flujo se aplican a todos los pasos. Las configuraciones por paso se gestionan desde la pestaña Pasos.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { label: "Notificar por email al cliente al cambiar de paso", icon: Mail, desc: "Usa las plantillas de email configuradas en Emails → Pedido enviado, Pedido entregado…" },
                  { label: "Alertar al equipo si se supera el SLA del paso",    icon: Bell, desc: "Envía una notificación interna al responsable del paso cuando vence el SLA" },
                  { label: "Crear tarea automática al entrar en cada paso",     icon: ClipboardCheck, desc: "Genera una tarea en el panel para el equipo operativo" },
                  { label: "Solicitar foto en cada transición manual",          icon: Camera, desc: "El operario debe adjuntar una foto al avanzar manualmente el pedido" },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3 px-3 py-3 border border-gray-200 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900">{item.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toast.info("Configuración guardada")}
                      className="w-8 h-5 bg-gray-200 rounded-full flex-shrink-0 relative transition-colors hover:bg-gray-300"
                    >
                      <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gray-100" />

              {/* SLA summary */}
              {form.steps.length > 0 && (
                <div>
                  <label className={lbl}>Resumen de SLAs</label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {form.steps.map((step, idx) => {
                      const Icon = getStepIcon(step.icon);
                      return (
                        <div key={step.id} className={`flex items-center gap-3 px-3 py-2.5 ${idx !== form.steps.length - 1 ? "border-b border-gray-50" : ""}`}>
                          <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: step.color + "22" }}>
                            <Icon className="w-3 h-3" style={{ color: step.color }} strokeWidth={1.5} />
                          </div>
                          <p className="text-xs text-gray-700 flex-1 truncate">{step.name}</p>
                          <span className={`text-[10px] px-1.5 py-px rounded ${TRIGGER_META[step.triggerType].color}`}>{TRIGGER_META[step.triggerType].label}</span>
                          <span className="text-[10px] text-gray-500 flex-shrink-0 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" strokeWidth={1.5} />
                            {step.slaHours > 0 ? `${step.slaHours}h` : "—"}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100">
                      <p className="text-[11px] text-gray-500">SLA total estimado</p>
                      <p className="text-xs text-gray-900">{totalSLA}h ({Math.ceil(totalSLA / 24)} día{Math.ceil(totalSLA / 24) !== 1 ? "s" : ""})</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex gap-1">
            {["config", "steps", "automation"].map(t => (
              <button key={t} onClick={() => setTab(t as any)}
                className={`w-2 h-2 rounded-full transition-colors ${tab === t ? "bg-gray-900" : "bg-gray-200"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-7 px-4 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="flex items-center gap-1.5 h-7 px-4 text-xs text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
              <Check className="w-3.5 h-3.5" />
              {isEdit ? "Guardar cambios" : "Crear flujo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flow Card
// ─────────────────────────────────────────────────────────────────────────────
function FlowCard({ flow, onEdit, onDelete, onToggle }: {
  flow: DeliveryFlow;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const tm = FLOW_TYPE_META[flow.type];
  const TypeIcon = tm.icon;
  const totalSLA = flow.steps.reduce((s, st) => s + st.slaHours, 0);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl ${tm.bg} flex items-center justify-center flex-shrink-0`}>
          <TypeIcon className={`w-4.5 h-4.5 ${tm.text}`} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-gray-900">{flow.name}</p>
            {flow.isDefault && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-px rounded-full">Por defecto</span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 truncate mt-0.5">{flow.description}</p>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${flow.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${flow.active ? "bg-green-400" : "bg-gray-300"}`} />
          {flow.active ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Mini pipeline */}
      <div className="flex items-center gap-1 mb-3 overflow-hidden">
        {flow.steps.slice(0, 7).map((step, idx) => {
          const Icon = getStepIcon(step.icon);
          return (
            <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
              <div
                title={step.name}
                className="w-5 h-5 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: step.color + "22" }}
              >
                <Icon className="w-2.5 h-2.5" style={{ color: step.color }} strokeWidth={1.5} />
              </div>
              {idx < Math.min(flow.steps.length - 1, 6) && (
                <ArrowRight className="w-2 h-2 text-gray-200 flex-shrink-0" strokeWidth={1.5} />
              )}
            </div>
          );
        })}
        {flow.steps.length > 7 && <span className="text-[10px] text-gray-400 ml-1">+{flow.steps.length - 7}</span>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
          <p className="text-[10px] text-gray-400">Pasos</p>
          <p className="text-xs text-gray-900">{flow.steps.length}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
          <p className="text-[10px] text-gray-400">SLA total</p>
          <p className="text-xs text-gray-900">{totalSLA > 0 ? `${totalSLA}h` : "—"}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
          <p className="text-[10px] text-gray-400">Pedidos</p>
          <p className="text-xs text-gray-900">{flow.ordersCount.toLocaleString()}</p>
        </div>
      </div>

      {/* Shipping methods */}
      {flow.shippingMethods.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {flow.shippingMethods.map(m => (
            <span key={m} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {SHIPPING_METHODS.find(s => s.id === m)?.label ?? m}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 text-[11px] transition-colors ${flow.active ? "text-amber-500 hover:text-amber-700" : "text-green-500 hover:text-green-700"}`}
        >
          {flow.active ? "Pausar" : "Activar"}
        </button>
        <div className="flex gap-1">
          <button onClick={onEdit} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Pencil className="w-3 h-3" /></button>
          <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export function AdminFlows() {
  const [flows, setFlows]       = useState<DeliveryFlow[]>(initFlows);
  const [filterType, setFilterType] = useState<FlowType | "all">("all");
  const [searchQ, setSearchQ]   = useState("");
  const [panelData, setPanelData] = useState<
    | { mode: "new";  data: Omit<DeliveryFlow, "id" | "createdAt" | "ordersCount"> }
    | { mode: "edit"; data: DeliveryFlow }
    | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const visible = useMemo(() => {
    let r = [...flows];
    if (filterType !== "all") r = r.filter(f => f.type === filterType);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      r = r.filter(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
    }
    return r;
  }, [flows, filterType, searchQ]);

  /* ── CRUD ─────────────────────────────────────────── */
  const handleSave = (data: Omit<DeliveryFlow, "id" | "createdAt" | "ordersCount"> & { id?: string }) => {
    if (data.id) {
      setFlows(prev => prev.map(f => f.id === data.id ? { ...f, ...data } as DeliveryFlow : f));
      toast.success("Flujo actualizado");
    } else {
      setFlows(prev => [...prev, { ...data, id: `f-${Date.now()}`, createdAt: "13/03/2026", ordersCount: 0 }]);
      toast.success("Flujo creado");
    }
    setPanelData(null);
  };

  const handleToggle = (id: string) => {
    setFlows(prev => prev.map(f => {
      if (f.id !== id) return f;
      const next = !f.active;
      toast.success(`Flujo ${next ? "activado" : "pausado"}`);
      return { ...f, active: next };
    }));
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setFlows(prev => prev.filter(f => f.id !== deleteTarget.id));
    toast.success("Flujo eliminado");
    setDeleteTarget(null);
  };

  const totalOrders = flows.reduce((s, f) => s + f.ordersCount, 0);
  const activeCount = flows.filter(f => f.active).length;
  const totalSteps  = flows.reduce((s, f) => s + f.steps.length, 0);

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Flujos de trabajo</h1>
          <p className="text-xs text-gray-400 mt-0.5">Define los procesos de entrega, devolución y logística para cada tipo de envío</p>
        </div>
        <button
          onClick={() => setPanelData({ mode: "new", data: { ...emptyFlow } })}
          className="flex items-center gap-2 h-8 px-4 text-xs text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo flujo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Flujos",           value: flows.length,                icon: Activity },
          { label: "Activos",          value: activeCount,                 icon: Zap      },
          { label: "Pasos totales",    value: totalSteps,                  icon: Layers   },
          { label: "Pedidos procesados", value: totalOrders.toLocaleString(), icon: Truck },
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
          {(["all", "delivery", "return", "exchange", "quality", "custom"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`h-7 px-3 text-xs rounded-lg transition-colors ${filterType === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "all" ? "Todos" : FLOW_TYPE_META[t].label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
          <input
            className="w-full h-9 pl-7 pr-3 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
            placeholder="Buscar flujos…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl py-16 text-center">
          <Activity className="w-10 h-10 mx-auto mb-3 text-gray-200" strokeWidth={1} />
          <p className="text-sm text-gray-500 mb-1">No hay flujos</p>
          <p className="text-xs text-gray-400 mb-4">Crea un flujo para gestionar el proceso de entrega de tus pedidos</p>
          <button onClick={() => setPanelData({ mode: "new", data: { ...emptyFlow } })}
            className="flex items-center gap-2 h-8 px-4 text-xs text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors mx-auto">
            <Plus className="w-3.5 h-3.5" /> Nuevo flujo
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map(f => (
            <FlowCard
              key={f.id}
              flow={f}
              onEdit={() => setPanelData({ mode: "edit", data: f })}
              onToggle={() => handleToggle(f.id)}
              onDelete={() => setDeleteTarget({ id: f.id, name: f.name })}
            />
          ))}
          <button
            onClick={() => setPanelData({ mode: "new", data: { ...emptyFlow } })}
            className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors min-h-40"
          >
            <Plus className="w-5 h-5" strokeWidth={1.5} />
            <p className="text-xs">Nuevo flujo</p>
          </button>
        </div>
      )}

      {/* Panels */}
      {panelData && (
        <FlowPanel
          initial={panelData.mode === "edit" ? panelData.data : panelData.data}
          onSave={handleSave}
          onClose={() => setPanelData(null)}
        />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm text-gray-900 text-center mb-1">¿Eliminar "{deleteTarget.name}"?</h3>
            <p className="text-xs text-gray-400 text-center mb-5">Los pedidos en curso que usen este flujo no se verán afectados.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-8 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDeleteConfirm} className="flex-1 h-8 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}