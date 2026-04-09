import { useState, useEffect, useCallback } from "react";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { profileRepository, type ProfilePayload, type SyncIdentityPayload } from "../../repositories/ProfileRepository";
import { loyaltyRepository, type LoyaltyTier } from "../../repositories/LoyaltyRepository";
import { Save, Pencil } from "lucide-react";
import { toast } from "sonner";

import { logger } from "../../lib/logger";

const docTypes = [
  { value: "DNI", label: "DNI", placeholder: "Ej. 12345678A" },
  { value: "PASSPORT", label: "PASAPORTE", placeholder: "Ej. USA12345678" },
  { value: "NIE", label: "NIE", placeholder: "Ej. X1234567A" },
  { value: "CIF", label: "CIF", placeholder: "Ej. B12345678" },
  { value: "OTHER", label: "OTRO", placeholder: "Número de documento" },
];

/** Fallback tiers — used while API tiers are loading. */
const FALLBACK_TIERS: LoyaltyTier[] = [
  { id: "fb-0", name: "Bronze", minPoints: 0, maxPoints: 999, multiplier: 1, benefits: [], createdAt: "", updatedAt: "" },
];

/**
 * Resolve the user's tier given their point balance and the (sorted) tier list.
 * The last tier whose minPoints ≤ points wins.
 */
function getMembershipTier(points: number, tiers: LoyaltyTier[]) {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let match = sorted[0];
  for (const t of sorted) {
    if (points >= t.minPoints) match = t;
    else break;
  }
  return match;
}

/** Find the next tier above the current one, or null if already at the top. */
function getNextTier(currentTier: LoyaltyTier, tiers: LoyaltyTier[]): LoyaltyTier | null {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  const idx = sorted.findIndex((t) => t.id === currentTier.id);
  return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
}

