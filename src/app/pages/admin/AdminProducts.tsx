import { useState } from "react";
import {
  Search, Plus, Edit2, Trash2, Monitor, X, Check,
  Package, Star, ChevronDown, Filter, ArrowUpDown,
  Heart, ShoppingCart, Image, AlertCircle,
  Tag, Truck, Globe, Layers, DollarSign, BarChart2,
} from "lucide-react";
import { products as initialProducts, type Product, type ProductImage, type ProductAttribute, type ProductVariant } from "../../data/products";
import { categories } from "../../data/adminData";
import { brands as brandsData } from "../../data/brands";
import { toast } from "sonner";

type SortKey = "name" | "price" | "stock" | "rating";

const TABS = [
  { id: "general",    label: "General",    icon: Package },
  { id: "precios",    label: "Precios",    icon: DollarSign },
  { id: "inventario", label: "Inventario", icon: BarChart2 },
  { id: "imagenes",   label: "Imágenes",   icon: Image },
  { id: "variantes",  label: "Variantes",  icon: Layers },
  { id: "envio",      label: "Envío",      icon: Truck },
  { id: "seo",        label: "SEO",        icon: Globe },
] as const;

type TabId = (typeof TABS)[number]["id"];

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

function makeEmpty(): Omit<Product, "id"> {
  return {
    name: "", slug: "", sku: "", brand: "", description: "", shortDescription: "",
    price: 0, originalPrice: undefined, salePrice: undefined, costPrice: undefined,
    taxClass: "standard", category: "", subcategory: "", keywords: [],
    image: "", images: [],
    rating: 0, reviews: 0,
    stock: 0, barcode: "", stockStatus: "in_stock", manageStock: true, allowBackorder: false,
    attributes: [], variants: [],
    weight: 0, dimensions: { length: 0, width: 0, height: 0 }, shippingClass: "standard",
    metaTitle: "", metaDescription: "",
    status: "active", visibility: "public", featured: false,
  };
}

