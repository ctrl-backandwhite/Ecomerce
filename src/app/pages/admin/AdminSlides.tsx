import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Image as ImageIcon, Trash2, Pencil, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { type Slide as ApiSlide, type SlidePayload, slideRepository } from "../../repositories/CmsRepository";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  align: "left" | "right";
  status: "active" | "inactive";
  order: number;
}

// Mock data replaced with API loading

/* ── API Mappers ─────────────────────────────────────── */
function mapApiToUi(s: ApiSlide): Slide {
  return {
    id: s.id,
    title: s.title,
    subtitle: s.subtitle ?? "",
    description: "",
    badge: "",
    badgeColor: "#3B82F6",
    buttonText: s.buttonText ?? "",
    buttonLink: s.link ?? "",
    image: s.imageUrl,
    align: "left",
    status: s.active ? "active" : "inactive",
    order: s.position,
  };
}

function uiToPayload(s: Slide): SlidePayload {
  return {
    title: s.title,
    subtitle: s.subtitle || undefined,
    imageUrl: s.image,
    link: s.buttonLink || undefined,
    buttonText: s.buttonText || undefined,
    position: s.order,
    active: s.status === "active",
  };
}

interface SlideModalProps {
  slide?: Slide;
  onSave: (slide: Slide) => void;
  onClose: () => void;
}

