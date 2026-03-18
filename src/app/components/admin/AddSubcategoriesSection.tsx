import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    X, Loader2, Plus, Trash2, Search, Link2, Check,
} from "lucide-react";
import { toast } from "sonner";
import {
    nexaCategoryPagedRepository,
    type PagedCategory,
} from "../../repositories/NexaCategoryPagedRepository";

/* ── Types ─────────────────────────────────────────────── */
export interface PendingSub {
    type: "link" | "create";
    id?: string;
    name: string;
    locale?: string;
}

export interface LinkedSub {
    id: string;
    name: string;
}

export interface AddSubcategoriesSectionProps {
    /** Parent category ID. Required for immediate mode. */
    parentId: string | null;
    /** Parent level — child will be parentLevel + 1 */
    parentLevel: number;
    /** Current locale for i18n */
    locale: string;
    /** IDs to exclude from link candidates (self + existing children) */
    excludeIds: string[];
    /** Whether to show locale dropdown in create sub form */
    showLocaleSelector?: boolean;
    /** Whether to show the "Create new" tab (default true). Set false when parent form already handles creation. */
    showCreateTab?: boolean;
    /** When true, operations execute immediately via API */
    immediate: boolean;
    /** Callback after immediate link/create succeeds */
    onChanged?: () => void;
    /** Pending subs (deferred mode — controlled) */
    pendingSubs?: PendingSub[];
    /** Update pending subs (deferred mode) */
    onPendingChange?: (subs: PendingSub[]) => void;
    /** Subs linked/created this session (immediate mode — controlled) */
    linkedSubs?: LinkedSub[];
    /** Update linked subs (immediate mode) */
    onLinkedSubsChange?: (subs: LinkedSub[]) => void;
    /** Variant: "footer" renders a toggle button then content; "inline" always renders content */
    variant?: "footer" | "inline";
}

/* ── i18n ──────────────────────────────────────────────── */
interface SubLabels {
    addSubcategories: string;
    close: string;
    linkExisting: string;
    createNew: string;
    searchSub: string;
    noResults: string;
    loading: string;
    linkSuccess: string;
    createSuccess: string;
    linkedThisSession: string;
    pendingSubs: string;
    removePending: string;
    subNamePlaceholder: string;
    addButton: string;
    levelHint: string;
}

const subTr: Record<string, SubLabels> = {
    es: {
        addSubcategories: "Agregar subcategorías",
        close: "Cerrar",
        linkExisting: "Vincular existente",
        createNew: "Crear nueva",
        searchSub: "Buscar categoría…",
        noResults: "Sin resultados",
        loading: "Cargando…",
        linkSuccess: "Subcategoría vinculada",
        createSuccess: "Subcategoría creada",
        linkedThisSession: "Vinculadas en esta sesión",
        pendingSubs: "Subcategorías pendientes",
        removePending: "Quitar",
        subNamePlaceholder: "Nombre de la subcategoría",
        addButton: "Agregar",
        levelHint: "Se creará como hija nivel",
    },
    en: {
        addSubcategories: "Add subcategories",
        close: "Close",
        linkExisting: "Link existing",
        createNew: "Create new",
        searchSub: "Search category…",
        noResults: "No results",
        loading: "Loading…",
        linkSuccess: "Subcategory linked",
        createSuccess: "Subcategory created",
        linkedThisSession: "Linked this session",
        pendingSubs: "Pending subcategories",
        removePending: "Remove",
        subNamePlaceholder: "Subcategory name",
        addButton: "Add",
        levelHint: "Will be created as level",
    },
    pt: {
        addSubcategories: "Adicionar subcategorias",
        close: "Fechar",
        linkExisting: "Vincular existente",
        createNew: "Criar nova",
        searchSub: "Buscar categoria…",
        noResults: "Sem resultados",
        loading: "Carregando…",
        linkSuccess: "Subcategoria vinculada",
        createSuccess: "Subcategoria criada",
        linkedThisSession: "Vinculadas nesta sessão",
        pendingSubs: "Subcategorias pendentes",
        removePending: "Remover",
        subNamePlaceholder: "Nome da subcategoria",
        addButton: "Adicionar",
        levelHint: "Será criada como filha nível",
    },
};

