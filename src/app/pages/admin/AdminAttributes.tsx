import { useState, useEffect } from "react";
import {
  Search, Plus, Pencil, Trash2, X, Check,
  ChevronDown, Tag, Palette, Type, List,
} from "lucide-react";
import { type Attribute, type AttributeValue } from "../../data/attributes";
import { toast } from "sonner";
import { Pagination } from "../../components/admin/Pagination";
import { useStore } from "../../context/StoreContext";

const TYPE_LABELS: Record<Attribute["type"], string> = {
  color: "Color",
  text: "Texto",
  size: "Talla",
  select: "Selección",
};

const TYPE_ICONS: Record<Attribute["type"], typeof Tag> = {
  color: Palette,
  text: Type,
  size: Tag,
  select: List,
};

/* ── Attribute Modal ──────────────────────────────────────── */
function AttributeModal({
  attribute, onSave, onClose,
}: {
  attribute: Partial<Attribute> & { id?: string };
  onSave: (a: Attribute) => void;
  onClose: () => void;
}) {
  const isNew = !attribute.id;
  const [name, setName] = useState(attribute.name ?? "");
  const [slug, setSlug] = useState(attribute.slug ?? "");
  const [type, setType] = useState<Attribute["type"]>(attribute.type ?? "text");
  const [values, setValues] = useState<AttributeValue[]>(attribute.values ?? []);
  const [newValue, setNewValue] = useState("");
  const [newColor, setNewColor] = useState("#6B7280");

  function slugify(str: string) {
    return str.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  }

  function handleNameChange(v: string) {
    setName(v);
    if (isNew) setSlug(slugify(v));
  }

  function addValue() {
    if (!newValue.trim()) return;
    const exists = values.some((v) => v.value.toLowerCase() === newValue.trim().toLowerCase());
    if (exists) { toast.error("El valor ya existe"); return; }
    const val: AttributeValue = {
      id: `val-${Date.now()}`,
      value: newValue.trim(),
      ...(type === "color" ? { color: newColor } : {}),
    };
    setValues((prev) => [...prev, val]);
    setNewValue("");
  }

  function removeValue(id: string) {
    setValues((prev) => prev.filter((v) => v.id !== id));
  }

  function handleSave() {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (values.length === 0) { toast.error("Agrega al menos un valor"); return; }
    onSave({
      id: attribute.id ?? `attr-${Date.now()}`,
      name: name.trim(),
      slug,
      type,
      values,
      usedInProducts: attribute.usedInProducts ?? 0,
    });
  }

  const field = "w-full text-xs text-gray-900 border border-gray-200 rounded-xl px-2.5 py-1 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white";
  const lbl = "block text-xs text-gray-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm text-gray-900">{isNew ? "Nuevo atributo" : "Editar atributo"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isNew ? "Define el atributo y sus valores posibles" : `Editando: ${attribute.name}`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Nombre del atributo *</label>
              <input value={name} onChange={(e) => handleNameChange(e.target.value)} className={field} placeholder="Ej: Color" />
            </div>
            <div>
              <label className={lbl}>Tipo</label>
              <div className="relative">
                <select value={type} onChange={(e) => setType(e.target.value as Attribute["type"])} className={`${field} appearance-none pr-8`}>
                  <option value="text">Texto</option>
                  <option value="color">Color</option>
                  <option value="size">Talla</option>
                  <option value="select">Selección</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className={lbl}>Slug</label>
            <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className={field} placeholder="color" />
          </div>

          {/* Values */}
          <div>
            <label className={lbl}>Valores ({values.length})</label>
            <div className="flex gap-2 mb-3">
              {type === "color" && (
                <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-10 w-12 border border-gray-200 rounded-xl cursor-pointer p-1 flex-shrink-0" />
              )}
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addValue()}
                className={`${field} flex-1`}
                placeholder={type === "color" ? "Ej: Rojo" : "Ej: XL"}
              />
              <button
                onClick={addValue}
                className="flex items-center gap-1.5 text-xs text-white bg-gray-900 rounded-xl px-4 py-2.5 hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                Agregar
              </button>
            </div>

            {values.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-xl">
                Agrega valores al atributo
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl min-h-[60px]">
                {values.map((v) => (
                  <div
                    key={v.id}
                    className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-1.5"
                  >
                    {type === "color" && v.color && (
                      <span className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: v.color }} />
                    )}
                    <span>{v.value}</span>
                    <button
                      onClick={() => removeValue(v.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
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
            {isNew ? "Crear atributo" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────── */
export function AdminAttributes() {
  const { attributes: list, saveAttribute, deleteAttribute } = useStore();

  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState<Partial<Attribute> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage]         = useState(1);
  const PAGE_SIZE = 10;

  const filtered = list.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => setPage(1), [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSave(a: Attribute) {
    saveAttribute(a);
    toast.success(modal?.id ? "Atributo actualizado" : "Atributo creado");
    setModal(null);
  }

  function handleDelete(id: string) {
    deleteAttribute(id);
    toast.success("Atributo eliminado");
    setDeleteId(null);
  }

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-gray-900 tracking-tight">Atributos</h1>
          <p className="text-xs text-gray-400 mt-1">{list.length} atributos · {list.reduce((s, a) => s + a.values.length, 0)} valores totales</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="w-9 h-9 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all flex items-center justify-center shadow-sm hover:shadow-md"
          title="Nuevo atributo"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar atributo..."
            className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-gray-400 placeholder-gray-300"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto space-y-2 pr-1">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-100 rounded-xl">
            <Tag className="w-10 h-10 text-gray-200 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-gray-400">No hay atributos</p>
          </div>
        )}

        {paginated.map((attr) => {
          const Icon = TYPE_ICONS[attr.type];
          const isExpanded = expanded === attr.id;

          return (
            <div key={attr.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors group"
                onClick={() => setExpanded(isExpanded ? null : attr.id)}
              >
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900">{attr.name}</p>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[attr.type]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{attr.values.length} valores · usado en {attr.usedInProducts} productos</p>
                </div>

                {/* Preview of first 4 values */}
                <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                  {attr.type === "color"
                    ? attr.values.slice(0, 6).map((v) => (
                        <span key={v.id} className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: v.color }} title={v.value} />
                      ))
                    : attr.values.slice(0, 4).map((v) => (
                        <span key={v.id} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{v.value}</span>
                      ))
                  }
                  {attr.values.length > (attr.type === "color" ? 6 : 4) && (
                    <span className="text-[10px] text-gray-400">+{attr.values.length - (attr.type === "color" ? 6 : 4)}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setModal(attr)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setDeleteId(attr.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                  strokeWidth={1.5}
                />
              </div>

              {/* Expanded values */}
              {isExpanded && (
                <div className="px-5 pb-4 border-t border-gray-50 pt-3">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Todos los valores</p>
                  <div className="flex flex-wrap gap-2">
                    {attr.values.map((v) => (
                      <div key={v.id} className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-1.5">
                        {attr.type === "color" && v.color && (
                          <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: v.color }} />
                        )}
                        <span>{v.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />

      {modal !== null && (
        <AttributeModal attribute={modal} onSave={handleSave} onClose={() => setModal(null)} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm text-gray-900 mb-2">¿Eliminar atributo?</h3>
            <p className="text-xs text-gray-400 mb-6">Se eliminarán también todos sus valores. Esta acción no se puede deshacer.</p>
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