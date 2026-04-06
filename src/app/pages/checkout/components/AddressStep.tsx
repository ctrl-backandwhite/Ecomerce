import {
    ChevronRight, Check, Plus, Truck, Store, Package2, MapPin,
    User, AlertCircle, Clock, Navigation, Building2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { StepBadge, Section } from "./StepIndicator";
import { deliveryMeta, storeLocations, pickupPoints, labelIcon } from "../types";
import type { CheckoutState, CheckoutAction, DeliveryType } from "../types";
import type { UserProfile } from "../../../context/UserContext";

interface AddressStepProps {
    state: CheckoutState;
    dispatch: React.Dispatch<CheckoutAction>;
    user: UserProfile;
    step2Valid: boolean;
    deliverySummary: string;
}

const newModeTabs: { id: DeliveryType; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Domicilio", icon: <Truck className="w-4 h-4" strokeWidth={1.5} /> },
    { id: "store", label: "Tienda NX036", icon: <Store className="w-4 h-4" strokeWidth={1.5} /> },
    { id: "pickup", label: "Punto entrega", icon: <Package2 className="w-4 h-4" strokeWidth={1.5} /> },
];

export function AddressStep({ state, dispatch, user, step2Valid, deliverySummary }: AddressStepProps) {
    const navigate = useNavigate();
    const { step, selectedAddrId, newMode, manualAddr, selectedStoreId, selectedPickupId } = state;

    return (
        <Section>
            <button
                className="w-full flex items-center gap-3 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => step > 1 && dispatch({ type: "SET_STEP", step: 2 })}
            >
                <StepBadge n={2} active={step === 2} done={step > 2 && !!step2Valid} />
                <div className="flex-1">
                    <p className="text-sm text-gray-900">Dirección de entrega</p>
                    {step !== 2 && step2Valid && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{deliverySummary}</p>
                    )}
                </div>
                {step > 2 && <ChevronRight className="w-4 h-4 text-gray-300" strokeWidth={1.5} />}
            </button>

            {step === 2 && (
                <div className="px-6 pb-6 border-t border-gray-50">
                    <div className="pt-5 space-y-3">

                        {/* ── Saved addresses ── */}
                        {user.addresses.length > 0 && (
                            <>
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Mis direcciones guardadas</p>
                                {user.addresses.map((addr) => {
                                    const dt = deliveryMeta[addr.deliveryType ?? "home"];
                                    const isSelected = selectedAddrId === addr.id;
                                    return (
                                        <button
                                            key={addr.id}
                                            type="button"
                                            onClick={() => dispatch({ type: "PATCH", payload: { selectedAddrId: addr.id } })}
                                            className={`w-full text-left rounded-xl border-2 overflow-hidden transition-all ${isSelected ? "border-gray-500" : "border-gray-100 hover:border-gray-300"
                                                }`}
                                        >
                                            <div className={`flex items-center gap-2 px-4 py-1.5 border-b ${isSelected ? "bg-gray-100 border-gray-200" : `${dt.bg} border-gray-100`
                                                }`}>
                                                <span className={isSelected ? "text-gray-700" : dt.color}>{dt.icon}</span>
                                                <span className={`text-xs ${isSelected ? "text-gray-600" : dt.color}`}>{dt.label}</span>
                                                {addr.isDefault && (
                                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full border text-gray-500 bg-white border-gray-200">
                                                        Predeterminada
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`px-4 py-3 flex items-start justify-between gap-4 ${isSelected ? "bg-gray-50" : "bg-white"}`}>
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-gray-500 text-white" : "bg-gray-100 text-gray-500"
                                                        }`}>
                                                        {labelIcon(addr.label)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-gray-900">{addr.label}</p>
                                                        {addr.deliveryType === "home" ? (
                                                            <>
                                                                <p className="text-xs text-gray-500">{addr.name}</p>
                                                                <p className="text-xs text-gray-400">{addr.street}</p>
                                                                <p className="text-xs text-gray-400">{addr.city}, {addr.state} {addr.zip}</p>
                                                                <p className="text-xs text-gray-400">{addr.country}</p>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-start gap-1.5 mt-0.5">
                                                                <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                                                <p className="text-xs text-gray-500">{addr.locationName}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isSelected ? "border-gray-500 bg-gray-500" : "border-gray-200"
                                                    }`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </>
                        )}

                        {/* ── Other delivery options ── */}
                        <div className={`rounded-xl border-2 overflow-hidden transition-all ${selectedAddrId === "new" ? "border-gray-900" : "border-dashed border-gray-200 hover:border-gray-300"
                            }`}>
                            <button
                                type="button"
                                onClick={() => dispatch({ type: "PATCH", payload: { selectedAddrId: "new" } })}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${selectedAddrId === "new" ? "bg-gray-50" : "bg-white hover:bg-gray-50"
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedAddrId === "new" ? "bg-gray-500 text-white" : "bg-gray-100 text-gray-400"
                                    }`}>
                                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">Usar otra dirección de entrega</p>
                                    <p className="text-xs text-gray-400">Domicilio, tienda NX036 o punto de entrega</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selectedAddrId === "new" ? "border-gray-500 bg-gray-500" : "border-gray-200"
                                    }`}>
                                    {selectedAddrId === "new" && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                                </div>
                            </button>

                            {selectedAddrId === "new" && (
                                <div className="border-t border-gray-100 bg-gray-50/50 px-4 pb-5">
                                    {/* Mode tabs */}
                                    <div className="flex gap-2 pt-4 mb-4">
                                        {newModeTabs.map(({ id, label, icon }) => {
                                            const meta = deliveryMeta[id];
                                            const active = newMode === id;
                                            return (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => dispatch({ type: "PATCH", payload: { newMode: id } })}
                                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs transition-all ${active
                                                        ? `border-gray-900 bg-white ${meta.color}`
                                                        : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600"
                                                        }`}
                                                >
                                                    <span className={active ? meta.color : "text-gray-400"}>{icon}</span>
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Home delivery form */}
                                    {newMode === "home" && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1.5">
                                                    <User className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                                                    Full name
                                                </label>
                                                <input
                                                    value={manualAddr.name}
                                                    onChange={(e) => dispatch({ type: "SET_MANUAL_ADDR", payload: { name: e.target.value } })}
                                                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                                    placeholder="Full name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1.5">Street address</label>
                                                <input
                                                    value={manualAddr.street}
                                                    onChange={(e) => dispatch({ type: "SET_MANUAL_ADDR", payload: { street: e.target.value } })}
                                                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                                    placeholder="Street, number, apt / suite"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1.5">City</label>
                                                    <input
                                                        value={manualAddr.city}
                                                        onChange={(e) => dispatch({ type: "SET_MANUAL_ADDR", payload: { city: e.target.value } })}
                                                        className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                                        placeholder="New York"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1.5">State / County</label>
                                                    <input
                                                        value={manualAddr.state}
                                                        onChange={(e) => dispatch({ type: "SET_MANUAL_ADDR", payload: { state: e.target.value } })}
                                                        className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                                        placeholder="NY"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1.5">ZIP / Postcode</label>
                                                    <input
                                                        value={manualAddr.zip}
                                                        onChange={(e) => dispatch({ type: "SET_MANUAL_ADDR", payload: { zip: e.target.value } })}
                                                        className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                                        placeholder="10001"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1.5">Country</label>
                                                    <input
                                                        value={manualAddr.country}
                                                        onChange={(e) => dispatch({ type: "SET_MANUAL_ADDR", payload: { country: e.target.value } })}
                                                        className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 bg-white placeholder-gray-300"
                                                        placeholder="United States"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2 pt-1">
                                                <AlertCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                                <p className="text-xs text-gray-400">
                                                    Para guardar esta dirección,{" "}
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate("/account?tab=addresses")}
                                                        className="underline hover:text-gray-600 transition-colors"
                                                    >
                                                        ve a Mis Direcciones
                                                    </button>.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Store pickup list */}
                                    {newMode === "store" && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-400 mb-1">Selecciona tu tienda NX036 más cercana</p>
                                            {storeLocations.map((store) => {
                                                const isSelected = selectedStoreId === store.id;
                                                return (
                                                    <button
                                                        key={store.id}
                                                        type="button"
                                                        onClick={() => dispatch({ type: "PATCH", payload: { selectedStoreId: store.id } })}
                                                        className={`w-full text-left rounded-xl border-2 px-4 py-3 flex items-start gap-3 transition-all ${isSelected ? "border-violet-500 bg-violet-50/40" : "border-gray-200 bg-white hover:border-violet-300"
                                                            }`}
                                                    >
                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "bg-violet-500 text-white" : "bg-violet-50 text-violet-400"
                                                            }`}>
                                                            <Store className="w-4 h-4" strokeWidth={1.5} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-900">{store.name}</p>
                                                            <div className="flex items-start gap-1 mt-0.5">
                                                                <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                                                <p className="text-xs text-gray-400">{store.address}</p>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                                                                    <span className="text-[11px] text-gray-400">{store.hours}</span>
                                                                </div>
                                                                {store.distance !== "—" && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Navigation className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                                                                        <span className="text-[11px] text-gray-400">{store.distance}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isSelected ? "border-violet-500 bg-violet-500" : "border-gray-200"
                                                            }`}>
                                                            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Pickup point list */}
                                    {newMode === "pickup" && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-400 mb-1">Selecciona un punto de entrega o locker cercano</p>
                                            {pickupPoints.map((point) => {
                                                const isSelected = selectedPickupId === point.id;
                                                return (
                                                    <button
                                                        key={point.id}
                                                        type="button"
                                                        onClick={() => dispatch({ type: "PATCH", payload: { selectedPickupId: point.id } })}
                                                        className={`w-full text-left rounded-xl border-2 px-4 py-3 flex items-start gap-3 transition-all ${isSelected ? "border-emerald-500 bg-emerald-50/40" : "border-gray-200 bg-white hover:border-emerald-300"
                                                            }`}
                                                    >
                                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-400"
                                                            }`}>
                                                            <Package2 className="w-4 h-4" strokeWidth={1.5} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm text-gray-900">{point.name}</p>
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${isSelected
                                                                    ? "text-emerald-700 bg-emerald-100 border-emerald-200"
                                                                    : "text-gray-400 bg-gray-50 border-gray-200"
                                                                    }`}>
                                                                    {point.type}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-start gap-1 mt-0.5">
                                                                <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                                                <p className="text-xs text-gray-400">{point.address}</p>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                                                                    <span className="text-[11px] text-gray-400">{point.hours}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Navigation className="w-3 h-3 text-gray-300" strokeWidth={1.5} />
                                                                    <span className="text-[11px] text-gray-400">{point.distance}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isSelected ? "border-emerald-500 bg-emerald-500" : "border-gray-200"
                                                            }`}>
                                                            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="mt-5 flex justify-end">
                        <button
                            onClick={() => step2Valid && dispatch({ type: "SET_STEP", step: 3 })}
                            disabled={!step2Valid}
                            className={`inline-flex items-center gap-2 text-sm rounded-xl px-5 py-2.5 transition-colors ${step2Valid ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-gray-100 text-gray-300 cursor-not-allowed"
                                }`}
                        >
                            Continuar
                            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            )}
        </Section>
    );
}
