import { useState, useEffect, useCallback, useRef } from "react";
import {
    X, Loader2, Save, Plus, Trash2, Globe,
    ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { logger } from "../../lib/logger";

import {
    nexaCategoryPagedRepository,
    type PagedCategory,
} from "../../repositories/NexaCategoryPagedRepository";
import {
    AddSubcategoriesSection,
    type PendingSub,
    type LinkedSub,
} from "./AddSubcategoriesSection";

/* ── i18n labels ───────────────────────────────────────── */
interface FormLabels {
    createTitle: string;
    editTitle: string;
    save: string;
    saving: string;
    cancel: string;
    parentId: string;
    parentPlaceholder: string;
    noParent: string;
    parentOptional: string;
    level: string;
    translations: string;
    addTranslation: string;
    locale: string;
    name: string;
    namePlaceholder: string;
    required: string;
    atLeastOneTranslation: string;
    createSuccess: string;
    updateSuccess: string;
    deleteTranslation: string;
    searchParent: string;
    loadingParents: string;
}

const tr: Record<string, FormLabels> = {
    es: {
        createTitle: "Nueva categoría",
        editTitle: "Editar categoría",
        save: "Guardar",
        saving: "Guardando…",
        cancel: "Cancelar",
        parentId: "Categoría padre",
        parentPlaceholder: "Seleccionar padre…",
        noParent: "Sin padre (raíz)",
        parentOptional: "Opcional — deja vacío para categoría raíz",
        level: "Nivel",
        translations: "Traducciones",
        addTranslation: "Agregar traducción",
        locale: "Idioma",
        name: "Nombre",
        namePlaceholder: "Nombre de la categoría",
        required: "Campo obligatorio",
        atLeastOneTranslation: "Se requiere al menos una traducción",
        createSuccess: "Categoría creada exitosamente",
        updateSuccess: "Categoría actualizada exitosamente",
        deleteTranslation: "Eliminar traducción",
        searchParent: "Buscar categoría padre…",
        loadingParents: "Cargando categorías…",
    },
    en: {
        createTitle: "New category",
        editTitle: "Edit category",
        save: "Save",
        saving: "Saving…",
        cancel: "Cancel",
        parentId: "Parent category",
        parentPlaceholder: "Select parent…",
        noParent: "No parent (root)",
        parentOptional: "Optional — leave empty for root category",
        level: "Level",
        translations: "Translations",
        addTranslation: "Add translation",
        locale: "Language",
        name: "Name",
        namePlaceholder: "Category name",
        required: "Required",
        atLeastOneTranslation: "At least one translation is required",
        createSuccess: "Category created successfully",
        updateSuccess: "Category updated successfully",
        deleteTranslation: "Delete translation",
        searchParent: "Search parent category…",
        loadingParents: "Loading categories…",
    },
    pt: {
        createTitle: "Nova categoria",
        editTitle: "Editar categoria",
        save: "Salvar",
        saving: "Salvando…",
        cancel: "Cancelar",
        parentId: "Categoria pai",
        parentPlaceholder: "Selecionar pai…",
        noParent: "Sem pai (raiz)",
        parentOptional: "Opcional — deixe vazio para categoria raiz",
        level: "Nível",
        translations: "Traduções",
        addTranslation: "Adicionar tradução",
        locale: "Idioma",
        name: "Nome",
        namePlaceholder: "Nome da categoria",
        required: "Campo obrigatório",
        atLeastOneTranslation: "Pelo menos uma tradução é necessária",
        createSuccess: "Categoria criada com sucesso",
        updateSuccess: "Categoria atualizada com sucesso",
        deleteTranslation: "Excluir tradução",
        searchParent: "Buscar categoria pai…",
        loadingParents: "Carregando categorias…",
    },
};

/* Available locales for translations */
const AVAILABLE_LOCALES = [
    { code: "es", label: "Español" },
    { code: "en", label: "English" },
    { code: "pt", label: "Português" },
];

/* ── Types ─────────────────────────────────────────────── */
interface TranslationRow {
    locale: string;
    name: string;
}

interface CategoryFormData {
    parentId: string | null;
    level: number;
    translations: TranslationRow[];
}

export interface CategoryFormModalProps {
    /** If provided, we're editing. If null, we're creating. */
    editCategory: PagedCategory | null;
    /** Pre-fill form from another category when cloning */
    cloneData?: PagedCategory | null;
    /** Pre-fill parentId when creating a subcategory */
    defaultParentId?: string | null;
    locale: string;
    onClose: () => void;
    onSaved: () => void;
}

/* ── Component ─────────────────────────────────────────── */
export function CategoryFormModal({
    editCategory,
    cloneData,
    defaultParentId,
    locale,
    onClose,
    onSaved,
}: CategoryFormModalProps) {
    const labels = tr[locale] ?? tr.es;
    const isEdit = !!editCategory;

    // ── Form state ──────────────────────────
    const [form, setForm] = useState<CategoryFormData>(() => {
        if (editCategory) {
            return {
                parentId: editCategory.parentId,
                level: editCategory.level,
                translations: editCategory.translations.length > 0
                    ? editCategory.translations.map((t) => ({ locale: t.locale, name: t.name }))
                    : [{ locale, name: "" }],
            };
        }
        if (cloneData) {
            return {
                parentId: cloneData.parentId,
                level: cloneData.level,
                translations: cloneData.translations.length > 0
                    ? cloneData.translations.map((t) => ({ locale: t.locale, name: t.name + " (Copia)" }))
                    : [{ locale, name: "(Copia)" }],
            };
        }
        return {
            parentId: defaultParentId ?? null,
            level: 1,
            translations: [{ locale, name: "" }],
        };
    });

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Parent categories (for dropdown) ─────
    const [parentOptions, setParentOptions] = useState<{ id: string; name: string; level: number }[]>([]);
    const [loadingParents, setLoadingParents] = useState(false);
    const [parentSearch, setParentSearch] = useState("");
    const [showParentDropdown, setShowParentDropdown] = useState(false);
    const parentDropdownRef = useRef<HTMLDivElement>(null);

    // ── Subcategory state (for shared component) ──
    const [linkedSubs, setLinkedSubs] = useState<LinkedSub[]>([]);
    const [pendingSubs, setPendingSubs] = useState<PendingSub[]>([]);

    const fetchParents = useCallback(async () => {
        setLoadingParents(true);
        try {
            // Fetch level 1 & 2 categories (potential parents)
            const page1 = await nexaCategoryPagedRepository.findPaged({
                size: 200,
                level: 1,
            });
            const page2 = await nexaCategoryPagedRepository.findPaged({
                size: 200,
                level: 2,
            });
            const all = [...page1.content, ...page2.content];
            setParentOptions(all.map((c) => ({ id: c.id, name: c.name, level: c.level })));
        } catch (err) { logger.warn("Suppressed error", err); } finally {
            setLoadingParents(false);
        }
    }, []);

    useEffect(() => { fetchParents(); }, [fetchParents]);

    // Close parent dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (parentDropdownRef.current && !parentDropdownRef.current.contains(e.target as Node)) {
                setShowParentDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // ── Auto-compute level from parent ──────
    useEffect(() => {
        if (form.parentId) {
            const parent = parentOptions.find((p) => p.id === form.parentId);
            if (parent) {
                setForm((prev) => ({ ...prev, level: parent.level + 1 }));
            }
        } else {
            setForm((prev) => ({ ...prev, level: 1 }));
        }
    }, [form.parentId, parentOptions]);

    // ── Close on Escape ─────────────────────
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [onClose]);

    // ── Translation methods ─────────────────
    function addTranslation() {
        const usedLocales = form.translations.map((t) => t.locale);
        const nextLocale = AVAILABLE_LOCALES.find((l) => !usedLocales.includes(l.code))?.code ?? "en";
        setForm((prev) => ({
            ...prev,
            translations: [...prev.translations, { locale: nextLocale, name: "" }],
        }));
    }

    function removeTranslation(idx: number) {
        setForm((prev) => ({
            ...prev,
            translations: prev.translations.filter((_, i) => i !== idx),
        }));
    }

    function updateTranslation(idx: number, field: "locale" | "name", value: string) {
        setForm((prev) => ({
            ...prev,
            translations: prev.translations.map((t, i) =>
                i === idx ? { ...t, [field]: value } : t,
            ),
        }));
    }

    // ── Validate ────────────────────────────
    function validate(): boolean {
        const errs: Record<string, string> = {};

        if (form.translations.length === 0) {
            errs.translations = labels.atLeastOneTranslation;
        }
        form.translations.forEach((t, i) => {
            if (!t.name.trim()) {
                errs[`translation_${i}_name`] = labels.required;
            }
            if (!t.locale.trim()) {
                errs[`translation_${i}_locale`] = labels.required;
            }
        });

        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    // ── Submit ──────────────────────────────
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        if (saving) return;

        setSaving(true);
        try {
            const payload = {
                parentId: form.parentId || null,
                level: form.level,
                translations: form.translations.map((t) => ({
                    locale: t.locale.trim(),
                    name: t.name.trim(),
                })),
            };

            if (isEdit) {
                await nexaCategoryPagedRepository.updateCategory(editCategory!.id, payload);
                toast.success(labels.updateSuccess);
                // Process pending subs for edit mode
                for (const sub of pendingSubs) {
                    try {
                        if (sub.type === "link" && sub.id) {
                            await nexaCategoryPagedRepository.updateCategory(sub.id, {
                                parentId: editCategory!.id,
                                level: editCategory!.level + 1,
                                translations: [{ locale: sub.locale ?? "es", name: sub.name }],
                            });
                        } else if (sub.type === "create") {
                            await nexaCategoryPagedRepository.createCategory({
                                parentId: editCategory!.id,
                                level: editCategory!.level + 1,
                                translations: [{ locale: sub.locale ?? "es", name: sub.name }],
                            });
                        }
                    } catch (err) { logger.warn("Suppressed error", err); }
                }
            } else {
                const created = await nexaCategoryPagedRepository.createCategory(payload);
                toast.success(labels.createSuccess);
                // Process pending subs for create mode
                for (const sub of pendingSubs) {
                    try {
                        if (sub.type === "link" && sub.id) {
                            await nexaCategoryPagedRepository.updateCategory(sub.id, {
                                parentId: created.id,
                                level: payload.level + 1,
                                translations: [{ locale: sub.locale ?? "es", name: sub.name }],
                            });
                        } else if (sub.type === "create") {
                            await nexaCategoryPagedRepository.createCategory({
                                parentId: created.id,
                                level: payload.level + 1,
                                translations: [{ locale: sub.locale ?? "es", name: sub.name }],
                            });
                        }
                    } catch (err) { logger.warn("Suppressed error", err); }
                }
            }
            onSaved();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error";
            toast.error(msg, { duration: 5000 });
        } finally {
            setSaving(false);
        }
    }

    // ── Exclude IDs for add-sub component ────
    const subExcludeIds = [
        ...(editCategory ? [editCategory.id] : []),
        ...(editCategory?.subCategories ?? []),
    ];

    // ── Filtered parent options ─────────────
    const filteredParents = parentSearch
        ? parentOptions.filter((p) =>
            p.name.toLowerCase().includes(parentSearch.toLowerCase()) ||
            p.id.toLowerCase().includes(parentSearch.toLowerCase())
        )
        : parentOptions;

    const selectedParentName = form.parentId
        ? parentOptions.find((p) => p.id === form.parentId)?.name ?? form.parentId
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-medium text-gray-900">
                        {isEdit ? labels.editTitle : labels.createTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Parent category */}
                    <div ref={parentDropdownRef}>
                        <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5 block">
                            {labels.parentId}
                            <span className="normal-case tracking-normal font-normal text-gray-400 ml-1">({labels.parentOptional})</span>
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowParentDropdown((v) => !v)}
                                className="w-full flex items-center justify-between text-left text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white hover:border-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                            >
                                <span className="text-gray-900 flex items-center gap-2">
                                    {selectedParentName ? (
                                        <>{selectedParentName}</>
                                    ) : (
                                        <><span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />{labels.noParent}</>
                                    )}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showParentDropdown ? "rotate-180" : ""}`} strokeWidth={1.5} />
                            </button>

                            {showParentDropdown && (
                                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 flex flex-col">
                                    {/* Search */}
                                    <div className="px-3 py-2 border-b border-gray-100">
                                        <input
                                            type="text"
                                            value={parentSearch}
                                            onChange={(e) => setParentSearch(e.target.value)}
                                            placeholder={labels.searchParent}
                                            className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-gray-400"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Options */}
                                    <div className="overflow-y-auto flex-1">
                                        {/* No parent option */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm((prev) => ({ ...prev, parentId: null }));
                                                setShowParentDropdown(false);
                                                setParentSearch("");
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${!form.parentId ? "text-blue-600 font-medium bg-blue-50/50" : "text-gray-600"
                                                }`}
                                        >
                                            {labels.noParent}
                                        </button>

                                        {loadingParents ? (
                                            <div className="flex items-center gap-2 px-3 py-3 text-xs text-gray-400">
                                                <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                                                {labels.loadingParents}
                                            </div>
                                        ) : (
                                            filteredParents
                                                .filter((p) => !editCategory || p.id !== editCategory.id)
                                                .map((p) => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setForm((prev) => ({ ...prev, parentId: p.id }));
                                                            setShowParentDropdown(false);
                                                            setParentSearch("");
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${form.parentId === p.id ? "text-blue-600 font-medium bg-blue-50/50" : "text-gray-700"
                                                            }`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.level === 1 ? "bg-violet-400" : "bg-sky-400"}`} />
                                                            {p.name}
                                                            <span className="text-[10px] text-gray-400 ml-auto">Nv.{p.level}</span>
                                                        </span>
                                                    </button>
                                                ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Level (auto-computed, read-only) */}
                    <div>
                        <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5 block">
                            {labels.level}
                        </label>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center text-xs px-3 py-1.5 rounded-lg font-medium ring-1 ${form.level === 1
                                ? "bg-violet-50 text-violet-700 ring-violet-200"
                                : form.level === 2
                                    ? "bg-sky-50 text-sky-700 ring-sky-200"
                                    : "bg-teal-50 text-teal-700 ring-teal-200"
                                }`}>
                                Nv. {form.level}
                            </span>
                            <span className="text-[11px] text-gray-400">
                                {form.parentId
                                    ? locale === "en" ? "Auto-computed from parent" : locale === "pt" ? "Auto-calculado do pai" : "Auto-calculado desde el padre"
                                    : locale === "en" ? "Root level" : locale === "pt" ? "Nível raiz" : "Nivel raíz"
                                }
                            </span>
                        </div>
                    </div>

                    {/* Translations */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
                                {labels.translations}
                            </label>
                            {form.translations.length < AVAILABLE_LOCALES.length && (
                                <button
                                    type="button"
                                    onClick={addTranslation}
                                    className="flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-700 font-medium transition-colors"
                                >
                                    <Plus className="w-3 h-3" strokeWidth={2} />
                                    {labels.addTranslation}
                                </button>
                            )}
                        </div>
                        {errors.translations && (
                            <p className="text-[11px] text-red-500 mb-2">{errors.translations}</p>
                        )}
                        <div className="space-y-2">
                            {form.translations.map((t, idx) => {
                                const usedLocales = form.translations.map((tr) => tr.locale);
                                return (
                                    <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                                        <div className="flex items-end gap-2">
                                            <div className="w-24 flex-shrink-0">
                                                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1 block">
                                                    {labels.locale}
                                                </label>
                                                <select
                                                    value={t.locale}
                                                    onChange={(e) => updateTranslation(idx, "locale", e.target.value)}
                                                    className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg px-2 py-2.5 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                                                >
                                                    {AVAILABLE_LOCALES.map((l) => (
                                                        <option
                                                            key={l.code}
                                                            value={l.code}
                                                            disabled={l.code !== t.locale && usedLocales.includes(l.code)}
                                                        >
                                                            {l.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1 block">
                                                    {labels.name}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={t.name}
                                                    onChange={(e) => updateTranslation(idx, "name", e.target.value)}
                                                    placeholder={labels.namePlaceholder}
                                                    className="w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 bg-white hover:border-gray-300 focus:outline-none focus:border-gray-400 transition-colors placeholder-gray-300"
                                                />
                                            </div>
                                            {form.translations.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeTranslation(idx)}
                                                    className="flex items-center justify-center w-9 h-9 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                    title={labels.deleteTranslation}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                </button>
                                            )}
                                        </div>
                                        {errors[`translation_${idx}_name`] && (
                                            <p className="text-[11px] text-red-500 mt-1.5 pl-[6.5rem]">{errors[`translation_${idx}_name`]}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Add subcategories section ── */}
                    <AddSubcategoriesSection
                        parentId={isEdit ? editCategory!.id : null}
                        parentLevel={form.level}
                        locale={locale}
                        excludeIds={subExcludeIds}
                        showCreateTab={false}
                        immediate={isEdit}
                        onChanged={onSaved}
                        pendingSubs={pendingSubs}
                        onPendingChange={setPendingSubs}
                        linkedSubs={linkedSubs}
                        onLinkedSubsChange={setLinkedSubs}
                        variant="inline"
                    />
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="text-xs text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {labels.cancel}
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-xs text-white bg-gray-800 hover:bg-gray-900 rounded-xl px-5 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                                {labels.saving}
                            </>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                                {labels.save}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
