import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
import { useCurrency } from "../../context/CurrencyContext";
import { useLanguage } from "../../context/LanguageContext";

/* ── Face verification modal ──────────────────────────────── */
type FaceStep = "idle" | "camera" | "scanning" | "done";

function FaceVerificationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useLanguage();
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-500 flex items-center justify-center">
              <ScanFace className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm text-gray-900">{t("profile.tienda.modal.header.title")}</p>
              <p className="text-xs text-gray-400">{t("profile.tienda.modal.header.subtitle")}</p>
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
              <p className="text-sm text-gray-900 mb-2">{t("profile.tienda.modal.idle.title")}</p>
              <p className="text-xs text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
                {t("profile.tienda.modal.idle.desc")}
              </p>
              <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-2.5">
                {[t("profile.tienda.modal.idle.tip1"), t("profile.tienda.modal.idle.tip2"), t("profile.tienda.modal.idle.tip3")].map((tip, i) => (
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
                {t("profile.tienda.modal.idle.button")}
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
              <p className="text-sm text-gray-900">{t("profile.tienda.modal.camera.title")}{".".repeat(dots + 1)}</p>
              <p className="text-xs text-gray-400 mt-1">{t("profile.tienda.modal.camera.subtitle")}</p>
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
              <p className="text-sm text-gray-900 mb-3">{t("profile.tienda.modal.scanning.title")}{".".repeat(dots + 1)}</p>
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
              <p className="text-sm text-gray-900 mb-1">{t("profile.tienda.modal.done.title")}</p>
              <p className="text-xs text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">
                {t("profile.tienda.modal.done.desc")}
              </p>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 text-left">
                {[t("profile.tienda.modal.done.feature1"), t("profile.tienda.modal.done.feature2"), t("profile.tienda.modal.done.feature3")].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5 last:mb-0">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" strokeWidth={2} />
                    <p className="text-xs text-green-700">{item}</p>
                  </div>
                ))}
              </div>
              <button onClick={handleSuccess} className="w-full bg-gray-200 text-gray-700 text-sm rounded-xl py-3 hover:bg-gray-300 transition-colors">
                {t("profile.tienda.modal.done.button")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── Face status map ──────────────────────────────────────── */
const faceStatusMap = {
  unverified: { labelKey: "profile.tienda.face.status.unverified", icon: ShieldX, color: "text-gray-400", bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-300" },
  pending: { labelKey: "profile.tienda.face.status.pending", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", dot: "bg-amber-400" },
  verified: { labelKey: "profile.tienda.face.status.verified", icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50", border: "border-green-100", dot: "bg-green-500" },
  rejected: { labelKey: "profile.tienda.face.status.rejected", icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-100", dot: "bg-red-400" },
};

/* ── Helpers ──────────────────────────────────────────────── */
const storeCategories = [
  "Tecnología", "Moda y Ropa", "Hogar y Decoración", "Deportes",
  "Belleza y Cuidado", "Juguetes y Juegos", "Alimentos y Bebidas",
  "Libros y Arte", "Salud", "Mascotas", "Automotriz", "Otro",
];

const statusConfig = {
  draft: { labelKey: "profile.tienda.storeinfo.status.draft", icon: FileText, color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400" },
  pending: { labelKey: "profile.tienda.storeinfo.status.pending", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", dot: "bg-amber-400" },
  active: { labelKey: "profile.tienda.storeinfo.status.active", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-100", dot: "bg-green-500" },
  suspended: { labelKey: "profile.tienda.storeinfo.status.suspended", icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-100", dot: "bg-red-400" },
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
  const { formatPrice } = useCurrency(); const { t } = useLanguage(); const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...user.store });
  const [showFaceModal, setShowFaceModal] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = () => {
    updateProfile({ store: { ...user.store, ...form } });
    setEditing(false);
    toast.success(t("profile.tienda.toast.updated"));
  };

  const handleCancel = () => {
    setForm({ ...user.store });
    setEditing(false);
  };

  const handleFaceSuccess = () => {
    updateProfile({ faceVerified: true, faceVerificationStatus: "verified" });
    toast.success(t("profile.tienda.toast.face_verified"));
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
        <p className="text-base text-gray-900 mb-2">{t("profile.tienda.notseller.title")}</p>
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed mb-6">
          {t("profile.tienda.notseller.desc")}
        </p>
        <button className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors">
          <Store className="w-4 h-4" strokeWidth={1.5} />
          {t("profile.tienda.notseller.button")}
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
              <h2 className="text-base text-gray-900">{t("profile.tienda.face.title")}</h2>
              <span className="text-[10px] bg-gray-600 text-white px-2 py-0.5 rounded-full tracking-wide">{t("profile.tienda.face.badge")}</span>
            </div>
            <p className="text-xs text-gray-400">{t("profile.tienda.face.subtitle")}</p>
          </div>
          <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${faceStatus.bg} ${faceStatus.color} ${faceStatus.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${faceStatus.dot}`} />
            {t(faceStatus.labelKey)}
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
                <p className="text-sm text-gray-900 mb-1">{t("profile.tienda.face.verified.title")}</p>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  {t("profile.tienda.face.verified.desc")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {[t("profile.tienda.face.verified.feature1"), t("profile.tienda.face.verified.feature2"), t("profile.tienda.face.verified.feature3")].map((label) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                      {label}
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowFaceModal(true)} className="inline-flex items-center gap-2 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {t("profile.tienda.face.verified.reverify")}
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
                <p className="text-sm text-gray-900 mb-1">{t("profile.tienda.face.pending.title")}</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t("profile.tienda.face.pending.desc")}
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
                <p className="text-sm text-gray-900 mb-1">{t("profile.tienda.face.rejected.title")}</p>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  {t("profile.tienda.face.rejected.desc")}
                </p>
                <button onClick={() => setShowFaceModal(true)} className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors">
                  <ScanFace className="w-4 h-4" strokeWidth={1.5} />
                  {t("profile.tienda.face.rejected.retry")}
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
                <p className="text-sm text-gray-900 mb-2">{t("profile.tienda.face.unverified.title")}</p>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  {t("profile.tienda.face.unverified.desc")}
                </p>
                <div className="space-y-2 mb-4">
                  {[t("profile.tienda.face.unverified.feature1"), t("profile.tienda.face.unverified.feature2"), t("profile.tienda.face.unverified.feature3"), t("profile.tienda.face.unverified.feature4")].map((text) => (
                    <div key={text} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={2} />
                      <p className="text-xs text-gray-500">{text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4">
                  <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {t("profile.tienda.face.unverified.info")}
                  </p>
                </div>
                <button onClick={() => setShowFaceModal(true)} className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors">
                  <ScanFace className="w-4 h-4" strokeWidth={1.5} />
                  {t("profile.tienda.face.button.verify")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ShoppingBag, label: t("profile.tienda.stats.sales"), value: user.store.totalSales.toString() },
          { icon: TrendingUp, label: t("profile.tienda.stats.revenue"), value: formatPrice(user.store.totalRevenue) },
          { icon: Star, label: t("profile.tienda.stats.rating"), value: `${user.store.rating} / 5` },
          { icon: Package, label: t("profile.tienda.stats.reviews"), value: user.store.reviewCount.toString() },
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
              <h2 className="text-base text-gray-900">{t("profile.tienda.storeinfo.title")}</h2>
              <p className="text-xs text-gray-400">{t("profile.tienda.storeinfo.subtitle")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badge */}
            <div className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${status.bg} ${status.color} ${status.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {t(status.labelKey)}
            </div>

            {/* Edit / Save */}
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <Pencil className="w-4 h-4" strokeWidth={1.5} />
                {t("profile.tienda.storeinfo.button.edit")}
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
                  {t("profile.tienda.button.save")}
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
              {t("profile.tienda.storeinfo.form.banner")}
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
            <SField label={t("profile.tienda.storeinfo.form.name")} icon={Store} name="name" value={form.name} placeholder={t("profile.tienda.storeinfo.form.name.placeholder")} editing={editing} onChange={handleChange as any} />
            <SField label={t("profile.tienda.storeinfo.form.slug")} icon={Link} name="slug" value={form.slug} placeholder={t("profile.tienda.storeinfo.form.slug.placeholder")} editing={editing} onChange={handleChange as any} />
            <div>
              <label className="block text-xs text-gray-400 mb-1 tracking-wide">{t("profile.tienda.storeinfo.form.category")}</label>
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
            <label className="block text-xs text-gray-400 mb-1 tracking-wide">{t("profile.tienda.storeinfo.form.desc")}</label>
            {editing ? (
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder={t("profile.tienda.storeinfo.form.desc.placeholder")}
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
            <p className="text-xs text-gray-400 mb-3 tracking-wide uppercase">{t("profile.tienda.storeinfo.form.contact")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SField label={t("profile.tienda.storeinfo.form.phone")} icon={Phone} name="phone" value={form.phone} placeholder={t("profile.tienda.storeinfo.form.phone.placeholder")} editing={editing} onChange={handleChange as any} />
              <SField label={t("profile.tienda.storeinfo.form.email")} icon={Mail} name="email" type="email" value={form.email} placeholder={t("profile.tienda.storeinfo.form.email.placeholder")} editing={editing} onChange={handleChange as any} />
              <SField label={t("profile.tienda.storeinfo.form.website")} icon={Globe} name="website" value={form.website} placeholder={t("profile.tienda.storeinfo.form.website.placeholder")} editing={editing} onChange={handleChange as any} />
            </div>
          </div>

          {/* Redes sociales */}
          <div>
            <p className="text-xs text-gray-400 mb-3 tracking-wide uppercase">{t("profile.tienda.storeinfo.form.social")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SField label={t("profile.tienda.storeinfo.form.instagram")} icon={Instagram} name="instagram" value={form.instagram} placeholder={t("profile.tienda.storeinfo.form.instagram.placeholder")} editing={editing} onChange={handleChange as any} />
              <SField label={t("profile.tienda.storeinfo.form.facebook")} icon={Facebook} name="facebook" value={form.facebook} placeholder={t("profile.tienda.storeinfo.form.facebook.placeholder")} editing={editing} onChange={handleChange as any} />
              <SField label={t("profile.tienda.storeinfo.form.tiktok")} icon={ExternalLink} name="tiktok" value={form.tiktok} placeholder={t("profile.tienda.storeinfo.form.tiktok.placeholder")} editing={editing} onChange={handleChange as any} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card: Políticas ────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base text-gray-900">{t("profile.tienda.policies.title")}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{t("profile.tienda.policies.subtitle")}</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <Pencil className="w-4 h-4" strokeWidth={1.5} />
              {t("profile.tienda.storeinfo.button.edit")}
            </button>
          )}
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Política de envíos */}
          <div>
            <label className="flex items-center gap-2 text-xs text-gray-400 mb-1 tracking-wide">
              <Truck className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t("profile.tienda.policies.shipping")}
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
              {t("profile.tienda.policies.returns")}
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
          <h2 className="text-base text-gray-900">{t("profile.tienda.storeinfo.status")}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t("profile.tienda.status.subtitle")}</p>
        </div>
        <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm ${status.bg} ${status.color} ${status.border}`}>
            <StatusIcon className="w-4 h-4" strokeWidth={1.5} />
            {t(status.labelKey)}
          </div>
          <div className="flex-1">
            {user.store.status === "active" && (
              <p className="text-xs text-gray-500 leading-relaxed">
                {t("profile.tienda.status.active.desc")}
              </p>
            )}
            {user.store.status === "pending" && (
              <p className="text-xs text-gray-500 leading-relaxed">
                {t("profile.tienda.status.pending.desc")}
              </p>
            )}
            {user.store.status === "draft" && (
              <p className="text-xs text-gray-500 leading-relaxed">
                {t("profile.tienda.status.draft.inactive")}
              </p>
            )}
            {user.store.status === "suspended" && (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-xs text-red-500 leading-relaxed">
                  {t("profile.tienda.status.suspended.error")}
                </p>
              </div>
            )}
          </div>
          {user.store.status === "draft" && (
            <button
              onClick={() => { updateProfile({ store: { ...user.store, status: "pending" } }); toast.success(t("profile.tienda.toast.submitted")); }}
              className="text-sm text-gray-700 bg-gray-200 rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors flex-shrink-0"
            >
              {t("profile.tienda.status.button.submit")}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}