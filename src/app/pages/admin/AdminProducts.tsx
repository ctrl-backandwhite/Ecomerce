import { useState, useEffect, useMemo } from "react";
import {
    Search, Plus, Pencil, Trash2, Eye, X, Check,
    Package, ChevronDown, Filter, ArrowUpDown,
    Heart, ShoppingCart, Image, AlertTriangle,
    Tag, Truck, Globe, DollarSign, BarChart2,
    RefreshCw, Loader2, Copy, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "../../components/admin/Pagination";
import { BulkUploadModal } from "../../components/admin/BulkUploadModal";
import { useAdminProducts } from "../../services/useAdminProducts";
import { useLanguage } from "../../context/LanguageContext";
import {
    nexaProductAdminRepository,
    type AdminProduct,
    type ProductPayload,
    type AdminProductQuery,
} from "../../repositories/NexaProductAdminRepository";
import {
    nexaCategoryPagedRepository,
    type PagedCategory,
} from "../../repositories/NexaCategoryPagedRepository";


// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
    { id: "general", label: "General", icon: Package },
    { id: "precios", label: "Precios", icon: DollarSign },
    { id: "inventario", label: "Inventario", icon: BarChart2 },
    { id: "imagenes", label: "Imágenes", icon: Image },
    { id: "envio", label: "Envío", icon: Truck },
    { id: "traducciones", label: "Idiomas", icon: Globe },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ label, variant }: { label: string; variant: "green" | "amber" | "red" | "gray" }) {
    const cls = {
        green: "bg-green-50 text-green-700",
        amber: "bg-amber-50 text-amber-700",
        red: "bg-red-50 text-red-700",
        gray: "bg-gray-100 text-gray-500",
    }[variant];
    return <span className={`text-[10px] px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function stockVariant(stock: number): "green" | "amber" | "red" {
    if (stock > 20) return "green";
    if (stock > 5) return "amber";
    return "red";
}

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

// ── Form types ───────────────────────────────────────────────────────────────
interface TranslationRow { locale: string; name: string }

interface ProductForm {
    sku: string;
    categoryId: string;
    bigImage: string;
    sellPrice: string;
    productType: string;
    listedNum: number;
    warehouseInventoryNum: number;
    isVideo: boolean;
    translations: TranslationRow[];
}

function makeEmptyForm(): ProductForm {
    return {
        sku: "", categoryId: "", bigImage: "", sellPrice: "", productType: "NORMAL",
        listedNum: 0, warehouseInventoryNum: 0, isVideo: false,
        translations: [{ locale: "es", name: "" }],
    };
}

function productToForm(p: AdminProduct): ProductForm {
    return {
        sku: p.sku || "",
        categoryId: p.categoryId || "",
        bigImage: p.bigImage || "",
        sellPrice: p.sellPrice || "",
        productType: p.productType || "NORMAL",
        listedNum: p.listedNum || 0,
        warehouseInventoryNum: p.warehouseInventoryNum || 0,
        isVideo: p.isVideo || false,
        translations: p.translations?.length
            ? p.translations.map(t => ({ locale: t.locale, name: t.name }))
            : [{ locale: "es", name: p.name || "" }],
    };
}

function formToPayload(form: ProductForm): ProductPayload {
    return {
        sku: form.sku || undefined,
        categoryId: form.categoryId,
        bigImage: form.bigImage || undefined,
        sellPrice: form.sellPrice || undefined,
        productType: form.productType || undefined,
        listedNum: form.listedNum,
        warehouseInventoryNum: form.warehouseInventoryNum,
        isVideo: form.isVideo,
        translations: form.translations.filter(t => t.name.trim()),
    };
}

/* ── Product Preview Modal ────────────────────────────────── */
function ProductPreview({ product, categoryName, onClose }: {
    product: AdminProduct;
    categoryName?: string;
    onClose: () => void;
}) {
    const price = parseFloat(product.sellPrice) || 0;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-gray-50 rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
                    <div>
                        <h2 className="text-sm text-gray-900">Vista previa</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">Cómo se verá en la tienda</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </div>
                <div className="p-5">
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="relative h-56 bg-white overflow-hidden">
                            {product.bigImage ? (
                                <img src={product.bigImage} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                    <Package className="w-12 h-12 text-gray-200" strokeWidth={1.5} />
                                </div>
                            )}
                            <button className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors z-10">
                                <Heart className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4">
                            {categoryName && (
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{categoryName}</div>
                            )}
                            <h3 className="text-base mb-2 line-clamp-2">{product.name}</h3>
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-2xl text-gray-900">${price.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                                <span>SKU: {product.sku || "—"}</span>
                                <span>·</span>
                                <span>Stock: {product.warehouseInventoryNum}</span>
                            </div>
                            {product.variants && product.variants.length > 0 && (
                                <div className="text-xs text-gray-400 mb-3">
                                    {product.variants.length} variante{product.variants.length > 1 ? "s" : ""}
                                </div>
                            )}
                            <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                Agregar al carrito
                            </button>
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-400 text-center mt-4">Vista previa del producto en la tienda</p>
                </div>
            </div>
        </div>
    );
}

/* ── Product Detail Drawer ────────────────────────────────── */
function ProductDetail({ product, categoryName, onClose, onEdit }: {
    product: AdminProduct;
    categoryName?: string;
    onClose: () => void;
    onEdit: () => void;
}) {
    const price = parseFloat(product.sellPrice) || 0;
    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
            <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-sm text-gray-900">Detalle del producto</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={onEdit} className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors">
                            <Pencil className="w-3 h-3" strokeWidth={1.5} /> Editar
                        </button>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                            <X className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Image */}
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                        {product.bigImage ? (
                            <img src={product.bigImage} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-16 h-16 text-gray-200" strokeWidth={1} />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        <h3 className="text-lg text-gray-900 mb-1">{product.name}</h3>
                        {categoryName && <p className="text-xs text-gray-400">{categoryName}</p>}
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Precio</p>
                            <p className="text-lg text-gray-900">${price.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Stock</p>
                            <p className="text-lg text-gray-900">{product.warehouseInventoryNum}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">SKU</p>
                            <p className="text-sm text-gray-700 font-mono">{product.sku || "—"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Tipo</p>
                            <p className="text-sm text-gray-700">{product.productType || "—"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Listados</p>
                            <p className="text-sm text-gray-700">{product.listedNum}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Video</p>
                            <p className="text-sm text-gray-700">{product.isVideo ? "Sí" : "No"}</p>
                        </div>
                    </div>

                    {/* Translations */}
                    {product.translations && product.translations.length > 0 && (
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Traducciones</p>
                            <div className="space-y-1">
                                {product.translations.map(t => (
                                    <div key={t.locale} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                                        <span className="text-gray-400 uppercase font-mono w-8">{t.locale}</span>
                                        <span className="text-gray-700">{t.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Variants */}
                    {product.variants && product.variants.length > 0 && (
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Variantes ({product.variants.length})</p>
                            <div className="space-y-2">
                                {product.variants.map(v => (
                                    <div key={v.vid} className="bg-gray-50 rounded-xl p-3 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-700 font-medium">{v.variantNameEn || v.variantSku}</span>
                                            <span className="text-xs text-gray-900">${v.variantSellPrice?.toFixed(2) || "—"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                            {v.variantSku && <span>SKU: {v.variantSku}</span>}
                                            {v.variantKey && <span>Key: {v.variantKey}</span>}
                                            {v.variantWeight > 0 && <span>{v.variantWeight}kg</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-4 space-y-1">
                        <p>Creado: {product.createdAt ? new Date(product.createdAt).toLocaleString() : "—"}</p>
                        <p>Actualizado: {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : "—"}</p>
                        <p className="font-mono">ID: {product.id}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Product Modal (tabbed) ───────────────────────────────── */
function ProductModal({ product, onSave, onClose, categories, initialForm }: {
    product: AdminProduct | null;
    onSave: (payload: ProductPayload, id?: string) => Promise<void>;
    onClose: () => void;
    categories: PagedCategory[];
    initialForm?: ProductForm;
}) {
    const isNew = !product;
    const [tab, setTab] = useState<TabId>("general");
    const [form, setForm] = useState<ProductForm>(
        initialForm ? initialForm : product ? productToForm(product) : makeEmptyForm(),
    );
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
        setForm(f => ({ ...f, [k]: v }));

    function validate(): boolean {
        const firstName = form.translations[0]?.name?.trim();
        if (!firstName) { toast.error("El nombre es obligatorio"); setTab("general"); return false; }
        if (!form.categoryId) { toast.error("Selecciona una categoría"); setTab("general"); return false; }
        return true;
    }

    async function handleSave() {
        if (!validate()) return;
        setSaving(true);
        try {
            await onSave(formToPayload(form), product?.id);
        } finally {
            setSaving(false);
        }
    }

    // ── Translation helpers ──
    function setTranslation(idx: number, field: "locale" | "name", value: string) {
        const updated = [...form.translations];
        updated[idx] = { ...updated[idx], [field]: value };
        set("translations", updated);
    }

    function addTranslation() {
        set("translations", [...form.translations, { locale: "", name: "" }]);
    }

    function removeTranslation(idx: number) {
        if (form.translations.length <= 1) return;
        set("translations", form.translations.filter((_, i) => i !== idx));
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
                        <h2 className="text-sm text-gray-900">{isNew ? "Nuevo producto" : "Editar producto"}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {isNew ? "Completa los datos del producto" : `Editando: ${product?.name}`}
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
                            className={`flex items-center gap-1.5 text-xs px-3 py-3 border-b-2 whitespace-nowrap transition-all ${tab === id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"
                                }`}
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
                                    <label className={lbl}>Nombre del producto * (idioma principal)</label>
                                    <input
                                        value={form.translations[0]?.name || ""}
                                        onChange={e => setTranslation(0, "name", e.target.value)}
                                        className={field}
                                        placeholder="Ej: Camiseta de algodón orgánico"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={lbl}>SKU</label>
                                    <input value={form.sku} onChange={e => set("sku", e.target.value)} className={field} placeholder="SKU-001" />
                                </div>
                                <div>
                                    <label className={lbl}>Tipo de producto</label>
                                    <div className="relative">
                                        <select value={form.productType} onChange={e => set("productType", e.target.value)} className={`${field} appearance-none pr-8`}>
                                            <option value="NORMAL">Normal</option>
                                            <option value="VARIATION">Con variantes</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className={lbl}>Categoría *</label>
                                <div className="relative">
                                    <select value={form.categoryId} onChange={e => set("categoryId", e.target.value)} className={`${field} appearance-none pr-8`}>
                                        <option value="">Seleccionar categoría...</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {"—".repeat(c.level - 1)} {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div
                                        onClick={() => set("isVideo", !form.isVideo)}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${form.isVideo ? "bg-gray-500" : "bg-gray-200"}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${form.isVideo ? "left-5" : "left-0.5"}`} />
                                    </div>
                                    <span className="text-xs text-gray-600">Tiene video</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* ── PRECIOS ── */}
                    {tab === "precios" && (
                        <div className={section}>
                            <div>
                                <label className={lbl}>Precio de venta (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                    <input
                                        type="number"
                                        value={form.sellPrice}
                                        onChange={e => set("sellPrice", e.target.value)}
                                        className={`${field} pl-6`}
                                        placeholder="0.00"
                                        min={0}
                                        step={0.01}
                                    />
                                </div>
                            </div>
                            {product?.variants && product.variants.length > 0 && (
                                <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
                                    <p>Las variantes tienen precios individuales (solo lectura, provienen de CJ).</p>
                                    <div className="mt-2 space-y-1">
                                        {product.variants.map((v, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span>{v.variantSku || v.variantNameEn || `Variante ${i + 1}`}</span>
                                                <span className="text-gray-700">${v.variantSellPrice?.toFixed(2) || "0.00"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── INVENTARIO ── */}
                    {tab === "inventario" && (
                        <div className={section}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={lbl}>Inventario en almacén</label>
                                    <input
                                        type="number"
                                        value={form.warehouseInventoryNum || ""}
                                        onChange={e => set("warehouseInventoryNum", parseInt(e.target.value) || 0)}
                                        className={field}
                                        placeholder="0"
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label className={lbl}>Cantidad listada</label>
                                    <input
                                        type="number"
                                        value={form.listedNum || ""}
                                        onChange={e => set("listedNum", parseInt(e.target.value) || 0)}
                                        className={field}
                                        placeholder="0"
                                        min={0}
                                    />
                                </div>
                            </div>

                            {/* Stock status badge */}
                            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${form.warehouseInventoryNum > 20 ? "bg-green-400" :
                                    form.warehouseInventoryNum > 0 ? "bg-amber-400" : "bg-red-400"
                                    }`} />
                                <div className="text-xs">
                                    <p className="text-gray-700">
                                        {form.warehouseInventoryNum > 20 ? "Stock suficiente" :
                                            form.warehouseInventoryNum > 0 ? "Stock bajo" : "Sin stock"}
                                    </p>
                                    <p className="text-gray-400 mt-0.5">{form.warehouseInventoryNum} unidades en almacén</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── IMÁGENES ── */}
                    {tab === "imagenes" && (
                        <div className={section}>
                            <div>
                                <label className={lbl}>URL de imagen principal</label>
                                <input
                                    value={form.bigImage}
                                    onChange={e => set("bigImage", e.target.value)}
                                    className={field}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                            </div>
                            {form.bigImage ? (
                                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                    <img
                                        src={form.bigImage}
                                        alt="Imagen principal"
                                        className="w-full h-full object-cover"
                                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Image className="w-10 h-10 text-gray-300 mb-2" strokeWidth={1.5} />
                                    <p className="text-xs text-gray-400">No hay imagen. Ingresa una URL arriba.</p>
                                </div>
                            )}

                            {product?.variants && product.variants.length > 0 && (
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Imágenes de variantes (solo lectura)</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {product.variants.filter(v => v.variantImage).map((v, i) => (
                                            <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                <img src={v.variantImage} alt={v.variantSku} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── ENVÍO ── */}
                    {tab === "envio" && (
                        <div className={section}>
                            {product?.variants && product.variants.length > 0 ? (
                                <>
                                    <p className="text-xs text-gray-500 mb-2">Dimensiones y peso de las variantes (solo lectura, provienen de CJ).</p>
                                    {product.variants.map((v, vi) => (
                                        <div key={vi} className="border border-gray-200 rounded-xl p-4 space-y-3">
                                            <p className="text-xs text-gray-700">{v.variantSku || v.variantNameEn || `Variante ${vi + 1}`}</p>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <span className="text-gray-400">Peso:</span> <span className="text-gray-700">{v.variantWeight} kg</span>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <span className="text-gray-400">Unidad:</span> <span className="text-gray-700">{v.variantUnit}</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 text-xs">
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <span className="text-gray-400">Largo:</span> <span className="text-gray-700">{v.variantLength}</span>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <span className="text-gray-400">Ancho:</span> <span className="text-gray-700">{v.variantWidth}</span>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <span className="text-gray-400">Alto:</span> <span className="text-gray-700">{v.variantHeight}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Truck className="w-10 h-10 text-gray-300 mb-2" strokeWidth={1.5} />
                                    <p className="text-xs text-gray-400">Sin variantes. Las dimensiones y peso se obtienen al importar el detalle desde CJ.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TRADUCCIONES ── */}
                    {tab === "traducciones" && (
                        <div className={section}>
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">
                                    Traducciones del producto ({form.translations.length})
                                </p>
                                <button onClick={addTranslation} className="flex items-center gap-1 text-xs text-gray-700 bg-gray-200 rounded-xl px-3 py-2 hover:bg-gray-300 transition-colors">
                                    <Plus className="w-3 h-3" strokeWidth={2} /> Agregar idioma
                                </button>
                            </div>
                            <div className="space-y-2">
                                {form.translations.map((t, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                        <input
                                            value={t.locale}
                                            onChange={e => setTranslation(i, "locale", e.target.value)}
                                            className={`${field} w-20`}
                                            placeholder="es"
                                        />
                                        <input
                                            value={t.name}
                                            onChange={e => setTranslation(i, "name", e.target.value)}
                                            className={`${field} flex-1`}
                                            placeholder="Nombre del producto en este idioma"
                                        />
                                        {form.translations.length > 1 && (
                                            <button onClick={() => removeTranslation(i)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                                                <X className="w-3.5 h-3.5" strokeWidth={2} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
                                <p>Idiomas comunes: <span className="font-mono">es</span> (Español), <span className="font-mono">en</span> (Inglés), <span className="font-mono">pt-BR</span> (Portugués)</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button onClick={onClose} className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-white transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={1.5} />}
                        {isNew ? "Crear producto" : "Guardar cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   ██  Main AdminProducts page
   ══════════════════════════════════════════════════════════════ */
export function AdminProducts() {
    const { locale } = useLanguage();
    const apiLocale = locale === "pt" ? "pt-BR" : locale;

    // ── Filters ─────────────────────────────────────────────────
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [searchTimerId, setSearchTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [catFilter, setCatFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<"" | "DRAFT" | "PUBLISHED">("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [ascending, setAscending] = useState(false);
    const [pageSize, setPageSize] = useState(15);
    const [showFilters, setShowFilters] = useState(false);

    function handleSearchChange(value: string) {
        setSearchInput(value);
        if (searchTimerId) clearTimeout(searchTimerId);
        setSearchTimerId(setTimeout(() => setDebouncedSearch(value), 400));
    }

    const activeFiltersCount = [catFilter, statusFilter].filter(Boolean).length + (debouncedSearch ? 1 : 0);

    function clearFilters() {
        setSearchInput("");
        setDebouncedSearch("");
        setCatFilter("");
        setStatusFilter("");
        setSortBy("createdAt");
        setAscending(false);
    }

    const query = useMemo<AdminProductQuery>(() => ({
        categoryId: catFilter || undefined,
        status: statusFilter || undefined,
        name: debouncedSearch.trim() || undefined,
        size: pageSize,
        sortBy,
        ascending,
    }), [catFilter, statusFilter, debouncedSearch, pageSize, sortBy, ascending]);

    const {
        products, loading, error,
        page, totalElements, totalPages,
        setPage, refetch,
    } = useAdminProducts(query);

    // ── Categories for filter & form ───────────────────────────
    const [categories, setCategories] = useState<PagedCategory[]>([]);
    useEffect(() => {
        nexaCategoryPagedRepository
            .findPaged({ locale: apiLocale, size: 500, ascending: true, sortBy: "level" })
            .then(r => setCategories(r.content))
            .catch(() => { });
    }, [apiLocale]);

    const categoryMap = useMemo(() => {
        const map: Record<string, string> = {};
        categories.forEach(c => { map[c.id] = c.name; });
        return map;
    }, [categories]);

    // ── Modal state ────────────────────────────────────────────
    const [modal, setModal] = useState<AdminProduct | "new" | null>(null);
    const [cloneForm, setCloneForm] = useState<ProductForm | null>(null);
    const [detail, setDetail] = useState<AdminProduct | null>(null);
    const [preview, setPreview] = useState<AdminProduct | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showBulk, setShowBulk] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    const allSelected = products.length > 0 && products.every(p => selectedIds.has(p.id));

    function toggleSelect(id: string) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }
    function toggleSelectAll() {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(products.map(p => p.id)));
        }
    }

    const lowStock = products.filter(p => p.warehouseInventoryNum > 0 && p.warehouseInventoryNum < 10).length;

    function handleCloneProduct(p: AdminProduct) {
        const cloned = productToForm(p);
        cloned.sku = "";
        cloned.translations = cloned.translations.map(t => ({
            ...t,
            name: t.name ? t.name + " (Copia)" : "(Copia)",
        }));
        setCloneForm(cloned);
        setModal("new");
    }

    async function handleTogglePublish(productId: string) {
        if (togglingId) return;
        setTogglingId(productId);
        try {
            await nexaProductAdminRepository.togglePublish(productId);
            toast.success("Estado actualizado");
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al cambiar estado");
        } finally {
            setTogglingId(null);
        }
    }

    async function handleSync() {
        // If already syncing → stop it
        if (syncing) {
            nexaProductAdminRepository.cancelSync();
            setSyncing(false);
            toast.info("Sincronización detenida");
            refetch();
            return;
        }

        setSyncing(true);
        try {
            const result = await nexaProductAdminRepository.syncProducts();
            toast.success(
                `Sincronización completada: ${result.created} creados, ${result.updated} actualizados (${result.total} total)`
            );
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al sincronizar productos");
        } finally {
            setSyncing(false);
        }
    }

    // ── Handlers ───────────────────────────────────────────────
    async function handleSave(payload: ProductPayload, id?: string) {
        try {
            if (id) {
                await nexaProductAdminRepository.updateProduct(id, payload);
                toast.success("Producto actualizado");
            } else {
                await nexaProductAdminRepository.createProduct(payload);
                toast.success("Producto creado");
            }
            setModal(null);
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al guardar producto");
        }
    }

    async function handleDelete(id: string) {
        setActionLoading(true);
        try {
            await nexaProductAdminRepository.deleteProducts([id]);
            toast.success("Producto eliminado");
            setDeleteId(null);
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al eliminar producto");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleBulkDelete() {
        if (selectedIds.size === 0) return;
        setActionLoading(true);
        try {
            await nexaProductAdminRepository.deleteProducts([...selectedIds]);
            toast.success(`${selectedIds.size} producto${selectedIds.size > 1 ? "s" : ""} eliminado${selectedIds.size > 1 ? "s" : ""}`);
            setSelectedIds(new Set());
            setShowBulkDeleteConfirm(false);
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al eliminar productos");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleBulkStatus(status: "DRAFT" | "PUBLISHED") {
        if (selectedIds.size === 0) return;
        setActionLoading(true);
        try {
            await nexaProductAdminRepository.bulkUpdateStatus([...selectedIds], status);
            const label = status === "PUBLISHED" ? "publicado" : "como borrador";
            toast.success(`${selectedIds.size} producto${selectedIds.size > 1 ? "s" : ""} ${label}${selectedIds.size > 1 ? "s" : ""}`);
            setSelectedIds(new Set());
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al cambiar estado");
        } finally {
            setActionLoading(false);
        }
    }

    function toggleSort(field: string) {
        if (sortBy === field) setAscending(a => !a);
        else { setSortBy(field); setAscending(true); }
    }

    async function handleViewDetail(p: AdminProduct) {
        try {
            const full = await nexaProductAdminRepository.findById(p.id, apiLocale);
            setDetail(full);
        } catch {
            setDetail(p);
        }
    }

    async function handleEditFromDetail() {
        if (!detail) return;
        try {
            const full = await nexaProductAdminRepository.findById(detail.id, apiLocale);
            setDetail(null);
            setModal(full);
        } catch {
            setDetail(null);
            setModal(detail);
        }
    }

    const SortBtn = ({ k, label }: { k: string; label: string }) => (
        <button onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
            {label}
            <ArrowUpDown className={`w-3 h-3 ${sortBy === k ? "text-gray-700" : "text-gray-300"}`} strokeWidth={1.5} />
        </button>
    );

    return (
        <div className="h-full flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="w-7 h-7 text-indigo-600" />
                        Productos
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        {totalElements} producto{totalElements !== 1 ? "s" : ""} en catálogo
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSync}
                        className={`w-9 h-9 border rounded-full transition-all flex items-center justify-center ${syncing
                            ? "bg-red-50 border-red-300 text-red-500 hover:bg-red-100"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                        title={syncing ? "Detener sincronización" : "Sincronizar productos desde CJ"}
                    >
                        {syncing
                            ? <X className="w-4 h-4" strokeWidth={2} />
                            : <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                        }
                    </button>
                    <button
                        onClick={() => setShowBulk(true)}
                        className="w-9 h-9 bg-white border border-gray-200 text-gray-500 rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center"
                        title="Carga masiva"
                    >
                        <Upload className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={() => setModal("new")}
                        className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
                        title="Nuevo producto"
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
                        value={searchInput}
                        onChange={e => handleSearchChange(e.target.value)}
                        placeholder="Buscar por nombre de producto…"
                        className="w-full text-xs text-gray-900 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                    />
                    {searchInput && (
                        <button
                            onClick={() => { setSearchInput(""); setDebouncedSearch(""); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
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
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                >
                    <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Filtros
                    {activeFiltersCount > 0 && (
                        <span className="w-5 h-5 bg-gray-700 text-white text-[10px] rounded-full flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>

                {lowStock > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl flex-shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {lowStock} con stock bajo
                    </div>
                )}
            </div>

            {/* Filter panel */}
            {showFilters && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4 space-y-4">
                    {/* Row 1: Status + Category */}
                    <div className="flex flex-wrap gap-6">
                        {/* Status filter */}
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Estado</p>
                            <div className="flex gap-1.5">
                                {[
                                    { label: "Todos", value: "" as const },
                                    { label: "Publicado", value: "PUBLISHED" as const },
                                    { label: "Borrador", value: "DRAFT" as const },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setStatusFilter(opt.value)}
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

                        {/* Category filter */}
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Categoría</p>
                            <div className="relative">
                                <select
                                    value={catFilter}
                                    onChange={e => setCatFilter(e.target.value)}
                                    className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 pr-7 bg-white appearance-none focus:outline-none focus:border-gray-400 cursor-pointer"
                                >
                                    <option value="">Todas las categorías</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {"—".repeat(c.level - 1)} {c.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Sort + Per page + Clear */}
                    <div className="flex flex-wrap items-end gap-6 border-t border-gray-200 pt-4">
                        {/* Sort by */}
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Ordenar por</p>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-gray-400"
                            >
                                <option value="createdAt">Fecha creación</option>
                                <option value="updatedAt">Última actualización</option>
                                <option value="sellPrice">Precio</option>
                                <option value="warehouseInventoryNum">Stock</option>
                                <option value="sku">SKU</option>
                            </select>
                        </div>

                        {/* Ascending / Descending */}
                        <div>
                            <button
                                onClick={() => setAscending(v => !v)}
                                className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:border-gray-300 transition-colors"
                            >
                                <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                                {ascending ? "Ascendente" : "Descendente"}
                            </button>
                        </div>

                        {/* Per page */}
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Por página</p>
                            <select
                                value={pageSize}
                                onChange={e => setPageSize(Number(e.target.value))}
                                className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-gray-400"
                            >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        {/* Clear all */}
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearFilters}
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
                    <button onClick={refetch} className="ml-auto text-red-500 hover:text-red-700 underline">Reintentar</button>
                </div>
            )}

            {/* Content area */}
            <div className="flex-1 overflow-auto space-y-2 pr-1 relative">

                {/* Selection toolbar */}
                {products.length > 0 && (
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
                {loading && products.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Loader2 className="w-6 h-6 text-gray-300 animate-spin mb-3" strokeWidth={1.5} />
                        <p className="text-sm text-gray-400">Cargando productos…</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && products.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-xl text-center">
                        <Package className="w-8 h-8 text-gray-200 mb-3" strokeWidth={1.5} />
                        <p className="text-sm text-gray-400">{debouncedSearch || catFilter || statusFilter ? "No se encontraron productos" : "No hay productos"}</p>
                        {(debouncedSearch || catFilter || statusFilter) && (
                            <p className="text-xs text-gray-300 mt-1">Intenta con otros filtros o busca por otro nombre</p>
                        )}
                    </div>
                )}

                {/* Loading overlay for page transitions */}
                {loading && products.length > 0 && (
                    <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-50/90 border border-blue-100 rounded-xl backdrop-blur-sm">
                        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" strokeWidth={1.5} />
                        <span className="text-xs text-blue-600">Cargando…</span>
                    </div>
                )}

                {/* Product rows */}
                {products.map(p => {
                    const isExpanded = expandedId === p.id;
                    const price = parseFloat(p.sellPrice) || 0;
                    return (
                        <div
                            key={p.id}
                            className="bg-white border border-gray-100 rounded-xl overflow-hidden transition-all hover:border-gray-200 hover:shadow-sm"
                        >
                            {/* Main row */}
                            <div className="flex items-center gap-3 px-4 py-3">
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(p.id)}
                                    onChange={() => toggleSelect(p.id)}
                                    className="w-3.5 h-3.5 rounded-[4px] border-gray-300 text-indigo-600 focus:ring-1 focus:ring-indigo-400 focus:ring-offset-0 cursor-pointer accent-indigo-600 flex-shrink-0"
                                />
                                {/* Image */}
                                <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {p.bigImage ? (
                                        <img src={p.bigImage} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
                                    )}
                                </div>

                                {/* Info */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                                    className="flex-1 min-w-0 text-left group"
                                >
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-1">
                                            {p.name || "Sin nombre"}
                                        </p>
                                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                            ${price.toFixed(2)}
                                        </span>
                                        {categoryMap[p.categoryId] && (
                                            <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">
                                                {categoryMap[p.categoryId]}
                                            </span>
                                        )}
                                        <Badge
                                            label={`${p.warehouseInventoryNum}`}
                                            variant={stockVariant(p.warehouseInventoryNum)}
                                        />
                                        <StatusBadge
                                            status={p.status || "DRAFT"}
                                            onClick={() => handleTogglePublish(p.id)}
                                            loading={togglingId === p.id}
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-0.5 truncate flex items-center gap-1">
                                        {p.sku && <><span className="font-mono">{p.sku}</span> · </>}
                                        ID: {p.id}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(p.id);
                                                toast.success("ID copiado");
                                            }}
                                            className="inline-flex items-center justify-center w-4 h-4 text-gray-300 hover:text-gray-600 transition-colors rounded"
                                            title="Copiar ID"
                                        >
                                            <Copy className="w-3 h-3" strokeWidth={1.5} />
                                        </button>
                                        {p.variants && p.variants.length > 0 && (
                                            <> · {p.variants.length} variante{p.variants.length !== 1 ? "s" : ""}</>
                                        )}
                                    </p>
                                </button>

                                {/* View detail */}
                                <button
                                    onClick={() => handleViewDetail(p)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex-shrink-0"
                                    title="Ver detalle"
                                >
                                    <Eye className="w-4 h-4" strokeWidth={1.5} />
                                </button>

                                {/* Edit */}
                                <button
                                    onClick={() => setModal(p)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors flex-shrink-0"
                                    title="Editar"
                                >
                                    <Pencil className="w-4 h-4" strokeWidth={1.5} />
                                </button>

                                {/* Clone */}
                                <button
                                    onClick={() => handleCloneProduct(p)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors flex-shrink-0"
                                    title="Clonar"
                                >
                                    <Copy className="w-4 h-4" strokeWidth={1.5} />
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => setDeleteId(p.id)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                </button>

                                {/* Expand/collapse */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
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
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Precio</p>
                                            <p className="text-xs text-gray-700 tabular-nums">${price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Stock</p>
                                            <p className="text-xs text-gray-700">{p.warehouseInventoryNum}</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Listados</p>
                                            <p className="text-xs text-gray-700">{p.listedNum}</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Tipo</p>
                                            <p className="text-xs text-gray-700">{p.productType || "—"}</p>
                                        </div>
                                    </div>

                                    {/* Extra info */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">SKU</p>
                                            <p className="text-xs text-gray-700 font-mono">{p.sku || "—"}</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Categoría</p>
                                            <p className="text-xs text-gray-700">{categoryMap[p.categoryId] || "—"}</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Variantes</p>
                                            <p className="text-xs text-gray-700">{p.variants?.length || 0}</p>
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Video</p>
                                            <p className="text-xs text-gray-700">{p.isVideo ? "Sí" : "No"}</p>
                                        </div>
                                    </div>
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
                        onChange={p => setPage(p - 1)}
                    />
                </div>
            )}

            {/* ── Modals ── */}
            {modal !== null && (
                <ProductModal
                    product={modal === "new" ? null : modal}
                    onSave={handleSave}
                    onClose={() => { setModal(null); setCloneForm(null); }}
                    categories={categories}
                    initialForm={modal === "new" && cloneForm ? cloneForm : undefined}
                />
            )}

            {preview && (
                <ProductPreview
                    product={preview}
                    categoryName={categoryMap[preview.categoryId]}
                    onClose={() => setPreview(null)}
                />
            )}

            {detail && (
                <ProductDetail
                    product={detail}
                    categoryName={categoryMap[detail.categoryId]}
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
                        <h3 className="text-sm text-gray-900 mb-2">¿Eliminar producto?</h3>
                        <p className="text-xs text-gray-400 mb-6">Esta acción no se puede deshacer. Se eliminarán también las traducciones y variantes.</p>
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

            {/* Bulk Delete Confirm */}
            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-sm text-gray-900 mb-2">¿Eliminar {selectedIds.size} producto{selectedIds.size > 1 ? "s" : ""}?</h3>
                        <p className="text-xs text-gray-400 mb-6">Esta acción no se puede deshacer. Se eliminarán también las traducciones y variantes de todos los productos seleccionados.</p>
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

            {/* Bulk Upload Modal */}
            <BulkUploadModal
                open={showBulk}
                onClose={() => setShowBulk(false)}
                entityType="products"
                onUpload={async (rows) => {
                    const payload = rows.map(r => r as unknown as import("../../repositories/NexaProductAdminRepository").ProductPayload);
                    return nexaProductAdminRepository.bulkCreate(payload);
                }}
                onSuccess={refetch}
            />
        </div>
    );
}
