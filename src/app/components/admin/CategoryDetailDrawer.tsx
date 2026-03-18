import { useState, useEffect, useCallback } from "react";
import {
    X, Loader2, ChevronRight, ChevronDown, Copy,
    Star, Globe, Calendar, Eye, EyeOff,
    AlertTriangle, Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import {
    nexaCategoryPagedRepository,
    type CategoryDetail,
} from "../../repositories/NexaCategoryPagedRepository";
import { AddSubcategoriesSection } from "./AddSubcategoriesSection";

/* ── Translations ──────────────────────────────────────── */
interface Labels {
    detail: string;
    close: string;
    loading: string;
    errorTitle: string;
    retry: string;
    id: string;
    parentId: string;
    level: string;
    status: string;
    visibility: string;
    featured: string;
    createdAt: string;
    updatedAt: string;
    translations: string;
    childCategories: string;
    noChildren: string;
    published: string;
    draft: string;
    active: string;
    inactive: string;
    yes: string;
    no: string;
    subcategories: string;
    publish: string;
    unpublish: string;
    activate: string;
    deactivate: string;
    deleteChild: string;
    deleteChildConfirm: string;
    deleteSuccess: string;
}

const tr: Record<string, Labels> = {
    es: {
        detail: "Detalle de categoría",
        close: "Cerrar",
        loading: "Cargando detalle…",
        errorTitle: "Error al cargar el detalle",
        retry: "Reintentar",
        id: "ID",
        parentId: "ID padre",
        level: "Nivel",
        status: "Estado",
        visibility: "Visibilidad",
        featured: "Destacada",
        createdAt: "Creado",
        updatedAt: "Actualizado",
        translations: "Traducciones",
        childCategories: "Categorías hijas",
        noChildren: "Sin categorías hijas",
        published: "Publicado",
        draft: "Borrador",
        active: "Activo",
        inactive: "Inactivo",
        yes: "Sí",
        no: "No",
        subcategories: "subcategorías",
        publish: "Publicar",
        unpublish: "Despublicar",
        activate: "Activar",
        deactivate: "Desactivar",
        deleteChild: "Eliminar",
        deleteChildConfirm: "\u00bfEliminar esta subcategor\u00eda?",
        deleteSuccess: "Subcategor\u00eda eliminada",
    },
    en: {
        detail: "Category detail",
        close: "Close",
        loading: "Loading detail…",
        errorTitle: "Failed to load detail",
        retry: "Retry",
        id: "ID",
        parentId: "Parent ID",
        level: "Level",
        status: "Status",
        visibility: "Visibility",
        featured: "Featured",
        createdAt: "Created",
        updatedAt: "Updated",
        translations: "Translations",
        childCategories: "Child categories",
        noChildren: "No child categories",
        published: "Published",
        draft: "Draft",
        active: "Active",
        inactive: "Inactive",
        yes: "Yes",
        no: "No",
        subcategories: "subcategories",
        publish: "Publish",
        unpublish: "Unpublish",
        activate: "Activate",
        deactivate: "Deactivate",
        deleteChild: "Delete",
        deleteChildConfirm: "Delete this subcategory?",
        deleteSuccess: "Subcategory deleted",
    },
    pt: {
        detail: "Detalhe da categoria",
        close: "Fechar",
        loading: "Carregando detalhe…",
        errorTitle: "Erro ao carregar o detalhe",
        retry: "Tentar novamente",
        id: "ID",
        parentId: "ID pai",
        level: "Nível",
        status: "Estado",
        visibility: "Visibilidade",
        featured: "Destacada",
        createdAt: "Criado",
        updatedAt: "Atualizado",
        translations: "Traduções",
        childCategories: "Categorias filhas",
        noChildren: "Sem categorias filhas",
        published: "Publicado",
        draft: "Rascunho",
        active: "Ativo",
        inactive: "Inativo",
        yes: "Sim",
        no: "Não",
        subcategories: "subcategorias",
        publish: "Publicar",
        unpublish: "Despublicar",
        activate: "Ativar",
        deactivate: "Desativar",
        deleteChild: "Excluir",
        deleteChildConfirm: "Excluir esta subcategoria?",
        deleteSuccess: "Subcategoria excluída",
    },
};

/* helper to get correct labels */
function useLabels(locale: string): Labels {
    return tr[locale] ?? tr.es;
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

/* ── Level badge ──────────────────────────────────────── */
function LevelBadge({ level }: { level: number }) {
    const colors = [
        "bg-violet-50 text-violet-700 ring-violet-200",
        "bg-sky-50 text-sky-700 ring-sky-200",
        "bg-teal-50 text-teal-700 ring-teal-200",
    ];
    const color = colors[Math.min(level - 1, colors.length - 1)] ?? colors[0];
    return (
        <span className={`inline-flex items-center text-[10px] leading-none px-2 py-1 rounded-full font-medium ring-1 ${color}`}>
            Nv. {level}
        </span>
    );
}

/* ── Child category tree node ─────────────────────────── */
function ChildNode({
    category,
    labels,
    locale,
    depth = 0,
    onDelete,
    deletingId,
}: {
    category: CategoryDetail;
    labels: Labels;
    locale: string;
    depth?: number;
    onDelete: (id: string) => void;
    deletingId: string | null;
}) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = category.subCategories.length > 0;
    const isDeleting = deletingId === category.id;

    return (
        <div className={depth > 0 ? "ml-4" : ""}>
            <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${hasChildren
                    ? "cursor-pointer hover:bg-gray-100"
                    : "bg-white border border-gray-100"
                    } ${depth > 0 ? "border-l-2 border-l-gray-200" : ""}`}
                onClick={() => hasChildren && setExpanded((v) => !v)}
            >
                {/* Expand icon or dot */}
                {hasChildren ? (
                    <button className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-gray-400">
                        {expanded ? (
                            <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                        )}
                    </button>
                ) : (
                    <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    </span>
                )}

                {/* Level bar */}
                <div
                    className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${category.level === 1
                        ? "bg-violet-400"
                        : category.level === 2
                            ? "bg-sky-400"
                            : "bg-teal-400"
                        }`}
                />

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-800 truncate">{category.name}</span>
                        <LevelBadge level={category.level} />
                        <span
                            className={`inline-flex items-center text-[10px] leading-none px-2 py-0.5 rounded-full font-medium ring-1 ${category.status === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-amber-50 text-amber-700 ring-amber-200"
                                }`}
                        >
                            {category.status === "PUBLISHED" ? labels.published : labels.draft}
                        </span>
                        <span
                            className={`inline-flex items-center text-[10px] leading-none px-2 py-0.5 rounded-full font-medium ring-1 ${category.active
                                ? "bg-blue-50 text-blue-700 ring-blue-200"
                                : "bg-gray-100 text-gray-500 ring-gray-200"
                                }`}
                        >
                            {category.active ? labels.active : labels.inactive}
                        </span>
                    </div>
                    {hasChildren && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            {category.subCategories.length} {labels.subcategories}
                        </p>
                    )}
                </div>

                {/* Copy ID */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(category.id);
                        toast.success("ID copiado");
                    }}
                    className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors rounded flex-shrink-0"
                    title="Copiar ID"
                >
                    <Copy className="w-3 h-3" strokeWidth={1.5} />
                </button>

                {/* Delete child (level 2 & 3) */}
                {category.level >= 2 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(category.id);
                        }}
                        disabled={isDeleting}
                        className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors rounded flex-shrink-0 disabled:opacity-50"
                        title={labels.deleteChild}
                    >
                        {isDeleting ? (
                            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                        ) : (
                            <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                        )}
                    </button>
                )}
            </div>

            {/* Expanded children */}
            {expanded && hasChildren && (
                <div className="mt-1 space-y-1">
                    {category.subCategories.map((child) => (
                        <ChildNode
                            key={child.id}
                            category={child}
                            labels={labels}
                            locale={locale}
                            depth={depth + 1}
                            onDelete={onDelete}
                            deletingId={deletingId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Main drawer component ────────────────────────────── */
export interface CategoryDetailDrawerProps {
    categoryId: string | null;
    locale: string;
    onClose: () => void;
    /** Called after any mutation so the parent list can refresh */
    onChanged?: () => void;
}

export function CategoryDetailDrawer({ categoryId, locale, onClose, onChanged }: CategoryDetailDrawerProps) {
    const labels = useLabels(locale);
    const [detail, setDetail] = useState<CategoryDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const localeMap: Record<string, string> = { pt: "pt-BR" };
    const apiLocale = localeMap[locale] ?? locale;

    const fetchDetail = useCallback(async () => {
        if (!categoryId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await nexaCategoryPagedRepository.findById(categoryId, apiLocale);
            setDetail(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
        } finally {
            setLoading(false);
        }
    }, [categoryId, apiLocale]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    // Close on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    // ── Action states ────────────────────────
    const [togglingPublish, setTogglingPublish] = useState(false);
    const [togglingActive, setTogglingActive] = useState(false);
    const [deletingChildId, setDeletingChildId] = useState<string | null>(null);
    const [confirmDeleteChildId, setConfirmDeleteChildId] = useState<string | null>(null);

    // ── Exclude IDs for add-sub component ────
    const subExcludeIds: string[] = [
        ...(categoryId ? [categoryId] : []),
        ...(detail?.subCategories.map((c) => c.id) ?? []),
    ];

    // ── Callback after sub added ─────────────
    const handleSubChanged = useCallback(async () => {
        await fetchDetail();
        onChanged?.();
    }, [fetchDetail, onChanged]);

    // ── Toggle publish ───────────────────────
    async function handleTogglePublish() {
        if (!detail || togglingPublish) return;
        setTogglingPublish(true);
        try {
            await nexaCategoryPagedRepository.togglePublish(detail.id);
            await fetchDetail();
            onChanged?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        } finally {
            setTogglingPublish(false);
        }
    }

    // ── Toggle active ────────────────────────
    async function handleToggleActive() {
        if (!detail || togglingActive) return;
        setTogglingActive(true);
        try {
            await nexaCategoryPagedRepository.toggleActive(detail.id, !detail.active);
            await fetchDetail();
            onChanged?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        } finally {
            setTogglingActive(false);
        }
    }

    // ── Delete child ─────────────────────────
    function handleRequestDeleteChild(childId: string) {
        setConfirmDeleteChildId(childId);
    }

    async function executeDeleteChild() {
        if (!confirmDeleteChildId) return;
        setDeletingChildId(confirmDeleteChildId);
        setConfirmDeleteChildId(null);
        try {
            await nexaCategoryPagedRepository.deleteCategory(confirmDeleteChildId);
            toast.success(labels.deleteSuccess);
            await fetchDetail();
            onChanged?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error");
        } finally {
            setDeletingChildId(null);
        }
    }

    // ── Find name of child being deleted (for confirm modal) ──
    function findChildName(id: string): string {
        function search(cats: CategoryDetail[]): string | null {
            for (const c of cats) {
                if (c.id === id) return c.name;
                const found = search(c.subCategories);
                if (found) return found;
            }
            return null;
        }
        return search(detail?.subCategories ?? []) ?? id;
    }

    if (!categoryId) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-medium text-gray-900">{labels.detail}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title={labels.close}
                    >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Loader2 className="w-6 h-6 text-gray-300 animate-spin mb-3" strokeWidth={1.5} />
                            <p className="text-sm text-gray-400">{labels.loading}</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                                <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{labels.errorTitle}</p>
                            <p className="text-xs text-gray-400 mb-4 max-w-xs">{error}</p>
                            <button
                                onClick={fetchDetail}
                                className="text-xs text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
                            >
                                {labels.retry}
                            </button>
                        </div>
                    )}

                    {/* Detail content */}
                    {detail && !loading && !error && (
                        <>
                            {/* Category name + badges */}
                            <div>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <h3 className="text-lg text-gray-900 font-medium">{detail.name}</h3>
                                    <LevelBadge level={detail.level} />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Status — clickable toggle */}
                                    <button
                                        type="button"
                                        onClick={handleTogglePublish}
                                        disabled={togglingPublish}
                                        className={`inline-flex items-center gap-1 text-[11px] leading-none px-2.5 py-1 rounded-full font-medium ring-1 cursor-pointer hover:ring-2 hover:shadow-sm transition-all ${detail.status === "PUBLISHED"
                                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                            : "bg-amber-50 text-amber-700 ring-amber-200"
                                            } ${togglingPublish ? "opacity-50" : ""}`}
                                    >
                                        {togglingPublish && <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />}
                                        {detail.status === "PUBLISHED" ? labels.published : labels.draft}
                                    </button>
                                    {/* Active — clickable toggle */}
                                    <button
                                        type="button"
                                        onClick={handleToggleActive}
                                        disabled={togglingActive}
                                        className={`inline-flex items-center gap-1 text-[11px] leading-none px-2.5 py-1 rounded-full font-medium ring-1 cursor-pointer hover:ring-2 hover:shadow-sm transition-all ${detail.active
                                            ? "bg-blue-50 text-blue-700 ring-blue-200"
                                            : "bg-gray-100 text-gray-500 ring-gray-200"
                                            } ${togglingActive ? "opacity-50" : ""}`}
                                    >
                                        {togglingActive ? (
                                            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                                        ) : detail.active ? (
                                            <Eye className="w-3 h-3" strokeWidth={1.5} />
                                        ) : (
                                            <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                                        )}
                                        {detail.active ? labels.active : labels.inactive}
                                    </button>
                                    {/* Featured */}
                                    {detail.featured && (
                                        <span className="inline-flex items-center gap-1 text-[11px] leading-none px-2.5 py-1 rounded-full font-medium ring-1 bg-yellow-50 text-yellow-700 ring-yellow-200">
                                            <Star className="w-3 h-3" strokeWidth={1.5} /> {labels.featured}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Metadata grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* ID */}
                                <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{labels.id}</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-xs text-gray-700 truncate font-mono">{detail.id}</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(detail.id);
                                                toast.success("ID copiado");
                                            }}
                                            className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors rounded flex-shrink-0"
                                        >
                                            <Copy className="w-3 h-3" strokeWidth={1.5} />
                                        </button>
                                    </div>
                                </div>

                                {/* Parent ID */}
                                <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{labels.parentId}</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-xs text-gray-700 truncate font-mono">
                                            {detail.parentId && detail.parentId !== "root-id" ? detail.parentId : "—"}
                                        </p>
                                        {detail.parentId && detail.parentId !== "root-id" && (
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(detail.parentId!);
                                                    toast.success("Parent ID copiado");
                                                }}
                                                className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors rounded flex-shrink-0"
                                            >
                                                <Copy className="w-3 h-3" strokeWidth={1.5} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Created */}
                                <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{labels.createdAt}</p>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                                        <p className="text-xs text-gray-700">{fmtDate(detail.createdAt, locale)}</p>
                                    </div>
                                </div>

                                {/* Updated */}
                                <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{labels.updatedAt}</p>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                                        <p className="text-xs text-gray-700">{fmtDate(detail.updatedAt, locale)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Translations */}
                            {detail.translations.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Globe className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{labels.translations}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {detail.translations.map((t) => (
                                            <div
                                                key={t.locale}
                                                className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5"
                                            >
                                                <span className="text-[10px] text-gray-400 uppercase font-mono">{t.locale}</span>
                                                <span className="text-xs text-gray-700">{t.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Children tree */}
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                                    {labels.childCategories}
                                    {detail.subCategories.length > 0 && (
                                        <span className="ml-1.5 text-gray-500">({detail.subCategories.length})</span>
                                    )}
                                </p>
                                {detail.subCategories.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">{labels.noChildren}</p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {detail.subCategories.map((child) => (
                                            <ChildNode
                                                key={child.id}
                                                category={child}
                                                labels={labels}
                                                locale={locale}
                                                onDelete={handleRequestDeleteChild}
                                                deletingId={deletingChildId}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                        </>
                    )}
                </div>

                {/* ── Add subcategories footer ── */}
                {detail && !loading && !error && (
                    <AddSubcategoriesSection
                        parentId={detail.id}
                        parentLevel={detail.level}
                        locale={locale}
                        excludeIds={subExcludeIds}
                        showLocaleSelector
                        immediate
                        onChanged={handleSubChanged}
                        variant="footer"
                    />
                )}

                {/* ── Delete child confirmation modal ── */}
                {confirmDeleteChildId && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                            onClick={() => setConfirmDeleteChildId(null)}
                        />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                                    <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-sm font-medium text-gray-900 mb-1">{labels.deleteChildConfirm}</h3>
                                <p className="text-xs text-gray-500 mb-5">
                                    <span className="font-medium text-gray-700">"{findChildName(confirmDeleteChildId)}"</span>
                                </p>
                                <div className="flex gap-2 w-full">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDeleteChildId(null)}
                                        className="flex-1 text-xs text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors"
                                    >
                                        {locale === "en" ? "Cancel" : locale === "pt" ? "Cancelar" : "Cancelar"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={executeDeleteChild}
                                        className="flex-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-xl px-4 py-2.5 transition-colors"
                                    >
                                        {labels.deleteChild}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
