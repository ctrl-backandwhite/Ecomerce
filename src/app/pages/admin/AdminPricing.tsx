import { useState, useEffect, useCallback } from "react";
import {
    Search, Plus, Pencil, Trash2, X, Check,
    ChevronDown, Percent, DollarSign, Globe2,
    Tag, Package, Layers,
} from "lucide-react";
import {
    type PriceRule, type PriceRulePayload,
    type PriceRuleScope, type MarginType,
    priceRuleRepository,
} from "../../repositories/PriceRuleRepository";
import {
    type PagedCategory,
    nexaCategoryPagedRepository,
} from "../../repositories/NexaCategoryPagedRepository";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import { Pagination } from "../../components/admin/Pagination";

const PAGE_SIZE = 15;

const SCOPE_LABELS: Record<PriceRuleScope, string> = {
    GLOBAL: "Global",
    CATEGORY: "Categoría",
    PRODUCT: "Producto",
    VARIANT: "Variante",
};

const SCOPE_ICONS: Record<PriceRuleScope, typeof Globe2> = {
    GLOBAL: Globe2,
    CATEGORY: Tag,
    PRODUCT: Package,
    VARIANT: Layers,
};

const MARGIN_LABELS: Record<MarginType, string> = {
    PERCENTAGE: "Porcentaje",
    FIXED: "Monto fijo",
};

const EMPTY: PriceRulePayload = {
    scope: "GLOBAL",
    scopeId: null,
    marginType: "PERCENTAGE",
    marginValue: 0,
    minPrice: null,
    maxPrice: null,
    priority: 0,
    active: true,
};

