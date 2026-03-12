import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { Shield, Eye, EyeOff, Bell, Mail, MessageSquare, ShoppingBag, Tag, Check } from "lucide-react";
import { toast } from "sonner";

export function ProfileSeguridad() {
  const { user, updateProfile } = useUser();
  const [notif, setNotif] = useState(user.notifications);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw]   = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState("");

  const togglePwVis = (field: keyof typeof showPw) =>
    setShowPw((p) => ({ ...p, [field]: !p[field] }));

  const handlePwChange = () => {
    if (pwForm.next.length < 8) { setPwError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Las contraseñas no coinciden"); return; }
    setPwError("");
    setPwForm({ current: "", next: "", confirm: "" });
    toast.success("Contraseña actualizada correctamente");
  };

  const handleNotifSave = () => {
    updateProfile({ notifications: notif });
    toast.success("Preferencias de notificación guardadas");
  };

  const PwField = ({
    label, field,
  }: {
    label: string;
    field: keyof typeof pwForm;
  }) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={showPw[field] ? "text" : "password"}
          value={pwForm[field]}
          onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
          className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:border-gray-400 bg-white"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => togglePwVis(field)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPw[field]
            ? <EyeOff className="w-4 h-4" strokeWidth={1.5} />
            : <Eye className="w-4 h-4" strokeWidth={1.5} />
          }
        </button>
      </div>
    </div>
  );

  const Toggle = ({
    checked, onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-gray-900" : "bg-gray-200"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  const notifItems = [
    { key: "email" as const,        icon: Mail,         label: "Correo electrónico",       sub: "Recibe actualizaciones por email" },
    { key: "sms" as const,          icon: MessageSquare, label: "SMS",                      sub: "Notificaciones vía mensaje de texto" },
    { key: "orderUpdates" as const, icon: ShoppingBag,  label: "Estado de pedidos",        sub: "Cambios en el estado de tus envíos" },
    { key: "promotions" as const,   icon: Tag,          label: "Ofertas y promociones",    sub: "Descuentos exclusivos para miembros" },
  ];

  return (
    <div className="space-y-6">

      {/* ── Change Password ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-gray-600" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base text-gray-900">Cambiar Contraseña</h2>
            <p className="text-xs text-gray-400">Última actualización: hace 3 meses</p>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="max-w-md space-y-4">
            <PwField label="Contraseña actual"    field="current" />
            <PwField label="Nueva contraseña"     field="next" />
            <PwField label="Confirmar contraseña" field="confirm" />

            {pwError && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {pwError}
              </p>
            )}

            {/* Password strength */}
            {pwForm.next && (
              <div>
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => {
                    const strength = Math.min(Math.floor(pwForm.next.length / 3), 4);
                    return (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength
                            ? strength <= 1 ? "bg-red-400"
                            : strength <= 2 ? "bg-amber-400"
                            : strength <= 3 ? "bg-blue-400"
                            : "bg-green-400"
                            : "bg-gray-200"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400">
                  {pwForm.next.length < 6 ? "Muy débil" : pwForm.next.length < 9 ? "Débil" : pwForm.next.length < 12 ? "Moderada" : "Fuerte"}
                </p>
              </div>
            )}

            <button
              onClick={handlePwChange}
              className="inline-flex items-center gap-2 text-sm text-white bg-gray-900 rounded-lg px-5 py-2.5 hover:bg-gray-800 transition-colors"
            >
              <Check className="w-4 h-4" strokeWidth={1.5} />
              Actualizar contraseña
            </button>
          </div>
        </div>
      </div>

      {/* ── Notifications ────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-gray-600" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base text-gray-900">Notificaciones</h2>
            <p className="text-xs text-gray-400">Elige cómo quieres recibir actualizaciones</p>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="space-y-4 mb-6">
            {notifItems.map(({ key, icon: Icon, label, sub }) => (
              <div key={key} className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                </div>
                <Toggle
                  checked={notif[key]}
                  onChange={() => setNotif((n) => ({ ...n, [key]: !n[key] }))}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleNotifSave}
            className="inline-flex items-center gap-2 text-sm text-white bg-gray-900 rounded-lg px-5 py-2.5 hover:bg-gray-800 transition-colors"
          >
            <Check className="w-4 h-4" strokeWidth={1.5} />
            Guardar preferencias
          </button>
        </div>
      </div>

      {/* ── Sessions ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base text-gray-900">Sesiones activas</h2>
          <p className="text-xs text-gray-400 mt-0.5">Dispositivos con sesión iniciada</p>
        </div>

        <div className="divide-y divide-gray-100">
          {[
            { device: "Chrome · macOS", location: "New York, NY", time: "Sesión actual", current: true },
            { device: "Safari · iPhone 15", location: "London, UK", time: "Hace 2 días",   current: false },
          ].map(({ device, location, time, current }) => (
            <div key={device} className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-900">{device}</p>
                  {current && (
                    <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                      Actual
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{location} · {time}</p>
              </div>
              {!current && (
                <button
                  onClick={() => toast.success("Sesión cerrada")}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Cerrar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}