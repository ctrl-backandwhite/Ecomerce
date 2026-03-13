import { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Plus, Pencil, Trash2, X, Check, GripVertical,
  Tag, AlertTriangle, Search, ToggleLeft, ToggleRight,
  ChevronDown, ChevronRight, Upload, Download, FileText,
  Eye, EyeOff, Send, Filter, LayoutGrid, CheckCircle2, Layers,
  /* ── icon palette ── */
  Cpu, Shirt, Sofa, Headphones, Gamepad2, Camera, Watch,
  Package, ShoppingBag, Smartphone, Laptop, Tablet,
  Music, Mic, Speaker, Tv, Monitor, Printer,
  Bike, Car, Plane, Home, Utensils, BookOpen,
  /* ── additional icons ── */
  Zap, Heart, Star, Award, Target, TrendingUp, Sparkles,
  Coffee, Gift, Briefcase, Palette, Code, Database, Lock,
  Mail, MessageCircle, Bell, Calendar, Clock, Map,
  Puzzle, Rocket, Shield, Truck, Wrench, Hammer,
  type LucideIcon,
} from "lucide-react";
import { categories as initialCategories, type Category } from "../../data/adminData";
import { toast } from "sonner";

/* ── Icon registry ────────────────────────────────────── */
const INITIAL_ICON_MAP: Record<string, LucideIcon> = {
  Cpu, Shirt, Sofa, Headphones, Gamepad2, Camera, Watch,
  Package, ShoppingBag, Smartphone, Laptop, Tablet,
  Music, Mic, Speaker, Tv, Monitor, Printer,
  Bike, Car, Plane, Home, Utensils, BookOpen,
  Zap, Heart, Star, Award, Target, TrendingUp, Sparkles,
  Coffee, Gift, Briefcase, Palette, Code, Database, Lock,
  Mail, MessageCircle, Bell, Calendar, Clock, Map,
  Puzzle, Rocket, Shield, Truck, Wrench, Hammer,
};

const INITIAL_ICON_LABELS: Record<string, string> = {
  Cpu:         "Electrónica / CPU",
  Shirt:       "Ropa / Moda",
  Sofa:        "Hogar / Muebles",
  Headphones:  "Audio / Auriculares",
  Gamepad2:    "Gaming / Videojuegos",
  Camera:      "Fotografía / Cámara",
  Watch:       "Relojes / Wearables",
  Package:     "Paquete / General",
  ShoppingBag: "Tienda / Compras",
  Smartphone:  "Smartphone / Móvil",
  Laptop:      "Laptop / Portátil",
  Tablet:      "Tablet",
  Music:       "Música",
  Mic:         "Micrófono",
  Speaker:     "Altavoz",
  Tv:          "Televisión",
  Monitor:     "Monitor / Pantalla",
  Printer:     "Impresora",
  Bike:        "Bicicleta / Deporte",
  Car:         "Automóvil / Motor",
  Plane:       "Viajes / Avión",
  Home:        "Casa / Inmobiliaria",
  Utensils:    "Cocina / Alimentación",
  BookOpen:    "Libros / Educación",
  Zap:         "Energía / Rápido",
  Heart:       "Favoritos / Salud",
  Star:        "Destacados / Premium",
  Award:       "Premios / Logros",
  Target:      "Objetivos / Metas",
  TrendingUp:  "Tendencias / Crecimiento",
  Sparkles:    "Nuevo / Especial",
  Coffee:      "Café / Bebidas",
  Gift:        "Regalos / Promociones",
  Briefcase:   "Negocios / Profesional",
  Palette:     "Arte / Diseño",
  Code:        "Programación / Tech",
  Database:    "Datos / Almacenamiento",
  Lock:        "Seguridad / Privado",
  Mail:        "Correo / Comunicación",
  MessageCircle: "Mensajes / Chat",
  Bell:        "Notificaciones / Alertas",
  Calendar:    "Calendario / Eventos",
  Clock:       "Tiempo / Horarios",
  Map:         "Mapas / Ubicación",
  Puzzle:      "Juegos / Entretenimiento",
  Rocket:      "Innovación / Lanzamiento",
  Shield:      "Protección / Garantía",
  Truck:       "Envíos / Logística",
  Wrench:      "Herramientas / Mantenimiento",
  Hammer:      "Construcción / DIY",
};

const ICON_MAP: Record<string, LucideIcon> = { ...INITIAL_ICON_MAP };
const ICON_LABELS: Record<string, string> = { ...INITIAL_ICON_LABELS };

