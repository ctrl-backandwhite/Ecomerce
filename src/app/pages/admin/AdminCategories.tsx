import { useState, useMemo } from "react";
import {
  Search, Tag, Filter, ChevronDown,
  ToggleLeft, ToggleRight, RefreshCw, AlertTriangle,
  Loader2, X, Copy, Eye, Plus, Pencil, Trash2, TriangleAlert, FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { usePagedCategories } from "../../services/usePagedCategories";
import { useLanguage } from "../../context/LanguageContext";
import { Pagination } from "../../components/admin/Pagination";
import { CategoryDetailDrawer } from "../../components/admin/CategoryDetailDrawer";
import { CategoryFormModal } from "../../components/admin/CategoryFormModal";
import { BulkCategoryUploadModal } from "../../components/admin/BulkCategoryUploadModal";
import { nexaCategoryPagedRepository, type PagedCategory } from "../../repositories/NexaCategoryPagedRepository";

/* ── Translations ──────────────────────────────────────── */
const tr = {
  es: {
    title: "Categorías",
    subtitle: (n: number) => `${n} categoría${n !== 1 ? "s" : ""} en total`,
    search: "Buscar categoría...",
    filters: "Filtros",
    all: "Todos",
    published: "Publicado",
    draft: "Borrador",
    active: "Activo",
    inactive: "Inactivo",
    status: "Estado",
    visibility: "Visibilidad",
    level: "Nivel",
    anyLevel: "Todos",
    noResults: "No se encontraron categorías",
    noResultsHint: "Intenta con otros filtros o busca por otro nombre",
    errorTitle: "Error al cargar categorías",
    retry: "Reintentar",
    loading: "Cargando categorías...",
    subcategories: "subcategorías",
    createdAt: "Creado",
    updatedAt: "Actualizado",
    translations: "Traducciones",
    clearFilters: "Limpiar filtros",
    perPage: "por página",
    sortBy: "Ordenar por",
    sortName: "Nombre",
    sortCreated: "Fecha creación",
    sortUpdated: "Última actualización",
    ascending: "Ascendente",
    descending: "Descendente",
    sync: "Sincronizar",
    syncing: "Sincronizando...",
    syncSuccess: (c: number, u: number, t: number) => `Sincronizado: ${c} creadas, ${u} actualizadas, ${t} total`,
    detail: "Ver detalle",
    newCategory: "Nueva categoría",
    bulkUpload: "Carga masiva",
    edit: "Editar",
    delete: "Eliminar",
    addSub: "Agregar subcategoría",
    deleteConfirm: "¿Eliminar esta categoría?",
    deleteConfirmDesc: "Esta acción no se puede deshacer. Se eliminarán también todas las subcategorías asociadas.",
    deleteSuccess: "Categoría eliminada",
    deleting: "Eliminando...",
    deleteBtn: "Sí, eliminar",
    cancelBtn: "Cancelar",
  },
  en: {
    title: "Categories",
    subtitle: (n: number) => `${n} categor${n !== 1 ? "ies" : "y"} total`,
    search: "Search category...",
    filters: "Filters",
    all: "All",
    published: "Published",
    draft: "Draft",
    active: "Active",
    inactive: "Inactive",
    status: "Status",
    visibility: "Visibility",
    level: "Level",
    anyLevel: "All",
    noResults: "No categories found",
    noResultsHint: "Try different filters or search for another name",
    errorTitle: "Failed to load categories",
    retry: "Retry",
    loading: "Loading categories...",
    subcategories: "subcategories",
    createdAt: "Created",
    updatedAt: "Updated",
    translations: "Translations",
    clearFilters: "Clear filters",
    perPage: "per page",
    sortBy: "Sort by",
    sortName: "Name",
    sortCreated: "Created date",
    sortUpdated: "Last updated",
    ascending: "Ascending",
    descending: "Descending",
    sync: "Sync",
    syncing: "Syncing...",
    syncSuccess: (c: number, u: number, t: number) => `Synced: ${c} created, ${u} updated, ${t} total`,
    detail: "View detail",
    newCategory: "New category",
    bulkUpload: "Bulk upload",
    edit: "Edit",
    delete: "Delete",
    addSub: "Add subcategory",
    deleteConfirm: "Delete this category?",
    deleteConfirmDesc: "This action cannot be undone. All associated subcategories will also be deleted.",
    deleteSuccess: "Category deleted",
    deleting: "Deleting...",
    deleteBtn: "Yes, delete",
    cancelBtn: "Cancel",
  },
  pt: {
    title: "Categorias",
    subtitle: (n: number) => `${n} categoria${n !== 1 ? "s" : ""} no total`,
    search: "Buscar categoria...",
    filters: "Filtros",
    all: "Todos",
    published: "Publicado",
    draft: "Rascunho",
    active: "Ativo",
    inactive: "Inativo",
    status: "Estado",
    visibility: "Visibilidade",
    level: "Nível",
    anyLevel: "Todos",
    noResults: "Nenhuma categoria encontrada",
    noResultsHint: "Tente filtros diferentes ou busque outro nome",
    errorTitle: "Erro ao carregar categorias",
    retry: "Tentar novamente",
    loading: "Carregando categorias...",
    subcategories: "subcategorias",
    createdAt: "Criado",
    updatedAt: "Atualizado",
    translations: "Traduções",
    clearFilters: "Limpar filtros",
    perPage: "por página",
    sortBy: "Ordenar por",
    sortName: "Nome",
    sortCreated: "Data de criação",
    sortUpdated: "Última atualização",
    ascending: "Ascendente",
    descending: "Descendente",
    sync: "Sincronizar",
    syncing: "Sincronizando...",
    syncSuccess: (c: number, u: number, t: number) => `Sincronizado: ${c} criadas, ${u} atualizadas, ${t} total`,
    detail: "Ver detalhe",
    newCategory: "Nova categoria",
    bulkUpload: "Carga em massa",
    edit: "Editar",
    delete: "Excluir",
    addSub: "Adicionar subcategoria",
    deleteConfirm: "Excluir esta categoria?",
    deleteConfirmDesc: "Esta ação não pode ser desfeita. Todas as subcategorias associadas também serão excluídas.",
    deleteSuccess: "Categoria excluída",
    deleting: "Excluindo...",
    deleteBtn: "Sim, excluir",
    cancelBtn: "Cancelar",
  },
} as const;

type Labels = typeof tr.es;

/* ── Status badge helper ──────────────────────────────── */
function StatusBadge({
  status,
  labels,
  onClick,
  loading: toggling,
}: {
  status: string;
  labels: Labels;
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
      {isPublished ? labels.published : labels.draft}
    </button>
  );
}

function ActiveBadge({
  active,
  labels,
  onClick,
  loading: toggling,
}: {
  active: boolean;
  labels: Labels;
  onClick?: () => void;
  loading?: boolean;
}) {
  const clickable = !!onClick;
  return (
    <button
      type="button"
      disabled={toggling}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`inline-flex items-center justify-center text-[10px] leading-none min-w-[56px] px-2 py-1 rounded-full font-medium transition-all duration-200 ${active
        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
        : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
        } ${clickable ? "cursor-pointer hover:ring-2 hover:shadow-sm" : "cursor-default"} ${toggling ? "opacity-50" : ""
        }`}
    >
      {toggling ? (
        <Loader2 className="w-3 h-3 animate-spin mr-1" strokeWidth={1.5} />
      ) : null}
      {active ? labels.active : labels.inactive}
    </button>
  );
}

