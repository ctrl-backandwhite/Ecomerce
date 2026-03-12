import { useMemo, useState } from "react";
import {
  Search, Plus, Edit2, Trash2, Monitor, X, Check,
  Package, DollarSign, Star, ChevronDown, ChevronUp, Grid3x3, List,
  Filter, ArrowUpDown, AlertCircle, Image, Heart, ShoppingCart, Upload, Download, FileText,
} from "lucide-react";
import { products as initialProducts, type Product } from "../../data/products";
import { categories } from "../../data/adminData";
import { toast } from "sonner";

type SortKey = "name" | "price" | "stock" | "rating";

const EMPTY: Omit<Product, "id"> = {
  name: "", description: "", price: 0, originalPrice: undefined,
  category: "", subcategory: "", image: "", rating: 0, reviews: 0, stock: 0, featured: false,
};

function Badge({ label, variant }: { label: string; variant: "green" | "amber" | "red" | "gray" }) {
  const cls = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red:   "bg-red-50 text-red-700",
    gray:  "bg-gray-100 text-gray-500",
  }[variant];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function stockVariant(stock: number): "green" | "amber" | "red" {
  if (stock > 20) return "green";
  if (stock > 5)  return "amber";
  return "red";
}

/* ── Product Preview Modal ────────────────────────────── */
function ProductPreview({ product, onClose }: { product: Product; onClose: () => void }) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-gray-50 rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <div>
            <h2 className="text-sm text-gray-900">Vista previa</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Cómo se verá en la tienda</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Product Card Preview - Exact replica of front-end */}
        <div className="p-5">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Image */}
            <div className="relative h-56 bg-white overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Package className="w-12 h-12 text-gray-200" strokeWidth={1.5} />
                </div>
              )}
              
              {discount > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">
                  -{discount}%
                </div>
              )}
              
              <button className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors z-10">
                <Heart className="w-4 h-4" />
              </button>
              
              {product.stock < 10 && product.stock > 0 && (
                <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-xs px-2 py-1 rounded z-10">
                  ¡Últimas unidades!
                </div>
              )}

              {product.stock === 0 && (
                <div className="absolute bottom-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">
                  Sin stock
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {product.category}
              </div>
              <h3 className="text-base mb-2 line-clamp-2">
                {product.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-1 text-sm mb-3">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-gray-900">{product.rating}</span>
                <span className="text-gray-500">({product.reviews})</span>
              </div>

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl text-gray-900">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>

                <button className="w-full px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Agregar al carrito
                </button>
              </div>
            </div>
          </div>

          {/* Info text */}
          <p className="text-[11px] text-gray-400 text-center mt-4">
            Esta es una vista previa de cómo se mostrará el producto en la tienda
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Product modal ───────────────────────────────────── */
function ProductModal({
  product, onSave, onClose,
}: {
  product: Partial<Product> & { id?: string };
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const isNew = !product.id;
  const [form, setForm] = useState<Omit<Product, "id">>({
    name:          product.name          ?? "",
    description:   product.description   ?? "",
    price:         product.price         ?? 0,
    originalPrice: product.originalPrice ?? undefined,
    category:      product.category      ?? "",
    subcategory:   product.subcategory   ?? "",
    image:         product.image         ?? "",
    rating:        product.rating        ?? 0,
    reviews:       product.reviews       ?? 0,
    stock:         product.stock         ?? 0,
    featured:      product.featured      ?? false,
  });

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // Get parent categories (those without parent_id)
  const parentCategories = categories.filter((c) => !c.parent_id);
  const selectedCat = parentCategories.find((c) => c.name === form.category);
  // Get subcategories for selected parent
  const subcats = selectedCat ? categories.filter((c) => c.parent_id === selectedCat.id) : [];

  function validate() {
    if (!form.name.trim())      { toast.error("El nombre es obligatorio"); return false; }
    if (!form.category)         { toast.error("Selecciona una categoría"); return false; }
    if (form.price <= 0)        { toast.error("El precio debe ser mayor a 0"); return false; }
    if (form.stock < 0)         { toast.error("El stock no puede ser negativo"); return false; }
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    const saved: Product = {
      id: product.id ?? `prod-${Date.now()}`,
      ...form,
      originalPrice: form.originalPrice && form.originalPrice > 0 ? form.originalPrice : undefined,
    };
    onSave(saved);
  }

  const field = "w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white";
  const label = "block text-xs text-gray-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm text-gray-900">{isNew ? "Nuevo producto" : "Editar producto"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isNew ? "Completa los campos para agregar el producto" : `Editando: ${product.name}`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name + Featured */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={label}>Nombre del producto *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className={field} placeholder="Ej: Smartphone Pro Max" />
            </div>
            <div className="flex-shrink-0 flex flex-col justify-end pb-0.5">
              <label className={label}>Destacado</label>
              <button
                type="button"
                onClick={() => set("featured", !form.featured)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-xs transition-all ${form.featured ? "bg-gray-900 border-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
              >
                <Star className="w-3.5 h-3.5" strokeWidth={1.5} fill={form.featured ? "currentColor" : "none"} />
                {form.featured ? "Sí" : "No"}
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={label}>Descripción</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`${field} h-20 resize-none`} placeholder="Descripción detallada del producto..." />
          </div>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Categoría *</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={(e) => { set("category", e.target.value); set("subcategory", ""); }}
                  className={`${field} appearance-none pr-8`}
                >
                  <option value="">Seleccionar...</option>
                  {parentCategories.map((c) => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <label className={label}>Subcategoría</label>
              <div className="relative">
                <select
                  value={form.subcategory}
                  onChange={(e) => set("subcategory", e.target.value)}
                  className={`${field} appearance-none pr-8`}
                  disabled={!subcats.length}
                >
                  <option value="">Seleccionar...</option>
                  {subcats.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Precio actual (USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                <input type="number" value={form.price || ""} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} className={`${field} pl-6`} placeholder="0.00" min={0} step={0.01} />
              </div>
            </div>
            <div>
              <label className={label}>Precio original (tachado)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                <input type="number" value={form.originalPrice || ""} onChange={(e) => set("originalPrice", parseFloat(e.target.value) || undefined)} className={`${field} pl-6`} placeholder="0.00 (opcional)" min={0} step={0.01} />
              </div>
            </div>
          </div>

          {/* Stock + Rating + Reviews */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={label}>Stock *</label>
              <input type="number" value={form.stock || ""} onChange={(e) => set("stock", parseInt(e.target.value) || 0)} className={field} placeholder="0" min={0} />
            </div>
            <div>
              <label className={label}>Rating (0-5)</label>
              <input type="number" value={form.rating || ""} onChange={(e) => set("rating", parseFloat(e.target.value) || 0)} className={field} placeholder="4.5" min={0} max={5} step={0.1} />
            </div>
            <div>
              <label className={label}>Reseñas</label>
              <input type="number" value={form.reviews || ""} onChange={(e) => set("reviews", parseInt(e.target.value) || 0)} className={field} placeholder="0" min={0} />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className={label}>
              <Image className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
              URL de imagen
            </label>
            <input value={form.image} onChange={(e) => set("image", e.target.value)} className={field} placeholder="https://..." />
            {form.image && (
              <div className="mt-2 w-20 h-20 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0">
                <img src={form.image} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>
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

/* ── Bulk Import Modal ───────────────────────────────── */
function BulkImportModal({ onImport, onClose }: { onImport: (products: Product[]) => void; onClose: () => void }) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");

  const exampleJSON = `[
  {
    "name": "Laptop Gaming Pro",
    "description": "Potente laptop para gaming",
    "price": 1299.99,
    "originalPrice": 1599.99,
    "category": "Electrónicos",
    "subcategory": "Computadoras",
    "image": "https://images.unsplash.com/photo-1603302576837-37561b2e2302",
    "rating": 4.5,
    "reviews": 120,
    "stock": 15,
    "featured": true
  },
  {
    "name": "Mouse Inalámbrico",
    "description": "Mouse ergonómico",
    "price": 29.99,
    "category": "Electrónicos",
    "subcategory": "Accesorios",
    "image": "https://images.unsplash.com/photo-1527814050087-3793815479db",
    "rating": 4.2,
    "reviews": 85,
    "stock": 50,
    "featured": false
  }
]`;

  function handleImport() {
    setError("");
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setError("El JSON debe ser un array de productos");
        return;
      }

      const products: Product[] = parsed.map((item, idx) => {
        // Validate required fields
        if (!item.name || typeof item.name !== "string") {
          throw new Error(`Producto ${idx + 1}: nombre es obligatorio`);
        }
        if (!item.category || typeof item.category !== "string") {
          throw new Error(`Producto ${idx + 1}: categoría es obligatoria`);
        }
        if (typeof item.price !== "number" || item.price <= 0) {
          throw new Error(`Producto ${idx + 1}: precio debe ser un número mayor a 0`);
        }
        if (typeof item.stock !== "number" || item.stock < 0) {
          throw new Error(`Producto ${idx + 1}: stock debe ser un número no negativo`);
        }

        return {
          id: item.id || `prod-import-${Date.now()}-${idx}`,
          name: item.name,
          description: item.description || "",
          price: item.price,
          originalPrice: item.originalPrice,
          category: item.category,
          subcategory: item.subcategory || "",
          image: item.image || "",
          rating: item.rating || 0,
          reviews: item.reviews || 0,
          stock: item.stock,
          featured: item.featured || false,
        };
      });

      onImport(products);
      toast.success(`${products.length} productos importados exitosamente`);
    } catch (err: any) {
      setError(err.message || "Error al procesar JSON");
      toast.error("Error en la importación");
    }
  }

  function handleDownloadTemplate() {
    const blob = new Blob([exampleJSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-productos.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Plantilla descargada");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm text-gray-900">Importación masiva de productos</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pega un JSON con el array de productos</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-blue-900 mb-1">Formato del JSON:</p>
                <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
                  <li>Debe ser un array de objetos</li>
                  <li>Campos obligatorios: name, category, price, stock</li>
                  <li>Campos opcionales: description, originalPrice, subcategory, image, rating, reviews, featured</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Download template button */}
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 text-xs text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors w-full justify-center"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            Descargar plantilla de ejemplo
          </button>

          {/* JSON textarea */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">JSON de productos</label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full h-64 text-xs text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white font-mono resize-none"
              placeholder={exampleJSON}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleImport} className="flex items-center gap-1.5 text-xs text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors">
            <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
            Importar productos
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────── */
export function AdminProducts() {
  const [list, setList]           = useState<Product[]>(initialProducts);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortKey, setSortKey]     = useState<SortKey>("name");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("asc");
  const [modal, setModal]         = useState<null | "new" | Product>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [preview, setPreview]     = useState<Product | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const catOptions = ["all", ...Array.from(new Set(list.map((p) => p.category)))];

  const filtered = useMemo(() => {
    let l = [...list];
    if (search)          l = l.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== "all") l = l.filter((p) => p.category === catFilter);
    l.sort((a, b) => {
      const va = a[sortKey as keyof Product] as any;
      const vb = b[sortKey as keyof Product] as any;
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return l;
  }, [list, search, catFilter, sortKey, sortDir]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filtered.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCatFilter(value);
    setCurrentPage(1);
  };

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
    setCurrentPage(1);
  }

  function handleSave(p: Product) {
    setList((prev) => prev.find((x) => x.id === p.id) ? prev.map((x) => x.id === p.id ? p : x) : [...prev, p]);
    setModal(null);
    toast.success(modal === "new" ? "Producto creado" : "Producto actualizado");
  }

  function handleBulkImport(products: Product[]) {
    setList((prev) => [...prev, ...products]);
    setShowBulkImport(false);
  }

  function confirmDelete(id: string) {
    setList((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
    toast.success("Producto eliminado");
  }

  const totalValue = list.reduce((s, p) => s + p.price * p.stock, 0);
  const lowStock   = list.filter((p) => p.stock < 10).length;

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => handleSort(k)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-gray-900" : ""}`} strokeWidth={1.5} />
    </button>
  );

  return (
    <div className="h-full flex flex-col space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl text-gray-900 tracking-tight">Productos</h1>
          <p className="text-xs text-gray-400 mt-1">{list.length} productos · Valor inventario ${totalValue.toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkImport(true)}
            className="inline-flex items-center gap-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
            Importar
          </button>
          <button
            onClick={() => setModal("new")}
            className="inline-flex items-center gap-2 text-xs text-white bg-gray-900 rounded-xl px-4 py-2.5 hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            Nuevo producto
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total productos", value: list.length },
          { label: "Stock bajo (<10)", value: lowStock, alert: lowStock > 0 },
          { label: "Sin stock",       value: list.filter((p) => p.stock === 0).length, alert: true },
          { label: "Destacados",      value: list.filter((p) => p.featured).length },
        ].map(({ label, value, alert }) => (
          <div key={label} className={`bg-white border rounded-xl px-4 py-3 ${alert && value > 0 ? "border-amber-200" : "border-gray-100"}`}>
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-xl mt-1 ${alert && value > 0 ? "text-amber-600" : "text-gray-900"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
          <input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Buscar producto..." className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-gray-400 placeholder-gray-300" />
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
        {(search || catFilter !== "all") && (
          <button onClick={() => { setSearch(""); setCatFilter("all"); }} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
            <X className="w-3 h-3" strokeWidth={1.5} /> Limpiar
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} resultados</span>
      </div>

      {/* Table - Scrollable area */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs text-gray-400 font-normal">
                    <SortBtn k="name" label="Producto" />
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs text-gray-400 font-normal hidden sm:table-cell">Categoría</th>
                  <th className="text-right px-4 py-3.5 text-xs text-gray-400 font-normal">
                    <SortBtn k="price" label="Precio" />
                  </th>
                  <th className="text-right px-4 py-3.5 text-xs text-gray-400 font-normal">
                    <SortBtn k="stock" label="Stock" />
                  </th>
                  <th className="text-right px-4 py-3.5 text-xs text-gray-400 font-normal hidden md:table-cell">
                    <SortBtn k="rating" label="Rating" />
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs text-gray-400 font-normal">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0 bg-gray-50">
                          {p.image
                            ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            : <Package className="w-4 h-4 text-gray-300 m-auto mt-3" strokeWidth={1.5} />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-900 truncate max-w-[180px]">{p.name}</p>
                          <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{p.subcategory}</p>
                        </div>
                        {p.featured && (
                          <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" strokeWidth={0} fill="currentColor" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">{p.category}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div>
                        <p className="text-xs text-gray-900">${p.price}</p>
                        {p.originalPrice && <p className="text-[11px] text-gray-400 line-through">${p.originalPrice}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-900">{p.stock}</span>
                        <Badge label={p.stock === 0 ? "Sin stock" : p.stock < 10 ? "Bajo" : "OK"} variant={p.stock === 0 ? "red" : stockVariant(p.stock)} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden md:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-3 h-3 text-amber-400" fill="currentColor" strokeWidth={0} />
                        <span className="text-xs text-gray-500">{p.rating}</span>
                        <span className="text-[11px] text-gray-300">({p.reviews})</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal(p)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => setPreview(p)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                          title="Vista previa en tienda"
                        >
                          <Monitor className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="w-8 h-8 text-gray-200 mb-3" strokeWidth={1.5} />
                <p className="text-sm text-gray-400">No hay productos que coincidan</p>
                <button onClick={() => { setSearch(""); setCatFilter("all"); }} className="mt-3 text-xs text-gray-500 underline">Limpiar filtros</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pb-8">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span className="text-xs text-gray-400">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Product modal */}
      {modal && (
        <ProductModal
          product={modal === "new" ? EMPTY : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm text-gray-900 mb-1">¿Eliminar producto?</h3>
            <p className="text-xs text-gray-400 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteId(null)} className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => confirmDelete(deleteId)} className="text-xs text-white bg-red-500 rounded-xl px-4 py-2 hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Product preview */}
      {preview && (
        <ProductPreview
          product={preview}
          onClose={() => setPreview(null)}
        />
      )}

      {/* Bulk import modal */}
      {showBulkImport && (
        <BulkImportModal
          onImport={handleBulkImport}
          onClose={() => setShowBulkImport(false)}
        />
      )}
    </div>
  );
}