import { useState } from "react";
import {
  X, Check, Plus, ChevronDown,
  Package, DollarSign, BarChart2, Image, Truck, Globe,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminProduct, ProductPayload } from "../../repositories/NexaProductAdminRepository";
import type { PagedCategory } from "../../repositories/NexaCategoryPagedRepository";

// ── Tabs ─────────────────────────────────────────────────────────────────────
export const TABS = [
  { id: "general", label: "General", icon: Package },
  { id: "precios", label: "Precios", icon: DollarSign },
  { id: "inventario", label: "Inventario", icon: BarChart2 },
  { id: "imagenes", label: "Imágenes", icon: Image },
  { id: "envio", label: "Envío", icon: Truck },
  { id: "traducciones", label: "Idiomas", icon: Globe },
] as const;

export type TabId = (typeof TABS)[number]["id"];

// ── Form types ────────────────────────────────────────────────────────────────
export interface TranslationRow { locale: string; name: string }

export interface ProductForm {
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

// ── Form helpers ──────────────────────────────────────────────────────────────
export function makeEmptyForm(): ProductForm {
  return {
    sku: "", categoryId: "", bigImage: "", sellPrice: "", productType: "NORMAL",
    listedNum: 0, warehouseInventoryNum: 0, isVideo: false,
    translations: [{ locale: "es", name: "" }],
  };
}

export function productToForm(p: AdminProduct): ProductForm {
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

export function formToPayload(form: ProductForm): ProductPayload {
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

// ── ProductModal component ────────────────────────────────────────────────────
export function ProductModal({ product, onSave, onClose, categories, initialForm }: {
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