function SlideModal({ slide, onSave, onClose }: SlideModalProps) {
  const [form, setForm] = useState<Slide>(
    slide || {
      id: "",
      title: "",
      subtitle: "",
      description: "",
      badge: "",
      badgeColor: "#3B82F6",
      buttonText: "",
      buttonLink: "",
      image: "",
      align: "left",
      status: "active",
      order: 0,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("El título es requerido");
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg text-gray-900">{slide ? "Editar Slide" : "Nuevo Slide"}</h2>
          <p className="text-xs text-gray-400 mt-1">
            {slide ? "Modifica los datos del slide" : "Completa la información del slide"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Título */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-2">Título principal *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: Descubre los Mejores Productos"
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400"
                required
              />
            </div>

            {/* Subtítulo */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">Subtítulo</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Ej: Tecnología de vanguardia"
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Badge */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">Badge</label>
              <input
                type="text"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="Ej: Nuevo"
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Descripción */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-2">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripción breve del slide..."
                rows={3}
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400 resize-none"
              />
            </div>

            {/* Texto del botón */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">Texto del botón</label>
              <input
                type="text"
                value={form.buttonText}
                onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                placeholder="Ej: Ver Ofertas"
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Link del botón */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">Link del botón</label>
              <input
                type="text"
                value={form.buttonLink}
                onChange={(e) => setForm({ ...form, buttonLink: e.target.value })}
                placeholder="Ej: /?ofertas=true"
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Color del badge */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">Color del badge</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.badgeColor}
                  onChange={(e) => setForm({ ...form, badgeColor: e.target.value })}
                  className="h-9 w-16 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.badgeColor}
                  onChange={(e) => setForm({ ...form, badgeColor: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>

            {/* Alineación */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">Alineación del contenido</label>
              <select
                value={form.align}
                onChange={(e) => setForm({ ...form, align: e.target.value as "left" | "right" })}
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400"
              >
                <option value="left">Izquierda</option>
                <option value="right">Derecha</option>
              </select>
            </div>

            {/* URL de imagen */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-2">URL de la imagen</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Preview de la imagen */}
            {form.image && (
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-2">Vista previa</label>
                <div className="relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "";
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Estado */}
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.status === "active"}
                  onChange={(e) => setForm({ ...form, status: e.target.checked ? "active" : "inactive" })}
                  className="w-4 h-4 rounded border-gray-200 text-gray-900 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs text-gray-700">Slide activo (visible en el slider)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="text-xs text-gray-700 bg-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-300 transition-colors"
            >
              {slide ? "Guardar cambios" : "Crear slide"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DraggableSlideRowProps {
  slide: Slide;
  index: number;
  moveSlide: (dragIndex: number, hoverIndex: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function DraggableSlideRow({
  slide,
  index,
  moveSlide,
  onEdit,
  onDelete,
  onToggleStatus,
  isExpanded,
  onToggleExpand,
}: DraggableSlideRowProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: "SLIDE",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "SLIDE",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveSlide(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => preview(drop(node))}
      className={`bg-white border border-gray-100 rounded-xl overflow-hidden transition-all ${isDragging ? "opacity-50 scale-95" : ""
        }`}
    >
      {/* Main Row */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Drag handle */}
        <div ref={drag} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-300" strokeWidth={1.5} />
        </div>

        {/* Order badge */}
        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-500">{slide.order}</span>
        </div>

        {/* Thumbnail */}
        <div className="w-20 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {slide.image ? (
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm text-gray-900 truncate">{slide.title}</h3>
            {slide.badge && (
              <span
                className="text-[10px] text-white px-2 py-0.5 rounded-md"
                style={{ backgroundColor: slide.badgeColor }}
              >
                {slide.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{slide.subtitle}</p>
        </div>

        {/* Status badge */}
        <div
          className={`text-[10px] px-2 py-1 rounded-lg border ${slide.status === "active"
              ? "text-green-600 bg-green-50 border-green-100"
              : "text-gray-400 bg-gray-50 border-gray-100"
            }`}
        >
          {slide.status === "active" ? "Activo" : "Inactivo"}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleExpand}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            title={isExpanded ? "Contraer" : "Expandir"}
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
            )}
          </button>
          <button
            onClick={onToggleStatus}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            title={slide.status === "active" ? "Desactivar" : "Activar"}
          >
            {slide.status === "active" ? (
              <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
            ) : (
              <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
            )}
          </button>
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Descripción</p>
              <p className="text-xs text-gray-700">{slide.description || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Botón</p>
              <p className="text-xs text-gray-700">{slide.buttonText || "—"}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{slide.buttonLink || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Alineación</p>
              <p className="text-xs text-gray-700">{slide.align === "left" ? "Izquierda" : "Derecha"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Color Badge</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border border-gray-200"
                  style={{ backgroundColor: slide.badgeColor }}
                />
                <span className="text-xs text-gray-700">{slide.badgeColor}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminSlides() {
  const [list, setList] = useState<Slide[]>([]);
  const [modal, setModal] = useState<{ slide?: Slide } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadSlides = useCallback(async () => {
    try {
      const slides = await slideRepository.findAll();
      setList(slides.map(mapApiToUi));
    } catch { toast.error("Error al cargar los slides"); }
  }, []);

  useEffect(() => { loadSlides(); }, [loadSlides]);

  const activeSlides = useMemo(() => list.filter((s) => s.status === "active").length, [list]);

  const handleSaveSlide = async (slide: Slide) => {
    try {
      if (slide.id) {
        const updated = await slideRepository.update(slide.id, uiToPayload(slide));
        setList((prev) => prev.map((s) => (s.id === slide.id ? mapApiToUi(updated) : s)));
        toast.success("Slide actualizado");
      } else {
        const created = await slideRepository.create(uiToPayload({ ...slide, order: list.length + 1 }));
        setList((prev) => [...prev, mapApiToUi(created)]);
        toast.success("Slide creado");
      }
    } catch { toast.error("Error al guardar el slide"); }
    setModal(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await slideRepository.delete(id);
      setList((prev) => prev.filter((s) => s.id !== id));
      toast.success("Slide eliminado");
    } catch { toast.error("Error al eliminar el slide"); }
    setDeleteId(null);
  };

  const handleToggleStatus = async (id: string) => {
    const slide = list.find(s => s.id === id);
    if (!slide) return;
    try {
      const updated = await slideRepository.update(id, uiToPayload({ ...slide, status: slide.status === "active" ? "inactive" : "active" }));
      setList((prev) => prev.map((s) => (s.id === id ? mapApiToUi(updated) : s)));
    } catch { toast.error("Error al cambiar el estado"); }
  };

  const moveSlide = async (dragIndex: number, hoverIndex: number) => {
    const dragSlide = list[dragIndex];
    const newList = [...list];
    newList.splice(dragIndex, 1);
    newList.splice(hoverIndex, 0, dragSlide);
    const reordered = newList.map((s, i) => ({ ...s, order: i + 1 }));
    setList(reordered);
    try {
      await slideRepository.updatePositions(reordered.map(s => ({ id: s.id, position: s.order })));
    } catch { /* silently fail and keep UI state */ }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl text-gray-900 tracking-tight">Slides Home</h1>
            <p className="text-xs text-gray-400 mt-1">{list.length} slides en rotación</p>
          </div>
          <button
            onClick={() => setModal({})}
            className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
            title="Nuevo slide"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Slides list */}
        <div className="flex-1 overflow-auto space-y-3 pr-1">
          {list.map((slide, index) => (
            <DraggableSlideRow
              key={slide.id}
              slide={slide}
              index={index}
              moveSlide={moveSlide}
              onEdit={() => setModal({ slide })}
              onDelete={() => setDeleteId(slide.id)}
              onToggleStatus={() => handleToggleStatus(slide.id)}
              isExpanded={expanded === slide.id}
              onToggleExpand={() => setExpanded(expanded === slide.id ? null : slide.id)}
            />
          ))}

          {list.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-xl text-center">
              <ImageIcon className="w-8 h-8 text-gray-200 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-400">No hay slides creados</p>
              <button
                onClick={() => setModal({})}
                className="mt-4 text-xs text-gray-700 bg-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-300 transition-colors"
              >
                Crear primer slide
              </button>
            </div>
          )}
        </div>

        {/* Slide Modal */}
        {modal && (
          <SlideModal
            slide={modal.slide}
            onSave={handleSaveSlide}
            onClose={() => setModal(null)}
          />
        )}

        {/* Delete Confirmation */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6">
              <h3 className="text-base text-gray-900 mb-2">¿Eliminar slide?</h3>
              <p className="text-xs text-gray-500 mb-6">
                Esta acción no se puede deshacer. El slide será eliminado permanentemente.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 text-xs text-white bg-red-500 rounded-xl px-4 py-2.5 hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}