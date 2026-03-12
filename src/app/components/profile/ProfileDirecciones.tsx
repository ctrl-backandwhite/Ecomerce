import { useState } from "react";
import { useUser, Address } from "../../context/UserContext";
import {
  MapPin, Plus, Edit3, Trash2, Check, Home, Briefcase,
  Truck, Store, Package2, ChevronRight, Clock, Phone,
  Search, X, Info, Building2,
} from "lucide-react";
import { toast } from "sonner";

/* ── Delivery type config ────────────────────────────────── */
type DeliveryType = "home" | "store" | "pickup";

const deliveryTypes: {
  id: DeliveryType;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "home",
    label: "Envío a domicilio",
    sublabel: "Recibe en la dirección que prefieras",
    icon: <Truck className="w-5 h-5" strokeWidth={1.5} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    id: "store",
    label: "Recogida en tienda",
    sublabel: "Retira gratis en cualquier tienda NEXA",
    icon: <Store className="w-5 h-5" strokeWidth={1.5} />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  {
    id: "pickup",
    label: "Punto de entrega",
    sublabel: "Operadores logísticos oficiales",
    icon: <Package2 className="w-5 h-5" strokeWidth={1.5} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
];

/* ── Mock NEXA stores ────────────────────────────────────── */
interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  phone: string;
  badge?: string;
}

const nexaStores: Location[] = [
  { id: "s1", name: "NEXA Manhattan",       address: "350 Fifth Avenue, Suite 210",    city: "New York, NY",      hours: "Mon–Sat 10:00–20:00, Sun 11:00–18:00", phone: "+1 212 555 0101", badge: "Flagship" },
  { id: "s2", name: "NEXA Beverly Hills",   address: "9500 Wilshire Blvd",              city: "Los Angeles, CA",   hours: "Mon–Sat 10:00–21:00, Sun 11:00–19:00", phone: "+1 310 555 0182" },
  { id: "s3", name: "NEXA Chicago Loop",    address: "111 N State Street",              city: "Chicago, IL",       hours: "Mon–Sat 10:00–20:00, Sun 12:00–18:00", phone: "+1 312 555 0143" },
  { id: "s4", name: "NEXA Oxford Street",   address: "374 Oxford Street",               city: "London, W1C 1JX",   hours: "Mon–Sat 09:30–21:00, Sun 12:00–18:00", phone: "+44 20 7946 0301", badge: "Flagship" },
  { id: "s5", name: "NEXA Manchester",      address: "18 Market Street",                city: "Manchester, M1 1PT",hours: "Mon–Sat 10:00–20:00, Sun 11:00–17:00", phone: "+44 161 496 0210" },
  { id: "s6", name: "NEXA Edinburgh",       address: "93 Princes Street",               city: "Edinburgh, EH2 2ER",hours: "Mon–Sat 10:00–19:30, Sun 12:00–17:00", phone: "+44 131 496 0145" },
];

/* ── Mock pickup points ──────────────────────────────────── */
interface PickupOperator {
  id: string;
  name: string;
  logo: string;
  description: string;
  points: Location[];
}