function LevelBadge({ level }: { level: number }) {
  const colors = [
    "bg-violet-50 text-violet-700 ring-violet-200",
    "bg-sky-50 text-sky-700 ring-sky-200",
    "bg-teal-50 text-teal-700 ring-teal-200",
  ];
  const color = colors[Math.min(level - 1, colors.length - 1)] ?? colors[0];
  return (
    <span
      className={`inline-flex items-center text-[10px] leading-none px-2 py-1 rounded-full font-medium ring-1 ${color}`}
    >
      Nv. {level}
    </span>
  );
}

/* ── Date formatter ───────────────────────────────────── */
function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/* ── Category Row ─────────────────────────────────────── */
interface CategoryRowProps {
  category: import("../../repositories/NexaCategoryPagedRepository").PagedCategory;
  labels: Labels;
  locale: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTogglePublish: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  togglingId: string | null;
  togglingActiveId: string | null;
  onViewDetail: (id: string) => void;
  onEdit: (category: import("../../repositories/NexaCategoryPagedRepository").PagedCategory) => void;
  onAddSubcategory: (parentId: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

function CategoryRow({
  category, labels, locale, isExpanded, onToggleExpand,
  onTogglePublish, onToggleActive, togglingId, togglingActiveId,
  onViewDetail, onEdit, onAddSubcategory, onDelete, deletingId,
}: CategoryRowProps) {
  const isToggling = togglingId === category.id;
  const isTogglingActive = togglingActiveId === category.id;
  const isDeleting = deletingId === category.id;
  const hasTranslations = category.translations.length > 0;
  const hasSubs = category.subCategories.length > 0;

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl overflow-hidden transition-all hover:border-gray-200 hover:shadow-sm"
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Level indicator */}
        <div
          className={`w-1 self-stretch rounded-full flex-shrink-0 ${category.level === 1
            ? "bg-violet-400"
            : category.level === 2
              ? "bg-sky-400"
              : "bg-teal-400"
            }`}
        />

        {/* Info */}
        <button
          onClick={onToggleExpand}
          className="flex-1 min-w-0 text-left group"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-900 group-hover:text-gray-700 transition-colors flex items-center gap-1">
              {category.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(category.name);
                  toast.success("Nombre copiado");
                }}
                className="inline-flex items-center justify-center w-4 h-4 text-gray-300 hover:text-gray-600 transition-colors rounded"
                title="Copiar nombre"
              >
                <Copy className="w-3 h-3" strokeWidth={1.5} />
              </button>
            </p>
            <LevelBadge level={category.level} />
            <StatusBadge status={category.status} labels={labels} />
            <ActiveBadge active={category.active} labels={labels} />
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate flex items-center gap-1">
            ID: {category.id}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(category.id);
                toast.success("ID copiado");
              }}
              className="inline-flex items-center justify-center w-4 h-4 text-gray-300 hover:text-gray-600 transition-colors rounded"
              title="Copiar ID"
            >
              <Copy className="w-3 h-3" strokeWidth={1.5} />
            </button>
            {category.parentId && category.parentId !== "root-id" && (
              <>
                {" · Parent: "}{category.parentId}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(category.parentId!);
                    toast.success("Parent ID copiado");
                  }}
                  className="inline-flex items-center justify-center w-4 h-4 text-gray-300 hover:text-gray-600 transition-colors rounded"
                  title="Copiar Parent ID"
                >
                  <Copy className="w-3 h-3" strokeWidth={1.5} />
                </button>
              </>
            )}
            {hasSubs && (
              <> · {category.subCategories.length} {labels.subcategories}</>
            )}
          </p>
        </button>

        {/* View detail */}
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetail(category.id); }}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex-shrink-0"
          title={labels.detail || "Detalle"}
        >
          <Eye className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Edit */}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(category); }}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors flex-shrink-0"
          title={labels.edit}
        >
          <Pencil className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Add subcategory */}
        <button
          onClick={(e) => { e.stopPropagation(); onAddSubcategory(category.id); }}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors flex-shrink-0"
          title={labels.addSub}
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
          disabled={isDeleting}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0 disabled:opacity-50"
          title={labels.delete}
        >
          {isDeleting
            ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            : <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          }
        </button>

        {/* Expand/collapse */}
        <button
          onClick={onToggleExpand}
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
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{labels.createdAt}</p>
              <p className="text-xs text-gray-700">{fmtDate(category.createdAt, locale)}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{labels.updatedAt}</p>
              <p className="text-xs text-gray-700">{fmtDate(category.updatedAt, locale)}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{labels.status}</p>
              <StatusBadge
                status={category.status}
                labels={labels}
                onClick={() => onTogglePublish(category.id)}
                loading={isToggling}
              />
            </div>
            <div className="flex flex-col items-center text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{labels.visibility}</p>
              <ActiveBadge
                active={category.active}
                labels={labels}
                onClick={() => onToggleActive(category.id, !category.active)}
                loading={isTogglingActive}
              />
            </div>
          </div>

          {/* Translations */}
          {hasTranslations && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{labels.translations}</p>
              <div className="flex flex-wrap gap-2">
                {category.translations.map((t) => (
                  <div
                    key={t.locale}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="text-[10px] text-gray-400 uppercase font-mono">{t.locale}</span>
                    <span className="text-xs text-gray-700">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subcategories count */}
          {hasSubs && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                {labels.subcategories} ({category.subCategories.length})
              </p>
              <button
                onClick={() => onViewDetail(category.id)}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {labels.detail}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Filter pill ──────────────────────────────────────── */
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-3 py-1.5 rounded-full transition-all ${active
        ? "bg-gray-700 text-white shadow-sm"
        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
    >
      {label}
    </button>
  );
}

/* ── Main page ────────────────────────────────────────── */
export function AdminCategories() {
  const { locale } = useLanguage();
  const labels = tr[locale] ?? tr.es;

  // ── Filters ───────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "DRAFT" | "PUBLISHED">("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [levelFilter, setLevelFilter] = useState<"" | "1" | "2" | "3">("");
  const [sortBy, setSortBy] = useState("");
  const [ascending, setAscending] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search: only apply after 400ms idle
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimerId, setSearchTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchTimerId) clearTimeout(searchTimerId);
    setSearchTimerId(setTimeout(() => setDebouncedSearch(value), 400));
  }

  // Build query from filters
  const query = useMemo(() => {
    const q: Record<string, unknown> = {
      size: pageSize,
      ascending,
    };
    if (debouncedSearch.trim()) q.name = debouncedSearch.trim();
    if (statusFilter) q.status = statusFilter;
    if (activeFilter) q.active = activeFilter === "true";
    if (levelFilter) q.level = Number(levelFilter);
    if (sortBy) q.sortBy = sortBy;
    return q;
  }, [debouncedSearch, statusFilter, activeFilter, levelFilter, sortBy, ascending, pageSize]);

  const {
    categories,
    loading,
    error,
    page,
    totalElements,
    totalPages,
    setPage,
    refetch,
  } = usePagedCategories(query);

  // ── Expand state ──────────────────────────
  const [expandedId, setExpandedId] = useState<string | null>(null);



  // ── Toggle publish state ──────────────────
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleTogglePublish(categoryId: string) {
    if (togglingId) return; // prevent double-clicks
    setTogglingId(categoryId);
    try {
      await nexaCategoryPagedRepository.togglePublish(categoryId);
      toast.success(locale === "en" ? "Status updated" : locale === "pt" ? "Estado atualizado" : "Estado actualizado");
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  }

  // ── Toggle active state ───────────────────
  const [togglingActiveId, setTogglingActiveId] = useState<string | null>(null);

  async function handleToggleActive(categoryId: string, active: boolean) {
    if (togglingActiveId) return;
    setTogglingActiveId(categoryId);
    try {
      await nexaCategoryPagedRepository.toggleActive(categoryId, active);
      toast.success(locale === "en" ? "Visibility updated" : locale === "pt" ? "Visibilidade atualizada" : "Visibilidad actualizada");
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setTogglingActiveId(null);
    }
  }

  // ── Active filters count ──────────────────
  const activeFiltersCount = [statusFilter, activeFilter, levelFilter, sortBy].filter(Boolean).length;

  // ── Sync state ─────────────────────────
  const [syncing, setSyncing] = useState(false);

  // ── Bulk upload modal state ───────────────
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // ── Detail drawer state ───────────────────
  const [detailCategoryId, setDetailCategoryId] = useState<string | null>(null);

  // ── Create / Edit form modal state ────────
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PagedCategory | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  function handleOpenCreate() {
    setEditingCategory(null);
    setDefaultParentId(null);
    setFormModalOpen(true);
  }

  function handleOpenEdit(category: PagedCategory) {
    setEditingCategory(category);
    setDefaultParentId(null);
    setFormModalOpen(true);
  }

  function handleOpenCreateSubcategory(parentId: string) {
    setEditingCategory(null);
    setDefaultParentId(parentId);
    setFormModalOpen(true);
  }

  function handleFormSaved() {
    setFormModalOpen(false);
    setEditingCategory(null);
    setDefaultParentId(null);
    refetch();
  }

  // ── Delete state ──────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmDeleteName = confirmDeleteId
    ? categories.find((c) => c.id === confirmDeleteId)?.name ?? confirmDeleteId
    : "";

  function handleDelete(categoryId: string) {
    setConfirmDeleteId(categoryId);
  }

  async function executeDelete() {
    if (!confirmDeleteId || deletingId) return;
    setDeletingId(confirmDeleteId);
    try {
      await nexaCategoryPagedRepository.deleteCategory(confirmDeleteId);
      toast.success(labels.deleteSuccess);
      setConfirmDeleteId(null);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg, { duration: 5000 });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await nexaCategoryPagedRepository.syncCategories();
      toast.success(labels.syncSuccess(result.created, result.updated, result.total));
      refetch();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message, {
          duration: 6000,
          description: err.cause instanceof Error ? err.cause.message : undefined,
        });
      } else {
        toast.error("Error", { duration: 6000 });
      }
    } finally {
      setSyncing(false);
    }
  }

  function clearFilters() {
    setStatusFilter("");
    setActiveFilter("");
    setLevelFilter("");
    setSortBy("");
    setAscending(true);
  }

  return (
    <div className="h-full flex flex-col">

      {/* ── Detail drawer ───────────────────── */}
      {detailCategoryId && (
        <CategoryDetailDrawer
          categoryId={detailCategoryId}
          locale={locale}
          onClose={() => setDetailCategoryId(null)}
          onChanged={refetch}
        />
      )}

      {/* ── Header ──────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl text-gray-900 tracking-tight">{labels.title}</h1>
          <p className="text-xs text-gray-400 mt-1">
            {labels.subtitle(totalElements)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center gap-1.5 text-xs border rounded-full px-4 py-2 transition-all flex-shrink-0 ${syncing
              ? "border-blue-300 text-blue-400 bg-blue-50 cursor-not-allowed"
              : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300"
              }`}
            title={labels.sync}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} strokeWidth={1.5} />
            {syncing ? labels.syncing : labels.sync}
          </button>
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-1.5 text-xs border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-full px-4 py-2 transition-all flex-shrink-0"
            title={labels.bulkUpload}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" strokeWidth={1.5} />
            {labels.bulkUpload}
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center w-8 h-8 text-white bg-gray-500 hover:bg-gray-600 rounded-full transition-all flex-shrink-0"
            title={labels.newCategory}
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Search + Filter toggle row ──────── */}
      <div className="flex items-center gap-3 mb-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" strokeWidth={1.5} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={labels.search}
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
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 text-xs border rounded-xl px-4 py-2.5 transition-colors flex-shrink-0 ${showFilters || activeFiltersCount > 0
            ? "border-gray-400 text-gray-700 bg-gray-50"
            : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
        >
          <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
          {labels.filters}
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 bg-gray-700 text-white text-[10px] rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter panel ────────────────────── */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4 space-y-4">
          {/* Row 1: Status + Active + Level */}
          <div className="flex flex-wrap gap-6">
            {/* Status filter */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{labels.status}</p>
              <div className="flex gap-1.5">
                <FilterPill label={labels.all} active={statusFilter === ""} onClick={() => setStatusFilter("")} />
                <FilterPill label={labels.published} active={statusFilter === "PUBLISHED"} onClick={() => setStatusFilter("PUBLISHED")} />
                <FilterPill label={labels.draft} active={statusFilter === "DRAFT"} onClick={() => setStatusFilter("DRAFT")} />
              </div>
            </div>

            {/* Active filter */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{labels.visibility}</p>
              <div className="flex gap-1.5">
                <FilterPill label={labels.all} active={activeFilter === ""} onClick={() => setActiveFilter("")} />
                <FilterPill label={labels.active} active={activeFilter === "true"} onClick={() => setActiveFilter("true")} />
                <FilterPill label={labels.inactive} active={activeFilter === "false"} onClick={() => setActiveFilter("false")} />
              </div>
            </div>

            {/* Level filter */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{labels.level}</p>
              <div className="flex gap-1.5">
                <FilterPill label={labels.anyLevel} active={levelFilter === ""} onClick={() => setLevelFilter("")} />
                <FilterPill label="1" active={levelFilter === "1"} onClick={() => setLevelFilter("1")} />
                <FilterPill label="2" active={levelFilter === "2"} onClick={() => setLevelFilter("2")} />
                <FilterPill label="3" active={levelFilter === "3"} onClick={() => setLevelFilter("3")} />
              </div>
            </div>
          </div>

          {/* Row 2: Sort + Per page + Clear */}
          <div className="flex flex-wrap items-end gap-6 border-t border-gray-200 pt-4">
            {/* Sort by */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{labels.sortBy}</p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-gray-400"
              >
                <option value="">—</option>
                <option value="name">{labels.sortName}</option>
                <option value="createdAt">{labels.sortCreated}</option>
                <option value="updatedAt">{labels.sortUpdated}</option>
              </select>
            </div>

            {/* Ascending/Descending */}
            <div>
              <button
                onClick={() => setAscending((v) => !v)}
                className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:border-gray-300 transition-colors"
              >
                {ascending
                  ? <><ToggleRight className="w-3.5 h-3.5 text-green-500" strokeWidth={1.5} /> {labels.ascending}</>
                  : <><ToggleLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> {labels.descending}</>
                }
              </button>
            </div>

            {/* Per page */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{labels.perPage}</p>
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
                onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                {labels.clearFilters}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Content area ────────────────────── */}
      <div className="flex-1 overflow-auto space-y-2 pr-1 relative">
        {/* Loading state */}
        {loading && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin mb-3" strokeWidth={1.5} />
            <p className="text-sm text-gray-400">{labels.loading}</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-700 mb-1">{labels.errorTitle}</p>
            <p className="text-xs text-gray-400 mb-4 max-w-sm">{error}</p>
            <button
              onClick={refetch}
              className="text-xs text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              {labels.retry}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-xl text-center">
            <Tag className="w-8 h-8 text-gray-200 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-gray-400">{labels.noResults}</p>
            <p className="text-xs text-gray-300 mt-1">{labels.noResultsHint}</p>
          </div>
        )}

        {/* Loading overlay for page transitions */}
        {loading && categories.length > 0 && (
          <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-50/90 border border-blue-100 rounded-xl backdrop-blur-sm">
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" strokeWidth={1.5} />
            <span className="text-xs text-blue-600">{labels.loading}</span>
          </div>
        )}

        {/* Category rows */}
        {categories.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            labels={labels}
            locale={locale}
            isExpanded={expandedId === cat.id}
            onToggleExpand={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
            onTogglePublish={handleTogglePublish}
            onToggleActive={handleToggleActive}
            togglingId={togglingId}
            togglingActiveId={togglingActiveId}
            onViewDetail={setDetailCategoryId}
            onEdit={handleOpenEdit}
            onAddSubcategory={handleOpenCreateSubcategory}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        ))}
      </div>

      {/* ── Pagination ──────────────────────── */}
      {totalPages > 0 && (
        <div className="mt-3">
          <Pagination
            page={page + 1}
            totalPages={totalPages}
            total={totalElements}
            pageSize={pageSize}
            onChange={(p) => setPage(p - 1)}
          />
        </div>
      )}

      {/* ── Create / Edit modal ─────────────── */}
      {formModalOpen && (
        <CategoryFormModal
          editCategory={editingCategory}
          defaultParentId={defaultParentId}
          locale={locale}
          onClose={() => { setFormModalOpen(false); setEditingCategory(null); setDefaultParentId(null); }}
          onSaved={handleFormSaved}
        />
      )}

      {/* ── Bulk upload modal ───────────────── */}
      <BulkCategoryUploadModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onUploaded={() => { refetch(); }}
        locale={locale}
      />

      {/* ── Delete confirmation modal ───────── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => !deletingId && setConfirmDeleteId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <TriangleAlert className="w-6 h-6 text-red-500" strokeWidth={1.5} />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-base font-medium text-gray-900 text-center mb-1">
              {labels.deleteConfirm}
            </h3>

            {/* Category name */}
            <p className="text-sm text-gray-800 text-center font-medium mb-1">
              &ldquo;{confirmDeleteName}&rdquo;
            </p>

            {/* Description */}
            <p className="text-xs text-gray-400 text-center mb-6">
              {labels.deleteConfirmDesc}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={!!deletingId}
                className="flex-1 text-xs text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {labels.cancelBtn}
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={!!deletingId}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                    {labels.deleting}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {labels.deleteBtn}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
