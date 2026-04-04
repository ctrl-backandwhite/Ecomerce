import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../context/UserContext";
import { Shield, Eye, EyeOff, Bell, Mail, MessageSquare, ShoppingBag, Tag, Check, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { profileRepository } from "../../repositories/ProfileRepository";
import { ApiError } from "../../lib/AppError";

type PwStep = "form" | "code" | "success";

/* ── Extracted so React keeps a stable component identity across re-renders ── */
function PwField({
  label, field, value, show, onChange, onToggle,
}: {
  label: string;
  field: string;
  value: string;
  show: boolean;
  onChange: (v: string) => void;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:border-gray-400 bg-white"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show
            ? <EyeOff className="w-4 h-4" strokeWidth={1.5} />
            : <Eye className="w-4 h-4" strokeWidth={1.5} />
          }
        </button>
      </div>
    </div>
  );
}

export function ProfileSeguridad() {
  const { user, saveNotificationPrefs } = useUser();
  const [notif, setNotif] = useState(user.notifications);
  const [savingNotif, setSavingNotif] = useState(false);

  // ── Password change state ──────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState("");
  const [pwStep, setPwStep] = useState<PwStep>("form");
  const [pwLoading, setPwLoading] = useState(false);

  // Verification code (6 individual inputs)
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer (180 seconds = 3 minutes)
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const togglePwVis = (field: keyof typeof showPw) =>
    setShowPw((p) => ({ ...p, [field]: !p[field] }));

  // Start countdown
  const startCountdown = useCallback(() => {
    setSecondsLeft(180);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Step 1: Request password change
  const handlePwRequest = async () => {
    if (pwForm.next.length < 8) { setPwError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Las contraseñas no coinciden"); return; }
    if (!pwForm.current) { setPwError("Ingresa tu contraseña actual"); return; }
    setPwError("");
    setPwLoading(true);

    try {
      await profileRepository.requestPasswordChange({
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
        confirmPassword: pwForm.confirm,
      });
      setPwStep("code");
      startCountdown();
      toast.info("Se envió un código de verificación a tu correo");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al solicitar el cambio";
      setPwError(msg);
    } finally {
      setPwLoading(false);
    }
  };

  // Step 2: Confirm with code
  const handleCodeConfirm = async () => {
    const code = codeDigits.join("");
    if (code.length !== 6) { setPwError("Ingresa los 6 dígitos del código"); return; }
    setPwError("");
    setPwLoading(true);

    try {
      await profileRepository.confirmPasswordChange({ code });
      setPwStep("success");
      toast.success("Contraseña actualizada correctamente");
      // Reset everything after short delay
      setTimeout(() => {
        setPwStep("form");
        setPwForm({ current: "", next: "", confirm: "" });
        setCodeDigits(["", "", "", "", "", ""]);
        setSecondsLeft(0);
      }, 2000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Código inválido o expirado";
      setPwError(msg);
    } finally {
      setPwLoading(false);
    }
  };

  // Back to form
  const handleBackToForm = () => {
    setPwStep("form");
    setPwError("");
    setCodeDigits(["", "", "", "", "", ""]);
    setSecondsLeft(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Handle individual digit input
  const handleCodeDigit = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // only digits
    const newDigits = [...codeDigits];
    newDigits[index] = value.slice(-1);
    setCodeDigits(newDigits);
    // Auto-focus next
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newDigits = [...codeDigits];
    for (let i = 0; i < 6; i++) newDigits[i] = pasted[i] || "";
    setCodeDigits(newDigits);
    const focusIdx = Math.min(pasted.length, 5);
    codeRefs.current[focusIdx]?.focus();
  };

  const handleNotifSave = async () => {
    setSavingNotif(true);
    try {
      await saveNotificationPrefs(notif);
      toast.success("Preferencias de notificación guardadas");
    } catch {
      toast.error("No se pudieron guardar las preferencias");
    } finally {
      setSavingNotif(false);
    }
  };

  const Toggle = ({
    checked, onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-gray-500" : "bg-gray-200"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  const notifItems = [
    { key: "email" as const, icon: Mail, label: "Correo electrónico", sub: "Recibe actualizaciones por email" },
    { key: "sms" as const, icon: MessageSquare, label: "SMS", sub: "Notificaciones vía mensaje de texto" },
    { key: "orderUpdates" as const, icon: ShoppingBag, label: "Estado de pedidos", sub: "Cambios en el estado de tus envíos" },
    { key: "promotions" as const, icon: Tag, label: "Ofertas y promociones", sub: "Descuentos exclusivos para miembros" },
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
          {pwStep === "form" && (
            <div className="max-w-md space-y-4">
              <PwField label="Contraseña actual" field="current" value={pwForm.current} show={showPw.current} onChange={(v) => setPwForm((f) => ({ ...f, current: v }))} onToggle={() => togglePwVis("current")} />
              <PwField label="Nueva contraseña" field="next" value={pwForm.next} show={showPw.next} onChange={(v) => setPwForm((f) => ({ ...f, next: v }))} onToggle={() => togglePwVis("next")} />
              <PwField label="Confirmar contraseña" field="confirm" value={pwForm.confirm} show={showPw.confirm} onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))} onToggle={() => togglePwVis("confirm")} />

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
                          className={`h-1 flex-1 rounded-full transition-colors ${i <= strength
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
                onClick={handlePwRequest}
                disabled={pwLoading}
                className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 rounded-lg px-5 py-2.5 hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {pwLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  : <Save className="w-4 h-4" strokeWidth={1.5} />
                }
                {pwLoading ? "Enviando código..." : "Cambiar contraseña"}
              </button>
            </div>
          )}

          {pwStep === "code" && (
            <div className="max-w-md space-y-5">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Ingresa el código de 6 dígitos enviado a tu correo electrónico.
                </p>
                <p className="text-xs text-gray-400">
                  El código expira en{" "}
                  <span className={`font-medium ${secondsLeft <= 30 ? "text-red-500" : "text-gray-600"}`}>
                    {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                  </span>
                </p>
              </div>

              {/* 6-digit code inputs */}
              <div className="flex gap-3 justify-start" onPaste={handleCodePaste}>
                {codeDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { codeRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeDigit(idx, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-medium text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
                  />
                ))}
              </div>

              {pwError && (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {pwError}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCodeConfirm}
                  disabled={pwLoading || codeDigits.join("").length !== 6 || secondsLeft === 0}
                  className="inline-flex items-center gap-2 text-sm text-white bg-gray-700 rounded-lg px-5 py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {pwLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    : <Check className="w-4 h-4" strokeWidth={1.5} />
                  }
                  {pwLoading ? "Verificando..." : "Confirmar"}
                </button>
                <button
                  onClick={handleBackToForm}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>

              {secondsLeft === 0 && (
                <p className="text-xs text-red-500">
                  El código ha expirado. Vuelve a intentarlo.
                </p>
              )}
            </div>
          )}

          {pwStep === "success" && (
            <div className="max-w-md flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm text-gray-900 font-medium">Contraseña actualizada</p>
                <p className="text-xs text-gray-400">Tu contraseña ha sido cambiada correctamente.</p>
              </div>
            </div>
          )}
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
            className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 rounded-lg px-5 py-2.5 hover:bg-gray-300 transition-colors"
          >
            <Save className="w-4 h-4" strokeWidth={1.5} />
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
            { device: "Safari · iPhone 15", location: "London, UK", time: "Hace 2 días", current: false },
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