export function ProfileDatos() {
  const { user, updateProfile } = useUser();
  const { user: authUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<LoyaltyTier[]>(FALLBACK_TIERS);
  const [form, setForm] = useState({
    firstName: authUser?.firstName ?? user.firstName,
    lastName: authUser?.lastName ?? user.lastName,
    username: user.username,
    email: authUser?.email ?? user.email,
    phone: user.phone,
    birthDate: user.birthDate,
    documentType: user.documentType,
    documentNumber: user.documentNumber,
  });

  /* ── Load real profile from API on mount ──────────────────── */
  const loadProfile = useCallback(async () => {
    try {
      let profile = await profileRepository.getMyProfile();

      // Auto-sync identity fields from JWT if not yet synced
      if (!profile.profileSynced && authUser) {
        const syncPayload: SyncIdentityPayload = {
          firstName: authUser.firstName ?? "",
          lastName: authUser.lastName ?? "",
          nickName: authUser.nickName ?? authUser.email ?? "",
          email: authUser.email ?? "",
        };
        profile = await profileRepository.syncIdentity(syncPayload);
      }

      const loaded = {
        firstName: profile.firstName ?? authUser?.firstName ?? user.firstName,
        lastName: profile.lastName ?? authUser?.lastName ?? user.lastName,
        username: profile.nickName ?? authUser?.email ?? user.username,
        email: profile.email ?? authUser?.email ?? user.email,
        phone: profile.phone ?? "",
        birthDate: profile.birthDate ?? "",
        documentType: (profile.documentType ?? "") as typeof user.documentType,
        documentNumber: profile.documentNumber ?? "",
      };
      setForm(loaded);
      updateProfile(loaded);
    } catch (err) { logger.warn("Suppressed error", err); }
  }, [authUser]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  /* ── Load loyalty tiers from API ──────────────────────────── */
  useEffect(() => {
    loyaltyRepository.findAllTiers()
      .then((data) => { if (data.length > 0) setTiers(data); })
      .catch((err) => logger.warn("Failed to load loyalty tiers", err));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: ProfilePayload = {
        phone: form.phone || undefined,
        birthDate: form.birthDate || undefined,
        documentType: form.documentType || undefined,
        documentNumber: form.documentNumber || undefined,
      };
      const updated = await profileRepository.updateMyProfile(payload);
      // Sync local context with API response
      updateProfile({
        firstName: updated.firstName ?? authUser?.firstName ?? user.firstName,
        lastName: updated.lastName ?? authUser?.lastName ?? user.lastName,
        phone: updated.phone ?? "",
        birthDate: updated.birthDate ?? "",
        documentType: (updated.documentType ?? "") as typeof user.documentType,
        documentNumber: updated.documentNumber ?? "",
      });
      setForm((prev) => ({
        ...prev,
        phone: updated.phone ?? "",
        birthDate: updated.birthDate ?? "",
        documentType: (updated.documentType ?? "") as typeof user.documentType,
        documentNumber: updated.documentNumber ?? "",
      }));
      setEditing(false);
      toast.success("Perfil actualizado correctamente");
    } catch {
      toast.error("Error al guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      firstName: authUser?.firstName ?? user.firstName,
      lastName: authUser?.lastName ?? user.lastName,
      username: user.username,
      email: authUser?.email ?? user.email,
      phone: user.phone,
      birthDate: user.birthDate,
      documentType: user.documentType,
      documentNumber: user.documentNumber,
    });
    setEditing(false);
  };

  const Field = ({
    label,
    name,
    type = "text",
    value,
    span2 = false,
    readOnly = false,
  }: {
    label: string;
    name: string;
    type?: string;
    value: string;
    span2?: boolean;
    readOnly?: boolean;
  }) => (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs text-gray-400 mb-1 tracking-wide">{label}</label>
      {editing && !readOnly ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400 bg-white transition-colors"
        />
      ) : (
        <p className="text-xs text-gray-900 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
          {name === "birthDate"
            ? (value
              ? new Date(value + "T00:00:00").toLocaleDateString("es-CL", {
                day: "numeric", month: "long", year: "numeric",
              })
              : "—")
            : (value || "—")}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-5 flex flex-col h-full">

      {/* ── Card: NX036 Rewards ─────────────────────────────────── */}
      {(() => {
        const tier = getMembershipTier(user.loyaltyPoints, tiers);
        const nextTier = tier ? getNextTier(tier, tiers) : null;
        const nextMinPoints = nextTier ? nextTier.minPoints : null;
        const progress = nextMinPoints ? Math.min((user.loyaltyPoints / nextMinPoints) * 100, 100) : 100;
        return (
          <div className="bg-gray-700 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs tracking-widest text-gray-400 uppercase">Puntos</span>
              <span className="text-xs text-gray-400">NX036 Rewards</span>
            </div>
            <p className="text-3xl text-white mb-1">{user.loyaltyPoints.toLocaleString()}</p>
            <p className="text-xs text-gray-400">puntos disponibles</p>
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Nivel {tier?.name ?? "Bronze"}</span>
                {nextTier ? (
                  <span>{nextMinPoints!.toLocaleString()} pts → {nextTier.name}</span>
                ) : (
                  <span>Nivel máximo</span>
                )}
              </div>
              <div className="w-full h-1.5 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Card: Información personal ─────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base text-gray-900">Información Personal</h2>
            <p className="text-xs text-gray-400 mt-0.5">Gestiona tus datos de perfil</p>
          </div>
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
              <button
                onClick={handleCancel}
                className="text-sm text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" strokeWidth={1.5} />
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          {/* ── Documento de identidad ─────────────────── */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-3 tracking-wide uppercase">Documento de identidad</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1 tracking-wide">Tipo de documento</label>
                {editing ? (
                  <select
                    name="documentType"
                    value={form.documentType}
                    onChange={handleChange}
                    className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400 bg-white transition-colors"
                  >
                    <option value="">Seleccionar…</option>
                    {docTypes.map((dt) => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-gray-900 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
                    {docTypes.find((d) => d.value === form.documentType)?.label ?? "—"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 tracking-wide">Número de documento</label>
                {editing ? (
                  <input
                    type="text"
                    name="documentNumber"
                    value={form.documentNumber}
                    onChange={handleChange}
                    placeholder={docTypes.find((d) => d.value === form.documentType)?.placeholder ?? "Número de documento"}
                    className="w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400 bg-white transition-colors"
                  />
                ) : (
                  <p className="text-xs text-gray-900 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
                    {user.documentNumber || "—"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre" name="firstName" value={form.firstName} readOnly />
            <Field label="Apellido" name="lastName" value={form.lastName} readOnly />
            <Field label="Nombre de usuario" name="username" value={form.username} readOnly />
            <Field label="Correo electrónico" name="email" type="email" value={form.email} readOnly />
            <Field label="Teléfono" name="phone" value={form.phone} />
            <Field label="Fecha de nacimiento" name="birthDate" type="date" value={form.birthDate} />
          </div>
        </div>
      </div>

      {/* ── Card: Información de cuenta ─────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base text-gray-900">Información de cuenta</h2>
          <p className="text-xs text-gray-400 mt-0.5">Datos internos de tu cuenta NX036</p>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "ID de cliente", value: authUser?.id !== undefined ? String(authUser.id) : user.id },
              { label: "Estado", value: "Activo" },
              { label: "Nivel de membresía", value: getMembershipTier(user.loyaltyPoints, tiers)?.name ?? "Bronze" },
              { label: "Tipo de cuenta", value: user.isSeller ? "Vendedor" : "Comprador" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1.5">{label}</p>
                <p className="text-xs text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}