/* ── Component ─────────────────────────────────────────── */
export function AddSubcategoriesSection({
    parentId,
    parentLevel,
    locale,
    excludeIds,
    showLocaleSelector = false,
    showCreateTab = true,
    immediate,
    onChanged,
    pendingSubs = [],
    onPendingChange,
    linkedSubs = [],
    onLinkedSubsChange,
    variant = "inline",
}: AddSubcategoriesSectionProps) {
    const labels = subTr[locale] ?? subTr.es;
    const childLevel = parentLevel + 1;

    // ── Section visibility ──
    const [showSection, setShowSection] = useState(false);

    // ── Mode tabs ──
    const [addSubMode, setAddSubMode] = useState<"link" | "create">("link");

    // ── Link existing state ──
    const [subSearch, setSubSearch] = useState("");
    const [subCandidates, setSubCandidates] = useState<PagedCategory[]>([]);
    const [loadingSubs, setLoadingSubs] = useState(false);
    const [linkingSubId, setLinkingSubId] = useState<string | null>(null);
    const [showSubDropdown, setShowSubDropdown] = useState(false);
    const subDropdownRef = useRef<HTMLDivElement>(null);

    // ── Create new state ──
    const [newSubName, setNewSubName] = useState("");
    const [newSubLocale, setNewSubLocale] = useState("es");
    const [creatingSub, setCreatingSub] = useState(false);

    // ── Fetch candidates ──
    const fetchSubCandidates = useCallback(async () => {
        setLoadingSubs(true);
        try {
            const [p1, p2, p3] = await Promise.all([
                nexaCategoryPagedRepository.findPaged({ size: 300, level: 1 }),
                nexaCategoryPagedRepository.findPaged({ size: 300, level: 2 }),
                nexaCategoryPagedRepository.findPaged({ size: 300, level: 3 }),
            ]);
            setSubCandidates([...p1.content, ...p2.content, ...p3.content]);
        } catch { /* silently fail */ }
        finally { setLoadingSubs(false); }
    }, []);

    const isVisible = variant === "inline" || showSection;

    useEffect(() => {
        if (isVisible && addSubMode === "link") fetchSubCandidates();
    }, [isVisible, addSubMode, fetchSubCandidates]);

    // ── Close dropdown on outside click ──
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (subDropdownRef.current && !subDropdownRef.current.contains(e.target as Node)) {
                setShowSubDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // ── Filtered candidates ──
    const filteredSubCandidates = useMemo(() => {
        const linkedIds = linkedSubs.map((s) => s.id);
        const pendingIds = pendingSubs.filter((s) => s.id).map((s) => s.id!);
        const allExcluded = [...excludeIds, ...linkedIds, ...pendingIds];
        return subCandidates
            .filter((c) => !allExcluded.includes(c.id))
            .filter((c) =>
                !subSearch ||
                c.name.toLowerCase().includes(subSearch.toLowerCase()) ||
                c.id.toLowerCase().includes(subSearch.toLowerCase()),
            );
    }, [subCandidates, excludeIds, linkedSubs, pendingSubs, subSearch]);

    // ── Link existing handler ──
    async function handleLinkSub(sub: PagedCategory) {
        if (linkingSubId) return;

        if (immediate && parentId) {
            setLinkingSubId(sub.id);
            try {
                await nexaCategoryPagedRepository.updateCategory(sub.id, {
                    parentId,
                    level: childLevel,
                    translations: sub.translations.map((t) => ({ locale: t.locale, name: t.name })),
                });
                toast.success(labels.linkSuccess);
                setSubSearch("");
                setShowSubDropdown(false);
                // Track in linkedSubs
                onLinkedSubsChange?.([...linkedSubs, { id: sub.id, name: sub.name }]);
                onChanged?.();
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error");
            } finally {
                setLinkingSubId(null);
            }
        } else {
            // Deferred mode — queue
            onPendingChange?.([...pendingSubs, { type: "link", id: sub.id, name: sub.name }]);
            setSubSearch("");
            setShowSubDropdown(false);
        }
    }

    // ── Create new handler ──
    async function handleCreateSub() {
        if (!newSubName.trim()) return;

        if (immediate && parentId) {
            setCreatingSub(true);
            try {
                await nexaCategoryPagedRepository.createCategory({
                    parentId,
                    level: childLevel,
                    translations: [{ locale: newSubLocale, name: newSubName.trim() }],
                });
                toast.success(labels.createSuccess);
                setNewSubName("");
                onLinkedSubsChange?.([
                    ...linkedSubs,
                    { id: Date.now().toString(), name: newSubName.trim() },
                ]);
                onChanged?.();
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error");
            } finally {
                setCreatingSub(false);
            }
        } else {
            // Deferred mode — queue
            onPendingChange?.([
                ...pendingSubs,
                { type: "create", name: newSubName.trim(), locale: newSubLocale },
            ]);
            setNewSubName("");
        }
    }

    // ── Remove pending sub ──
    function removePending(idx: number) {
        onPendingChange?.(pendingSubs.filter((_, i) => i !== idx));
    }

    // ── Render content ──
    const showLinkMode = showCreateTab ? addSubMode === "link" : true;
    const showCreateMode = showCreateTab && addSubMode === "create";

    const content = (
        <div className="space-y-3">
            {/* Mode tabs — only shown when both tabs are available */}
            {showCreateTab && (
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                        type="button"
                        onClick={() => setAddSubMode("link")}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-md transition-all ${addSubMode === "link"
                            ? "bg-white text-gray-800 shadow-sm font-medium"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Link2 className="w-3 h-3" strokeWidth={1.5} />
                        {labels.linkExisting}
                    </button>
                    <button
                        type="button"
                        onClick={() => setAddSubMode("create")}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-md transition-all ${addSubMode === "create"
                            ? "bg-white text-gray-800 shadow-sm font-medium"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Plus className="w-3 h-3" strokeWidth={1.5} />
                        {labels.createNew}
                    </button>
                </div>
            )}

            {/* Link existing mode */}
            {showLinkMode && (
                <div ref={subDropdownRef} className="relative">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                        <input
                            type="text"
                            value={subSearch}
                            onChange={(e) => {
                                setSubSearch(e.target.value);
                                setShowSubDropdown(true);
                            }}
                            onFocus={() => setShowSubDropdown(true)}
                            placeholder={labels.searchSub}
                            className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 bg-white hover:border-gray-300 focus:outline-none focus:border-gray-400 transition-colors placeholder-gray-300"
                        />
                    </div>

                    {showSubDropdown && subSearch && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {loadingSubs ? (
                                <div className="flex items-center gap-2 px-3 py-3 text-xs text-gray-400">
                                    <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                                    {labels.loading}
                                </div>
                            ) : filteredSubCandidates.length === 0 ? (
                                <div className="px-3 py-3 text-xs text-gray-400 text-center">
                                    {labels.noResults}
                                </div>
                            ) : (
                                filteredSubCandidates.slice(0, 30).map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        disabled={linkingSubId === c.id}
                                        onClick={() => handleLinkSub(c)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-violet-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {linkingSubId === c.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin text-violet-500 flex-shrink-0" strokeWidth={1.5} />
                                        ) : (
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.level === 1 ? "bg-violet-400" : c.level === 2 ? "bg-sky-400" : "bg-teal-400"}`} />
                                        )}
                                        <span className="flex-1 truncate text-gray-700">{c.name}</span>
                                        <span className="text-[10px] text-gray-400 flex-shrink-0">Nv.{c.level}</span>
                                        <Plus className="w-3 h-3 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Create new mode */}
            {showCreateMode && (
                <div className="space-y-2">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                        <div className="flex items-end gap-2">
                            {showLocaleSelector && (
                                <div className="flex-shrink-0">
                                    <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5 block">
                                        {locale === "en" ? "Lang" : "Idioma"}
                                    </label>
                                    <select
                                        value={newSubLocale}
                                        onChange={(e) => setNewSubLocale(e.target.value)}
                                        className="w-20 text-xs text-gray-700 border border-gray-200 rounded-lg px-2 py-2.5 bg-white focus:outline-none focus:border-gray-400"
                                    >
                                        <option value="es">ES</option>
                                        <option value="en">EN</option>
                                        <option value="pt">PT</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex-1">
                                <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5 block">
                                    {subTr[locale]?.subNamePlaceholder ?? subTr.es.subNamePlaceholder}
                                </label>
                                <input
                                    type="text"
                                    value={newSubName}
                                    onChange={(e) => setNewSubName(e.target.value)}
                                    placeholder={labels.subNamePlaceholder}
                                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 bg-white hover:border-gray-300 focus:outline-none focus:border-gray-400 transition-colors placeholder-gray-300"
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateSub(); } }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleCreateSub}
                                disabled={creatingSub || !newSubName.trim()}
                                className="flex items-center gap-1.5 text-xs text-white bg-gray-800 hover:bg-gray-900 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
                            >
                                {creatingSub ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                                ) : (
                                    <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                                )}
                                {labels.addButton}
                            </button>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400">
                        {labels.levelHint} {childLevel}
                    </p>
                </div>
            )}

            {/* Linked subs (immediate mode) */}
            {linkedSubs.length > 0 && (
                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{labels.linkedThisSession}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {linkedSubs.map((s) => (
                            <span
                                key={s.id}
                                className="inline-flex items-center gap-1 text-[11px] text-violet-700 bg-violet-50 ring-1 ring-violet-200 rounded-lg px-2.5 py-1"
                            >
                                <Check className="w-3 h-3" strokeWidth={2} />
                                {s.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending subs (deferred mode) */}
            {pendingSubs.length > 0 && (
                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{labels.pendingSubs}</p>
                    <div className="space-y-1">
                        {pendingSubs.map((s, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5"
                            >
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.type === "link" ? "bg-sky-400" : "bg-emerald-400"}`} />
                                <span className="flex-1 text-xs text-gray-700 truncate">{s.name}</span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                    {s.type === "link" ? labels.linkExisting : labels.createNew}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removePending(idx)}
                                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                                    title={labels.removePending}
                                >
                                    <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // ── Footer variant (with toggle button) ──
    if (variant === "footer") {
        return (
            <div className="border-t border-gray-200 px-5 py-4">
                {showSection && <div className="mb-4">{content}</div>}
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => setShowSection((v) => !v)}
                        className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl px-5 py-2.5 transition-colors"
                    >
                        {showSection ? (
                            <><X className="w-3.5 h-3.5" strokeWidth={1.5} /> {labels.close}</>
                        ) : (
                            <><Plus className="w-3.5 h-3.5" strokeWidth={1.5} /> {labels.addSubcategories}</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ── Inline variant (with toggle button inside) ──
    return (
        <div className="border-t border-gray-100 pt-5">
            <div className="flex justify-center mb-3">
                <button
                    type="button"
                    onClick={() => setShowSection((v) => !v)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl transition-colors ${showSection
                        ? "text-gray-600 bg-gray-100 hover:bg-gray-200"
                        : "text-violet-600 bg-violet-50 hover:bg-violet-100"
                        }`}
                >
                    {showSection ? (
                        <><X className="w-3.5 h-3.5" strokeWidth={1.5} /> {labels.close}</>
                    ) : (
                        <><Plus className="w-3.5 h-3.5" strokeWidth={1.5} /> {labels.addSubcategories}</>
                    )}
                </button>
            </div>
            {showSection && content}

            {/* Show linked/pending outside the toggle when section is collapsed */}
            {!showSection && linkedSubs.length > 0 && (
                <div className="mt-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{labels.linkedThisSession}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {linkedSubs.map((s) => (
                            <span
                                key={s.id}
                                className="inline-flex items-center gap-1 text-[11px] text-violet-700 bg-violet-50 ring-1 ring-violet-200 rounded-lg px-2.5 py-1"
                            >
                                <Check className="w-3 h-3" strokeWidth={2} />
                                {s.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {!showSection && pendingSubs.length > 0 && (
                <div className="mt-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">{labels.pendingSubs}</p>
                    <div className="space-y-1">
                        {pendingSubs.map((s, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5"
                            >
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.type === "link" ? "bg-sky-400" : "bg-emerald-400"}`} />
                                <span className="flex-1 text-xs text-gray-700 truncate">{s.name}</span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                    {s.type === "link" ? labels.linkExisting : labels.createNew}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removePending(idx)}
                                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                                    title={labels.removePending}
                                >
                                    <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
