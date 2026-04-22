import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    Layers, Search, Pencil, Trash2, Eye, X, Loader2, Check,
    AlertTriangle, Package, DollarSign, Ruler, Globe, Warehouse,
    ChevronDown, RefreshCw, ExternalLink, Plus, Copy, Upload,
    Filter, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import {
    nexaVariantAdminRepository,
    type VariantPayload,
    type VariantTranslationPayload,
    type VariantInventoryPayload,
} from "../../repositories/NexaVariantAdminRepository";
import type { ProductVariant, VariantTranslation, VariantInventory } from "../../repositories/NexaProductAdminRepository";
import { Pagination } from "../../components/admin/Pagination";
import { BulkUploadModal } from "../../components/admin/BulkUploadModal";

// ── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({
    status,
    onClick,
    loading: toggling,
}: {
    status: string;
    onClick?: () => void;
    loading?: boolean;
}) {
    const isPublished = status === "PUBLISHED";
    const clickable = !!onClick;
    return (
        <button
            type="button"
            disabled={toggling}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            className={`inline-flex items-center justify-center text-[10px] leading-none min-w-[62px] px-2 py-1 rounded-full font-medium transition-all duration-200 ${isPublished
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                } ${clickable ? "cursor-pointer hover:ring-2 hover:shadow-sm" : "cursor-default"} ${toggling ? "opacity-50" : ""
                }`}
        >
            {toggling ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" strokeWidth={1.5} />
            ) : null}
            {isPublished ? "Publicado" : "Borrador"}
        </button>
    );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type TabId = "general" | "precios" | "dimensiones" | "traducciones" | "inventarios";

const TABS: { id: TabId; label: string; icon: typeof Package }[] = [
    { id: "general", label: "General", icon: Package },
    { id: "precios", label: "Precios", icon: DollarSign },
    { id: "dimensiones", label: "Dimensiones", icon: Ruler },
    { id: "traducciones", label: "Traducciones", icon: Globe },
    { id: "inventarios", label: "Inventarios", icon: Warehouse },
];

// ── Form types ────────────────────────────────────────────────────────────────

interface VariantForm {
    pid: string;
    variantNameEn: string;
    variantSku: string;
    variantUnit: string;
    variantKey: string;
    variantImage: string;
    variantSellPrice: string;
    variantSugSellPrice: string;
    variantLength: string;
    variantWidth: string;
    variantHeight: string;
    variantVolume: string;
    variantWeight: string;
    variantStandard: string;
    translations: { locale: string; variantName: string }[];
    inventories: {
        id: number | null;
        countryCode: string;
        totalInventory: string;
        cjInventory: string;
        factoryInventory: string;
        verifiedWarehouse: string;
    }[];
}

function variantToForm(v: ProductVariant): VariantForm {
    return {
        pid: v.pid,
        variantNameEn: v.variantNameEn || "",
        variantSku: v.variantSku || "",
        variantUnit: v.variantUnit || "",
        variantKey: v.variantKey || "",
        variantImage: v.variantImage || "",
        variantSellPrice: v.variantSellPrice?.toString() || "",
        variantSugSellPrice: v.variantSugSellPrice?.toString() || "",
        variantLength: v.variantLength?.toString() || "",
        variantWidth: v.variantWidth?.toString() || "",
        variantHeight: v.variantHeight?.toString() || "",
        variantVolume: v.variantVolume?.toString() || "",
        variantWeight: v.variantWeight?.toString() || "",
        variantStandard: v.variantStandard || "",
        translations: v.translations?.length
            ? v.translations.map(t => ({ locale: t.locale, variantName: t.variantName || "" }))
            : [{ locale: "en", variantName: v.variantNameEn || "" }],
        inventories: v.inventories?.length
            ? v.inventories.map(inv => ({
                id: inv.id ?? null,
                countryCode: inv.countryCode || "",
                totalInventory: inv.totalInventory?.toString() || "0",
                cjInventory: inv.cjInventory?.toString() || "0",
                factoryInventory: inv.factoryInventory?.toString() || "0",
                verifiedWarehouse: inv.verifiedWarehouse?.toString() || "0",
            }))
            : [],
    };
}