const pickupOperators: PickupOperator[] = [
  {
    id: "ups",
    name: "UPS Access Point",
    logo: "UPS",
    description: "Over 40,000 access points across the US and UK",
    points: [
      { id: "ups1", name: "UPS – Midtown Manhattan",  address: "630 Lexington Ave",            city: "New York, NY 10022",    hours: "Mon–Fri 8:00–19:00, Sat 9:00–15:00", phone: "+1 800 742 5877" },
      { id: "ups2", name: "UPS – Downtown Chicago",   address: "77 W Wacker Dr, Suite 100",    city: "Chicago, IL 60601",     hours: "Mon–Fri 8:30–18:30, Sat 9:00–14:00", phone: "+1 800 742 5877" },
      { id: "ups3", name: "UPS – London Victoria",    address: "14 Buckingham Palace Rd",      city: "London, SW1W 0QP",      hours: "Mon–Fri 8:00–18:30, Sat 9:00–14:00", phone: "+44 345 787 7877" },
    ],
  },
  {
    id: "fedex",
    name: "FedEx On-site",
    logo: "FDX",
    description: "Nationwide FedEx drop-off & collection network",
    points: [
      { id: "fdx1", name: "FedEx – Sunset Blvd",      address: "8500 Sunset Blvd",             city: "Los Angeles, CA 90069", hours: "Mon–Fri 8:00–19:00, Sat 9:00–15:00", phone: "+1 800 463 3339" },
      { id: "fdx2", name: "FedEx – Houston Galleria",  address: "5085 Westheimer Rd",           city: "Houston, TX 77056",     hours: "Mon–Fri 8:30–18:30, Sat 9:00–14:00", phone: "+1 800 463 3339" },
      { id: "fdx3", name: "FedEx – Birmingham UK",     address: "126 Colmore Row",              city: "Birmingham, B3 3AP",    hours: "Mon–Fri 9:00–18:00, Sat 9:00–13:00", phone: "+44 345 600 0068" },
    ],
  },
  {
    id: "royalmail",
    name: "Royal Mail / USPS",
    logo: "RM",
    description: "Official postal service collection offices",
    points: [
      { id: "rm1", name: "USPS – Grand Central",       address: "450 Lexington Ave",            city: "New York, NY 10017",    hours: "Mon–Fri 9:00–18:00",                  phone: "+1 800 275 8777" },
      { id: "rm2", name: "USPS – State Street",        address: "211 S State Street",           city: "Chicago, IL 60604",     hours: "Mon–Fri 8:30–17:30",                  phone: "+1 800 275 8777" },
      { id: "rm3", name: "Royal Mail – Trafalgar Sq",  address: "24–28 William IV Street",      city: "London, WC2N 4DL",      hours: "Mon–Fri 8:30–18:30, Sat 9:00–13:00", phone: "+44 345 722 3344" },
    ],
  },
];

