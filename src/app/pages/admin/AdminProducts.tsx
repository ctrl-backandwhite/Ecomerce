import { useState, useEffect, useMemo } from "react";
import {
    Search, Plus, Trash2, Eye, X, Check, Pencil,
    Package, ChevronDown, Filter, ArrowUpDown,
    AlertTriangle, Loader2,
    RefreshCw, Copy, Upload, Compass,
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "../../components/admin/Pagination";
import { BulkUploadModal } from "../../components/admin/BulkUploadModal";
import { useAdminProducts } from "../../hooks/useAdminProducts";
import { useLanguage } from "../../context/LanguageContext";
import { useCurrency } from "../../context/CurrencyContext";
import {
    nexaProductAdminRepository,
    loadDiscoverState,
    type AdminProduct,
    type ProductPayload,
    type AdminProductQuery,
    type DiscoverProgress,
} from "../../repositories/NexaProductAdminRepository";
import {
    nexaCategoryPagedRepository,
    type PagedCategory,
} from "../../repositories/NexaCategoryPagedRepository";
import { Badge, StatusBadge, stockVariant } from "../../components/admin/ProductBadges";
import { ProductPreviewModal } from "../../components/admin/ProductPreviewModal";
import { ProductDetailDrawer } from "../../components/admin/ProductDetailDrawer";
import { ProductModal, type ProductForm, productToForm, makeEmptyForm } from "../../components/admin/ProductModal";


/* ══════════════════════════════════════════════════════════════
   ██  Main AdminProducts page
   ══════════════════════════════════════════════════════════════ */
export function AdminProducts() {
    const { locale } = useLanguage();
    const apiLocale = locale === "pt" ? "pt-BR" : locale;
    const { formatPrice } = useCurrency();

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
    const [discovering, setDiscovering] = useState(false);
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

        // Ask for optional category IDs to filter the sync
        const catInput = window.prompt(
            "Sincronizar productos de CJ Dropshipping\n\n" +
            "Ingresa IDs de categorías separados por coma para sincronizar solo esas categorías.\n" +
            "Déjalo vacío para sincronizar TODOS los productos.",
            ""
        );
        // User pressed Cancel → abort
        if (catInput === null) return;

        const categoryIds = catInput
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);

        // Ask user whether to overwrite all data or only update changed fields
        const forceOverwrite = window.confirm(
            "¿Sobreescribir TODOS los datos de los productos?\n\n" +
            "• Aceptar → Sobreescribe todos los campos con los datos de CJ\n" +
            "• Cancelar → Solo actualiza los campos que hayan cambiado (más rápido)"
        );

        setSyncing(true);
        try {
            const result = await nexaProductAdminRepository.syncProducts(forceOverwrite, categoryIds);
            const skippedMsg = result.skipped > 0 ? `, ${result.skipped} sin cambios` : "";
            const catMsg = categoryIds.length > 0 ? ` (categorías: ${categoryIds.join(", ")})` : "";
            toast.success(
                `Sincronización completada${catMsg}: ${result.created} creados, ${result.updated} actualizados${skippedMsg} (${result.total} total)`
            );
            refetch();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al sincronizar productos");
        } finally {
            setSyncing(false);
        }
    }

    // ── Auto-resume discover after page refresh ──────────────
    useEffect(() => {
        const saved = loadDiscoverState();
        if (!saved) return;

        if (saved.running) {
            // The previous session was interrupted by a page refresh — resume
            const pct = saved.totalCategories > 0
                ? Math.round((saved.offset / saved.totalCategories) * 100) : 0;
            toast.loading(
                `Reanudando descubrimiento — categoría ${saved.offset} / ${saved.totalCategories} (${pct}%)  —  ${saved.created} nuevos, ${saved.updated} actualizados`,
                { id: "discover-progress", duration: Infinity },
            );
            setDiscovering(true);
            runDiscover(saved.offset, saved.created, saved.updated);
        } else {
            // Cancelled or errored — show info about partial progress
            toast.info(
                `Descubrimiento interrumpido: categoría ${saved.offset}/${saved.totalCategories} — ${saved.created} nuevos, ${saved.updated} actualizados. Pulsa ▶ para reanudar.`,
                { duration: 8000 },
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function runDiscover(startOffset = 0, accCreated = 0, accUpdated = 0) {
        setDiscovering(true);
        if (startOffset === 0) {
            toast.loading("Iniciando descubrimiento por categoría…", { id: "discover-progress", duration: Infinity });
        }
        try {
            const result = await nexaProductAdminRepository.discoverByCategory(
                (progress: DiscoverProgress) => {
                    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
                    toast.loading(
                        `Categoría ${progress.current} / ${progress.total} (${pct}%)  —  ${progress.created} nuevos, ${progress.updated} actualizados`,
                        { id: "discover-progress", duration: Infinity },
                    );
                },
                startOffset,
                accCreated,
                accUpdated,
            );
            toast.dismiss("discover-progress");
            toast.success(
                `Descubrimiento completado: ${result.created} nuevos, ${result.updated} actualizados (${result.total} total)`
            );
            refetch();
        } catch (err) {
            toast.dismiss("discover-progress");
            toast.error(err instanceof Error ? err.message : "Error al descubrir productos");
        } finally {
            setDiscovering(false);
        }
    }

    async function handleDiscover() {
        if (discovering) {
            nexaProductAdminRepository.cancelDiscover();
            setDiscovering(false);
            toast.dismiss("discover-progress");
            toast.info("Descubrimiento detenido");
            refetch();
            return;
        }

        // Check if there's a saved partial state to resume
        const saved = loadDiscoverState();
        if (saved && !saved.running && saved.offset > 0) {
            toast.loading(
                `Reanudando desde categoría ${saved.offset}/${saved.totalCategories}…`,
                { id: "discover-progress", duration: Infinity },
            );
            runDiscover(saved.offset, saved.created, saved.updated);
            return;
        }

        runDiscover();
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
                        onClick={handleDiscover}
                        disabled={syncing}
                        className={`w-9 h-9 border rounded-full transition-all flex items-center justify-center ${discovering
                            ? "bg-red-50 border-red-300 text-red-500 hover:bg-red-100"
                            : "bg-white border-gray-200 text-violet-500 hover:bg-violet-50 hover:border-violet-200"
                            } ${syncing ? "opacity-40 cursor-not-allowed" : ""}`}
                        title={discovering ? "Detener descubrimiento" : "Descubrir productos nuevos por categoría"}
                    >
                        {discovering
                            ? <X className="w-4 h-4" strokeWidth={2} />
                            : <Compass className="w-4 h-4" strokeWidth={1.5} />
                        }
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={discovering}
                        className={`w-9 h-9 border rounded-full transition-all flex items-center justify-center ${syncing
                            ? "bg-red-50 border-red-300 text-red-500 hover:bg-red-100"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                            } ${discovering ? "opacity-40 cursor-not-allowed" : ""}`}
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
                                            {formatPrice(price)}
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
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(p.id);
                                                toast.success("ID copiado");
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    navigator.clipboard.writeText(p.id);
                                                    toast.success("ID copiado");
                                                }
                                            }}
                                            className="inline-flex items-center justify-center w-4 h-4 text-gray-300 hover:text-gray-600 transition-colors rounded cursor-pointer"
                                            title="Copiar ID"
                                        >
                                            <Copy className="w-3 h-3" strokeWidth={1.5} />
                                        </span>
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
                                            <p className="text-xs text-gray-700 tabular-nums">{formatPrice(price)}</p>
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
                <ProductPreviewModal
                    product={preview}
                    categoryName={categoryMap[preview.categoryId]}
                    onClose={() => setPreview(null)}
                />
            )}

            {detail && (
                <ProductDetailDrawer
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
                    const payload = rows.map(r => r as unknown as ProductPayload);
                    return nexaProductAdminRepository.bulkCreate(payload);
                }}
                onSuccess={refetch}
            />
        </div>
    );
}
