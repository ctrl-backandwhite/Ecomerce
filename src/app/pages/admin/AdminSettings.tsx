import { useState } from "react";
import {
  Store, Bell, Shield, CreditCard, Globe, Truck,
  Save, Check, ChevronRight, Mail, Phone, MapPin,
  Instagram, Facebook, Twitter, ToggleLeft, ToggleRight,
  Percent, DollarSign, Clock, Package,
} from "lucide-react";
import { toast } from "sonner";

type SettingsTab = "general" | "notifications" | "payments" | "shipping" | "security";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "general",       label: "General",        icon: Store    },
  { id: "notifications", label: "Notificaciones", icon: Bell     },
  { id: "payments",      label: "Pagos",          icon: CreditCard },
  { id: "shipping",      label: "Envíos",         icon: Truck    },
  { id: "security",      label: "Seguridad",      icon: Shield   },
];

const field = "w-full text-xs text-gray-900 border border-gray-200 rounded-xl px-2.5 py-1 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white";
const label = "block text-xs text-gray-400 mb-1.5";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-900 uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange, label: lbl }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{lbl}</span>
      <button onClick={() => onChange(!value)} className="flex-shrink-0">
        {value
          ? <ToggleRight className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
          : <ToggleLeft  className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
        }
      </button>
    </div>
  );
}