function formToPayload(f: VariantForm): VariantPayload {
    const num = (s: string) => { const n = parseFloat(s); return isNaN(n) ? null : n; };
    return {
        pid: f.pid,
        variantNameEn: f.variantNameEn || undefined,
        variantSku: f.variantSku || undefined,
        variantUnit: f.variantUnit || undefined,
        variantKey: f.variantKey || undefined,
        variantImage: f.variantImage || undefined,
        variantSellPrice: num(f.variantSellPrice),
        variantSugSellPrice: num(f.variantSugSellPrice),
        variantLength: num(f.variantLength),
        variantWidth: num(f.variantWidth),
        variantHeight: num(f.variantHeight),
        variantVolume: num(f.variantVolume),
        variantWeight: num(f.variantWeight),
        variantStandard: f.variantStandard || null,
        translations: f.translations
            .filter(t => t.locale.trim())
            .map(t => ({ locale: t.locale, variantName: t.variantName || null })),
        inventories: f.inventories
            .filter(inv => inv.countryCode.trim())
            .map(inv => ({
                id: inv.id,
                countryCode: inv.countryCode,
                totalInventory: parseInt(inv.totalInventory) || 0,
                cjInventory: parseInt(inv.cjInventory) || 0,
                factoryInventory: parseInt(inv.factoryInventory) || 0,
                verifiedWarehouse: parseInt(inv.verifiedWarehouse) || 0,
            })),
    };
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

function VariantDetail({ variant, onClose, onEdit }: {
    variant: ProductVariant;
    onClose: () => void;
    onEdit: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
            <div className="bg-white w-full max-w-md h-full overflow-y-auto border-l border-gray-100 shadow-xl animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4 z-10">
                    <div>
                        <h2 className="text-sm text-gray-900">Detalle de variante</h2>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{variant.vid}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                            <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Image */}
                    {variant.variantImage && (
                        <div className="w-full h-48 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                            <img src={variant.variantImage} alt={variant.variantSku} className="max-w-full max-h-full object-contain p-4" />
                        </div>
                    )}

                    {/* General */}
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Información general</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-gray-400">Nombre:</span> <span className="text-gray-700">{variant.variantNameEn || "—"}</span></div>
                            <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-gray-400">SKU:</span> <span className="text-gray-700 font-mono">{variant.variantSku || "—"}</span></div>
                            <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-gray-400">Key:</span> <span className="text-gray-700">{variant.variantKey || "—"}</span></div>
                            <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-gray-400">Unidad:</span> <span className="text-gray-700">{variant.variantUnit || "—"}</span></div>
                            <div className="bg-gray-50 rounded-lg p-2.5 col-span-2"><span className="text-gray-400">Estándar:</span> <span className="text-gray-700">{variant.variantStandard || "—"}</span></div>
                        </div>
                    </div>

                    {/* Prices */}
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Precios</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-gray-400">Venta:</span> <span className="text-gray-900 font-medium">${variant.variantSellPrice?.toFixed(2) || "—"}</span></div>
                            <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-gray-400">Sugerido:</span> <span className="text-gray-700">${variant.variantSugSellPrice?.toFixed(2) || "—"}</span></div>
                        </div>
                    </div>

                    {/* Dimensions */}
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Dimensiones</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-gray-400">Largo:</span> <span className="text-gray-700">{variant.variantLength ?? "—"}</span></div>
                            <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-gray-400">Ancho:</span> <span className="text-gray-700">{variant.variantWidth ?? "—"}</span></div>
                            <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-gray-400">Alto:</span> <span className="text-gray-700">{variant.variantHeight ?? "—"}</span></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                            <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-gray-400">Volumen:</span> <span className="text-gray-700">{variant.variantVolume ?? "—"}</span></div>
                            <div className="bg-gray-50 rounded-lg p-2.5"><span className="text-gray-400">Peso:</span> <span className="text-gray-700">{variant.variantWeight ?? "—"} kg</span></div>
                        </div>
                    </div>

                    {/* Translations */}
                    {variant.translations?.length > 0 && (
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Traducciones ({variant.translations.length})</p>
                            <div className="space-y-1.5">
                                {variant.translations.map((t, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                                        <span className="text-[10px] text-gray-400 uppercase w-8">{t.locale}</span>
                                        <span className="text-xs text-gray-700">{t.variantName || "—"}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Inventories */}
                    {variant.inventories?.length > 0 && (
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Inventarios ({variant.inventories.length})</p>
                            <div className="space-y-2">
                                {variant.inventories.map((inv, i) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1">
                                        <p className="text-xs text-gray-700 font-medium">{inv.countryCode || "—"}</p>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                                            <span>Total: {inv.totalInventory}</span>
                                            <span>CJ: {inv.cjInventory}</span>
                                            <span>Fábrica: {inv.factoryInventory}</span>
                                            <span>Verificado: {inv.verifiedWarehouse}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-4 space-y-1">
                        <p>Creado (CJ): {variant.createTime ? new Date(variant.createTime).toLocaleString() : "—"}</p>
                        <p>Creado: {variant.createdAt ? new Date(variant.createdAt).toLocaleString() : "—"}</p>
                        <p>Actualizado: {variant.updatedAt ? new Date(variant.updatedAt).toLocaleString() : "—"}</p>
                        <p className="font-mono">PID: {variant.pid}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

const EMPTY_FORM: VariantForm = {
    pid: "",
    variantNameEn: "",
    variantSku: "",
    variantUnit: "",
    variantKey: "",
    variantImage: "",
    variantSellPrice: "",
    variantSugSellPrice: "",
    variantLength: "",
    variantWidth: "",
    variantHeight: "",
    variantVolume: "",
    variantWeight: "",
    variantStandard: "",
    translations: [{ locale: "en", variantName: "" }],
    inventories: [],
};

function VariantModal({ variant, onSave, onCreate, onClose, mode = "edit", initialData }: {
    variant?: ProductVariant;
    onSave?: (vid: string, payload: VariantPayload) => Promise<void>;
    onCreate?: (payload: VariantPayload) => Promise<void>;
    onClose: () => void;
    mode?: "edit" | "create";
    initialData?: VariantForm;
}) {
    const [tab, setTab] = useState<TabId>("general");
    const [form, setForm] = useState<VariantForm>(
        initialData ? initialData : mode === "edit" && variant ? variantToForm(variant) : EMPTY_FORM
    );
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof VariantForm>(k: K, v: VariantForm[K]) =>
        setForm(f => ({ ...f, [k]: v }));

    function validate(): boolean {
        if (!form.pid) { toast.error("El PID es obligatorio"); return false; }
        if (mode === "create" && !form.variantNameEn && !form.variantSku) {
            toast.error("Ingresa al menos un nombre o SKU"); return false;
        }
        return true;
    }

    async function handleSave() {
        if (!validate()) return;
        setSaving(true);
        try {
            if (mode === "create" && onCreate) {
                await onCreate(formToPayload(form));
            } else if (mode === "edit" && onSave && variant) {
                await onSave(variant.vid, formToPayload(form));
            }
        } finally {
            setSaving(false);
        }
    }

    // ── Translation helpers ──
    function setTranslation(idx: number, field: "locale" | "variantName", value: string) {
        const updated = [...form.translations];
        updated[idx] = { ...updated[idx], [field]: value };
        set("translations", updated);
    }
    function addTranslation() {
        set("translations", [...form.translations, { locale: "", variantName: "" }]);
    }
    function removeTranslation(idx: number) {
        if (form.translations.length <= 1) return;
        set("translations", form.translations.filter((_, i) => i !== idx));
    }

    // ── Inventory helpers ──
    function setInventory(idx: number, field: string, value: string) {
        const updated = [...form.inventories];
        updated[idx] = { ...updated[idx], [field]: value };
        set("inventories", updated);
    }
    function addInventory() {
        set("inventories", [...form.inventories, {
            id: null, countryCode: "", totalInventory: "0",
            cjInventory: "0", factoryInventory: "0", verifiedWarehouse: "0",
        }]);
    }
    function removeInventory(idx: number) {
        set("inventories", form.inventories.filter((_, i) => i !== idx));
    }

    const field = "w-full text-xs text-gray-900 border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white";
    const lbl = "block text-xs text-gray-400 mb-1.5";
    const section = "space-y-4";

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 bg-black/50 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-3xl overflow-hidden mb-6">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm text-gray-900">{mode === "create" ? "Nueva variante" : "Editar variante"}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {mode === "create" ? "Crea una variante para un producto existente" : (variant?.variantSku || variant?.variantNameEn || variant?.vid)}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-gray-100 px-4 gap-1 scrollbar-hide">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex items-center gap-1.5 text-xs px-3 py-3 border-b-2 whitespace-nowrap transition-all ${tab === id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"}`}
                        >
                            <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                    {/* ── GENERAL ── */}
                    {tab === "general" && (
                        <div className={section}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className={lbl}>PID (Product ID) {mode === "create" && <span className="text-red-400">*</span>}</label>
                                    <input
                                        value={form.pid}
                                        onChange={e => set("pid", e.target.value)}
                                        className={`${field} ${mode === "edit" ? "bg-gray-50 text-gray-400" : ""}`}
                                        placeholder="Ej: 1E0115B5-60F4-4099-AF1D-..."
                                        readOnly={mode === "edit"}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className={lbl}>Nombre (EN)</label>
                                    <input value={form.variantNameEn} onChange={e => set("variantNameEn", e.target.value)} className={field} placeholder="Variant name" />
                                </div>
                                <div>
                                    <label className={lbl}>SKU</label>
                                    <input value={form.variantSku} onChange={e => set("variantSku", e.target.value)} className={field} placeholder="SKU" />
                                </div>
                                <div>
                                    <label className={lbl}>Unidad</label>
                                    <input value={form.variantUnit} onChange={e => set("variantUnit", e.target.value)} className={field} placeholder="pcs, kg..." />
                                </div>
                                <div>
                                    <label className={lbl}>Clave</label>
                                    <input value={form.variantKey} onChange={e => set("variantKey", e.target.value)} className={field} placeholder="Variant key" />
                                </div>
                                <div>
                                    <label className={lbl}>Estándar</label>
                                    <input value={form.variantStandard} onChange={e => set("variantStandard", e.target.value)} className={field} placeholder="Estándar" />
                                </div>
                                <div className="col-span-2">
                                    <label className={lbl}>Imagen URL</label>
                                    <input value={form.variantImage} onChange={e => set("variantImage", e.target.value)} className={field} placeholder="https://..." />
                                    {form.variantImage && (
                                        <div className="mt-2 w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                            <img src={form.variantImage} alt="preview" className="w-full h-full object-contain p-1" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PRECIOS ── */}
                    {tab === "precios" && (
                        <div className={section}>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={lbl}>Precio de venta</label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                        <input value={form.variantSellPrice} onChange={e => set("variantSellPrice", e.target.value)} className={`${field} pl-6`} placeholder="0.00" type="number" step="0.01" />
                                    </div>
                                </div>
                                <div>
                                    <label className={lbl}>Precio sugerido</label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                        <input value={form.variantSugSellPrice} onChange={e => set("variantSugSellPrice", e.target.value)} className={`${field} pl-6`} placeholder="0.00" type="number" step="0.01" />
                                    </div>
                                </div>
                            </div>
                            {/* Margin indicator */}
                            {form.variantSellPrice && form.variantSugSellPrice && (() => {
                                const sell = parseFloat(form.variantSellPrice);
                                const sug = parseFloat(form.variantSugSellPrice);
                                if (!isNaN(sell) && !isNaN(sug) && sell > 0) {
                                    const margin = ((sug - sell) / sug * 100).toFixed(1);
                                    return (
                                        <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs text-gray-500 flex items-center gap-2">
                                            <DollarSign className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                                            Margen estimado: <span className="text-gray-900 font-medium">{margin}%</span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    )}

                    {/* ── DIMENSIONES ── */}
                    {tab === "dimensiones" && (
                        <div className={section}>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={lbl}>Largo</label>
                                    <input value={form.variantLength} onChange={e => set("variantLength", e.target.value)} className={field} placeholder="0.00" type="number" step="0.01" />
                                </div>
                                <div>
                                    <label className={lbl}>Ancho</label>
                                    <input value={form.variantWidth} onChange={e => set("variantWidth", e.target.value)} className={field} placeholder="0.00" type="number" step="0.01" />
                                </div>
                                <div>
                                    <label className={lbl}>Alto</label>
                                    <input value={form.variantHeight} onChange={e => set("variantHeight", e.target.value)} className={field} placeholder="0.00" type="number" step="0.01" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={lbl}>Volumen</label>
                                    <input value={form.variantVolume} onChange={e => set("variantVolume", e.target.value)} className={field} placeholder="0.00" type="number" step="0.01" />
                                </div>
                                <div>
                                    <label className={lbl}>Peso (kg)</label>
                                    <input value={form.variantWeight} onChange={e => set("variantWeight", e.target.value)} className={field} placeholder="0.00" type="number" step="0.01" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TRADUCCIONES ── */}
                    {tab === "traducciones" && (
                        <div className={section}>
                            {form.translations.map((t, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <div className="w-20 flex-shrink-0">
                                        <label className={lbl}>Locale</label>
                                        <input value={t.locale} onChange={e => setTranslation(i, "locale", e.target.value)} className={field} placeholder="en" maxLength={5} />
                                    </div>
                                    <div className="flex-1">
                                        <label className={lbl}>Nombre</label>
                                        <input value={t.variantName} onChange={e => setTranslation(i, "variantName", e.target.value)} className={field} placeholder="Nombre traducido" />
                                    </div>
                                    <button
                                        onClick={() => removeTranslation(i)}
                                        disabled={form.translations.length <= 1}
                                        className="mt-6 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addTranslation} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 mt-2">
                                <span className="text-lg leading-none">+</span> Agregar traducción
                            </button>
                        </div>
                    )}

                    {/* ── INVENTARIOS ── */}
                    {tab === "inventarios" && (
                        <div className={section}>
                            {form.inventories.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Warehouse className="w-8 h-8 text-gray-300 mb-2" strokeWidth={1.5} />
                                    <p className="text-xs text-gray-400">Sin inventarios registrados</p>
                                </div>
                            )}
                            {form.inventories.map((inv, i) => (
                                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-700 font-medium">Inventario {i + 1}</p>
                                        <button onClick={() => removeInventory(i)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                        </button>
                                    </div>
                                    <div>
                                        <label className={lbl}>Código de país</label>
                                        <input value={inv.countryCode} onChange={e => setInventory(i, "countryCode", e.target.value)} className={field} placeholder="US, CN..." maxLength={5} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={lbl}>Total</label>
                                            <input value={inv.totalInventory} onChange={e => setInventory(i, "totalInventory", e.target.value)} className={field} type="number" />
                                        </div>
                                        <div>
                                            <label className={lbl}>CJ</label>
                                            <input value={inv.cjInventory} onChange={e => setInventory(i, "cjInventory", e.target.value)} className={field} type="number" />
                                        </div>
                                        <div>
                                            <label className={lbl}>Fábrica</label>
                                            <input value={inv.factoryInventory} onChange={e => setInventory(i, "factoryInventory", e.target.value)} className={field} type="number" />
                                        </div>
                                        <div>
                                            <label className={lbl}>Verificado</label>
                                            <input value={inv.verifiedWarehouse} onChange={e => setInventory(i, "verifiedWarehouse", e.target.value)} className={field} type="number" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addInventory} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 mt-2">
                                <span className="text-lg leading-none">+</span> Agregar inventario
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={saving} className="text-xs text-white bg-gray-900 rounded-xl px-4 py-2 hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                        {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                        {mode === "create" ? "Crear" : "Guardar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// ██  AdminVariants – Main page
// ══════════════════════════════════════════════════════════════════════════════

export function AdminVariants() {
    const { t } = useLanguage();
    // ── State ──
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // ── Filter state ──
    const [statusFilter, setStatusFilter] = useState<"" | "DRAFT" | "PUBLISHED">("");
    const [sortBy, setSortBy] = useState("");
    const [ascending, setAscending] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [pageSize, setPageSize] = useState(20);

    const activeFiltersCount = [statusFilter, sortBy].filter(Boolean).length;

    // Modals / drawers
    const [modal, setModal] = useState<ProductVariant | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [cloneData, setCloneData] = useState<VariantForm | null>(null);
    const [detail, setDetail] = useState<ProductVariant | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showBulk, setShowBulk] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    const allSelected = variants.length > 0 && variants.every(v => selectedIds.has(v.vid));

    function toggleSelect(vid: string) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(vid)) next.delete(vid); else next.add(vid);
            return next;
        });
    }
    function toggleSelectAll() {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(variants.map(v => v.vid)));
        }
    }

    // ── Fetch variants (paginated + server-side search/filters) ──
    const fetchVariants = useCallback(async (p: number, q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await nexaVariantAdminRepository.findAllPaged(
                p, pageSize, q, statusFilter || undefined, sortBy || undefined, ascending,
            );
            setVariants(data.content);
            setPage(data.currentPage);
            setTotalElements(data.totalElements);
            setTotalPages(data.totalPages);
        } catch (err: any) {
            setError(err.message || "Error al cargar variantes");
            setVariants([]);
        } finally {
            setLoading(false);
        }
    }, [pageSize, statusFilter, sortBy, ascending]);

    useEffect(() => {
        fetchVariants(0);
    }, [fetchVariants]);

    // ── Debounced search ──
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    function handleSearchChange(value: string) {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchVariants(0, value);
        }, 400);
    }

    // ── Actions ──
    async function handleCreate(payload: VariantPayload) {
        try {
            await nexaVariantAdminRepository.createVariant(payload);
            toast.success("Variante creada");
            setShowCreate(false);
            fetchVariants(0, search);
        } catch (err: any) {
            toast.error(err.message || "Error al crear variante");
        }
    }

    async function handleSave(vid: string, payload: VariantPayload) {
        try {
            await nexaVariantAdminRepository.updateVariant(vid, payload);
            toast.success("Variante actualizada");
            setModal(null);
            fetchVariants(page, search);
        } catch (err: any) {
            toast.error(err.message || "Error al actualizar");
        }
    }

    async function handleDelete(vid: string) {
        setActionLoading(true);
        try {
            await nexaVariantAdminRepository.deleteVariant(vid);
            toast.success("Variante eliminada");
            setDeleteId(null);
            fetchVariants(page, search);
        } catch (err: any) {
            toast.error(err.message || "Error al eliminar");
        } finally {
            setActionLoading(false);
        }
    }

    function handleEditFromDetail() {
        if (detail) { setModal(detail); setDetail(null); }
    }

    function handleClone(v: ProductVariant) {
        const cloned = variantToForm(v);
        cloned.variantNameEn = cloned.variantNameEn ? cloned.variantNameEn + " (Copia)" : "(Copia)";
        cloned.variantSku = "";
        cloned.inventories = cloned.inventories.map(inv => ({ ...inv, id: null }));
        setCloneData(cloned);
        setShowCreate(true);
    }

    async function handleTogglePublish(vid: string) {
        if (togglingId) return;
        setTogglingId(vid);
        try {
            await nexaVariantAdminRepository.togglePublish(vid);
            toast.success("Estado actualizado");
            fetchVariants(page, search);
        } catch (err: any) {
            toast.error(err.message || "Error al cambiar estado");
        } finally {
            setTogglingId(null);
        }
    }

    async function handleBulkDelete() {
        if (selectedIds.size === 0) return;
        setActionLoading(true);
        try {
            await nexaVariantAdminRepository.deleteVariants([...selectedIds]);
            toast.success(`${selectedIds.size} variante${selectedIds.size > 1 ? "s" : ""} eliminada${selectedIds.size > 1 ? "s" : ""}`);
            setSelectedIds(new Set());
            setShowBulkDeleteConfirm(false);
            fetchVariants(page, search);
        } catch (err: any) {
            toast.error(err.message || "Error al eliminar variantes");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleBulkStatus(status: "DRAFT" | "PUBLISHED") {
        if (selectedIds.size === 0) return;
        setActionLoading(true);
        try {
            await nexaVariantAdminRepository.bulkUpdateStatus([...selectedIds], status);
            const label = status === "PUBLISHED" ? "publicada" : "como borrador";
            toast.success(`${selectedIds.size} variante${selectedIds.size > 1 ? "s" : ""} ${label}${selectedIds.size > 1 ? "s" : ""}`);
            setSelectedIds(new Set());
            fetchVariants(page, search);
        } catch (err: any) {
            toast.error(err.message || "Error al cambiar estado");
        } finally {
            setActionLoading(false);
        }
    }

    return (
        <div className="h-full flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Layers className="w-7 h-7 text-indigo-600" />
                        Variantes
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        {totalElements} variante{totalElements !== 1 ? "s" : ""} en catálogo
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchVariants(page, search)}
                        disabled={loading}
                        className="w-9 h-9 bg-white border border-gray-200 text-gray-500 rounded-full hover:bg-gray-50 transition-all flex items-center justify-center"
                        title="Recargar"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={() => setShowBulk(true)}
                        className="w-9 h-9 bg-white border border-gray-200 text-gray-500 rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center"
                        title="Carga masiva"
                    >
                        <Upload className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
                        title="Nueva variante"
                    >
                        <Plus className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            {/* Search + Filter toggle row */}
            <div className="flex items-center gap-3 mb-3">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" strokeWidth={1.5} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => handleSearchChange(e.target.value)}
                        className="w-full text-xs text-gray-900 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                        placeholder="Buscar por nombre, SKU, VID o PID..."
                    />
                    {search && (
                        <button
                            onClick={() => { setSearch(""); fetchVariants(0); }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                    )}
                </div>
                {/* Filter toggle */}
                <button
                    onClick={() => setShowFilters(v => !v)}
                    className={`flex items-center gap-1.5 text-xs border rounded-xl px-4 py-2.5 transition-colors flex-shrink-0 ${showFilters || activeFiltersCount > 0
                        ? "border-gray-400 text-gray-700 bg-gray-50"
                        : "border-gray-200 text-gray-400 hover:bg-gray-50"
                        }`}
                >
                    <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Filtros
                    {activeFiltersCount > 0 && (
                        <span className="ml-1 w-4 h-4 bg-gray-700 text-white text-[9px] rounded-full flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4 space-y-4">
                    {/* Row 1: Status pills */}
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Estado</p>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { value: "" as const, label: "Todos" },
                                { value: "PUBLISHED" as const, label: "Publicado" },
                                { value: "DRAFT" as const, label: "Borrador" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setStatusFilter(opt.value); setPage(0); }}
                                    className={`text-[11px] px-3 py-1.5 rounded-full transition-all ${statusFilter === opt.value
                                        ? "bg-gray-700 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Row 2: Sort + Per page + Clear */}
                    <div className="flex flex-wrap items-end gap-6 border-t border-gray-200 pt-4">
                        {/* Sort by */}
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Ordenar por</p>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-gray-400"
                            >
                                <option value="">—</option>
                                <option value="createdAt">Fecha creación</option>
                                <option value="updatedAt">Fecha actualización</option>
                                <option value="variantSellPrice">Precio venta</option>
                                <option value="variantSku">SKU</option>
                                <option value="variantNameEn">Nombre</option>
                            </select>
                        </div>

                        {/* Ascending/Descending */}
                        <div>
                            <button
                                onClick={() => setAscending(v => !v)}
                                className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:border-gray-300 transition-colors"
                            >
                                {ascending
                                    ? <><ToggleRight className="w-3.5 h-3.5 text-green-500" strokeWidth={1.5} /> Ascendente</>
                                    : <><ToggleLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> Descendente</>
                                }
                            </button>
                        </div>

                        {/* Per page */}
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Por página</p>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-gray-400"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        {/* Clear all */}
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={() => { setStatusFilter(""); setSortBy(""); setAscending(false); }}
                                className="text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    {error}
                    <button onClick={() => fetchVariants(page, search)} className="ml-auto text-red-500 hover:text-red-700 underline">Reintentar</button>
                </div>
            )}

            {/* Content area */}
            <div className="flex-1 overflow-auto space-y-2 pr-1 relative">

                {/* Selection toolbar */}
                {variants.length > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-100 rounded-xl">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="w-3.5 h-3.5 rounded-[4px] border-gray-300 text-indigo-600 focus:ring-1 focus:ring-indigo-400 focus:ring-offset-0 cursor-pointer accent-indigo-600"
                            />
                            <span className="text-[11px] text-gray-400">
                                {selectedIds.size > 0
                                    ? `${selectedIds.size} seleccionado${selectedIds.size > 1 ? "s" : ""}`
                                    : "Todos"}
                            </span>
                        </label>
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-1.5 ml-auto">
                                <button
                                    onClick={() => handleBulkStatus("PUBLISHED")}
                                    className="flex items-center gap-1 text-[11px] text-emerald-600 border border-emerald-200 rounded-lg px-2.5 py-1 hover:bg-emerald-50 transition-colors"
                                >
                                    <Check className="w-3 h-3" strokeWidth={2} />
                                    Publicar
                                </button>
                                <button
                                    onClick={() => handleBulkStatus("DRAFT")}
                                    className="flex items-center gap-1 text-[11px] text-amber-600 border border-amber-200 rounded-lg px-2.5 py-1 hover:bg-amber-50 transition-colors"
                                >
                                    <Pencil className="w-3 h-3" strokeWidth={2} />
                                    Borrador
                                </button>
                                <button
                                    onClick={() => setShowBulkDeleteConfirm(true)}
                                    className="flex items-center gap-1 text-[11px] text-red-500 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" strokeWidth={2} />
                                    Eliminar
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Loading state */}
                {loading && variants.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Loader2 className="w-6 h-6 text-gray-300 animate-spin mb-3" strokeWidth={1.5} />
                        <p className="text-sm text-gray-400">Cargando variantes…</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && variants.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-xl text-center">
                        <Layers className="w-8 h-8 text-gray-200 mb-3" strokeWidth={1.5} />
                        <p className="text-sm text-gray-400">{search ? "No se encontraron variantes" : "No hay variantes registradas"}</p>
                    </div>
                )}

                {/* Loading overlay for page transitions */}
                {loading && variants.length > 0 && (
                    <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-50/90 border border-blue-100 rounded-xl backdrop-blur-sm">
                        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" strokeWidth={1.5} />
                        <span className="text-xs text-blue-600">Cargando…</span>
                    </div>
                )}

                {/* Variant rows */}
                {variants.map(v => {
                    const isExpanded = expandedId === v.vid;
                    return (
                        <div
                            key={v.vid}
                            className="bg-white border border-gray-100 rounded-xl overflow-hidden transition-all hover:border-gray-200 hover:shadow-sm"
                        >
                            {/* Main row */}
                            <div className="flex items-center gap-3 px-4 py-3">
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(v.vid)}
                                    onChange={() => toggleSelect(v.vid)}
                                    className="w-3.5 h-3.5 rounded-[4px] border-gray-300 text-indigo-600 focus:ring-1 focus:ring-indigo-400 focus:ring-offset-0 cursor-pointer accent-indigo-600 flex-shrink-0"
                                />
                                {/* Image */}
                                <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {v.variantImage ? (
                                        <img src={v.variantImage} alt={v.variantSku} className="w-full h-full object-contain p-0.5" />
                                    ) : (
                                        <Layers className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
                                    )}
                                </div>

                                {/* Info */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setExpandedId(isExpanded ? null : v.vid)}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedId(isExpanded ? null : v.vid); }}
                                    className="flex-1 min-w-0 text-left group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-1">
                                            {v.variantNameEn || "Sin nombre"}
                                        </p>
                                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                            ${v.variantSellPrice?.toFixed(2) || "—"}
                                        </span>
                                        {v.variantSku && (
                                            <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                                {v.variantSku}
                                            </span>
                                        )}
                                        <StatusBadge
                                            status={v.status || "DRAFT"}
                                            onClick={() => handleTogglePublish(v.vid)}
                                            loading={togglingId === v.vid}
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-0.5 truncate flex items-center gap-1">
                                        VID: {v.vid}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(v.vid);
                                                toast.success("VID copiado");
                                            }}
                                            className="inline-flex items-center justify-center w-4 h-4 text-gray-300 hover:text-gray-600 transition-colors rounded"
                                            title="Copiar VID"
                                        >
                                            <Copy className="w-3 h-3" strokeWidth={1.5} />
                                        </button>
                                        {" · PID: "}{v.pid?.slice(0, 8)}…
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(v.pid);
                                                toast.success("PID copiado");
                                            }}
                                            className="inline-flex items-center justify-center w-4 h-4 text-gray-300 hover:text-gray-600 transition-colors rounded"
                                            title="Copiar PID"
                                        >
                                            <Copy className="w-3 h-3" strokeWidth={1.5} />
                                        </button>
                                        {v.inventories && v.inventories.length > 0 && (
                                            <> · {v.inventories.length} inventario{v.inventories.length !== 1 ? "s" : ""}</>
                                        )}
                                    </p>
                                </div>

                                {/* View detail */}
                                <button
                                    onClick={() => setDetail(v)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex-shrink-0"
                                    title="Ver detalle"
                                >
                                    <Eye className="w-4 h-4" strokeWidth={1.5} />
                                </button>

                                {/* Edit */}
                                <button
                                    onClick={() => setModal(v)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors flex-shrink-0"
                                    title="Editar"
                                >
                                    <Pencil className="w-4 h-4" strokeWidth={1.5} />
                                </button>

                                {/* Clone */}
                                <button
                                    onClick={() => handleClone(v)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors flex-shrink-0"
                                    title="Clonar"
                                >
                                    <Copy className="w-4 h-4" strokeWidth={1.5} />
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => setDeleteId(v.vid)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                </button>

                                {/* Expand/collapse */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : v.vid)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                                >
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                        strokeWidth={1.5}
                                    />
                                </button>
                            </div>

                            {/* Expanded detail */}
                            {isExpanded && (
                                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 space-y-4">
                                    {/* Metadata grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Precio venta</p>
                                            <p className="text-xs text-gray-700 tabular-nums">${v.variantSellPrice?.toFixed(2) || "—"}</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Precio sug.</p>
                                            <p className="text-xs text-gray-700 tabular-nums">${v.variantSugSellPrice?.toFixed(2) || "—"}</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Peso</p>
                                            <p className="text-xs text-gray-700">{v.variantWeight ?? "—"} kg</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Inventarios</p>
                                            <p className="text-xs text-gray-700">{v.inventories?.length || 0}</p>
                                        </div>
                                    </div>

                                    {/* Extra info */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Unidad</p>
                                            <p className="text-xs text-gray-700">{v.variantUnit || "—"}</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Key</p>
                                            <p className="text-xs text-gray-700 font-mono">{v.variantKey || "—"}</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">SKU</p>
                                            <p className="text-xs text-gray-700 font-mono">{v.variantSku || "—"}</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">PID</p>
                                            <p className="text-xs text-gray-700 font-mono truncate max-w-[140px]" title={v.pid}>{v.pid}</p>
                                        </div>
                                    </div>

                                    {/* Translations */}
                                    {v.translations && v.translations.length > 0 && (
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Traducciones</p>
                                            <div className="flex flex-wrap gap-2">
                                                {v.translations.map((t) => (
                                                    <div
                                                        key={t.locale}
                                                        className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5"
                                                    >
                                                        <span className="text-[10px] text-gray-400 uppercase font-mono">{t.locale}</span>
                                                        <span className="text-xs text-gray-700">{t.variantName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
                <div className="mt-3">
                    <Pagination
                        page={page + 1}
                        totalPages={totalPages}
                        total={totalElements}
                        pageSize={pageSize}
                        onChange={(p) => fetchVariants(p - 1, search)}
                    />
                </div>
            )}

            {/* ── Modals ── */}
            {showCreate && (
                <VariantModal
                    mode="create"
                    onCreate={handleCreate}
                    onClose={() => { setShowCreate(false); setCloneData(null); }}
                    initialData={cloneData ?? undefined}
                />
            )}

            {modal && (
                <VariantModal
                    variant={modal}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}

            {detail && (
                <VariantDetail
                    variant={detail}
                    onClose={() => setDetail(null)}
                    onEdit={handleEditFromDetail}
                />
            )}

            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-sm text-gray-900 mb-2">¿Eliminar variante?</h3>
                        <p className="text-xs text-gray-400 mb-6">Esta acción no se puede deshacer. Se eliminarán también las traducciones e inventarios de esta variante.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                disabled={actionLoading}
                                className="flex-1 text-xs text-gray-500 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                disabled={actionLoading}
                                className="flex-1 text-xs text-white bg-red-500 rounded-xl py-2.5 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                                {actionLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal */}
            <BulkUploadModal
                open={showBulk}
                onClose={() => setShowBulk(false)}
                entityType="variants"
                onUpload={async (rows) => {
                    const payload = rows.map(r => r as unknown as import("../../repositories/NexaVariantAdminRepository").VariantPayload);
                    return nexaVariantAdminRepository.bulkCreate(payload);
                }}
                onSuccess={() => fetchVariants(0, search)}
            />

            {/* Bulk Delete Confirm */}
            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-sm text-gray-900 mb-2">¿Eliminar {selectedIds.size} variante{selectedIds.size > 1 ? "s" : ""}?</h3>
                        <p className="text-xs text-gray-400 mb-6">Esta acción no se puede deshacer. Se eliminarán también las traducciones e inventarios de todas las variantes seleccionadas.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBulkDeleteConfirm(false)}
                                disabled={actionLoading}
                                className="flex-1 text-xs text-gray-500 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={actionLoading}
                                className="flex-1 text-xs text-white bg-red-500 rounded-xl py-2.5 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                                {actionLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                Eliminar ({selectedIds.size})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
