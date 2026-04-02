import { useState, useEffect, useCallback } from "react";
import { type Setting, settingRepository } from "../../repositories/CmsRepository";
import {
  Store, Bell, Shield, CreditCard, Globe, Truck,
  Save, Check, ChevronRight, Mail, Phone, MapPin,
  Instagram, Facebook, Twitter, ToggleLeft, ToggleRight,
  Percent, DollarSign, Clock, Package,
} from "lucide-react";
import { toast } from "sonner";

type SettingsTab = "general" | "notifications" | "payments" | "shipping" | "security";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Store },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "payments", label: "Pagos", icon: CreditCard },
  { id: "shipping", label: "Envíos", icon: Truck },
  { id: "security", label: "Seguridad", icon: Shield },
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
          : <ToggleLeft className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
        }
      </button>
    </div>
  );
}

/** Convert Setting[] from API into a plain key→value map (strips the prefix). */
function toMap(settings: Setting[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const s of settings) m[s.key] = s.value;
  return m;
}

function Field(section: string, key: string, value: string): Setting {
  return { key: `${section}.${key}`, value, section, type: "STRING" };
}
function BoolField(section: string, key: string, value: boolean): Setting {
  return { key: `${section}.${key}`, value: value ? "true" : "false", section, type: "BOOLEAN" };
}