function Badge({ label, variant }: { label: string; variant: "green" | "amber" | "red" | "gray" }) {
  const cls = { green: "bg-green-50 text-green-700", amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700", gray: "bg-gray-100 text-gray-500" }[variant];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}
function stockVariant(stock: number): "green" | "amber" | "red" {
  if (stock > 20) return "green";
  if (stock > 5)  return "amber";
  return "red";
}

/* ── Product Preview Modal ────────────────────────────────── */
function ProductPreview({ product, onClose }: { product: Product; onClose: () => void }) {
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
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
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Package className="w-12 h-12 text-gray-200" strokeWidth={1.5} />
                </div>
              )}
              {discount > 0 && <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">-{discount}%</div>}
              <button className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors z-10">
                <Heart className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{product.category}</div>
              <h3 className="text-base mb-2 line-clamp-2">{product.name}</h3>
              <div className="flex items-center gap-1 text-sm mb-3">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-gray-900">{product.rating}</span>
                <span className="text-gray-500">({product.reviews})</span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl text-gray-900">${product.price}</span>
                {product.originalPrice && <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>}
              </div>
              <button className="w-full px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
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

/* ── Product Modal (tabbed) ───────────────────────────────── */
function ProductModal({ product, onSave, onClose }: {
  product: Partial<Product> & { id?: string };
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const isNew = !product.id;
  const [tab, setTab] = useState<TabId>("general");
  const [form, setForm] = useState<Omit<Product, "id">>({
    ...makeEmpty(),
    ...product,
  });

  // Temp states for adding
  const [newKeyword, setNewKeyword] = useState("");
  const [newImgUrl, setNewImgUrl] = useState("");
  const [newImgAlt, setNewImgAlt] = useState("");
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");
  const [newVarSku, setNewVarSku] = useState("");
  const [newVarPrice, setNewVarPrice] = useState("");
  const [newVarStock, setNewVarStock] = useState("");
  const [newVarAttrs, setNewVarAttrs] = useState("");

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const parentCategories = categories.filter((c) => !c.parent_id);
  const selectedCat = parentCategories.find((c) => c.name === form.category);
  const subcats = selectedCat ? categories.filter((c) => c.parent_id === selectedCat.id) : [];

  function validate() {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); setTab("general"); return false; }
    if (!form.category)    { toast.error("Selecciona una categoría"); setTab("general"); return false; }
    if (form.price <= 0)   { toast.error("El precio debe ser mayor a 0"); setTab("precios"); return false; }
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    const mainImage = form.images[0]?.url ?? form.image ?? "";
    onSave({ id: product.id ?? `prod-${Date.now()}`, ...form, image: mainImage });
  }

  function addKeyword() {
    if (!newKeyword.trim()) return;
    set("keywords", [...form.keywords, newKeyword.trim()]);
    setNewKeyword("");
  }

  function addImage() {
    if (!newImgUrl.trim()) return;
    const img: ProductImage = { url: newImgUrl.trim(), alt: newImgAlt || form.name, position: form.images.length + 1 };
    set("images", [...form.images, img]);
    setNewImgUrl(""); setNewImgAlt("");
  }

  function removeImage(idx: number) {
    set("images", form.images.filter((_, i) => i !== idx));
  }

  function addAttribute() {
    if (!newAttrName.trim() || !newAttrValue.trim()) return;
    set("attributes", [...form.attributes, { name: newAttrName.trim(), value: newAttrValue.trim() }]);
    setNewAttrName(""); setNewAttrValue("");
  }

  function removeAttribute(idx: number) {
    set("attributes", form.attributes.filter((_, i) => i !== idx));
  }

  function addVariant() {
    if (!newVarSku.trim() || !newVarPrice) return;
    let attrs: Record<string, string> = {};
    try { attrs = Object.fromEntries(newVarAttrs.split(",").map((s) => s.trim().split(":").map((x) => x.trim()) as [string, string])); } catch {}
    const v: ProductVariant = {
      id: `var-${Date.now()}`,
      sku: newVarSku.trim(),
      price: parseFloat(newVarPrice) || 0,
      stock_quantity: parseInt(newVarStock) || 0,
      attributes: attrs,
    };
    set("variants", [...form.variants, v]);
    setNewVarSku(""); setNewVarPrice(""); setNewVarStock(""); setNewVarAttrs("");
  }

  function removeVariant(idx: number) {
    set("variants", form.variants.filter((_, i) => i !== idx));
  }

  const field = "w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white";
  const lbl = "block text-xs text-gray-400 mb-1.5";
  const section = "space-y-4";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-3xl overflow-hidden mb-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm text-gray-900">{isNew ? "Nuevo producto" : "Editar producto"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isNew ? "Completa todos los campos del producto" : `Editando: ${product.name}`}</p>
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
              className={`flex items-center gap-1.5 text-xs px-3 py-3 border-b-2 whitespace-nowrap transition-all ${
                tab === id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-700"
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
              {/* Name + featured + status */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-2">
                  <label className={lbl}>Nombre del producto *</label>
                  <input value={form.name} onChange={(e) => { set("name", e.target.value); if (isNew) set("slug", slugify(e.target.value)); }} className={field} placeholder="Ej: iPhone 15 Pro Max" />
                </div>
                <div>
                  <label className={lbl}>Estado</label>
                  <div className="relative">
                    <select value={form.status} onChange={(e) => set("status", e.target.value)} className={`${field} appearance-none pr-8`}>
                      <option value="active">Activo</option>
                      <option value="draft">Borrador</option>
                      <option value="archived">Archivado</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              {/* Slug + brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Slug (URL)</label>
                  <input value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} className={field} placeholder="iphone-15-pro-max" />
                </div>
                <div>
                  <label className={lbl}>Marca</label>
                  <div className="relative">
                    <select value={form.brand} onChange={(e) => set("brand", e.target.value)} className={`${field} appearance-none pr-8`}>
                      <option value="">Sin marca</option>
                      {brandsData.filter(b => b.status === "active").map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              {/* Category + Subcategory */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Categoría *</label>
                  <div className="relative">
                    <select value={form.category} onChange={(e) => { set("category", e.target.value); set("subcategory", ""); }} className={`${field} appearance-none pr-8`}>
                      <option value="">Seleccionar...</option>
                      {parentCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Subcategoría</label>
                  <div className="relative">
                    <select value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)} className={`${field} appearance-none pr-8`} disabled={!subcats.length}>
                      <option value="">Seleccionar...</option>
                      {subcats.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              {/* Visibility + Featured */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Visibilidad</label>
                  <div className="relative">
                    <select value={form.visibility} onChange={(e) => set("visibility", e.target.value)} className={`${field} appearance-none pr-8`}>
                      <option value="public">Público</option>
                      <option value="private">Privado</option>
                      <option value="hidden">Oculto</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <label className={lbl}>Destacado</label>
                  <button
                    type="button"
                    onClick={() => set("featured", !form.featured)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-xs transition-all ${form.featured ? "bg-gray-900 border-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                  >
                    <Star className="w-3.5 h-3.5" strokeWidth={1.5} fill={form.featured ? "currentColor" : "none"} />
                    {form.featured ? "Sí, destacado" : "No destacado"}
                  </button>
                </div>
              </div>

              {/* Short description */}
              <div>
                <label className={lbl}>Descripción corta</label>
                <textarea value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className={`${field} h-16 resize-none`} placeholder="Resumen breve del producto..." />
              </div>

              {/* Description */}
              <div>
                <label className={lbl}>Descripción completa</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`${field} h-28 resize-none`} placeholder="Descripción detallada del producto..." />
              </div>

              {/* Keywords */}
              <div>
                <label className={lbl}>Palabras clave ({form.keywords.length})</label>
                <div className="flex gap-2 mb-2">
                  <input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addKeyword()} className={`${field} flex-1`} placeholder="Agregar keyword..." />
                  <button onClick={addKeyword} className="px-4 py-2.5 text-xs text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap">
                    + Agregar
                  </button>
                </div>
                {form.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.keywords.map((kw, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-[10px] bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1">
                        {kw}
                        <button onClick={() => set("keywords", form.keywords.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                          <X className="w-2.5 h-2.5" strokeWidth={2} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PRECIOS ── */}
          {tab === "precios" && (
            <div className={section}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Precio regular (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                    <input type="number" value={form.price || ""} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} className={`${field} pl-6`} placeholder="0.00" min={0} step={0.01} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Precio de oferta (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                    <input type="number" value={form.salePrice || ""} onChange={(e) => set("salePrice", parseFloat(e.target.value) || undefined)} className={`${field} pl-6`} placeholder="0.00 (opcional)" min={0} step={0.01} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Precio tachado (original)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                    <input type="number" value={form.originalPrice || ""} onChange={(e) => set("originalPrice", parseFloat(e.target.value) || undefined)} className={`${field} pl-6`} placeholder="0.00 (opcional)" min={0} step={0.01} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Precio de costo (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                    <input type="number" value={form.costPrice || ""} onChange={(e) => set("costPrice", parseFloat(e.target.value) || undefined)} className={`${field} pl-6`} placeholder="0.00 (opcional)" min={0} step={0.01} />
                  </div>
                </div>
              </div>
              <div>
                <label className={lbl}>Clase de impuesto</label>
                <div className="relative">
                  <select value={form.taxClass} onChange={(e) => set("taxClass", e.target.value)} className={`${field} appearance-none pr-8`}>
                    <option value="standard">Estándar</option>
                    <option value="reduced">Reducido</option>
                    <option value="zero">Sin impuesto</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                </div>
              </div>
              {/* Margin preview */}
              {form.price > 0 && form.costPrice && form.costPrice > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-6 text-xs">
                  <div>
                    <p className="text-gray-400 mb-0.5">Margen bruto</p>
                    <p className="text-gray-900">${(form.price - form.costPrice).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5">Margen %</p>
                    <p className="text-green-700">{(((form.price - form.costPrice) / form.price) * 100).toFixed(1)}%</p>
                  </div>
                  {form.originalPrice && form.originalPrice > 0 && (
                    <div>
                      <p className="text-gray-400 mb-0.5">Descuento</p>
                      <p className="text-amber-700">-{Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)}%</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── INVENTARIO ── */}
          {tab === "inventario" && (
            <div className={section}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>SKU</label>
                  <input value={form.sku} onChange={(e) => set("sku", e.target.value)} className={field} placeholder="APL-IP15PM-256-BLK" />
                </div>
                <div>
                  <label className={lbl}>Código de barras</label>
                  <input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} className={field} placeholder="1234567890123" />
                </div>
                <div>
                  <label className={lbl}>Cantidad en stock *</label>
                  <input type="number" value={form.stock || ""} onChange={(e) => set("stock", parseInt(e.target.value) || 0)} className={field} placeholder="0" min={0} />
                </div>
                <div>
                  <label className={lbl}>Estado de stock</label>
                  <div className="relative">
                    <select value={form.stockStatus} onChange={(e) => set("stockStatus", e.target.value)} className={`${field} appearance-none pr-8`}>
                      <option value="in_stock">En stock</option>
                      <option value="out_of_stock">Sin stock</option>
                      <option value="backorder">Bajo pedido</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => set("manageStock", !form.manageStock)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.manageStock ? "bg-gray-900" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${form.manageStock ? "left-5" : "left-0.5"}`} />
                  </div>
                  <span className="text-xs text-gray-600">Gestionar stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => set("allowBackorder", !form.allowBackorder)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.allowBackorder ? "bg-gray-900" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${form.allowBackorder ? "left-5" : "left-0.5"}`} />
                  </div>
                  <span className="text-xs text-gray-600">Permitir pedidos sin stock</span>
                </label>
              </div>
              {/* Rating + reviews */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className={lbl}>Rating (0-5)</label>
                  <input type="number" value={form.rating || ""} onChange={(e) => set("rating", parseFloat(e.target.value) || 0)} className={field} placeholder="4.5" min={0} max={5} step={0.1} />
                </div>
                <div>
                  <label className={lbl}>N° de reseñas</label>
                  <input type="number" value={form.reviews || ""} onChange={(e) => set("reviews", parseInt(e.target.value) || 0)} className={field} placeholder="0" min={0} />
                </div>
              </div>
            </div>
          )}

          {/* ── IMÁGENES ── */}
          {tab === "imagenes" && (
            <div className={section}>
              <div>
                <label className={lbl}>Agregar imagen</label>
                <div className="flex gap-2 mb-2">
                  <input value={newImgUrl} onChange={(e) => setNewImgUrl(e.target.value)} className={`${field} flex-1`} placeholder="URL de imagen https://..." />
                  <input value={newImgAlt} onChange={(e) => setNewImgAlt(e.target.value)} className={`${field} w-32`} placeholder="Alt text" />
                  <button onClick={addImage} className="px-4 py-2.5 text-xs text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap">+ Agregar</button>
                </div>
              </div>

              {form.images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Image className="w-10 h-10 text-gray-300 mb-2" strokeWidth={1.5} />
                  <p className="text-xs text-gray-400">No hay imágenes. Agrega la URL de la primera imagen.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      <img src={img.url} alt={img.alt} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      {i === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded">Principal</div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => removeImage(i)} className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-red-500">
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                      <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1.5 py-1 truncate">{img.alt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VARIANTES ── */}
          {tab === "variantes" && (
            <div className={section}>
              {/* Attributes */}
              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Atributos del producto</p>
                <div className="flex gap-2 mb-2">
                  <input value={newAttrName} onChange={(e) => setNewAttrName(e.target.value)} className={`${field} flex-1`} placeholder="Nombre ej: Color" />
                  <input value={newAttrValue} onChange={(e) => setNewAttrValue(e.target.value)} className={`${field} flex-1`} placeholder="Valor ej: Titanio Negro" />
                  <button onClick={addAttribute} className="px-4 py-2.5 text-xs text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap">+ Agregar</button>
                </div>
                {form.attributes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.attributes.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg px-3 py-1.5">
                        <span className="text-gray-400">{a.name}:</span> {a.value}
                        <button onClick={() => removeAttribute(i)} className="text-gray-300 hover:text-red-500">
                          <X className="w-3 h-3" strokeWidth={2} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Variants */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Variantes (SKU / precio / stock)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  <input value={newVarSku} onChange={(e) => setNewVarSku(e.target.value)} className={field} placeholder="SKU" />
                  <input value={newVarPrice} onChange={(e) => setNewVarPrice(e.target.value)} className={field} placeholder="Precio" type="number" min={0} />
                  <input value={newVarStock} onChange={(e) => setNewVarStock(e.target.value)} className={field} placeholder="Stock" type="number" min={0} />
                  <input value={newVarAttrs} onChange={(e) => setNewVarAttrs(e.target.value)} className={field} placeholder="Color:Negro,Cap:256GB" />
                </div>
                <button onClick={addVariant} className="text-xs text-white bg-gray-900 rounded-xl px-4 py-2.5 hover:bg-gray-800 transition-colors">+ Agregar variante</button>

                {form.variants.length > 0 && (
                  <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left text-gray-400 px-3 py-2">SKU</th>
                          <th className="text-left text-gray-400 px-3 py-2">Precio</th>
                          <th className="text-left text-gray-400 px-3 py-2">Stock</th>
                          <th className="text-left text-gray-400 px-3 py-2">Atributos</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.variants.map((v, i) => (
                          <tr key={v.id} className="border-b border-gray-50">
                            <td className="px-3 py-2 font-mono text-gray-700">{v.sku}</td>
                            <td className="px-3 py-2 text-gray-700">${v.price}</td>
                            <td className="px-3 py-2 text-gray-700">{v.stock_quantity}</td>
                            <td className="px-3 py-2 text-gray-500">
                              {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(", ")}
                            </td>
                            <td className="px-3 py-2">
                              <button onClick={() => removeVariant(i)} className="text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" strokeWidth={1.5} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ENVÍO ── */}
          {tab === "envio" && (
            <div className={section}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Peso (kg)</label>
                  <input type="number" value={form.weight || ""} onChange={(e) => set("weight", parseFloat(e.target.value) || 0)} className={field} placeholder="0.00" min={0} step={0.01} />
                </div>
                <div>
                  <label className={lbl}>Clase de envío</label>
                  <div className="relative">
                    <select value={form.shippingClass} onChange={(e) => set("shippingClass", e.target.value)} className={`${field} appearance-none pr-8`}>
                      <option value="standard">Estándar</option>
                      <option value="express">Express</option>
                      <option value="heavy">Voluminoso / pesado</option>
                      <option value="free">Envío gratis</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
              <div>
                <label className={lbl}>Dimensiones (cm)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input type="number" value={form.dimensions.length || ""} onChange={(e) => set("dimensions", { ...form.dimensions, length: parseFloat(e.target.value) || 0 })} className={field} placeholder="Largo" min={0} step={0.1} />
                    <p className="text-[10px] text-gray-400 mt-1 text-center">Largo</p>
                  </div>
                  <div>
                    <input type="number" value={form.dimensions.width || ""} onChange={(e) => set("dimensions", { ...form.dimensions, width: parseFloat(e.target.value) || 0 })} className={field} placeholder="Ancho" min={0} step={0.1} />
                    <p className="text-[10px] text-gray-400 mt-1 text-center">Ancho</p>
                  </div>
                  <div>
                    <input type="number" value={form.dimensions.height || ""} onChange={(e) => set("dimensions", { ...form.dimensions, height: parseFloat(e.target.value) || 0 })} className={field} placeholder="Alto" min={0} step={0.1} />
                    <p className="text-[10px] text-gray-400 mt-1 text-center">Alto</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SEO ── */}
          {tab === "seo" && (
            <div className={section}>
              <div>
                <label className={lbl}>Meta título</label>
                <input value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className={field} placeholder="iPhone 15 Pro Max | Comprar Apple iPhone" maxLength={60} />
                <p className="text-[10px] text-gray-400 mt-1">{form.metaTitle.length}/60 caracteres</p>
              </div>
              <div>
                <label className={lbl}>Meta descripción</label>
                <textarea value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} className={`${field} h-24 resize-none`} placeholder="Descripción para motores de búsqueda..." maxLength={160} />
                <p className="text-[10px] text-gray-400 mt-1">{form.metaDescription.length}/160 caracteres</p>
              </div>
              {/* Preview */}
              {(form.metaTitle || form.name) && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider">Vista previa en Google</p>
                  <p className="text-blue-600 text-sm truncate">{form.metaTitle || form.name}</p>
                  <p className="text-green-700 text-[11px] mt-0.5">nexa.com/producto/{form.slug || "..."}</p>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">{form.metaDescription || form.description}</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 text-xs text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors">
            <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
            {isNew ? "Crear producto" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────── */
export function AdminProducts() {
  const [list, setList]         = useState<Product[]>(initialProducts);
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sort, setSort]         = useState<SortKey>("name");
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [modal, setModal]       = useState<Partial<Product> & { id?: string } | null>(null);
  const [preview, setPreview]   = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const lowStock = list.filter((p) => p.stock > 0 && p.stock < 10).length;

  const catOptions = ["all", ...Array.from(new Set(list.map((p) => p.category)))];

  const handleSearchChange = (v: string) => setSearch(v);
  const handleCategoryFilterChange = (v: string) => setCatFilter(v);

  const filtered = list
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.category === catFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sort === "name")   cmp = a.name.localeCompare(b.name);
      if (sort === "price")  cmp = a.price - b.price;
      if (sort === "stock")  cmp = a.stock - b.stock;
      if (sort === "rating") cmp = a.rating - b.rating;
      return sortDir === "asc" ? cmp : -cmp;
    });

  function toggleSort(k: SortKey) {
    if (sort === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(k); setSortDir("asc"); }
  }

  function handleSave(p: Product) {
    setList((prev) => {
      const exists = prev.find((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
    });
    toast.success(modal?.id ? "Producto actualizado" : "Producto creado");
    setModal(null);
  }

  function handleDelete(id: string) {
    setList((prev) => prev.filter((p) => p.id !== id));
    toast.success("Producto eliminado");
    setDeleteId(null);
  }

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sort === k ? "text-gray-700" : "text-gray-300"}`} strokeWidth={1.5} />
    </button>
  );

  return (
    <div className="h-full flex flex-col space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-gray-900 tracking-tight">Productos</h1>
          <p className="text-xs text-gray-400 mt-1">{filtered.length} productos en catálogo</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="w-9 h-9 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
          title="Nuevo producto"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
          <input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Buscar producto, SKU o marca..." className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-gray-400 placeholder-gray-300" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
          <div className="relative">
            <select value={catFilter} onChange={(e) => handleCategoryFilterChange(e.target.value)} className="text-xs text-gray-600 border border-gray-200 rounded-xl px-3 py-2 pr-7 bg-white appearance-none focus:outline-none focus:border-gray-400 cursor-pointer">
              {catOptions.map((c) => <option key={c} value={c}>{c === "all" ? "Todas las categorías" : c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" strokeWidth={1.5} />
          </div>
        </div>
        {lowStock > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
            {lowStock} con stock bajo
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white border border-gray-100 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs text-gray-400 px-5 py-3.5 w-12">Img</th>
              <th className="text-left text-xs text-gray-400 px-5 py-3.5"><SortBtn k="name" label="Producto" /></th>
              <th className="text-left text-xs text-gray-400 px-5 py-3.5 hidden md:table-cell">Marca / Cat.</th>
              <th className="text-left text-xs text-gray-400 px-5 py-3.5"><SortBtn k="price" label="Precio" /></th>
              <th className="text-left text-xs text-gray-400 px-5 py-3.5 hidden sm:table-cell"><SortBtn k="stock" label="Stock" /></th>
              <th className="text-left text-xs text-gray-400 px-5 py-3.5 hidden lg:table-cell"><SortBtn k="rating" label="Rating" /></th>
              <th className="text-left text-xs text-gray-400 px-5 py-3.5 hidden lg:table-cell">Estado</th>
              <th className="text-right text-xs text-gray-400 px-5 py-3.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-16 text-xs text-gray-400">{search ? "No se encontraron productos" : "No hay productos"}</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                <td className="px-4 py-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-300 m-auto mt-2.5" strokeWidth={1.5} />}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div>
                    <p className="text-sm text-gray-900 line-clamp-1">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.sku || "—"}</p>
                  </div>
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  <p className="text-xs text-gray-700">{p.brand || "—"}</p>
                  <p className="text-xs text-gray-400">{p.category}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm text-gray-900">${p.price}</p>
                  {p.originalPrice && <p className="text-xs text-gray-400 line-through">${p.originalPrice}</p>}
                </td>
                <td className="px-5 py-3 hidden sm:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Badge label={`${p.stock}`} variant={stockVariant(p.stock)} />
                  </div>
                </td>
                <td className="px-5 py-3 hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-gray-700">{p.rating}</span>
                  </div>
                </td>
                <td className="px-5 py-3 hidden lg:table-cell">
                  <Badge
                    label={p.status === "active" ? "Activo" : p.status === "draft" ? "Borrador" : "Archivado"}
                    variant={p.status === "active" ? "green" : p.status === "draft" ? "amber" : "gray"}
                  />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setPreview(p)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Vista previa">
                      <Monitor className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setModal(p)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                      <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setDeleteId(p.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal !== null && <ProductModal product={modal} onSave={handleSave} onClose={() => setModal(null)} />}
      {preview && <ProductPreview product={preview} onClose={() => setPreview(null)} />}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm text-gray-900 mb-2">¿Eliminar producto?</h3>
            <p className="text-xs text-gray-400 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 text-xs text-gray-500 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 text-xs text-white bg-red-500 rounded-xl py-2.5 hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
