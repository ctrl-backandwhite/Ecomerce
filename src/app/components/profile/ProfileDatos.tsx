import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { Save, Edit3 } from "lucide-react";
import { toast } from "sonner";

const docTypes = [
  { value: "dni",      label: "Driver's License",  placeholder: "e.g. D123-4567-8901" },
  { value: "passport", label: "Passport",           placeholder: "e.g. US-A12345678"   },
  { value: "ce",       label: "National ID Card",   placeholder: "e.g. GB-AB123456C"   },
  { value: "other",    label: "Other",              placeholder: "Document number"      },
];

export function ProfileDatos() {
  const { user, updateProfile } = useUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName:      user.firstName,
    lastName:       user.lastName,
    username:       user.username,
    email:          user.email,
    phone:          user.phone,
    birthDate:      user.birthDate,
    documentType:   user.documentType,
    documentNumber: user.documentNumber,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = () => {
    updateProfile(form);
    setEditing(false);
    toast.success("Perfil actualizado correctamente");
  };

  const handleCancel = () => {
    setForm({
      firstName:      user.firstName,
      lastName:       user.lastName,
      username:       user.username,
      email:          user.email,
      phone:          user.phone,
      birthDate:      user.birthDate,
      documentType:   user.documentType,
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
  }: {
    label: string;
    name: string;
    type?: string;
    value: string;
    span2?: boolean;
  }) => (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs text-gray-400 mb-1 tracking-wide">{label}</label>
      {editing ? (
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
            ? new Date(value + "T00:00:00").toLocaleDateString("es-CL", {
                day: "numeric", month: "long", year: "numeric",
              })
            : value}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-5 flex flex-col h-full">

      {/* ── Card: NEXA Rewards ─────────────────────────────────── */}
      <div className="bg-gray-900 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs tracking-widest text-gray-400 uppercase">Puntos</span>
          <span className="text-xs text-gray-400">NEXA Rewards</span>
        </div>
        <p className="text-3xl text-white mb-1">{user.loyaltyPoints.toLocaleString()}</p>
        <p className="text-xs text-gray-400">puntos disponibles</p>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Nivel Plata</span>
            <span>5.000 pts → Oro</span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${Math.min((user.loyaltyPoints / 5000) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

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
              <Edit3 className="w-4 h-4" strokeWidth={1.5} />
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
                className="inline-flex items-center gap-2 text-sm text-white bg-gray-900 rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors"
              >
                <Save className="w-4 h-4" strokeWidth={1.5} />
                Guardar
              </button>
            </div>
          )}
        </div>

        {/* Name + member since centered */}
        <div className="px-6 py-6 border-b border-gray-100 flex flex-col items-center text-center flex-shrink-0">
          <p className="text-sm text-gray-900 mb-1">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-gray-400">
            Miembro desde{" "}
            {new Date(user.memberSince).toLocaleDateString("es-CL", {
              month: "long", year: "numeric",
            })}
          </p>
          {editing && (
            <button className="mt-3 text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              Cambiar foto
            </button>
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
                    {docTypes.map((dt) => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-gray-900 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
                    {docTypes.find((d) => d.value === user.documentType)?.label ?? "—"}
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
            <Field label="Nombre"             name="firstName" value={form.firstName} />
            <Field label="Apellido"            name="lastName"  value={form.lastName} />
            <Field label="Nombre de usuario"   name="username"  value={form.username} />
            <Field label="Correo electrónico"  name="email"     type="email" value={form.email} />
            <Field label="Teléfono"            name="phone"     value={form.phone} />
            <Field label="Fecha de nacimiento" name="birthDate" type="date" value={form.birthDate} />
          </div>
        </div>
      </div>

      {/* ── Card: Información de cuenta ─────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base text-gray-900">Información de cuenta</h2>
          <p className="text-xs text-gray-400 mt-0.5">Datos internos de tu cuenta NEXA</p>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "ID de cliente",      value: user.id },
              { label: "Estado",             value: "Activo" },
              { label: "Nivel de membresía", value: "Plata" },
              { label: "Tipo de cuenta",     value: user.isSeller ? "Vendedor" : "Comprador" },
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