const ICON_OPTIONS: { name: string; Icon: LucideIcon; label: string }[] = Object.entries(ICON_MAP).map(
  ([name, Icon]) => ({ name, Icon, label: ICON_LABELS[name] ?? name })
);

/* Resolve an icon name to a component */
function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return Package;
  return ICON_MAP[name] ?? Package;
}

/* Renders a Lucide icon by name */
function CatIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = resolveIcon(name);
  return <Icon className={className ?? "w-4 h-4"} strokeWidth={1.5} />;
}

/* ── Tooltip wrapper ─────────────────────────────────── */
function IconTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-[11px] leading-tight rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
            {label}
          </div>
          <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1 rounded-sm" />
        </div>
      )}
    </div>
  );
}

/* ── Drag & Drop Types ──────────────────────────────── */
const DND_TYPE_CATEGORY = "category";
const DND_TYPE_SUBCATEGORY = "subcategory";

/* ── Category modal ──────────────────────────────────── */
function CategoryModal({
  category, onSave, onClose,
}: {
  category?: Category;
  onSave: (c: Category) => void;
  onClose: () => void;
}) {
  const isNew = !category;
  const isParent = !category || !category.parent_id;
  
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "Package");
  const [desc, setDesc] = useState(category?.description ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [keywords, setKeywords] = useState<string[]>(category?.keywords ?? []);
  const [newKeyword, setNewKeyword] = useState("");
  const [published, setPublished] = useState(category?.published ?? false);

  function autoSlug(n: string) {
    return n
      .toLowerCase()
      .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i")
      .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function handleNameChange(n: string) {
    setName(n);
    if (!category) setSlug(autoSlug(n));
  }

  function handleAddKeyword() {
    if (!newKeyword.trim()) return;
    if (keywords.includes(newKeyword.trim().toLowerCase())) {
      toast.error("Esta keyword ya existe");
      return;
    }
    setKeywords((prev) => [...prev, newKeyword.trim().toLowerCase()]);
    setNewKeyword("");
  }

  function handleRemoveKeyword(kw: string) {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  }

  function handleSave() {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    onSave({
      id:           category?.id ?? `${Date.now()}`,
      name:         name.trim(),
      slug:         slug || autoSlug(name),
      icon:         isParent ? icon : undefined,
      description:  desc,
      keywords,
      parent_id:    category?.parent_id ?? null,
      productCount: category?.productCount ?? 0,
      status:       category?.status ?? "active",
      order:        category?.order ?? 999,
      published,
    });
  }

  const field = "w-full text-xs text-gray-900 border border-gray-200 rounded-xl px-2.5 py-1 focus:outline-none focus:border-gray-400 placeholder-gray-300";
  const lbl   = "block text-xs text-gray-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm text-gray-900">{isNew ? "Nueva categoría" : `Editar: ${category.name}`}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Icon picker - only for parent categories */}
          {isParent && (
            <div>
              <label className={lbl}>Ícono</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(({ name: iName, Icon, label }) => {
                  const selected = icon === iName;
                  return (
                    <IconTooltip key={iName} label={label}>
                      <button
                        type="button"
                        onClick={() => setIcon(iName)}
                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                          selected
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700"
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </IconTooltip>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center">
                  <CatIcon name={icon} className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-xs text-gray-400">
                  Seleccionado: <span className="text-gray-700">{ICON_LABELS[icon] ?? icon}</span>
                </span>
              </div>
            </div>
          )}

          <div>
            <label className={lbl}>Nombre *</label>
            <input value={name} onChange={(e) => handleNameChange(e.target.value)} className={field} placeholder="Ej: Electrónica" />
          </div>

          <div>
            <label className={lbl}>Slug (URL)</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={field} placeholder="electronica" />
          </div>

          <div>
            <label className={lbl}>Descripción</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className={`${field} h-16 resize-none`} placeholder="Descripción breve..." />
          </div>

          {/* Keywords section */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-gray-400 uppercase tracking-wider">
                Keywords ({keywords.length})
              </label>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                className={field}
                placeholder="Agregar keyword..."
              />
              <button
                onClick={handleAddKeyword}
                className="flex items-center gap-1.5 text-xs text-white bg-gray-900 rounded-xl px-4 py-2.5 hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                Agregar
              </button>
            </div>

            {/* Keywords list */}
            <div className="flex flex-wrap gap-2">
              {keywords.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl w-full">
                  No hay keywords aún
                </p>
              )}

              {keywords.map((kw) => (
                <div
                  key={kw}
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-xs rounded-lg px-3 py-1.5"
                >
                  <span>{kw}</span>
                  <button
                    onClick={() => handleRemoveKeyword(kw)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Published toggle */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-gray-400 uppercase tracking-wider">
                Publicado
              </label>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setPublished(!published)}
                className={`flex items-center gap-1.5 text-xs rounded-xl px-4 py-2.5 transition-colors whitespace-nowrap ${
                  published ? "text-white bg-green-500 hover:bg-green-600" : "text-gray-500 bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {published ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                ) : (
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                )}
                {published ? "Publicado" : "No publicado"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 text-xs text-white bg-gray-900 rounded-xl px-5 py-2.5 hover:bg-gray-800 transition-colors">
            <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
            {isNew ? "Crear categoría" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Draggable Category Row ──────────────────────────── */
interface DraggableCategoryRowProps {
  category: Category;
  subcategories: Category[];
  index: number;
  moveCategory: (dragIndex: number, hoverIndex: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onTogglePublished: () => void;
  onExpand: () => void;
  isExpanded: boolean;
  onAddSubcategory: () => void;
  onEditSubcategory: (sub: Category) => void;
  onDeleteSubcategory: (subId: string) => void;
  onToggleSubStatus: (subId: string) => void;
  moveSubcategory: (subIndex: number, hoverIndex: number) => void;
}

function DraggableCategoryRow({
  category, subcategories, index, moveCategory, onEdit, onDelete, onToggleStatus, onTogglePublished, onExpand, isExpanded,
  onAddSubcategory, onEditSubcategory, onDeleteSubcategory, onToggleSubStatus, moveSubcategory,
}: DraggableCategoryRowProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: DND_TYPE_CATEGORY,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: DND_TYPE_CATEGORY,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveCategory(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => preview(drop(node))}
      className={`bg-white border rounded-xl overflow-hidden transition-all ${
        category.status === "inactive" ? "border-gray-100 opacity-60" : "border-gray-100"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {/* Category row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag handle */}
        <div ref={drag} className="cursor-move text-gray-300 hover:text-gray-500">
          <GripVertical className="w-4 h-4" strokeWidth={1.5} />
        </div>

        {/* Order number */}
        <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-gray-400">{category.order}</span>
        </div>

        {/* Icon */}
        {category.icon && (
          <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CatIcon name={category.icon} className="w-4 h-4 text-gray-500" />
          </div>
        )}

        {/* Info */}
        <button
          onClick={onExpand}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-900">{category.name}</p>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                category.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
              }`}
            >
              {category.status === "active" ? "Activa" : "Inactiva"}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                category.published ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
              }`}
            >
              {category.published ? "Publicado" : "Borrador"}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
            /{category.slug} · {subcategories.length} subcategorías · {category.productCount} productos
          </p>
        </button>

        {/* Expand button */}
        <button
          onClick={onExpand}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            strokeWidth={1.5}
          />
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleStatus}
            title={category.status === "active" ? "Desactivar" : "Activar"}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {category.status === "active"
              ? <ToggleRight className="w-4 h-4 text-green-500" strokeWidth={1.5} />
              : <ToggleLeft  className="w-4 h-4"               strokeWidth={1.5} />
            }
          </button>
          <button
            onClick={onTogglePublished}
            title={category.published ? "Despublicar" : "Publicar"}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {category.published
              ? <Eye className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
              : <EyeOff  className="w-4 h-4"               strokeWidth={1.5} />
            }
          </button>
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Subcategories panel */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Subcategorías ({subcategories.length})
            </p>
            <button
              onClick={onAddSubcategory}
              className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-xl px-3 py-1.5 bg-white hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              <Plus className="w-3 h-3" strokeWidth={1.5} />
              Agregar subcategoría
            </button>
          </div>

          {subcategories.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">Sin subcategorías aún</p>
          )}

          <div className="space-y-2">
            {subcategories.map((sub, subIndex) => (
              <DraggableSubcategoryRow
                key={sub.id}
                subcategory={sub}
                index={subIndex}
                moveSubcategory={moveSubcategory}
                onEdit={() => onEditSubcategory(sub)}
                onDelete={() => onDeleteSubcategory(sub.id)}
                onToggleStatus={() => onToggleSubStatus(sub.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Draggable Subcategory Row ───────────────────────── */
interface DraggableSubcategoryRowProps {
  subcategory: Category;
  index: number;
  moveSubcategory: (dragIndex: number, hoverIndex: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

function DraggableSubcategoryRow({
  subcategory, index, moveSubcategory, onEdit, onDelete, onToggleStatus,
}: DraggableSubcategoryRowProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: DND_TYPE_SUBCATEGORY,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: DND_TYPE_SUBCATEGORY,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveSubcategory(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => preview(drop(node))}
      className={`flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {/* Drag handle */}
      <div ref={drag} className="cursor-move text-gray-300 hover:text-gray-500">
        <GripVertical className="w-3.5 h-3.5" strokeWidth={1.5} />
      </div>

      {/* Order number */}
      <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-[11px] text-gray-400">{subcategory.order}</span>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={1.5} />

      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700">{subcategory.name}</p>
        <p className="text-[11px] text-gray-400">/{subcategory.slug} · {subcategory.productCount} productos</p>
      </div>

      <span
        className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
          subcategory.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
        }`}
      >
        {subcategory.status === "active" ? "Activa" : "Inactiva"}
      </span>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={onToggleStatus}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {subcategory.status === "active"
            ? <ToggleRight className="w-3.5 h-3.5 text-green-500" strokeWidth={1.5} />
            : <ToggleLeft  className="w-3.5 h-3.5"               strokeWidth={1.5} />
          }
        </button>
        <button
          onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Pencil className="w-3 h-3" strokeWidth={1.5} />
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

/* ── Bulk Import Modal ───────────────────────────────── */
function BulkImportCategoriesModal({ 
  onImport, 
  onClose 
}: { 
  onImport: (categories: Category[]) => void; 
  onClose: () => void;
}) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const [showIcons, setShowIcons] = useState(false);
  const [newIconName, setNewIconName] = useState("");
  const [newIconLabel, setNewIconLabel] = useState("");
  const [customIcons, setCustomIcons] = useState<Array<{ name: string; label: string }>>([]);

  const exampleJSON = `[
  {
    "name": "Deportes",
    "slug": "deportes",
    "icon": "Bike",
    "description": "Artículos deportivos, fitness y outdoor",
    "keywords": ["deportes", "fitness", "gimnasio", "running", "outdoor"],
    "published": false,
    "subcategories": [
      {
        "name": "Equipamiento Fitness",
        "slug": "equipamiento-fitness",
        "description": "Máquinas, pesas y accesorios de gimnasio",
        "keywords": ["fitness", "gimnasio", "pesas", "mancuernas", "equipamiento"]
      },
      {
        "name": "Ropa Deportiva",
        "slug": "ropa-deportiva",
        "description": "Indumentaria deportiva y activewear",
        "keywords": ["ropa deportiva", "activewear", "leggings", "tops", "running"]
      },
      {
        "name": "Calzado Deportivo",
        "slug": "calzado-deportivo",
        "description": "Zapatillas para running, training y deportes",
        "keywords": ["zapatillas", "sneakers", "running shoes", "deportivo"]
      }
    ]
  },
  {
    "name": "Libros y Educación",
    "slug": "libros-educacion",
    "icon": "BookOpen",
    "description": "Libros físicos, ebooks y material educativo",
    "keywords": ["libros", "lectura", "literatura", "educación", "ebooks"],
    "published": true,
    "subcategories": [
      {
        "name": "Ficción",
        "slug": "ficcion",
        "description": "Novelas, cuentos y relatos de ficción",
        "keywords": ["ficción", "novelas", "narrativa", "cuentos", "literatura"]
      },
      {
        "name": "No Ficción",
        "slug": "no-ficcion",
        "description": "Ensayos, biografías, historia y divulgación",
        "keywords": ["no ficción", "ensayos", "biografías", "historia", "divulgación"]
      },
      {
        "name": "Material Educativo",
        "slug": "material-educativo",
        "description": "Libros de texto, guías de estudio y cursos",
        "keywords": ["educación", "libros de texto", "estudio", "cursos", "aprendizaje"]
      }
    ]
  },
  {
    "name": "Mascotas",
    "slug": "mascotas",
    "icon": "Heart",
    "description": "Productos y accesorios para mascotas",
    "keywords": ["mascotas", "perros", "gatos", "animales", "pets"],
    "published": false,
    "subcategories": [
      {
        "name": "Alimentación",
        "slug": "alimentacion-mascotas",
        "description": "Comida y snacks para mascotas",
        "keywords": ["comida", "alimento", "snacks", "golosinas", "nutrición"]
      },
      {
        "name": "Accesorios",
        "slug": "accesorios-mascotas",
        "description": "Collares, correas, juguetes y más",
        "keywords": ["collares", "correas", "juguetes", "accesorios", "pets"]
      }
    ]
  },
  {
    "name": "Belleza y Cuidado Personal",
    "slug": "belleza-cuidado",
    "icon": "Sparkles",
    "description": "Productos de belleza, skincare y cuidado personal",
    "keywords": ["belleza", "cosmética", "skincare", "maquillaje", "cuidado"],
    "published": true,
    "subcategories": [
      {
        "name": "Skincare",
        "slug": "skincare",
        "description": "Cuidado de la piel, cremas y tratamientos",
        "keywords": ["skincare", "cremas", "tratamientos", "facial", "piel"]
      },
      {
        "name": "Maquillaje",
        "slug": "maquillaje",
        "description": "Cosméticos y productos de maquillaje",
        "keywords": ["maquillaje", "cosmética", "labial", "base", "sombras"]
      },
      {
        "name": "Cuidado del Cabello",
        "slug": "cuidado-cabello",
        "description": "Shampoo, acondicionador y tratamientos capilares",
        "keywords": ["cabello", "shampoo", "acondicionador", "tratamientos", "pelo"]
      }
    ]
  }
]`;

  function handleImport() {
    setError("");
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setError("El JSON debe ser un array de categorías");
        return;
      }

      const categories: Category[] = [];
      
      parsed.forEach((item, idx) => {
        // Validate required fields for parent category
        if (!item.name || typeof item.name !== "string") {
          throw new Error(`Categoría ${idx + 1}: nombre es obligatorio`);
        }

        const parentId = `cat-import-${Date.now()}-${idx}`;
        const slug = item.slug || item.name.toLowerCase()
          .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i")
          .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        // Validate icon exists if provided
        if (item.icon && !ICON_MAP[item.icon]) {
          throw new Error(
            `Categoría ${idx + 1}: ícono "${item.icon}" no válido. Iconos disponibles: ${Object.keys(ICON_MAP).join(", ")}`
          );
        }

        // Create parent category
        const parentCategory: Category = {
          id: parentId,
          name: item.name,
          slug,
          icon: item.icon || "Package",
          description: item.description || "",
          keywords: Array.isArray(item.keywords) ? item.keywords : [],
          parent_id: null,
          productCount: 0,
          status: "active",
          order: 999,
          published: item.published ?? false,
        };

        categories.push(parentCategory);

        // Create subcategories if provided
        if (Array.isArray(item.subcategories)) {
          item.subcategories.forEach((sub: any, subIdx: number) => {
            if (!sub.name || typeof sub.name !== "string") {
              throw new Error(`Categoría ${idx + 1}, Subcategoría ${subIdx + 1}: nombre es obligatorio`);
            }

            const subSlug = sub.slug || sub.name.toLowerCase()
              .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i")
              .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n")
              .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

            const subcategory: Category = {
              id: `sub-import-${Date.now()}-${idx}-${subIdx}`,
              name: sub.name,
              slug: subSlug,
              icon: undefined,
              description: sub.description || "",
              keywords: Array.isArray(sub.keywords) ? sub.keywords : [],
              parent_id: parentId,
              productCount: 0,
              status: "active",
              order: subIdx + 1,
            };

            categories.push(subcategory);
          });
        }
      });

      onImport(categories);
      const parentCount = categories.filter(c => !c.parent_id).length;
      const subCount = categories.filter(c => c.parent_id).length;
      toast.success(`${parentCount} categorías y ${subCount} subcategorías importadas`);
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
    a.download = "plantilla-categorias.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Plantilla descargada");
  }

  function handleAddCustomIcon() {
    if (!newIconName || !newIconLabel) {
      toast.error("Nombre y etiqueta del ícono son obligatorios");
      return;
    }

    if (ICON_MAP[newIconName]) {
      toast.error(`El ícono \"${newIconName}\" ya existe`);
      return;
    }

    // Add to custom icons
    setCustomIcons((prev) => [...prev, { name: newIconName, label: newIconLabel }]);

    // Add to global icon map
    ICON_MAP[newIconName] = Package; // Placeholder icon
    ICON_LABELS[newIconName] = newIconLabel;

    // Update icon options
    const newOptions = Object.entries(ICON_MAP).map(
      ([name, Icon]) => ({ name, Icon, label: ICON_LABELS[name] ?? name })
    );
    ICON_OPTIONS.length = 0; // Clear existing options
    ICON_OPTIONS.push(...newOptions);

    toast.success(`Ícono \"${newIconName}\" agregado`);
    setNewIconName("");
    setNewIconLabel("");
  }

  const availableIcons = Object.keys(ICON_MAP).join(", ");
  const field = "w-full text-xs text-gray-900 border border-gray-200 rounded-xl px-2.5 py-1 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex-1 text-center">
            <h2 className="text-sm text-gray-900">Importación masiva de categorías</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pega un JSON con categorías y subcategorías</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-blue-900 font-medium mb-2">📋 Formato del JSON</p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Debe ser un array de objetos (categorías padre)</li>
                  <li><strong>Campo obligatorio:</strong> name</li>
                  <li><strong>Campos opcionales:</strong> slug, icon, description, keywords, published, subcategories</li>
                  <li><strong>published:</strong> true = publicada inmediatamente, false = guardar como borrador (por defecto: false)</li>
                  <li><strong>slug:</strong> se genera automáticamente si no se especifica</li>
                  <li><strong>Subcategorías:</strong> array con objetos que tienen name, slug (opcional), description, keywords</li>
                  <li><strong>Íconos disponibles:</strong> {availableIcons.substring(0, 100)}... (ver lista completa abajo)</li>
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

          {/* Show icons button */}
          <button
            onClick={() => setShowIcons(!showIcons)}
            className="flex items-center gap-2 text-xs text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors w-full justify-center"
          >
            <Tag className="w-3.5 h-3.5" strokeWidth={1.5} />
            {showIcons ? "Ocultar" : "Ver"} iconos disponibles ({ICON_OPTIONS.length})
          </button>

          {/* Icons gallery - expandable */}
          {showIcons && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-3">
                Haz clic en un ícono para copiar su nombre al portapapeles
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                {ICON_OPTIONS.map(({ name, Icon, label }) => (
                  <button
                    key={name}
                    onClick={() => {
                      navigator.clipboard.writeText(name);
                      toast.success(`"${name}" copiado`);
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all group"
                    title={label}
                  >
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
                    <span className="text-[10px] text-gray-400 group-hover:text-gray-700 text-center leading-tight font-mono">
                      {name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add custom icon section */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-gray-400 uppercase tracking-wider">
                Agregar ícono personalizado
              </label>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                value={newIconName}
                onChange={(e) => setNewIconName(e.target.value)}
                className={field}
                placeholder="Nombre del ícono"
              />
              <input
                value={newIconLabel}
                onChange={(e) => setNewIconLabel(e.target.value)}
                className={field}
                placeholder="Etiqueta del ícono"
              />
              <button
                onClick={handleAddCustomIcon}
                className="flex items-center gap-1.5 text-xs text-white bg-gray-900 rounded-xl px-4 py-2.5 hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                Agregar ícono
              </button>
            </div>

            {/* Custom icons list */}
            <div className="flex flex-wrap gap-2">
              {customIcons.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl w-full">
                  No hay íconos personalizados aún
                </p>
              )}

              {customIcons.map((icon) => (
                <div
                  key={icon.name}
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-xs rounded-lg px-3 py-1.5"
                >
                  <span>{icon.label}</span>
                  <button
                    onClick={() => {
                      // Remove from custom icons
                      setCustomIcons((prev) => prev.filter((i) => i.name !== icon.name));

                      // Remove from global icon map
                      delete ICON_MAP[icon.name];
                      delete ICON_LABELS[icon.name];

                      // Update icon options
                      const newOptions = Object.entries(ICON_MAP).map(
                        ([name, Icon]) => ({ name, Icon, label: ICON_LABELS[name] ?? name })
                      );
                      ICON_OPTIONS.length = 0; // Clear existing options
                      ICON_OPTIONS.push(...newOptions);

                      toast.success(`Ícono "${icon.name}" eliminado`);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* JSON textarea */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">JSON de categorías</label>
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
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
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
            Importar categorías
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Preview Modal ───────────────────────────────────── */
function PreviewPublishModal({
  categories,
  onConfirm,
  onClose,
}: {
  categories: Category[];
  onConfirm: () => void;
  onClose: () => void;
}) {
  const draftParents = categories.filter((c) => !c.parent_id && !c.published);
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId).sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm text-gray-900">Vista previa de publicación</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {draftParents.length} categoría{draftParents.length > 1 ? "s" : ""} lista{draftParents.length > 1 ? "s" : ""} para publicar
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Info banner */}
        <div className="px-6 pt-5 pb-0 flex-shrink-0">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-blue-900 mb-1">
                  Las siguientes categorías cambiarán de estado "Borrador" a "Publicado"
                </p>
                <p className="text-xs text-blue-700">
                  Las categorías publicadas serán visibles en el sitio web para todos los usuarios.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <div className="space-y-4">
            {draftParents.map((parent) => {
              const subs = getSubcategories(parent.id);
              return (
                <div key={parent.id} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                  {/* Parent category */}
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-200">
                    {/* Icon */}
                    {parent.icon && (
                      <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CatIcon name={parent.icon} className="w-4 h-4 text-gray-500" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-900 font-medium">{parent.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 line-through">
                          Borrador
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          → Publicado
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        /{parent.slug} · {subs.length} subcategoría{subs.length !== 1 ? "s" : ""}
                      </p>
                      {parent.description && (
                        <p className="text-xs text-gray-500 mt-1.5">{parent.description}</p>
                      )}
                      {parent.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {parent.keywords.map((kw) => (
                            <span
                              key={kw}
                              className="text-[10px] bg-gray-100 text-gray-600 rounded-md px-2 py-0.5"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subcategories */}
                  {subs.length > 0 && (
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                        Subcategorías ({subs.length})
                      </p>
                      {subs.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700">{sub.name}</p>
                            <p className="text-[11px] text-gray-400">/{sub.slug}</p>
                            {sub.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {sub.keywords.map((kw) => (
                                  <span
                                    key={kw}
                                    className="text-[10px] bg-gray-50 text-gray-500 rounded px-1.5 py-0.5"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {draftParents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <EyeOff className="w-8 h-8 text-gray-200 mb-3" strokeWidth={1.5} />
                <p className="text-sm text-gray-400">No hay categorías en borrador</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={draftParents.length === 0}
            className="flex items-center gap-1.5 text-xs text-white bg-blue-500 rounded-xl px-5 py-2.5 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
            Confirmar y publicar {draftParents.length > 0 && `(${draftParents.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────── */
export function AdminCategories() {
  const [list, setList] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [catModal, setCatModal] = useState<null | "new" | { category: Category; parentId?: string }>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterPublished, setFilterPublished] = useState<"all" | "published" | "draft">("all");
  const [showPreview, setShowPreview] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Separate parent categories and subcategories
  const parentCategories = list.filter((c) => !c.parent_id).sort((a, b) => a.order - b.order);
  const getSubcategories = (parentId: string) => 
    list.filter((c) => c.parent_id === parentId).sort((a, b) => a.order - b.order);

  // Filter logic with keyword search and filters
  const filtered = parentCategories.filter((c) => {
    const searchLower = search.toLowerCase();
    const matchesName = c.name.toLowerCase().includes(searchLower);
    const matchesKeywords = c.keywords.some((kw) => kw.toLowerCase().includes(searchLower));
    const matchesSubcategories = getSubcategories(c.id).some((sub) =>
      sub.name.toLowerCase().includes(searchLower) ||
      sub.keywords.some((kw) => kw.toLowerCase().includes(searchLower))
    );
    const matchesSearch = matchesName || matchesKeywords || matchesSubcategories;

    // Status filter
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" && c.status === "active") ||
      (filterStatus === "inactive" && c.status === "inactive");

    // Published filter
    const matchesPublished =
      filterPublished === "all" ||
      (filterPublished === "published" && c.published) ||
      (filterPublished === "draft" && !c.published);

    return matchesSearch && matchesStatus && matchesPublished;
  });
  
  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filtered.slice(startIndex, endIndex);
  
  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  function moveCategory(dragIndex: number, hoverIndex: number) {
    const draggedCat = filtered[dragIndex];
    const newList = [...filtered];
    newList.splice(dragIndex, 1);
    newList.splice(hoverIndex, 0, draggedCat);
    
    // Update order numbers
    const reordered = newList.map((cat, idx) => ({ ...cat, order: idx + 1 }));
    
    // Merge with unchanged categories
    setList((prev) => {
      const unchanged = prev.filter((c) => c.parent_id);
      return [...reordered, ...unchanged];
    });
  }

  function moveSubcategory(parentId: string, dragIndex: number, hoverIndex: number) {
    setList((prev) => {
      const subs = prev.filter((c) => c.parent_id === parentId);
      const draggedSub = subs[dragIndex];
      subs.splice(dragIndex, 1);
      subs.splice(hoverIndex, 0, draggedSub);
      
      // Update order numbers
      const reordered = subs.map((sub, idx) => ({ ...sub, order: idx + 1 }));
      
      // Merge back
      const others = prev.filter((c) => c.parent_id !== parentId);
      return [...others, ...reordered];
    });
  }

  function handleSaveCat(cat: Category) {
    setList((prev) => {
      const existing = prev.find((c) => c.id === cat.id);
      if (existing) {
        return prev.map((c) => (c.id === cat.id ? cat : c));
      } else {
        // New category
        if (cat.parent_id) {
          // Subcategory - get max order within parent
          const siblings = prev.filter((c) => c.parent_id === cat.parent_id);
          const maxOrder = Math.max(...siblings.map((c) => c.order), 0);
          return [...prev, { ...cat, order: maxOrder + 1 }];
        } else {
          // Parent category - get max order
          const parents = prev.filter((c) => !c.parent_id);
          const maxOrder = Math.max(...parents.map((c) => c.order), 0);
          return [...prev, { ...cat, order: maxOrder + 1 }];
        }
      }
    });
    setCatModal(null);
    toast.success(catModal === "new" ? "Categoría creada" : "Categoría actualizada");
  }

  function handleDeleteCat(id: string) {
    // Delete category and all its subcategories
    setList((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
    setDeleteId(null);
    toast.success("Categoría eliminada");
  }

  function handleToggleCatStatus(id: string) {
    setList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === "active" ? "inactive" : "active" } : c))
    );
    toast.success("Estado actualizado");
  }

  function handleBulkImport(categories: Category[]) {
    setList((prev) => [...prev, ...categories]);
    setShowBulkImport(false);
  }

  function handlePublishAllDrafts() {
    const draftCount = parentCategories.filter((c) => !c.published).length;
    if (draftCount === 0) {
      toast.error("No hay categorías en borrador para publicar");
      return;
    }

    setList((prev) =>
      prev.map((c) => (!c.parent_id && !c.published ? { ...c, published: true } : c))
    );
    setShowPreview(false);
    toast.success(`${draftCount} categoría(s) publicada(s)`);
  }

  const totalProducts = list.reduce((s, c) => s + c.productCount, 0);
  const totalSubcategories = list.filter((c) => c.parent_id).length;
  const draftCount = parentCategories.filter((c) => !c.published).length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl text-gray-900 tracking-tight">Categorías</h1>
            <p className="text-xs text-gray-400 mt-1">{parentCategories.length} categorías principales</p>
          </div>
          <button
            onClick={() => setCatModal("new")}
            className="w-9 h-9 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
            title="Nueva categoría"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Category list - Scrollable area */}
        <div className="flex-1 overflow-auto space-y-3 pr-1">
          {paginatedCategories.map((cat, index) => (
            <DraggableCategoryRow
              key={cat.id}
              category={cat}
              subcategories={getSubcategories(cat.id)}
              index={index}
              moveCategory={moveCategory}
              onEdit={() => setCatModal({ category: cat })}
              onDelete={() => setDeleteId(cat.id)}
              onToggleStatus={() => handleToggleCatStatus(cat.id)}
              onTogglePublished={() => setList((prev) => prev.map((c) => (c.id === cat.id ? { ...c, published: !c.published } : c)))}
              onExpand={() => setExpanded(expanded === cat.id ? null : cat.id)}
              isExpanded={expanded === cat.id}
              onAddSubcategory={() => setCatModal({ category: { ...cat, id: `${Date.now()}`, parent_id: cat.id }, parentId: cat.id })}
              onEditSubcategory={(sub) => setCatModal({ category: sub })}
              onDeleteSubcategory={(subId) => {
                setList((prev) => prev.filter((c) => c.id !== subId));
                toast.success("Subcategoría eliminada");
              }}
              onToggleSubStatus={(subId) => handleToggleCatStatus(subId)}
              moveSubcategory={(dragIdx, hoverIdx) => moveSubcategory(cat.id, dragIdx, hoverIdx)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-xl text-center">
              <Tag className="w-8 h-8 text-gray-200 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-400">No hay categorías que coincidan</p>
            </div>
          )}
        </div>

        {/* Pagination controls */}
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

        {/* Category modal */}
        {catModal && (
          <CategoryModal
            category={catModal === "new" ? undefined : catModal.category}
            onSave={handleSaveCat}
            onClose={() => setCatModal(null)}
          />
        )}

        {/* Delete confirm */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 max-w-sm w-full text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm text-gray-900 mb-1">¿Eliminar categoría?</h3>
              <p className="text-xs text-gray-400 mb-5">
                Se eliminarán también todas sus subcategorías. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setDeleteId(null)}
                  className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteCat(deleteId)}
                  className="text-xs text-white bg-red-500 rounded-xl px-4 py-2 hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk import modal */}
        {showBulkImport && (
          <BulkImportCategoriesModal
            onImport={handleBulkImport}
            onClose={() => setShowBulkImport(false)}
          />
        )}

        {/* Preview publish modal */}
        {showPreview && (
          <PreviewPublishModal
            categories={list}
            onConfirm={handlePublishAllDrafts}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </DndProvider>
  );
}