/* ── Reusable location card ──────────────────────────────── */
function LocationCard({
  location,
  selected,
  onSelect,
  badgeColor,
}: {
  location: Location;
  selected: boolean;
  onSelect: () => void;
  badgeColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
          : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm text-gray-900">{location.name}</p>
            {location.badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${badgeColor ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                {location.badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
            <p className="text-xs text-gray-500 truncate">{location.address}, {location.city}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
              <p className="text-[11px] text-gray-400">{location.hours}</p>
            </div>
          </div>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
          selected ? "border-gray-900 bg-gray-900" : "border-gray-200"
        }`}>
          {selected && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
        </div>
      </div>
    </button>
  );
}

/* ── Address Form ────────────────────────────────────────── */
type FormState = {
  label: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
  deliveryType: DeliveryType;
  locationId: string;
  locationName: string;
};

const emptyForm: FormState = {
  label: "",
  name: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  isDefault: false,
  deliveryType: "home",
  locationId: "",
  locationName: "",
};

function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [storeSearch, setStoreSearch] = useState("");
  const [expandedOperator, setExpandedOperator] = useState<string | null>("chilexpress");

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const setDelivery = (type: DeliveryType) =>
    setForm((f) => ({ ...f, deliveryType: type, locationId: "", locationName: "" }));

  const selectLocation = (locId: string, locName: string) =>
    setForm((f) => ({ ...f, locationId: locId, locationName: locName }));

  const filteredStores = nexaStores.filter(
    (s) =>
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.city.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const canSave = () => {
    if (form.deliveryType === "home") {
      return form.label && form.name && form.street && form.city;
    }
    return form.label && form.locationId;
  };

  const activeType = deliveryTypes.find((d) => d.id === form.deliveryType)!;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
      {/* Step 1 – Tipo de entrega */}
      <div className="p-5 border-b border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
          1. Tipo de entrega
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {deliveryTypes.map((dt) => (
            <button
              key={dt.id}
              type="button"
              onClick={() => setDelivery(dt.id)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                form.deliveryType === dt.id
                  ? `${dt.border} ${dt.bg}`
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                form.deliveryType === dt.id ? `${dt.bg} ${dt.color}` : "bg-gray-100 text-gray-400"
              }`}>
                {dt.icon}
              </div>
              <div>
                <p className={`text-xs mb-0.5 ${form.deliveryType === dt.id ? dt.color : "text-gray-700"}`}>
                  {dt.label}
                </p>
                <p className="text-[11px] text-gray-400 leading-tight">{dt.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 – Etiqueta + nombre */}
      <div className="p-5 border-b border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
          2. Identificación
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Etiqueta</label>
            <input
              name="label"
              value={form.label}
              onChange={change}
              placeholder="Ej: Casa, Trabajo…"
              className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
            />
          </div>
          {form.deliveryType === "home" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Nombre del destinatario</label>
              <input
                name="name"
                value={form.name}
                onChange={change}
                placeholder="Nombre completo"
                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
              />
            </div>
          )}
        </div>
      </div>

      {/* Step 3 – Dirección / Tienda / Punto */}
      <div className="p-5 border-b border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
          3. {form.deliveryType === "home" ? "Dirección de envío" : form.deliveryType === "store" ? "Selecciona una tienda NEXA" : "Selecciona un punto de entrega"}
        </p>

        {/* ── HOME: address fields ── */}
        {form.deliveryType === "home" && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Street address", name: "street",  col: "col-span-2", placeholder: "Street, number, apt / suite" },
              { label: "City",           name: "city",    col: "col-span-1", placeholder: "New York" },
              { label: "State / County", name: "state",   col: "col-span-1", placeholder: "NY" },
              { label: "ZIP / Postcode", name: "zip",     col: "col-span-1", placeholder: "10001" },
              { label: "Country",        name: "country", col: "col-span-1", placeholder: "United States" },
            ].map(({ label, name, col, placeholder }) => (
              <div key={name} className={col}>
                <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
                <input
                  name={name}
                  value={String(form[name as keyof FormState])}
                  onChange={change}
                  placeholder={placeholder}
                  className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                />
              </div>
            ))}
          </div>
        )}

        {/* ── STORE: NEXA store picker ── */}
        {form.deliveryType === "store" && (
          <div className="space-y-3">
            {/* Info banner */}
            <div className="flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-lg p-3">
              <Info className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-xs text-violet-600">
                Recogida gratuita. Tu pedido estará listo para retirar en un plazo de 24–48 h hábiles tras la confirmación.
              </p>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
              <input
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                placeholder="Buscar tienda o ciudad…"
                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
              />
              {storeSearch && (
                <button onClick={() => setStoreSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                </button>
              )}
            </div>
            {/* Store list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredStores.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No se encontraron tiendas</p>
              ) : (
                filteredStores.map((store) => (
                  <LocationCard
                    key={store.id}
                    location={store}
                    selected={form.locationId === store.id}
                    onSelect={() => selectLocation(store.id, store.name)}
                    badgeColor="bg-violet-50 text-violet-600 border-violet-200"
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── PICKUP: operator + points ── */}
        {form.deliveryType === "pickup" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <Info className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-xs text-emerald-700">
                Puntos de entrega oficiales asociados a NEXA. Recoge con tu RUT y código de pedido.
              </p>
            </div>

            {pickupOperators.map((op) => (
              <div key={op.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                {/* Operator header */}
                <button
                  type="button"
                  onClick={() => setExpandedOperator(expandedOperator === op.id ? null : op.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white tracking-wider">{op.logo}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{op.name}</p>
                    <p className="text-xs text-gray-400">{op.description}</p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expandedOperator === op.id ? "rotate-90" : ""}`}
                    strokeWidth={1.5}
                  />
                </button>

                {/* Operator points */}
                {expandedOperator === op.id && (
                  <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
                    {op.points.map((point) => (
                      <LocationCard
                        key={point.id}
                        location={point}
                        selected={form.locationId === point.id}
                        onSelect={() => selectLocation(point.id, `${op.name} – ${point.name}`)}
                        badgeColor="bg-emerald-50 text-emerald-600 border-emerald-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 4 – Options */}
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            className="rounded border-gray-300"
          />
          Establecer como predeterminada
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => canSave() && onSave(form)}
            disabled={!canSave()}
            className={`inline-flex items-center gap-2 text-sm rounded-lg px-4 py-2 transition-colors ${
              canSave()
                ? "text-white bg-gray-900 hover:bg-gray-800"
                : "text-gray-300 bg-gray-100 cursor-not-allowed"
            }`}
          >
            <Check className="w-4 h-4" strokeWidth={1.5} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Address Card (display) ──────────────────────────────── */
function AddressCard({
  addr,
  onEdit,
  onRemove,
  onSetDefault,
}: {
  addr: Address;
  onEdit: () => void;
  onRemove: () => void;
  onSetDefault: () => void;
}) {
  const labelIcon = (label: string) => {
    if (label.toLowerCase() === "casa")    return <Home className="w-4 h-4" strokeWidth={1.5} />;
    if (label.toLowerCase() === "trabajo") return <Briefcase className="w-4 h-4" strokeWidth={1.5} />;
    return <MapPin className="w-4 h-4" strokeWidth={1.5} />;
  };

  const dt = deliveryTypes.find((d) => d.id === addr.deliveryType) ?? deliveryTypes[0];

  return (
    <div className={`group border rounded-xl overflow-hidden transition-all ${addr.isDefault ? "border-gray-900" : "border-gray-100 hover:border-gray-200"}`}>
      {/* Delivery type badge bar */}
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${addr.isDefault ? "border-gray-800 bg-gray-900" : `border-gray-100 ${dt.bg}`}`}>
        <span className={`${addr.isDefault ? "text-white" : dt.color}`}>{dt.icon}</span>
        <span className={`text-xs ${addr.isDefault ? "text-gray-300" : dt.color}`}>{dt.label}</span>
        {addr.isDefault && (
          <span className="ml-auto text-[10px] text-gray-400 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
            Predeterminada
          </span>
        )}
      </div>

      <div className={`p-4 ${addr.isDefault ? "bg-gray-50" : "bg-white"}`}>
        <div className="flex items-start justify-between gap-4">
          {/* Info */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${addr.isDefault ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
              {labelIcon(addr.label)}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-900 mb-0.5">{addr.label}</p>

              {addr.deliveryType === "home" ? (
                <>
                  <p className="text-sm text-gray-600">{addr.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{addr.street}</p>
                  <p className="text-xs text-gray-400">{addr.city}, {addr.state}</p>
                  {addr.zip && <p className="text-xs text-gray-400">CP {addr.zip} · {addr.country}</p>}
                </>
              ) : (
                <div className="flex items-start gap-1.5 mt-0.5">
                  <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-xs text-gray-500">{addr.locationName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Editar"
            >
              <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            {!addr.isDefault && (
              <button
                onClick={onRemove}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {!addr.isDefault && (
          <button
            onClick={onSetDefault}
            className="mt-3 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Establecer como predeterminada
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export function ProfileDirecciones() {
  const { user, addAddress, updateAddress, removeAddress } = useUser();
  const [showAdd, setShowAdd]     = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = (form: FormState) => {
    addAddress(form);
    setShowAdd(false);
    toast.success("Dirección añadida correctamente");
  };

  const handleUpdate = (id: string, form: FormState) => {
    updateAddress(id, form);
    setEditingId(null);
    toast.success("Dirección actualizada correctamente");
  };

  const handleRemove = (id: string) => {
    removeAddress(id);
    toast.success("Dirección eliminada");
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h2 className="text-base text-gray-900">Mis Direcciones</h2>
          <p className="text-xs text-gray-400 mt-0.5">{user.addresses.length} dirección{user.addresses.length !== 1 ? "es" : ""} guardada{user.addresses.length !== 1 ? "s" : ""}</p>
        </div>
        {!showAdd && (
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); }}
            className="inline-flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Nueva dirección
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Add form */}
        {showAdd && (
          <AddressForm
            initial={emptyForm}
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {/* Address list */}
        {user.addresses.map((addr) =>
          editingId === addr.id ? (
            <AddressForm
              key={addr.id}
              initial={{
                label: addr.label,
                name: addr.name,
                street: addr.street,
                city: addr.city,
                state: addr.state,
                zip: addr.zip,
                country: addr.country,
                isDefault: addr.isDefault,
                deliveryType: addr.deliveryType ?? "home",
                locationId: addr.locationId ?? "",
                locationName: addr.locationName ?? "",
              }}
              onSave={(form) => handleUpdate(addr.id, form)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <AddressCard
              key={addr.id}
              addr={addr}
              onEdit={() => { setEditingId(addr.id); setShowAdd(false); }}
              onRemove={() => handleRemove(addr.id)}
              onSetDefault={() => updateAddress(addr.id, { isDefault: true })}
            />
          )
        )}

        {/* Empty state */}
        {user.addresses.length === 0 && !showAdd && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-500">No tienes direcciones guardadas</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 inline-flex items-center gap-2 text-sm text-white bg-gray-900 rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              Añadir primera dirección
            </button>
          </div>
        )}
      </div>
    </div>
  );
}