/* ── Scope Badge ─────────────────────────────────────────── */
function ScopeBadge({ scope }: { scope: PriceRuleScope }) {
    const colors: Record<PriceRuleScope, string> = {
        GLOBAL: "bg-blue-50 text-blue-700",
        CATEGORY: "bg-purple-50 text-purple-700",
        PRODUCT: "bg-amber-50 text-amber-700",
        VARIANT: "bg-teal-50 text-teal-700",
    };
    const Icon = SCOPE_ICONS[scope];
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full ${colors[scope]}`}>
            <Icon className="w-3 h-3" strokeWidth={1.5} />
            {SCOPE_LABELS[scope]}
        </span>
    );
}

/* ── Price Rule Modal ────────────────────────────────────── */
function PriceRuleModal({
    rule,
    categories,
    onSave,
    onClose,
}: {
    rule: (Partial<PriceRule> & { id?: string }) | PriceRulePayload;
    categories: PagedCategory[];
    onSave: (payload: PriceRulePayload, id?: string) => void;
    onClose: () => void;
}) {
    const isNew = !("id" in rule) || !rule.id;
    const [form, setForm] = useState<PriceRulePayload>({
        scope: rule.scope ?? "GLOBAL",
        scopeId: rule.scopeId ?? null,
        marginType: rule.marginType ?? "PERCENTAGE",
        marginValue: rule.marginValue ?? 0,
        minPrice: "minPrice" in rule ? rule.minPrice ?? null : null,
        maxPrice: "maxPrice" in rule ? rule.maxPrice ?? null : null,
        priority: rule.priority ?? 0,
        active: rule.active ?? true,
    });

    const set = (k: keyof PriceRulePayload, v: unknown) =>
        setForm((f) => ({ ...f, [k]: v }));

    function handleScopeChange(scope: PriceRuleScope) {
        set("scope", scope);
        if (scope === "GLOBAL") set("scopeId", null);
        else set("scopeId", "");
    }

    function validate(): boolean {
        if (form.scope !== "GLOBAL" && !form.scopeId?.trim()) {
            toast.error("Debes seleccionar o ingresar un ID de referencia");
            return false;
        }
        if (form.marginValue < 0) {
            toast.error("El margen debe ser mayor o igual a 0");
            return false;
        }
        if (form.marginType === "PERCENTAGE" && form.marginValue > 1000) {
            toast.error("El porcentaje no puede ser mayor a 1000%");
            return false;
        }
        if (form.minPrice != null && form.maxPrice != null && form.minPrice >= form.maxPrice) {
            toast.error("El precio mínimo debe ser menor que el precio máximo");
            return false;
        }
        return true;
    }

    function handleSave() {
        if (!validate()) return;
        const payload: PriceRulePayload = {
            ...form,
            scopeId: form.scope === "GLOBAL" ? null : form.scopeId,
            minPrice: form.minPrice ?? null,
            maxPrice: form.maxPrice ?? null,
        };
        onSave(payload, "id" in rule ? rule.id : undefined);
    }

    const field = "w-full text-xs text-gray-900 border border-gray-200 rounded-xl px-2.5 py-1 focus:outline-none focus:border-gray-400 placeholder-gray-300 bg-white";
    const lbl = "block text-xs text-gray-400 mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm text-gray-900">
                            {isNew ? "Nueva regla de precio" : "Editar regla de precio"}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {isNew
                                ? "Define el margen de ganancia a aplicar"
                                : `Editando regla: ${SCOPE_LABELS[form.scope]}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Scope + Active */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className={lbl}>Alcance *</label>
                            <div className="relative">
                                <select
                                    value={form.scope}
                                    onChange={(e) => handleScopeChange(e.target.value as PriceRuleScope)}
                                    className={`${field} appearance-none pr-8`}
                                >
                                    <option value="GLOBAL">Global (todos los productos)</option>
                                    <option value="CATEGORY">Categoría</option>
                                    <option value="PRODUCT">Producto</option>
                                    <option value="VARIANT">Variante</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <label className={lbl}>Estado</label>
                            <div className="relative">
                                <select
                                    value={form.active ? "true" : "false"}
                                    onChange={(e) => set("active", e.target.value === "true")}
                                    className={`${field} appearance-none pr-8`}
                                >
                                    <option value="true">Activa</option>
                                    <option value="false">Inactiva</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    {/* Scope ID — shown only when scope != GLOBAL */}
                    {form.scope !== "GLOBAL" && (
                        <div>
                            <label className={lbl}>
                                {form.scope === "CATEGORY"
                                    ? "Categoría *"
                                    : form.scope === "PRODUCT"
                                        ? "ID del producto *"
                                        : "ID de la variante *"}
                            </label>
                            {form.scope === "CATEGORY" ? (
                                <div className="relative">
                                    <select
                                        value={form.scopeId ?? ""}
                                        onChange={(e) => set("scopeId", e.target.value)}
                                        className={`${field} appearance-none pr-8`}
                                    >
                                        <option value="">Selecciona una categoría</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.translations?.[0]?.name || c.name} (Nivel {c.level})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                                </div>
                            ) : (
                                <input
                                    value={form.scopeId ?? ""}
                                    onChange={(e) => set("scopeId", e.target.value)}
                                    className={field}
                                    placeholder={
                                        form.scope === "PRODUCT"
                                            ? "UUID del producto"
                                            : "UUID de la variante"
                                    }
                                />
                            )}
                        </div>
                    )}

                    {/* Price Range */}
                    <div>
                        <label className={lbl}>Rango de precio de costo (opcional)</label>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={form.minPrice ?? ""}
                                    onChange={(e) =>
                                        set("minPrice", e.target.value === "" ? null : parseFloat(e.target.value))
                                    }
                                    className={`${field} pl-8`}
                                    placeholder="Mín (ej: 0.00)"
                                />
                            </div>
                            <span className="text-xs text-gray-300 self-center">—</span>
                            <div className="flex-1 relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={form.maxPrice ?? ""}
                                    onChange={(e) =>
                                        set("maxPrice", e.target.value === "" ? null : parseFloat(e.target.value))
                                    }
                                    className={`${field} pl-8`}
                                    placeholder="Máx (ej: 10.00)"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-1">
                            Deja vacío para aplicar a todos los precios. Ejemplo: 0 – 10 aplica a productos con costo entre $0 y $10.
                        </p>
                    </div>

                    {/* Margin Type + Value */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className={lbl}>Tipo de margen *</label>
                            <div className="relative">
                                <select
                                    value={form.marginType}
                                    onChange={(e) => set("marginType", e.target.value as MarginType)}
                                    className={`${field} appearance-none pr-8`}
                                >
                                    <option value="PERCENTAGE">Porcentaje (%)</option>
                                    <option value="FIXED">Monto fijo ($)</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className={lbl}>
                                Valor del margen *
                            </label>
                            <div className="relative">
                                {form.marginType === "PERCENTAGE" ? (
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                                ) : (
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                                )}
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={form.marginValue}
                                    onChange={(e) => set("marginValue", parseFloat(e.target.value) || 0)}
                                    className={`${field} pl-8`}
                                    placeholder={form.marginType === "PERCENTAGE" ? "40" : "5.00"}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className={lbl}>Prioridad</label>
                        <input
                            type="number"
                            min={0}
                            value={form.priority}
                            onChange={(e) => set("priority", parseInt(e.target.value) || 0)}
                            className={field}
                            placeholder="0"
                        />
                        <p className="text-[10px] text-gray-300 mt-1">
                            Mayor prioridad = se aplica primero cuando hay reglas del mismo alcance
                        </p>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 mb-1">Vista previa del margen</p>
                        {(() => {
                            const samplePrice =
                                form.minPrice != null && form.maxPrice != null
                                    ? +((form.minPrice + form.maxPrice) / 2).toFixed(2)
                                    : form.minPrice != null
                                        ? form.minPrice + 5
                                        : form.maxPrice != null
                                            ? Math.max(form.maxPrice - 5, 0.01)
                                            : 10;
                            const result =
                                form.marginType === "PERCENTAGE"
                                    ? (samplePrice * (1 + form.marginValue / 100)).toFixed(2)
                                    : (samplePrice + form.marginValue).toFixed(2);
                            const rangeLabel =
                                form.minPrice != null || form.maxPrice != null
                                    ? ` (rango: ${form.minPrice != null ? `$${form.minPrice}` : "∞"} – ${form.maxPrice != null ? `$${form.maxPrice}` : "∞"})`
                                    : "";
                            return (
                                <p className="text-xs text-gray-700">
                                    {form.marginType === "PERCENTAGE"
                                        ? `Producto de $${samplePrice.toFixed(2)}${rangeLabel} → $${result} (+${form.marginValue}%)`
                                        : `Producto de $${samplePrice.toFixed(2)}${rangeLabel} → $${result} (+$${form.marginValue.toFixed(2)})`}
                                </p>
                            );
                        })()}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="text-xs text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-200 rounded-xl px-5 py-2.5 hover:bg-gray-300 transition-colors"
                    >
                        <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {isNew ? "Crear regla" : "Guardar cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main ────────────────────────────────────────────────── */
export function AdminPricing() {
    const { t } = useLanguage();
    const [list, setList] = useState<PriceRule[]>([]);
    const [categories, setCategories] = useState<PagedCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState<Partial<PriceRule> | PriceRulePayload | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const loadRules = useCallback(async () => {
        setLoading(true);
        try {
            setList(await priceRuleRepository.findAll());
        } catch {
            toast.error("Error al cargar las reglas de precio");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadCategories = useCallback(async () => {
        try {
            const result = await nexaCategoryPagedRepository.findPaged({ size: 500, status: "PUBLISHED" });
            setCategories(result.content);
        } catch {
            /* Categories are optional — just for the dropdown */
        }
    }, []);

    useEffect(() => {
        loadRules();
        loadCategories();
    }, [loadRules, loadCategories]);

    /* ── Filtering ─────────────────────────────────────────── */
    const filtered = list.filter((r) => {
        const q = search.toLowerCase();
        if (!q) return true;
        return (
            SCOPE_LABELS[r.scope].toLowerCase().includes(q) ||
            MARGIN_LABELS[r.marginType].toLowerCase().includes(q) ||
            (r.scopeId ?? "").toLowerCase().includes(q) ||
            String(r.marginValue).includes(q)
        );
    });

    useEffect(() => setPage(1), [search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    /* ── Resolve category name from scopeId ─────────────────── */
    function resolveScopeName(rule: PriceRule): string {
        if (rule.scope === "GLOBAL") return "Todos los productos";
        if (rule.scope === "CATEGORY") {
            const cat = categories.find((c) => c.id === rule.scopeId);
            return cat ? (cat.translations?.[0]?.name || cat.name) : (rule.scopeId ?? "—");
        }
        return rule.scopeId ?? "—";
    }

    /* ── CRUD ──────────────────────────────────────────────── */
    async function handleSave(payload: PriceRulePayload, id?: string) {
        try {
            if (id) {
                await priceRuleRepository.update(id, payload);
            } else {
                await priceRuleRepository.create(payload);
            }
            await loadRules();
            toast.success(id ? "Regla actualizada" : "Regla creada");
        } catch {
            toast.error("Error al guardar la regla");
        }
        setModal(null);
    }

    async function handleDelete(id: string) {
        try {
            await priceRuleRepository.delete(id);
            await loadRules();
            toast.success("Regla eliminada");
        } catch {
            toast.error("Error al eliminar la regla");
        }
        setDeleteId(null);
    }

    return (
        <div className="h-full flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl text-gray-900 tracking-tight">{t("admin.pricing.title")}</h1>
                    <p className="text-xs text-gray-400 mt-1">
                        {list.length} {list.length === 1 ? "regla configurada" : "reglas configuradas"} · Define márgenes de ganancia por producto, categoría o global
                    </p>
                </div>
                <button
                    onClick={() => setModal(EMPTY)}
                    className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md"
                    title="Nueva regla"
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
                        placeholder="Buscar por alcance, tipo o ID..."
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
                                <th className="text-left text-xs text-gray-400 px-5 py-3.5">Alcance</th>
                                <th className="text-left text-xs text-gray-400 px-5 py-3.5 hidden md:table-cell">Referencia</th>
                                <th className="text-left text-xs text-gray-400 px-5 py-3.5 hidden lg:table-cell">Rango</th>
                                <th className="text-left text-xs text-gray-400 px-5 py-3.5">Margen</th>
                                <th className="text-right text-xs text-gray-400 px-5 py-3.5 hidden sm:table-cell">Prioridad</th>
                                <th className="text-left text-xs text-gray-400 px-5 py-3.5">Estado</th>
                                <th className="text-right text-xs text-gray-400 px-5 py-3.5">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-xs text-gray-400">
                                        Cargando reglas...
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-xs text-gray-400">
                                        {search ? "No se encontraron reglas" : "No hay reglas configuradas"}
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                paginated.map((rule) => (
                                    <tr
                                        key={rule.id}
                                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors group"
                                    >
                                        <td className="px-5 py-4">
                                            <ScopeBadge scope={rule.scope} />
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell">
                                            <p className="text-xs text-gray-600 truncate max-w-[200px]">
                                                {resolveScopeName(rule)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 hidden lg:table-cell">
                                            <p className="text-xs text-gray-500">
                                                {rule.minPrice != null || rule.maxPrice != null
                                                    ? `${rule.minPrice != null ? `$${rule.minPrice.toFixed(2)}` : "∞"} – ${rule.maxPrice != null ? `$${rule.maxPrice.toFixed(2)}` : "∞"}`
                                                    : "Sin rango"}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {rule.marginType === "PERCENTAGE" ? (
                                                    <Percent className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                                                ) : (
                                                    <DollarSign className="w-3.5 h-3.5 text-gray-300" strokeWidth={1.5} />
                                                )}
                                                <span className="text-sm text-gray-900 font-medium">
                                                    {rule.marginType === "PERCENTAGE"
                                                        ? `${rule.marginValue}%`
                                                        : `$${rule.marginValue.toFixed(2)}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 hidden sm:table-cell">
                                            <p className="text-xs text-gray-500 text-right">{rule.priority}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`text-[10px] px-2.5 py-1 rounded-full ${rule.active
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                                    }`}
                                            >
                                                {rule.active ? "Activa" : "Inactiva"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setModal(rule)}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(rule.id)}
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
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={filtered.length}
                    pageSize={PAGE_SIZE}
                    onChange={setPage}
                />
            </div>

            {/* Modal */}
            {modal !== null && (
                <PriceRuleModal
                    rule={modal}
                    categories={categories}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}

            {/* Delete confirm */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-5 h-5 text-red-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-sm text-gray-900 mb-2">¿Eliminar regla de precio?</h3>
                        <p className="text-xs text-gray-400 mb-6">
                            Los productos afectados volverán a usar la regla de mayor alcance.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 text-xs text-gray-500 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                className="flex-1 text-xs text-white bg-red-500 rounded-xl py-2.5 hover:bg-red-600 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
