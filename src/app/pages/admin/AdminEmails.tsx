import { useState, useEffect, useCallback } from "react";
import {
  Mail, Pencil, Send, Eye, Plus, X, Check,
  Trash2, AlertTriangle, ChevronDown, Copy,
  Tag, User, ShoppingBag, RotateCcw, FileText,
  Gift, Star, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import {
  type EmailTemplate as ApiEmailTemplate, type EmailTemplatePayload,
  emailTemplateRepository,
} from "../../repositories/EmailTemplateRepository";

// ── Types ─────────────────────────────────────────────────────────────────────
type EmailCategory = "transactional" | "marketing" | "system";

interface EmailTemplate {
  id: string;
  name: string;
  category: EmailCategory;
  trigger: string;
  subject: string;
  body: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  active: boolean;
  lastSent?: string;
  sentCount: number;
  openRate: number;
}

// ── Catálogos ─────────────────────────────────────────────────────────────────
const TRIGGERS = [
  { group: "Pedidos", items: ["Al confirmar pedido", "Al despachar pedido", "Al marcar como entregado", "Al cancelar pedido"] },
  { group: "Devoluciones", items: ["Al aprobar devolución", "Al rechazar devolución", "Al completar reembolso"] },
  { group: "Facturación", items: ["Al generar factura"] },
  { group: "Usuario", items: ["Al registrarse", "Al solicitar reset de contraseña", "Al cambiar email"] },
  { group: "Marketing", items: ["Al suscribirse al newsletter", "1h después de abandono de carrito", "3 días tras entrega"] },
  { group: "Fidelización", items: ["Al acumular 500 puntos", "Al canjear puntos", "Al recibir gift card"] },
  { group: "Personalizado", items: ["Envío manual / Campaña"] },
];

const VARIABLES: { group: string; icon: React.ElementType; vars: { key: string; label: string }[] }[] = [
  { group: "Cliente", icon: User, vars: [{ key: "{{customer.firstName}}", label: "Nombre" }, { key: "{{customer.lastName}}", label: "Apellido" }, { key: "{{customer.email}}", label: "Email" }] },
  { group: "Pedido", icon: ShoppingBag, vars: [{ key: "{{order.id}}", label: "ID pedido" }, { key: "{{order.total}}", label: "Total" }, { key: "{{order.date}}", label: "Fecha" }, { key: "{{order.trackingCode}}", label: "Tracking" }] },
  { group: "Factura", icon: FileText, vars: [{ key: "{{invoice.id}}", label: "ID factura" }, { key: "{{invoice.total}}", label: "Total" }] },
  { group: "Devolución", icon: RotateCcw, vars: [{ key: "{{return.id}}", label: "ID devolución" }, { key: "{{return.amount}}", label: "Importe" }] },
  { group: "Cupón", icon: Tag, vars: [{ key: "{{coupon.code}}", label: "Código" }, { key: "{{coupon.discount}}", label: "Descuento" }] },
  { group: "Puntos", icon: Star, vars: [{ key: "{{loyalty.points}}", label: "Puntos" }, { key: "{{loyalty.reward}}", label: "Premio" }] },
  { group: "Gift Card", icon: Gift, vars: [{ key: "{{giftcard.code}}", label: "Código" }, { key: "{{giftcard.balance}}", label: "Saldo" }] },
  { group: "Tienda", icon: Zap, vars: [{ key: "{{store.name}}", label: "Nombre tienda" }, { key: "{{store.url}}", label: "URL tienda" }] },
];

const CATEGORY_META: Record<EmailCategory, { label: string; bg: string; text: string }> = {
  transactional: { label: "Transaccional", bg: "bg-blue-50", text: "text-blue-700" },
  marketing: { label: "Marketing", bg: "bg-violet-50", text: "text-violet-700" },
  system: { label: "Sistema", bg: "bg-gray-100", text: "text-gray-600" },
};

// ── Mock body ─────────────────────────────────────────────────────────────────
const DEFAULT_BODY = [
  "Hola {{customer.firstName}},",
  "",
  "Tu pedido {{order.id}} ha sido confirmado correctamente.",
  "",
  "Resumen del pedido:",
  "{{#each order.items}}",
  "  - {{item.name}} x {{item.quantity}} — {{item.total}}",
  "{{/each}}",
  "",
  "Total: {{order.total}}",
  "",
  "Recibirás otro email cuando tu pedido sea despachado.",
  "",
  "Gracias por confiar en NX036.",
  "",
  "— El equipo de NX036",
].join("\n");

// ── Initial data ──────────────────────────────────────────────────────────────
// Removed: data is now loaded from the API.

function mapApiToUi(t: ApiEmailTemplate): EmailTemplate {
  return {
    id: t.id,
    name: t.name,
    category: "transactional",
    trigger: t.name,
    subject: t.subject,
    body: t.htmlBody,
    fromName: "NX036",
    fromEmail: "no-reply@nx036.com",
    replyTo: "",
    active: true,
    sentCount: 0,
    openRate: 0,
  };
}

function uiToPayload(t: EmailTemplate): EmailTemplatePayload {
  return {
    name: t.name,
    subject: t.subject,
    htmlBody: t.body,
    variables: [],
  };
}

const emptyTemplate: Omit<EmailTemplate, "id" | "lastSent" | "sentCount" | "openRate"> = {
  name: "", category: "transactional", trigger: "", subject: "",
  body: "Hola {{customer.firstName}},\n\n\n\n— El equipo de NX036",
  fromName: "NX036", fromEmail: "pedidos@nx036.com", replyTo: "", active: true,
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const inp = "w-full h-7 px-2.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300";
const lbl = "block text-[11px] text-gray-500 mb-1";

// ─────────────────────────────────────────────────────────────────────────────
// Variable picker component (shared by new & edit panels)
// ─────────────────────────────────────────────────────────────────────────────
function VariablePicker({ onInsert }: { onInsert: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-6 px-2.5 text-[11px] border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        <Tag className="w-3 h-3" /> Insertar variable
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-8 z-20 w-80 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <p className="px-3 py-2 text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
            Variables disponibles
          </p>
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {VARIABLES.map(group => (
              <div key={group.group}>
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <group.icon className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                  <p className="text-[10px] text-gray-400">{group.group}</p>
                </div>
                <div className="flex flex-wrap gap-1 px-2 pb-1.5">
                  {group.vars.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => { onInsert(v.key); setOpen(false); }}
                      className="h-6 px-2 text-[11px] bg-gray-100 hover:bg-gray-200 hover:text-gray-800 text-gray-600 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] text-gray-400">También puedes escribir la variable directamente en el texto.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Template Panel (slide-in from right)
// ─────────────────────────────────────────────────────────────────────────────
interface NewTemplatePanelProps {
  onSave: (t: Omit<EmailTemplate, "id" | "lastSent" | "sentCount" | "openRate">) => void;
  onClose: () => void;
}

function NewTemplatePanel({ onSave, onClose }: NewTemplatePanelProps) {
  const [form, setForm] = useState({ ...emptyTemplate });
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "sender" | "settings">("content");

  const set = (field: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Insert variable into subject or body
  const insertIntoSubject = (v: string) => set("subject", form.subject + v);
  const insertIntoBody = (v: string) => set("body", form.body + v);

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!form.trigger.trim()) { toast.error("Selecciona un trigger"); return; }
    if (!form.subject.trim()) { toast.error("El asunto es obligatorio"); return; }
    if (!form.body.trim()) { toast.error("El cuerpo no puede estar vacío"); return; }
    if (!form.fromEmail.trim()) { toast.error("El email del remitente es obligatorio"); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-500 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm text-gray-900">Nueva plantilla de email</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 px-5 py-2.5 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
          {(["content", "sender", "settings"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`h-7 px-3.5 text-xs rounded-lg transition-colors ${activeTab === t ? "bg-white text-gray-900 shadow-sm border border-gray-100" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "content" ? "Contenido" : t === "sender" ? "Remitente" : "Configuración"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── TAB: Contenido ── */}
          {activeTab === "content" && (
            <>
              {/* Preview badge */}
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div className={`inline-flex text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${CATEGORY_META[form.category].bg} ${CATEGORY_META[form.category].text}`}>
                  {CATEGORY_META[form.category].label}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-900">{form.name || "Nombre de la plantilla"}</p>
                  <p className="text-[11px] text-gray-400 truncate">{form.subject || "Asunto del email…"}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{form.trigger || "Sin trigger"}</p>
                </div>
                <div className={`ml-auto flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${form.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${form.active ? "bg-green-400" : "bg-gray-300"}`} />
                  {form.active ? "Activa" : "Inactiva"}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className={lbl}>Nombre de la plantilla *</label>
                <input
                  className={inp}
                  placeholder="Ej: Confirmación de pedido, Carrito abandonado…"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                />
              </div>

              {/* Trigger */}
              <div className="relative">
                <label className={lbl}>Evento de envío (trigger) *</label>
                <button
                  type="button"
                  onClick={() => setTriggerOpen(o => !o)}
                  className={`${inp} flex items-center justify-between text-left ${form.trigger ? "text-gray-900" : "text-gray-300"}`}
                >
                  <span>{form.trigger || "Seleccionar evento…"}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${triggerOpen ? "rotate-180" : ""}`} />
                </button>
                {triggerOpen && (
                  <div className="absolute left-0 top-[calc(100%+2px)] z-20 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="max-h-52 overflow-y-auto">
                      {TRIGGERS.map(group => (
                        <div key={group.group}>
                          <p className="px-3 pt-2 pb-1 text-[10px] text-gray-400 uppercase tracking-widest">{group.group}</p>
                          {group.items.map(item => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => { set("trigger", item); setTriggerOpen(false); }}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${form.trigger === item ? "text-gray-900 bg-gray-50" : "text-gray-600"}`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Subject */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={lbl.replace("mb-1", "")}>Asunto del email *</label>
                  <VariablePicker onInsert={insertIntoSubject} />
                </div>
                <input
                  className={inp}
                  placeholder="Ej: ✅ Tu pedido {{order.id}} ha sido confirmado — NX036"
                  value={form.subject}
                  onChange={e => set("subject", e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  {form.subject.length} caracteres · Recomendado: 40-60
                </p>
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={lbl.replace("mb-1", "")}>Cuerpo del mensaje *</label>
                  <VariablePicker onInsert={insertIntoBody} />
                </div>
                <textarea
                  rows={14}
                  className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 transition-colors resize-none font-mono leading-relaxed placeholder:text-gray-300"
                  placeholder={"Hola {{customer.firstName}},\n\n[Escribe el cuerpo del email aquí]\n\n— El equipo de NX036"}
                  value={form.body}
                  onChange={e => set("body", e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Usa {"{{variable}}"} para insertar datos dinámicos. Soporta Handlebars: {"{{#each}}"}, {"{{#if}}"}.
                </p>
              </div>
            </>
          )}

          {/* ── TAB: Remitente ── */}
          {activeTab === "sender" && (
            <>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[11px] text-blue-700">
                  Configura quién aparece como remitente. Si lo dejas vacío se usará el remitente predeterminado de la tienda.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Nombre del remitente</label>
                  <input
                    className={inp}
                    placeholder="NX036"
                    value={form.fromName}
                    onChange={e => set("fromName", e.target.value)}
                  />
                </div>
                <div>
                  <label className={lbl}>Email del remitente *</label>
                  <input
                    type="email"
                    className={inp}
                    placeholder="pedidos@nx036.com"
                    value={form.fromEmail}
                    onChange={e => set("fromEmail", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>Reply-to <span className="text-gray-300">(opcional)</span></label>
                <input
                  type="email"
                  className={inp}
                  placeholder="soporte@nx036.com"
                  value={form.replyTo}
                  onChange={e => set("replyTo", e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Si el cliente responde al email, la respuesta irá a esta dirección.
                </p>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="space-y-2">
                <p className={lbl}>Remitentes comunes</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: "Pedidos", from: "pedidos@nx036.com", name: "NX036 Pedidos" },
                    { label: "Soporte", from: "soporte@nx036.com", name: "NX036 Soporte" },
                    { label: "Marketing", from: "hola@nx036.com", name: "NX036 Store" },
                    { label: "Facturación", from: "facturas@nx036.com", name: "NX036 Facturas" },
                    { label: "No-reply", from: "no-reply@nx036.com", name: "NX036" },
                  ].map(s => (
                    <button
                      key={s.from}
                      type="button"
                      onClick={() => { set("fromEmail", s.from); set("fromName", s.name); }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-colors ${form.fromEmail === s.from
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div>
                        <p className="text-xs text-gray-900">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.from}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── TAB: Configuración ── */}
          {activeTab === "settings" && (
            <>
              {/* Category */}
              <div>
                <label className={lbl}>Categoría de la plantilla *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(CATEGORY_META) as [EmailCategory, typeof CATEGORY_META[EmailCategory]][]).map(
                    ([key, meta]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set("category", key)}
                        className={`px-3 py-2.5 rounded-xl border text-center transition-all ${form.category === key
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <span className={`inline-flex text-[11px] px-2 py-0.5 rounded-full ${meta.bg} ${meta.text} mb-1`}>
                          {meta.label}
                        </span>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          {key === "transactional" ? "Responde a acciones del usuario"
                            : key === "marketing" ? "Campañas y automatizaciones"
                              : "Técnicos del sistema"}
                        </p>
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Active toggle */}
              <div>
                <label className={lbl}>Estado</label>
                <button
                  type="button"
                  onClick={() => set("active", !form.active)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-colors text-left ${form.active ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                    }`}
                >
                  <div
                    className={`relative rounded-full flex-shrink-0 transition-colors ${form.active ? "bg-green-400" : "bg-gray-200"}`}
                    style={{ width: 32, height: 18 }}
                  >
                    <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${form.active ? "left-[calc(100%-16px)]" : "left-0.5"}`} />
                  </div>
                  <div>
                    <p className={`text-xs ${form.active ? "text-green-800" : "text-gray-500"}`}>
                      {form.active ? "Plantilla activa" : "Plantilla inactiva"}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {form.active
                        ? "Se enviará automáticamente cuando ocurra el trigger"
                        : "No se enviará hasta que la actives"}
                    </p>
                  </div>
                </button>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Test email */}
              <div>
                <label className={lbl}>Enviar email de prueba</label>
                <div className="flex gap-2">
                  <input
                    className={inp + " flex-1"}
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                  />
                  <button
                    type="button"
                    onClick={() => toast.success("Email de prueba enviado")}
                    className="flex items-center gap-1.5 h-7 px-3 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    <Send className="w-3 h-3 text-gray-500" />
                    Enviar
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Recibirás el email con datos de ejemplo para verificar el diseño.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex gap-1">
            {(["content", "sender", "settings"] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`w-2 h-2 rounded-full transition-colors ${activeTab === t ? "bg-gray-600" : "bg-gray-200"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-7 px-4 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 h-7 px-4 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {isEdit ? "Guardar" : "Crear plantilla"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit / Preview Panel (existing templates)
// ─────────────────────────────────────────────────────────────────────────────
interface EditPanelProps {
  template: EmailTemplate;
  mode: "edit" | "preview";
  onSave: (t: EmailTemplate) => void;
  onClose: () => void;
}

function EditPanel({ template, mode: initMode, onSave, onClose }: EditPanelProps) {
  const [mode, setMode] = useState(initMode);
  const [form, setForm] = useState({ ...template });
  const set = (field: keyof EmailTemplate, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const insertIntoSubject = (v: string) => set("subject", form.subject + v);
  const insertIntoBody = (v: string) => set("body", form.body + v);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <p className="text-sm text-gray-900">{form.name}</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {(["preview", "edit"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`h-6 px-3 text-xs rounded-md transition-colors ${mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {m === "preview" ? "Vista previa" : "Editar"}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {mode === "preview" ? (
            <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
              {/* Email client mock header */}
              <div className="px-4 py-3 border-b border-gray-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-12">De:</span>
                  <span className="text-xs text-gray-700">{form.fromName} &lt;{form.fromEmail}&gt;</span>
                </div>
                {form.replyTo && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-12">Reply-to:</span>
                    <span className="text-xs text-gray-500">{form.replyTo}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-12">Trigger:</span>
                  <span className="text-xs text-gray-500">{form.trigger}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-12">Asunto:</span>
                  <span className="text-sm text-gray-900">{form.subject}</span>
                </div>
              </div>
              <div className="px-5 py-4">
                <pre className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">{form.body}</pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Nombre</label>
                <input className={inp} value={form.name} onChange={e => set("name", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Nombre remitente</label>
                  <input className={inp} value={form.fromName} onChange={e => set("fromName", e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Email remitente</label>
                  <input type="email" className={inp} value={form.fromEmail} onChange={e => set("fromEmail", e.target.value)} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={lbl.replace("mb-1", "")}>Asunto</label>
                  <VariablePicker onInsert={insertIntoSubject} />
                </div>
                <input className={inp} value={form.subject} onChange={e => set("subject", e.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={lbl.replace("mb-1", "")}>Cuerpo</label>
                  <VariablePicker onInsert={insertIntoBody} />
                </div>
                <textarea
                  rows={14}
                  className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 transition-colors resize-none font-mono leading-relaxed"
                  value={form.body}
                  onChange={e => set("body", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <button
            onClick={() => toast.success(`Test enviado para "${form.name}"`)}
            className="flex items-center gap-1.5 h-7 px-3 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
          >
            <Send className="w-3 h-3" /> Enviar test
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-7 px-4 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            {mode === "edit" && (
              <button
                onClick={() => { onSave(form); toast.success("Plantilla guardada"); onClose(); }}
                className="flex items-center gap-1.5 h-7 px-4 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar plantilla
              </button>
            )}
          </div>
        </div>
      </div>
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
        <p className="text-xs text-gray-400 text-center mb-5">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-8 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 h-8 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export function AdminEmails() {
    const { t } = useLanguage();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editTarget, setEditTarget] = useState<{ t: EmailTemplate; mode: "edit" | "preview" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [filterCat, setFilterCat] = useState<EmailCategory | "all">("all");

  const loadTemplates = useCallback(async () => {
    try {
      const data = await emailTemplateRepository.findAll();
      setTemplates(data.map(mapApiToUi));
    } catch {
      toast.error("Error al cargar plantillas");
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const visible = filterCat === "all" ? templates : templates.filter(t => t.category === filterCat);

  /* ── CRUD ────────────────────────────────────────────────── */
  const handleCreate = async (data: Omit<EmailTemplate, "id" | "lastSent" | "sentCount" | "openRate">) => {
    try {
      const created = await emailTemplateRepository.create(uiToPayload(data as EmailTemplate));
      setTemplates(prev => [...prev, mapApiToUi(created)]);
      toast.success("Plantilla creada");
      setShowNew(false);
    } catch {
      toast.error("Error al crear plantilla");
    }
  };

  const handleSave = async (updated: EmailTemplate) => {
    try {
      await emailTemplateRepository.update(updated.id, uiToPayload(updated));
      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch {
      toast.error("Error al guardar plantilla");
    }
  };

  const toggleActive = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
    toast.success("Estado actualizado");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await emailTemplateRepository.delete(deleteTarget.id);
      setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
      toast.success("Plantilla eliminada");
      setDeleteTarget(null);
    } catch {
      toast.error("Error al eliminar plantilla");
    }
  };

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">{t("admin.emails.title")}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gestiona los emails transaccionales y de marketing</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
          title="Nueva plantilla"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Plantillas", value: templates.length },
          { label: "Activas", value: templates.filter(t => t.active).length },
          { label: "Emails enviados", value: templates.reduce((s, t) => s + t.sentCount, 0).toLocaleString() },
          { label: "Tasa apertura media", value: `${Math.round(templates.filter(t => t.sentCount > 0).reduce((s, t) => s + t.openRate, 0) / templates.filter(t => t.sentCount > 0).length)}%` },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-lg text-gray-900 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["all", "transactional", "marketing", "system"] as const).map(c => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`h-7 px-3.5 text-xs rounded-lg transition-colors ${filterCat === c ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {c === "all" ? "Todas" : CATEGORY_META[c].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="hidden lg:grid grid-cols-[2fr_1.5fr_1fr_0.8fr_0.8fr_0.8fr_auto] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
          {["Plantilla", "Asunto", "Trigger", "Enviados", "Apertura", "Estado", ""].map(h => (
            <p key={h} className="text-[10px] text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="py-12 text-center">
            <Mail className="w-8 h-8 mx-auto mb-2 text-gray-200" strokeWidth={1} />
            <p className="text-xs text-gray-400">No hay plantillas en esta categoría.</p>
          </div>
        )}

        {visible.map((t, i) => (
          <div
            key={t.id}
            className={`flex flex-col lg:grid lg:grid-cols-[2fr_1.5fr_1fr_0.8fr_0.8fr_0.8fr_auto] gap-2 lg:gap-3 px-4 py-3.5 items-start lg:items-center hover:bg-gray-50/60 transition-colors ${i !== visible.length - 1 ? "border-b border-gray-50" : ""}`}
          >
            {/* Name + category */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${CATEGORY_META[t.category].bg}`}>
                <Mail className={`w-3.5 h-3.5 ${CATEGORY_META[t.category].text}`} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-900 truncate">{t.name}</p>
                <span className={`inline-flex text-[10px] px-1.5 py-px rounded-full ${CATEGORY_META[t.category].bg} ${CATEGORY_META[t.category].text}`}>
                  {CATEGORY_META[t.category].label}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 truncate">{t.subject}</p>
            <p className="text-xs text-gray-400 truncate">{t.trigger}</p>
            <p className="text-xs text-gray-700">{t.sentCount > 0 ? t.sentCount.toLocaleString() : "—"}</p>

            {/* Open rate bar */}
            <div className="flex items-center gap-1.5">
              {t.sentCount > 0 ? (
                <>
                  <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${t.openRate}%` }} />
                  </div>
                  <span className="text-xs text-gray-600">{t.openRate}%</span>
                </>
              ) : <span className="text-xs text-gray-300">—</span>}
            </div>

            {/* Status */}
            <button
              onClick={() => toggleActive(t.id)}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full w-fit transition-colors ${t.active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${t.active ? "bg-green-400" : "bg-gray-300"}`} />
              {t.active ? "Activo" : "Inactivo"}
            </button>

            {/* Actions */}
            <div className="flex gap-1">
              <button
                onClick={() => setEditTarget({ t, mode: "preview" })}
                className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Vista previa"
              >
                <Eye className="w-3 h-3" />
              </button>
              <button
                onClick={() => setEditTarget({ t, mode: "edit" })}
                className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Editar"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => toast.success(`Test enviado para "${t.name}"`)}
                className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Enviar test"
              >
                <Send className="w-3 h-3" />
              </button>
              <button
                onClick={() => setDeleteTarget({ id: t.id, name: t.name })}
                className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {visible.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50">
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
              <Plus className="w-3 h-3" /> Añadir plantilla
            </button>
          </div>
        )}
      </div>

      {/* Panels & dialogs */}
      {showNew && (
        <NewTemplatePanel
          onSave={handleCreate}
          onClose={() => setShowNew(false)}
        />
      )}

      {editTarget && (
        <EditPanel
          template={editTarget.t}
          mode={editTarget.mode}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
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