/* ── Tab: General ──────────────────────────────────────── */
function GeneralTab() {
  const [form, setForm] = useState({
    storeName: "NEXA",
    storeEmail: "hola@nexastore.com",
    phone: "+1 (800) 555-NEXA",
    address: "350 Fifth Avenue, New York, NY 10118",
    website: "https://nexastore.com",
    instagram: "@nexastore",
    facebook: "nexastore",
    twitter: "@nexastore",
    description: "La plataforma de e-commerce más completa para compradores y vendedores.",
    currency: "USD",
    language: "es",
    timezone: "America/New_York",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handleSave() {
    toast.success("Configuración general guardada");
  }

  return (
    <div className="space-y-5">
      <Section title="Información de la tienda">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Nombre de la plataforma</label>
            <input value={form.storeName} onChange={(e) => set("storeName", e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Email de contacto</label>
            <input value={form.storeEmail} onChange={(e) => set("storeEmail", e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Teléfono</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Sitio web</label>
            <input value={form.website} onChange={(e) => set("website", e.target.value)} className={field} />
          </div>
        </div>
        <div>
          <label className={label}>Dirección</label>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Descripción</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`${field} h-16 resize-none`} />
        </div>
      </Section>

      <Section title="Redes sociales">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Instagram, key: "instagram" as const, placeholder: "@nexastore" },
            { icon: Facebook,  key: "facebook"  as const, placeholder: "nexastore" },
            { icon: Twitter,   key: "twitter"   as const, placeholder: "@nexastore" },
          ].map(({ icon: Icon, key, placeholder }) => (
            <div key={key}>
              <label className={label}>
                <Icon className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <input value={(form as any)[key]} onChange={(e) => set(key, e.target.value)} className={field} placeholder={placeholder} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Regionalización">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Moneda</label>
            <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={field}>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="MXN">MXN — Peso mexicano</option>
              <option value="ARS">ARS — Peso argentino</option>
            </select>
          </div>
          <div>
            <label className={label}>Idioma</label>
            <select value={form.language} onChange={(e) => set("language", e.target.value)} className={field}>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
          <div>
            <label className={label}>Zona horaria</label>
            <select value={form.timezone} onChange={(e) => set("timezone", e.target.value)} className={field}>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Mexico_City">America/Mexico_City</option>
              <option value="Europe/Madrid">Europe/Madrid</option>
              <option value="America/Buenos_Aires">America/Buenos_Aires</option>
            </select>
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={handleSave} className="inline-flex items-center gap-2 text-xs text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors">
          <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

/* ── Tab: Notifications ──────────────────────────────── */
function NotificationsTab() {
  const [settings, setSettings] = useState({
    newOrder:       true,
    lowStock:       true,
    newSeller:      true,
    orderShipped:   true,
    paymentFailed:  true,
    customerSignup: false,
    reviewPosted:   false,
    weeklyReport:   true,
    monthlyReport:  true,
    adminAlerts:    true,
  });

  const toggle = (k: keyof typeof settings) => setSettings((s) => ({ ...s, [k]: !s[k] }));

  const groups = [
    {
      title: "Órdenes",
      items: [
        { key: "newOrder"      as const, label: "Nueva orden recibida" },
        { key: "orderShipped"  as const, label: "Orden enviada" },
        { key: "paymentFailed" as const, label: "Pago fallido" },
      ],
    },
    {
      title: "Inventario",
      items: [
        { key: "lowStock" as const, label: "Stock bajo (<10 unidades)" },
      ],
    },
    {
      title: "Usuarios",
      items: [
        { key: "newSeller"      as const, label: "Nueva solicitud de tienda" },
        { key: "customerSignup" as const, label: "Nuevo cliente registrado" },
        { key: "reviewPosted"   as const, label: "Nueva reseña publicada" },
      ],
    },
    {
      title: "Reportes",
      items: [
        { key: "weeklyReport"  as const, label: "Reporte semanal" },
        { key: "monthlyReport" as const, label: "Reporte mensual" },
        { key: "adminAlerts"   as const, label: "Alertas del sistema" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <Section key={g.title} title={g.title}>
          {g.items.map(({ key, label: lbl }) => (
            <Toggle key={key} value={settings[key]} onChange={() => toggle(key)} label={lbl} />
          ))}
        </Section>
      ))}
      <div className="flex justify-end">
        <button onClick={() => toast.success("Preferencias de notificaciones guardadas")} className="inline-flex items-center gap-2 text-xs text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors">
          <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
          Guardar
        </button>
      </div>
    </div>
  );
}

/* ── Tab: Payments ───────────────────────────────────── */
function PaymentsTab() {
  const [settings, setSettings] = useState({
    cards:        true,
    paypal:       true,
    usdt:         true,
    bitcoin:      false,
    commission:   "8",
    minPayout:    "50",
    payoutCycle:  "weekly",
    taxRate:      "10",
  });

  const set = (k: keyof typeof settings, v: any) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-5">
      <Section title="Métodos de pago aceptados">
        {[
          { key: "cards"   as const, label: "Tarjetas (Visa / Mastercard)" },
          { key: "paypal"  as const, label: "PayPal" },
          { key: "usdt"    as const, label: "USDT (Tether)" },
          { key: "bitcoin" as const, label: "Bitcoin (BTC)" },
        ].map(({ key, label: lbl }) => (
          <Toggle key={key} value={settings[key] as boolean} onChange={() => set(key, !settings[key])} label={lbl} />
        ))}
      </Section>

      <Section title="Comisiones y liquidaciones">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>
              <Percent className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
              Comisión de plataforma (%)
            </label>
            <input type="number" value={settings.commission} onChange={(e) => set("commission", e.target.value)} className={field} min={0} max={100} step={0.5} />
          </div>
          <div>
            <label className={label}>
              <DollarSign className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
              Mínimo de liquidación (USD)
            </label>
            <input type="number" value={settings.minPayout} onChange={(e) => set("minPayout", e.target.value)} className={field} min={0} />
          </div>
          <div>
            <label className={label}>
              <Clock className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
              Ciclo de liquidación
            </label>
            <select value={settings.payoutCycle} onChange={(e) => set("payoutCycle", e.target.value)} className={field}>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quincenal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>
          <div>
            <label className={label}>
              <Percent className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
              Tasa de impuesto (%)
            </label>
            <input type="number" value={settings.taxRate} onChange={(e) => set("taxRate", e.target.value)} className={field} min={0} max={100} step={0.5} />
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={() => toast.success("Configuración de pagos guardada")} className="inline-flex items-center gap-2 text-xs text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors">
          <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
          Guardar
        </button>
      </div>
    </div>
  );
}

/* ── Tab: Shipping ───────────────────────────────────── */
function ShippingTab() {
  const [settings, setSettings] = useState({
    freeShippingThreshold: "100",
    baseShippingRate:      "15",
    expressRate:           "30",
    internationalRate:     "45",
    processingDays:        "1-2",
    estimatedDelivery:     "3-5",
    freeShippingEnabled:   true,
    expressEnabled:        true,
    internationalEnabled:  false,
    trackingEnabled:       true,
  });

  const set = (k: keyof typeof settings, v: any) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-5">
      <Section title="Opciones de envío">
        {[
          { key: "freeShippingEnabled"  as const, label: "Envío gratuito (por umbral)" },
          { key: "expressEnabled"       as const, label: "Envío exprés" },
          { key: "internationalEnabled" as const, label: "Envío internacional" },
          { key: "trackingEnabled"      as const, label: "Seguimiento de envíos" },
        ].map(({ key, label: lbl }) => (
          <Toggle key={key} value={settings[key] as boolean} onChange={() => set(key, !settings[key])} label={lbl} />
        ))}
      </Section>

      <Section title="Tarifas y tiempos">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Umbral envío gratis (USD)</label>
            <input type="number" value={settings.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", e.target.value)} className={field} min={0} />
          </div>
          <div>
            <label className={label}>Tarifa base de envío (USD)</label>
            <input type="number" value={settings.baseShippingRate} onChange={(e) => set("baseShippingRate", e.target.value)} className={field} min={0} />
          </div>
          <div>
            <label className={label}>Tarifa exprés (USD)</label>
            <input type="number" value={settings.expressRate} onChange={(e) => set("expressRate", e.target.value)} className={field} min={0} />
          </div>
          <div>
            <label className={label}>Tarifa internacional (USD)</label>
            <input type="number" value={settings.internationalRate} onChange={(e) => set("internationalRate", e.target.value)} className={field} min={0} />
          </div>
          <div>
            <label className={label}>Días de procesamiento</label>
            <input value={settings.processingDays} onChange={(e) => set("processingDays", e.target.value)} className={field} placeholder="1-2" />
          </div>
          <div>
            <label className={label}>Entrega estimada (días)</label>
            <input value={settings.estimatedDelivery} onChange={(e) => set("estimatedDelivery", e.target.value)} className={field} placeholder="3-5" />
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={() => toast.success("Configuración de envíos guardada")} className="inline-flex items-center gap-2 text-xs text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors">
          <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
          Guardar
        </button>
      </div>
    </div>
  );
}

/* ── Tab: Security ───────────────────────────────────── */
function SecurityTab() {
  const [settings, setSettings] = useState({
    twoFactor:          false,
    sessionTimeout:     "30",
    ipWhitelist:        false,
    auditLog:           true,
    requireStrongPwd:   true,
    autoLockout:        true,
    lockoutAttempts:    "5",
    dataRetentionDays:  "365",
  });

  const set = (k: keyof typeof settings, v: any) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-5">
      <Section title="Autenticación">
        {[
          { key: "twoFactor"        as const, label: "Autenticación de dos factores (2FA)" },
          { key: "requireStrongPwd" as const, label: "Requerir contraseña fuerte" },
          { key: "autoLockout"      as const, label: "Bloqueo automático por intentos fallidos" },
          { key: "ipWhitelist"      as const, label: "Whitelist de IPs permitidas" },
        ].map(({ key, label: lbl }) => (
          <Toggle key={key} value={settings[key] as boolean} onChange={() => set(key, !settings[key])} label={lbl} />
        ))}
      </Section>

      <Section title="Sesión y retención">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Timeout de sesión (min)</label>
            <input type="number" value={settings.sessionTimeout} onChange={(e) => set("sessionTimeout", e.target.value)} className={field} min={5} />
          </div>
          <div>
            <label className={label}>Intentos antes de bloqueo</label>
            <input type="number" value={settings.lockoutAttempts} onChange={(e) => set("lockoutAttempts", e.target.value)} className={field} min={1} max={10} />
          </div>
          <div>
            <label className={label}>Retención de datos (días)</label>
            <input type="number" value={settings.dataRetentionDays} onChange={(e) => set("dataRetentionDays", e.target.value)} className={field} min={30} />
          </div>
        </div>
      </Section>

      <Section title="Auditoría">
        <Toggle value={settings.auditLog} onChange={() => set("auditLog", !settings.auditLog)} label="Registro de auditoría (audit log)" />
        <div className="pt-2">
          <button
            onClick={() => toast.success("Descarga del audit log iniciada")}
            className="text-xs text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Descargar audit log
          </button>
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={() => toast.success("Configuración de seguridad guardada")} className="inline-flex items-center gap-2 text-xs text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors">
          <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
          Guardar
        </button>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────── */
export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const tabContent: Record<SettingsTab, React.ReactNode> = {
    general:       <GeneralTab />,
    notifications: <NotificationsTab />,
    payments:      <PaymentsTab />,
    shipping:      <ShippingTab />,
    security:      <SecurityTab />,
  };

  return (
    <div className="space-y-5 max-w-[1000px]">
      <div>
        <h1 className="text-xl text-gray-900 tracking-tight">Configuración</h1>
        <p className="text-xs text-gray-400 mt-1">Gestiona la configuración global de la plataforma NEXA</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Tab sidebar */}
        <div className="w-full lg:w-52 flex-shrink-0 bg-white border border-gray-100 rounded-xl overflow-hidden">
          {tabs.map(({ id, label: lbl, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 text-sm text-left border-l-2 transition-colors ${
                activeTab === id
                  ? "border-gray-900 bg-gray-50 text-gray-900"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                {lbl}
              </div>
              {activeTab === id && <ChevronRight className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
}