/* ── Tab: General ──────────────────────────────────────── */
function GeneralTab() {
  const [form, setForm] = useState({
    storeName: "NX036",
    storeEmail: "hola@nx036.com",
    phone: "+1 (800) 555-NX036",
    address: "350 Fifth Avenue, New York, NY 10118",
    website: "https://nx036.com",
    instagram: "@nx036store",
    facebook: "nx036store",
    twitter: "@nx036store",
    description: "La plataforma de e-commerce más completa para compradores y vendedores.",
    currency: "USD",
    language: "es",
    timezone: "America/New_York",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const loadSettings = useCallback(async () => {
    try {
      const settings = await settingRepository.findBySection("general");
      const m = toMap(settings);
      setForm(f => ({
        storeName: m["general.store.name"] ?? f.storeName,
        storeEmail: m["general.store.email"] ?? f.storeEmail,
        phone: m["general.store.phone"] ?? f.phone,
        address: m["general.store.address"] ?? f.address,
        website: m["general.store.website"] ?? f.website,
        instagram: m["general.store.instagram"] ?? f.instagram,
        facebook: m["general.store.facebook"] ?? f.facebook,
        twitter: m["general.store.twitter"] ?? f.twitter,
        description: m["general.store.description"] ?? f.description,
        currency: m["general.store.currency"] ?? f.currency,
        language: m["general.store.language"] ?? f.language,
        timezone: m["general.store.timezone"] ?? f.timezone,
      }));
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  async function handleSave() {
    try {
      await Promise.all([
        settingRepository.save(Field("general", "store.name", form.storeName)),
        settingRepository.save(Field("general", "store.email", form.storeEmail)),
        settingRepository.save(Field("general", "store.phone", form.phone)),
        settingRepository.save(Field("general", "store.address", form.address)),
        settingRepository.save(Field("general", "store.website", form.website)),
        settingRepository.save(Field("general", "store.instagram", form.instagram)),
        settingRepository.save(Field("general", "store.facebook", form.facebook)),
        settingRepository.save(Field("general", "store.twitter", form.twitter)),
        settingRepository.save(Field("general", "store.description", form.description)),
        settingRepository.save(Field("general", "store.currency", form.currency)),
        settingRepository.save(Field("general", "store.language", form.language)),
        settingRepository.save(Field("general", "store.timezone", form.timezone)),
      ]);
      toast.success("Configuración general guardada");
    } catch {
      toast.error("Error al guardar la configuración");
    }
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
            { icon: Instagram, key: "instagram" as const, placeholder: "@nx036store" },
            { icon: Facebook, key: "facebook" as const, placeholder: "nx036store" },
            { icon: Twitter, key: "twitter" as const, placeholder: "@nx036store" },
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
        <button onClick={handleSave} className="inline-flex items-center gap-2 text-xs text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors">
          <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

/* ── Tab: Notifications ──────────────────────────────── */
function TabNotificaciones() {
  const [settings, setSettings] = useState({
    newOrder: true,
    lowStock: true,
    newSeller: true,
    orderShipped: true,
    paymentFailed: true,
    customerSignup: false,
    reviewPosted: false,
    weeklyReport: true,
    monthlyReport: true,
    adminAlerts: true,
  });

  const toggle = (k: keyof typeof settings) => setSettings((s) => ({ ...s, [k]: !s[k] }));

  const loadSettings = useCallback(async () => {
    try {
      const list = await settingRepository.findBySection("notifications");
      const m = toMap(list);
      setSettings(s => Object.fromEntries(
        Object.keys(s).map(k => [k, m[`notifications.${k}`] !== undefined ? m[`notifications.${k}`] === "true" : s[k as keyof typeof s]])
      ) as typeof settings);
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSaveNotifications = async () => {
    try {
      await Promise.all(
        (Object.keys(settings) as (keyof typeof settings)[]).map(k =>
          settingRepository.save(BoolField("notifications", k, settings[k]))
        )
      );
      toast.success("Preferencias de notificaciones guardadas");
    } catch {
      toast.error("Error al guardar notificaciones");
    }
  };

  const groups = [
    {
      title: "Órdenes",
      items: [
        { key: "newOrder" as const, label: "Nueva orden recibida" },
        { key: "orderShipped" as const, label: "Orden enviada" },
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
        { key: "newSeller" as const, label: "Nueva solicitud de tienda" },
        { key: "customerSignup" as const, label: "Nuevo cliente registrado" },
        { key: "reviewPosted" as const, label: "Nueva reseña publicada" },
      ],
    },
    {
      title: "Reportes",
      items: [
        { key: "weeklyReport" as const, label: "Reporte semanal" },
        { key: "monthlyReport" as const, label: "Reporte mensual" },
        { key: "adminAlerts" as const, label: "Alertas del sistema" },
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
        <button onClick={handleSaveNotifications} className="inline-flex items-center gap-2 text-xs text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors">
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
    cards: true,
    paypal: true,
    usdt: true,
    bitcoin: false,
    commission: "8",
    minPayout: "50",
    payoutCycle: "weekly",
    taxRate: "10",
  });

  const set = (k: keyof typeof settings, v: any) => setSettings((s) => ({ ...s, [k]: v }));

  const loadPayments = useCallback(async () => {
    try {
      const list = await settingRepository.findBySection("payments");
      const m = toMap(list);
      setSettings(s => ({
        cards: m["payments.cards"] !== undefined ? m["payments.cards"] === "true" : s.cards,
        paypal: m["payments.paypal"] !== undefined ? m["payments.paypal"] === "true" : s.paypal,
        usdt: m["payments.usdt"] !== undefined ? m["payments.usdt"] === "true" : s.usdt,
        bitcoin: m["payments.bitcoin"] !== undefined ? m["payments.bitcoin"] === "true" : s.bitcoin,
        commission: m["payments.commission"] ?? s.commission,
        minPayout: m["payments.minPayout"] ?? s.minPayout,
        payoutCycle: m["payments.payoutCycle"] ?? s.payoutCycle,
        taxRate: m["payments.taxRate"] ?? s.taxRate,
      }));
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const handleSavePayments = async () => {
    try {
      await Promise.all([
        settingRepository.save(BoolField("payments", "cards", settings.cards)),
        settingRepository.save(BoolField("payments", "paypal", settings.paypal)),
        settingRepository.save(BoolField("payments", "usdt", settings.usdt)),
        settingRepository.save(BoolField("payments", "bitcoin", settings.bitcoin)),
        settingRepository.save(Field("payments", "commission", settings.commission)),
        settingRepository.save(Field("payments", "minPayout", settings.minPayout)),
        settingRepository.save(Field("payments", "payoutCycle", settings.payoutCycle)),
        settingRepository.save(Field("payments", "taxRate", settings.taxRate)),
      ]);
      toast.success("Configuración de pagos guardada");
    } catch {
      toast.error("Error al guardar pagos");
    }
  };

  return (
    <div className="space-y-5">
      <Section title="Métodos de pago aceptados">
        {[
          { key: "cards" as const, label: "Tarjetas (Visa / Mastercard)" },
          { key: "paypal" as const, label: "PayPal" },
          { key: "usdt" as const, label: "USDT (Tether)" },
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
        <button onClick={handleSavePayments} className="inline-flex items-center gap-2 text-xs text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors">
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
    baseShippingRate: "15",
    expressRate: "30",
    internationalRate: "45",
    processingDays: "1-2",
    estimatedDelivery: "3-5",
    freeShippingEnabled: true,
    expressEnabled: true,
    internationalEnabled: false,
    trackingEnabled: true,
  });

  const set = (k: keyof typeof settings, v: any) => setSettings((s) => ({ ...s, [k]: v }));

  const loadShipping = useCallback(async () => {
    try {
      const list = await settingRepository.findBySection("shipping");
      const m = toMap(list);
      setSettings(s => ({
        freeShippingThreshold: m["shipping.freeShippingThreshold"] ?? s.freeShippingThreshold,
        baseShippingRate: m["shipping.baseShippingRate"] ?? s.baseShippingRate,
        expressRate: m["shipping.expressRate"] ?? s.expressRate,
        internationalRate: m["shipping.internationalRate"] ?? s.internationalRate,
        processingDays: m["shipping.processingDays"] ?? s.processingDays,
        estimatedDelivery: m["shipping.estimatedDelivery"] ?? s.estimatedDelivery,
        freeShippingEnabled: m["shipping.freeShippingEnabled"] !== undefined ? m["shipping.freeShippingEnabled"] === "true" : s.freeShippingEnabled,
        expressEnabled: m["shipping.expressEnabled"] !== undefined ? m["shipping.expressEnabled"] === "true" : s.expressEnabled,
        internationalEnabled: m["shipping.internationalEnabled"] !== undefined ? m["shipping.internationalEnabled"] === "true" : s.internationalEnabled,
        trackingEnabled: m["shipping.trackingEnabled"] !== undefined ? m["shipping.trackingEnabled"] === "true" : s.trackingEnabled,
      }));
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => { loadShipping(); }, [loadShipping]);

  const handleSaveShipping = async () => {
    try {
      await Promise.all([
        settingRepository.save(Field("shipping", "freeShippingThreshold", settings.freeShippingThreshold)),
        settingRepository.save(Field("shipping", "baseShippingRate", settings.baseShippingRate)),
        settingRepository.save(Field("shipping", "expressRate", settings.expressRate)),
        settingRepository.save(Field("shipping", "internationalRate", settings.internationalRate)),
        settingRepository.save(Field("shipping", "processingDays", settings.processingDays)),
        settingRepository.save(Field("shipping", "estimatedDelivery", settings.estimatedDelivery)),
        settingRepository.save(BoolField("shipping", "freeShippingEnabled", settings.freeShippingEnabled)),
        settingRepository.save(BoolField("shipping", "expressEnabled", settings.expressEnabled)),
        settingRepository.save(BoolField("shipping", "internationalEnabled", settings.internationalEnabled)),
        settingRepository.save(BoolField("shipping", "trackingEnabled", settings.trackingEnabled)),
      ]);
      toast.success("Configuración de envíos guardada");
    } catch {
      toast.error("Error al guardar envíos");
    }
  };

  return (
    <div className="space-y-5">
      <Section title="Opciones de envío">
        {[
          { key: "freeShippingEnabled" as const, label: "Envío gratuito (por umbral)" },
          { key: "expressEnabled" as const, label: "Envío exprés" },
          { key: "internationalEnabled" as const, label: "Envío internacional" },
          { key: "trackingEnabled" as const, label: "Seguimiento de envíos" },
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
        <button onClick={handleSaveShipping} className="inline-flex items-center gap-2 text-xs text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors">
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
    twoFactor: false,
    sessionTimeout: "30",
    ipWhitelist: false,
    auditLog: true,
    requireStrongPwd: true,
    autoLockout: true,
    lockoutAttempts: "5",
    dataRetentionDays: "365",
  });

  const set = (k: keyof typeof settings, v: any) => setSettings((s) => ({ ...s, [k]: v }));

  const loadSecurity = useCallback(async () => {
    try {
      const list = await settingRepository.findBySection("security");
      const m = toMap(list);
      setSettings(s => ({
        twoFactor: m["security.twoFactor"] !== undefined ? m["security.twoFactor"] === "true" : s.twoFactor,
        ipWhitelist: m["security.ipWhitelist"] !== undefined ? m["security.ipWhitelist"] === "true" : s.ipWhitelist,
        auditLog: m["security.auditLog"] !== undefined ? m["security.auditLog"] === "true" : s.auditLog,
        requireStrongPwd: m["security.requireStrongPwd"] !== undefined ? m["security.requireStrongPwd"] === "true" : s.requireStrongPwd,
        autoLockout: m["security.autoLockout"] !== undefined ? m["security.autoLockout"] === "true" : s.autoLockout,
        sessionTimeout: m["security.sessionTimeout"] ?? s.sessionTimeout,
        lockoutAttempts: m["security.lockoutAttempts"] ?? s.lockoutAttempts,
        dataRetentionDays: m["security.dataRetentionDays"] ?? s.dataRetentionDays,
      }));
    } catch { /* use defaults */ }
  }, []);

  useEffect(() => { loadSecurity(); }, [loadSecurity]);

  const handleSaveSecurity = async () => {
    try {
      await Promise.all([
        settingRepository.save(BoolField("security", "twoFactor", settings.twoFactor)),
        settingRepository.save(BoolField("security", "ipWhitelist", settings.ipWhitelist)),
        settingRepository.save(BoolField("security", "auditLog", settings.auditLog)),
        settingRepository.save(BoolField("security", "requireStrongPwd", settings.requireStrongPwd)),
        settingRepository.save(BoolField("security", "autoLockout", settings.autoLockout)),
        settingRepository.save(Field("security", "sessionTimeout", settings.sessionTimeout)),
        settingRepository.save(Field("security", "lockoutAttempts", settings.lockoutAttempts)),
        settingRepository.save(Field("security", "dataRetentionDays", settings.dataRetentionDays)),
      ]);
      toast.success("Configuración de seguridad guardada");
    } catch {
      toast.error("Error al guardar seguridad");
    }
  };

  return (
    <div className="space-y-5">
      <Section title="Autenticación">
        {[
          { key: "twoFactor" as const, label: "Autenticación de dos factores (2FA)" },
          { key: "requireStrongPwd" as const, label: "Requerir contraseña fuerte" },
          { key: "autoLockout" as const, label: "Bloqueo automático por intentos fallidos" },
          { key: "ipWhitelist" as const, label: "Whitelist de IPs permitidas" },
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
        <button onClick={handleSaveSecurity} className="inline-flex items-center gap-2 text-xs text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors">
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
    general: <GeneralTab />,
    notifications: <TabNotificaciones />,
    payments: <PaymentsTab />,
    shipping: <ShippingTab />,
    security: <SecurityTab />,
  };

  return (
    <div className="space-y-5 max-w-[1000px]">
      <div>
        <h1 className="text-xl text-gray-900 tracking-tight">Configuración</h1>
        <p className="text-xs text-gray-400 mt-1">Gestiona la configuración global de la plataforma NX036</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Tab sidebar */}
        <div className="w-full lg:w-52 flex-shrink-0 bg-white border border-gray-100 rounded-xl overflow-hidden">
          {tabs.map(({ id, label: lbl, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 text-sm text-left border-l-2 transition-colors ${activeTab === id
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