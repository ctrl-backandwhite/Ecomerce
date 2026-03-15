import { useState, useEffect, useRef } from "react";
import { useUser } from "../../context/UserContext";
import {
  Store,
  Save,
  X,
  Globe,
  Instagram,
  Facebook,
  Phone,
  Mail,
  Star,
  ShoppingBag,
  TrendingUp,
  Package,
  Link,
  Tag,
  FileText,
  Truck,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ExternalLink,
  ImagePlus,
  ScanFace,
  ShieldCheck,
  ShieldX,
  Camera,
  RefreshCw,
  Info,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

/* ── Face verification modal ──────────────────────────────── */
type FaceStep = "idle" | "camera" | "scanning" | "done";

function FaceVerificationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<FaceStep>("idle");
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step === "camera" || step === "scanning") {
      intervalRef.current = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [step]);

  useEffect(() => {
    if (step !== "scanning") return;
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 100) { p = 100; clearInterval(t); setTimeout(() => setStep("done"), 400); }
      setProgress(p);
    }, 200);
    return () => clearInterval(t);
  }, [step]);

  const startCamera = () => { setStep("camera"); setTimeout(() => setStep("scanning"), 2500); };
  const handleSuccess = () => { onSuccess(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-500 flex items-center justify-center">
              <ScanFace className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-gray-900">Verificación facial</p>
              <p className="text-xs text-gray-400">Vendedor NEXA</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-8">
          {step === "idle" && (
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center mx-auto mb-6">
                <ScanFace className="w-10 h-10 text-gray-300" strokeWidth={1} />
              </div>
              <p className="text-sm text-gray-900 mb-2">Verifica tu identidad</p>
              <p className="text-xs text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
                El reconocimiento facial confirma que eres el titular de la cuenta y habilita funciones exclusivas de vendedor.
              </p>
              <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-2.5">
                {["Coloca tu rostro centrado en el encuadre", "Asegúrate de tener buena iluminación", "Retira lentes de sol o cubrebocas"].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] text-gray-500">{i + 1}</span>
                    </div>
                    <p className="text-xs text-gray-500">{tip}</p>
                  </div>
                ))}
              </div>
              <button onClick={startCamera} className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 text-sm rounded-xl py-3 hover:bg-gray-300 transition-colors">
                <Camera className="w-4 h-4" strokeWidth={1.5} />
                Iniciar cámara
              </button>
            </div>
          )}

          {step === "camera" && (
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6">
                <div className="w-full h-full rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <ScanFace className="w-20 h-20 text-gray-400" strokeWidth={0.8} />
                  </div>
                </div>
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-gray-900 rounded-tl-sm" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-gray-900 rounded-tr-sm" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-gray-900 rounded-bl-sm" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-gray-900 rounded-br-sm" />
                <div className="absolute inset-0 rounded-full border-2 border-gray-400 animate-ping opacity-30" />
              </div>
              <p className="text-sm text-gray-900">Centrando rostro{".".repeat(dots + 1)}</p>
              <p className="text-xs text-gray-400 mt-1">Mantén el dispositivo estable</p>
            </div>
          )}

          {step === "scanning" && (
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6">
                <div className="w-full h-full rounded-full bg-gray-100 border-2 border-gray-900 overflow-hidden flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <ScanFace className="w-20 h-20 text-gray-600" strokeWidth={0.8} />
                  </div>
                  <div className="absolute left-0 right-0 h-0.5 bg-gray-600/40 transition-all duration-200" style={{ top: `${progress}%` }} />
                </div>
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-gray-900 rounded-tl-sm" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-gray-900 rounded-tr-sm" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-gray-900 rounded-bl-sm" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-gray-900 rounded-br-sm" />
              </div>
              <p className="text-sm text-gray-900 mb-3">Analizando biometría{".".repeat(dots + 1)}</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gray-600 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">{Math.round(progress)}%</p>
            </div>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={1} />
              </div>
              <p className="text-sm text-gray-900 mb-1">Verificación exitosa</p>
              <p className="text-xs text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
                Tu identidad ha sido confirmada. Ahora tienes acceso completo a las funciones de vendedor NEXA.
              </p>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 text-left">
                {["Publicar productos en el marketplace", "Recibir pagos y gestionar ingresos", "Acceso al panel de vendedor"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5 last:mb-0">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" strokeWidth={2} />
                    <p className="text-xs text-green-700">{item}</p>
                  </div>
                ))}
              </div>
              <button onClick={handleSuccess} className="w-full bg-gray-200 text-gray-700 text-sm rounded-xl py-3 hover:bg-gray-300 transition-colors">
                Continuar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Face status map ──────────────────────────────────────── */
const faceStatusMap = {
  unverified: { label: "Sin verificar", icon: ShieldX,     color: "text-gray-400",  bg: "bg-gray-50",   border: "border-gray-200",  dot: "bg-gray-300" },
  pending:    { label: "En revisión",   icon: Clock,       color: "text-amber-600", bg: "bg-amber-50",  border: "border-amber-100", dot: "bg-amber-400" },
  verified:   { label: "Verificado",    icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50",  border: "border-green-100", dot: "bg-green-500" },
  rejected:   { label: "Rechazado",     icon: XCircle,     color: "text-red-500",   bg: "bg-red-50",    border: "border-red-100",   dot: "bg-red-400" },
};

/* ── Helpers ──────────────────────────────────────────────── */
const storeCategories = [
  "Tecnología", "Moda y Ropa", "Hogar y Decoración", "Deportes",
  "Belleza y Cuidado", "Juguetes y Juegos", "Alimentos y Bebidas",
  "Libros y Arte", "Salud", "Mascotas", "Automotriz", "Otro",
];

const statusConfig = {
  draft:     { label: "Borrador",   icon: FileText,    color: "text-gray-500",  bg: "bg-gray-50",    border: "border-gray-200",  dot: "bg-gray-400" },
  pending:   { label: "En revisión",icon: Clock,       color: "text-amber-600", bg: "bg-amber-50",   border: "border-amber-100", dot: "bg-amber-400" },
  active:    { label: "Activa",     icon: CheckCircle, color: "text-green-600", bg: "bg-green-50",   border: "border-green-100", dot: "bg-green-500" },
  suspended: { label: "Suspendida", icon: XCircle,     color: "text-red-500",   bg: "bg-red-50",     border: "border-red-100",   dot: "bg-red-400" },
};

/* ── Shared small input ───────────────────────────────────── */
function SField({
  label,
  icon: Icon,
  name,
  value,
  type = "text",
  placeholder,
  editing,
  onChange,
}: {
  label: string;
  icon?: typeof Store;
  name: string;
  value: string;
  type?: string;
  placeholder?: string;
  editing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1 tracking-wide">{label}</label>
      {editing ? (
        <div className="relative">
          {Icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
            </span>
          )}
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full text-xs text-gray-900 border border-gray-200 rounded-lg py-1.5 focus:outline-none focus:border-gray-400 bg-white transition-colors ${Icon ? "pl-8 pr-3" : "px-3"}`}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100 min-h-[30px]">
          {Icon && <Icon className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={1.5} />}
          <p className="text-xs text-gray-900 truncate">{value || "—"}</p>
        </div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */
export function ProfileTienda() {
  const { user, updateProfile } = useUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...user.store });
  const [showFaceModal, setShowFaceModal] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = () => {
    updateProfile({ store: { ...user.store, ...form } });
    setEditing(false);
    toast.success("Tienda actualizada correctamente");
  };

  const handleCancel = () => {
    setForm({ ...user.store });
    setEditing(false);
  };

  const handleFaceSuccess = () => {
    updateProfile({ faceVerified: true, faceVerificationStatus: "verified" });
    toast.success("Identidad verificada correctamente");
  };

  const faceStatus = faceStatusMap[user.faceVerificationStatus];
  const FaceStatusIcon = faceStatus.icon;
  const status = statusConfig[user.store.status];
  const StatusIcon = status.icon;

  /* If not a seller, show CTA */
  if (!user.isSeller) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
          <Store className="w-8 h-8 text-gray-300" strokeWidth={1} />
        </div>
        <p className="text-base text-gray-900 mb-2">Aún no eres vendedor</p>
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed mb-6">
          Activa tu cuenta de vendedor para crear tu tienda, publicar productos y empezar a generar ingresos en NEXA.
        </p>
        <button className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors">
          <Store className="w-4 h-4" strokeWidth={1.5} />
          Convertirme en vendedor
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showFaceModal && (
        <FaceVerificationModal
          onClose={() => setShowFaceModal(false)}
          onSuccess={handleFaceSuccess}
        />
      )}

      {/* ── Card: Verificación de identidad ───────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base text-gray-900">Verificación de identidad</h2>
              <span className="text-[10px] bg-gray-600 text-white px-2 py-0.5 rounded-full tracking-wide">VENDEDOR</span>
            </div>
            <p className="text-xs text-gray-400">Reconocimiento facial para cuenta de vendedor</p>
          </div>
          <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${faceStatus.bg} ${faceStatus.color} ${faceStatus.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${faceStatus.dot}`} />
            {faceStatus.label}
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Verified */}
          {user.faceVerificationStatus === "verified" && (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-green-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 mb-1">Identidad confirmada</p>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Tu reconocimiento facial fue completado exitosamente. Tienes acceso a todas las funciones de vendedor NEXA.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {["Publicar productos", "Recibir pagos", "Panel vendedor"].map((label) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                      {label}
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowFaceModal(true)} className="inline-flex items-center gap-2 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Volver a verificar
                </button>
              </div>
            </div>
          )}

          {/* Pending */}
          {user.faceVerificationStatus === "pending" && (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-amber-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-gray-900 mb-1">Verificación en revisión</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Estamos analizando tu información biométrica. El proceso puede tardar hasta 24 horas. Te notificaremos por correo.
                </p>
              </div>
            </div>
          )}

          {/* Rejected */}
          {user.faceVerificationStatus === "rejected" && (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-gray-900 mb-1">Verificación rechazada</p>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  No pudimos confirmar tu identidad. Asegúrate de tener buena iluminación y que tu rostro esté completamente visible.
                </p>
                <button onClick={() => setShowFaceModal(true)} className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors">
                  <ScanFace className="w-4 h-4" strokeWidth={1.5} />
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}

          {/* Unverified */}
          {user.faceVerificationStatus === "unverified" && (
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-full sm:w-36 flex-shrink-0">
                <div className="relative w-28 h-28 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200 animate-spin [animation-duration:8s]" />
                  <div className="absolute inset-4 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <ScanFace className="w-9 h-9 text-gray-300" strokeWidth={1} />
                  </div>
                  {["top-1 left-8", "top-1 right-8", "bottom-1 left-8", "bottom-1 right-8"].map((pos, i) => (
                    <div key={i} className={`absolute w-1.5 h-1.5 rounded-full bg-gray-400 ${pos}`} />
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 mb-2">Habilita tu cuenta de vendedor</p>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Para vender en NEXA necesitas verificar tu identidad mediante reconocimiento facial. Es rápido, seguro y solo toma unos segundos.
                </p>
                <div className="space-y-2 mb-4">
                  {["Publicar hasta 500 productos", "Recibir pagos directamente", "Panel de analytics de ventas", "Insignia de Vendedor Verificado"].map((text) => (
                    <div key={text} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                      <p className="text-xs text-gray-500">{text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4">
                  <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Los datos biométricos se procesan localmente y no se almacenan en nuestros servidores. Cumple con la Ley 19.628.
                  </p>
                </div>
                <button onClick={() => setShowFaceModal(true)} className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors">
                  <ScanFace className="w-4 h-4" strokeWidth={1.5} />
                  Verificar identidad
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ShoppingBag, label: "Ventas totales",  value: user.store.totalSales.toString() },
          { icon: TrendingUp,  label: "Ingresos",        value: `$${(user.store.totalRevenue / 1000).toFixed(0)}K` },
          { icon: Star,        label: "Calificación",    value: `${user.store.rating} / 5` },
          { icon: Package,     label: "Reseñas",         value: user.store.reviewCount.toString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Card: Información de la tienda ───────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Store className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-base text-gray-900">Mi Tienda</h2>
              <p className="text-xs text-gray-400">Información pública de tu tienda</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badge */}
            <div className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${status.bg} ${status.color} ${status.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </div>

            {/* Edit / Save */}
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <Pencil className="w-4 h-4" strokeWidth={1.5} />
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleCancel} className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors"
                >
                  <Save className="w-4 h-4" strokeWidth={1.5} />
                  Guardar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Banner + Logo preview */}
        <div className="relative h-28 bg-gradient-to-r from-gray-100 to-gray-200 flex-shrink-0">
          {editing && (
            <button className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-gray-500 hover:bg-black/10 transition-colors">
              <ImagePlus className="w-4 h-4" strokeWidth={1.5} />
              Cambiar banner
            </button>
          )}
          {/* Logo */}
          <div className="absolute -bottom-6 left-6">
            <div className="w-14 h-14 rounded-xl bg-white border-2 border-white shadow-md flex items-center justify-center">
              <span className="text-lg text-gray-900 tracking-wider">
                {user.store.name.charAt(0)}
              </span>
            </div>
            {editing && (
              <button className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-500 text-white flex items-center justify-center">
                <Pencil className="w-2.5 h-2.5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Form body */}
        <div className="px-6 pt-10 pb-6 space-y-5">

          {/* Nombre + Slug + Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SField label="Nombre de la tienda" icon={Store} name="name" value={form.name} placeholder="Mi tienda NEXA" editing={editing} onChange={handleChange as any} />
            <SField label="URL de la tienda" icon={Link} name="slug" value={form.slug} placeholder="mi-tienda" editing={editing} onChange={handleChange as any} />
            <div>
              <label className="block text-xs text-gray-400 mb-1 tracking-wide">Categoría principal</label>
              {editing ? (
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg py-1.5 pl-8 pr-3 focus:outline-none focus:border-gray-400 bg-white transition-colors"
                  >
                    {storeCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
                  <Tag className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                  <p className="text-xs text-gray-900">{form.category}</p>
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 tracking-wide">Descripción de la tienda</label>
            {editing ? (
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Cuéntale a tus clientes sobre tu tienda..."
                className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white transition-colors resize-none"
              />
            ) : (
              <p className="text-xs text-gray-700 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100 leading-relaxed">
                {form.description || "—"}
              </p>
            )}
          </div>

          {/* Contacto */}
          <div>
            <p className="text-xs text-gray-400 mb-3 tracking-wide uppercase">Contacto de la tienda</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SField label="Teléfono" icon={Phone} name="phone" value={form.phone} placeholder="+56 9 0000 0000" editing={editing} onChange={handleChange as any} />
              <SField label="Email de la tienda" icon={Mail} name="email" type="email" value={form.email} placeholder="ventas@mitienda.com" editing={editing} onChange={handleChange as any} />
              <SField label="Sitio web" icon={Globe} name="website" value={form.website} placeholder="https://mitienda.com" editing={editing} onChange={handleChange as any} />
            </div>
          </div>

          {/* Redes sociales */}
          <div>
            <p className="text-xs text-gray-400 mb-3 tracking-wide uppercase">Redes sociales</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SField label="Instagram" icon={Instagram} name="instagram" value={form.instagram} placeholder="@mitienda" editing={editing} onChange={handleChange as any} />
              <SField label="Facebook" icon={Facebook} name="facebook" value={form.facebook} placeholder="mitienda" editing={editing} onChange={handleChange as any} />
              <SField label="TikTok" icon={ExternalLink} name="tiktok" value={form.tiktok} placeholder="@mitienda" editing={editing} onChange={handleChange as any} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card: Políticas ────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base text-gray-900">Políticas de la tienda</h2>
            <p className="text-xs text-gray-400 mt-0.5">Visibles para los compradores en tu página de tienda</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <Pencil className="w-4 h-4" strokeWidth={1.5} />
              Editar
            </button>
          )}
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Política de envíos */}
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-400 mb-1 tracking-wide">
              <Truck className="w-3.5 h-3.5" strokeWidth={1.5} />
              Política de envíos
            </label>
            {editing ? (
              <textarea
                name="shippingPolicy"
                value={form.shippingPolicy}
                onChange={handleChange}
                rows={4}
                className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white transition-colors resize-none"
              />
            ) : (
              <p className="text-xs text-gray-700 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100 leading-relaxed min-h-[72px]">
                {form.shippingPolicy || "—"}
              </p>
            )}
          </div>

          {/* Política de devoluciones */}
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-400 mb-1 tracking-wide">
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              Política de devoluciones
            </label>
            {editing ? (
              <textarea
                name="returnPolicy"
                value={form.returnPolicy}
                onChange={handleChange}
                rows={4}
                className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white transition-colors resize-none"
              />
            ) : (
              <p className="text-xs text-gray-700 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100 leading-relaxed min-h-[72px]">
                {form.returnPolicy || "—"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Card: Estado de la tienda ──────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base text-gray-900">Estado de la tienda</h2>
          <p className="text-xs text-gray-400 mt-0.5">Visibilidad actual en el marketplace NEXA</p>
        </div>
        <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm ${status.bg} ${status.color} ${status.border}`}>
            <StatusIcon className="w-4 h-4" strokeWidth={1.5} />
            {status.label}
          </div>
          <div className="flex-1">
            {user.store.status === "active" && (
              <p className="text-xs text-gray-500 leading-relaxed">
                Tu tienda está activa y visible para todos los compradores. Los productos publicados aparecen en el catálogo.
              </p>
            )}
            {user.store.status === "pending" && (
              <p className="text-xs text-gray-500 leading-relaxed">
                Tu solicitud está siendo revisada por el equipo de NEXA. Recibirás una notificación en 24–48 horas hábiles.
              </p>
            )}
            {user.store.status === "draft" && (
              <p className="text-xs text-gray-500 leading-relaxed">
                Tu tienda está en borrador. Completa la información y envíala a revisión para comenzar a vender.
              </p>
            )}
            {user.store.status === "suspended" && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-xs text-red-500 leading-relaxed">
                  Tu tienda fue suspendida. Contacta a soporte NEXA para conocer los motivos y resolver la situación.
                </p>
              </div>
            )}
          </div>
          {user.store.status === "draft" && (
            <button
              onClick={() => { updateProfile({ store: { ...user.store, status: "pending" } }); toast.success("Tienda enviada a revisión"); }}
              className="text-sm text-gray-700 bg-gray-200 rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors flex-shrink-0"
            >
              Enviar a revisión
            </button>
          )}
        </div>
      </div>

    </div>
  );
}