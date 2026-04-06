import { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Pencil, Trash2, X, Check,
  Globe, Package, ChevronDown, ExternalLink,
} from "lucide-react";
import { type Brand, brandRepository } from "../../repositories/BrandRepository";
import { toast } from "sonner";
import { Pagination } from "../../components/admin/Pagination";
import { slugify } from "../../lib/urls";

const EMPTY: Partial<Brand> = {
  name: "", slug: "", logoUrl: "", websiteUrl: "", description: "", productCount: 0, status: "ACTIVE",
};

/* ── Brand Logo with fallback ────────────────────────────── */
function BrandLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
      {logoUrl && !failed ? (
        <img src={logoUrl} alt={name} className="w-full h-full object-contain p-1" onError={() => setFailed(true)} />
      ) : (
        <span className="text-xs font-medium text-gray-500">{initials}</span>
      )}
    </div>
  );
}

/* ── Brand Modal ─────────────────────────────────────────── */
function BrandModal({
  brand, onSave, onClose,
}: {
  brand: Partial<Brand> & { id?: string };
  onSave: (b: Brand) => void;
  onClose: () => void;
}) {
  const isNew = !brand.id;
  const [form, setForm] = useState<Omit<Brand, "id" | "createdAt" | "updatedAt">>({
    name: brand.name ?? "",
    slug: brand.slug ?? "",
    logoUrl: brand.logoUrl ?? "",
    websiteUrl: brand.websiteUrl ?? "",
    description: brand.description ?? "",
    productCount: brand.productCount ?? 0,
    status: brand.status ?? "ACTIVE",
  });

  const set = (k: keyof typeof form, v: any) => setForm((f: typeof form) => ({ ...f, [k]: v }));

  function handleNameChange(v: string) {
    set("name", v);
    if (isNew) set("slug", slugify(v));
  }

  function validate() {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return false; }
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({ id: brand.id ?? "", ...form, createdAt: brand.createdAt ?? new Date().toISOString(), updatedAt: brand.updatedAt ?? null });
  }

  const field = "w-full text-xs text-gray-900 border border-gray-200 rounded-xl px-2.5 py-1 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white";
  const lbl = "block text-xs text-gray-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm text-gray-900">{isNew ? "Nueva marca" : "Editar marca"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isNew ? "Agrega una nueva marca al catálogo" : `Editando: ${brand.name}`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Name + Status */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={lbl}>Nombre *</label>
              <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={field} placeholder="Ej: Apple" />
            </div>
            <div className="flex-shrink-0">
              <label className={lbl}>Estado</label>
              <div className="relative">
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className={`${field} appearance-none pr-8`}>
                  <option value="ACTIVE">Activa</option>
                  <option value="INACTIVE">Inactiva</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className={lbl}>Slug (URL)</label>
            <input value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} className={field} placeholder="apple" />
          </div>

          {/* Logo URL */}
          <div>
            <label className={lbl}>URL del logo (opcional)</label>
            <input value={form.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} className={field} placeholder="https://..." />
          </div>

          {/* Website */}
          <div>
            <label className={lbl}>Sitio web (opcional)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
              <input value={form.websiteUrl ?? ""} onChange={(e) => set("websiteUrl", e.target.value)} className={`${field} pl-8`} placeholder="https://apple.com" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={lbl}>Descripción</label>
            <textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} className={`${field} h-20 resize-none`} placeholder="Breve descripción de la marca..." />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors">
            <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
            {isNew ? "Crear marca" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────── */
export function AdminBrands() {
  const [list, setList] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Partial<Brand> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadBrands = useCallback(async () => {
    setLoading(true);
    try { setList(await brandRepository.findAll()); }
    catch { toast.error("Error al cargar las marcas"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBrands(); }, [loadBrands]);

  const filtered = list.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => setPage(1), [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSave(b: Brand) {
    try {
      if (modal?.id) {
        await brandRepository.update(b.id, { name: b.name, slug: b.slug, logoUrl: b.logoUrl ?? undefined, websiteUrl: b.websiteUrl ?? undefined, description: b.description ?? undefined });
      } else {
        await brandRepository.create({ name: b.name, slug: b.slug, logoUrl: b.logoUrl ?? undefined, websiteUrl: b.websiteUrl ?? undefined, description: b.description ?? undefined });
      }
      await loadBrands();
      toast.success(modal?.id ? "Marca actualizada" : "Marca creada");
    } catch { toast.error("Error al guardar la marca"); }
    setModal(null);
  }

  async function handleDelete(id: string) {
    try {
      await brandRepository.delete(id);
      await loadBrands();
      toast.success("Marca eliminada");
    } catch { toast.error("Error al eliminar la marca"); }
    setDeleteId(null);
  }

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-gray-900 tracking-tight">Marcas</h1>
          <p className="text-xs text-gray-400 mt-1">{list.length} marcas registradas</p>
        </div>
        <button
          onClick={() => setModal(EMPTY)}
          className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md"
          title="Nueva marca"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar marca..."
            className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-gray-400 placeholder-gray-300"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col flex-1 min-h-0 bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 px-5 py-3.5">Marca</th>
                <th className="text-left text-xs text-gray-400 px-5 py-3.5 hidden md:table-cell">Sitio web</th>
                <th className="text-right text-xs text-gray-400 px-5 py-3.5 hidden sm:table-cell">Productos</th>
                <th className="text-left text-xs text-gray-400 px-5 py-3.5">Estado</th>
                <th className="text-right text-xs text-gray-400 px-5 py-3.5">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-xs text-gray-400">
                    {search ? "No se encontraron marcas" : "No hay marcas registradas"}
                  </td>
                </tr>
              )}
              {paginated.map((brand) => (
                <tr key={brand.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <BrandLogo name={brand.name} logoUrl={brand.logoUrl} />
                      <div>
                        <p className="text-sm text-gray-900">{brand.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{brand.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {brand.websiteUrl ? (
                      <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                        <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                        {brand.websiteUrl.replace("https://", "")}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-1.5 text-xs text-gray-600">
                      <Package className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                      {brand.productCount}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full ${brand.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {brand.status === "ACTIVE" ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal(brand)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setDeleteId(brand.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* Brand Modal */}
      {modal !== null && (
        <BrandModal brand={modal} onSave={handleSave} onClose={() => setModal(null)} />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm text-gray-900 mb-2">¿Eliminar marca?</h3>
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