import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus, Zap, Percent, DollarSign, Package, Truck,
  Copy, Pencil, Trash2, Pause, Play, X, Check,
  Calendar, Tag, ChevronDown, AlertTriangle,
  Search, BarChart2, ShoppingBag, Clock, Eye,
  ToggleLeft, Star, Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import { useNexaProducts } from "../../hooks/useNexaProducts";
import { useNexaCategories } from "../../hooks/useNexaCategories";
import {
  type Campaign as ApiCampaign, type CampaignPayload, type ApiCampaignType,
  campaignRepository,
} from "../../repositories/CampaignRepository";
import { ApiError } from "../../lib/AppError";

// ── Types ─────────────────────────────────────────────────────────────────────
type CampaignType =
  | "percentage"
  | "fixed"
  | "flash"
  | "bundle"
  | "free_shipping"
  | "two_for_one";

type CampaignStatus = "active" | "scheduled" | "paused" | "ended" | "draft";
type AppliesTo = "all" | "categories" | "products";

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  // discount
  discountValue: number;       // % or fixed amount (ignored for free_shipping / two_for_one / bundle)
  minOrder: number;            // minimum cart total to activate
  maxDiscount: number | null;  // cap for %-based discounts (null = no cap)
  // scope
  appliesTo: AppliesTo;
  categoryIds: string[];
  productIds: string[];
  // bundle
  buyQty: number;              // "buy X"
  getQty: number;              // "get Y" free
  // dates
  startDate: string;
  endDate: string;
  isFlash: boolean;
  // presentation
  badgeText: string;           // text shown on product cards
  badgeColor: string;          // hex
  showOnHome: boolean;
  priority: number;
  // stats (mock)
  revenue: number;
  ordersCount: number;
  usesCount: number;
}

// ── Catalogues ────────────────────────────────────────────────────────────────
const TYPE_META: Record<CampaignType, { label: string; icon: React.ElementType; iconBg: string; iconText: string; description: string }> = {
  percentage: { label: "Descuento %", icon: Percent, iconBg: "bg-blue-50", iconText: "text-blue-600", description: "Aplica un porcentaje de descuento" },
  fixed: { label: "Descuento fijo", icon: DollarSign, iconBg: "bg-green-50", iconText: "text-green-600", description: "Descuento de cantidad fija en $" },
  flash: { label: "Flash Sale", icon: Zap, iconBg: "bg-yellow-50", iconText: "text-yellow-600", description: "Oferta relámpago con contador" },
  bundle: { label: "Compra X lleva Y", icon: Package, iconBg: "bg-orange-50", iconText: "text-orange-600", description: "Compra N artículos, lleva M gratis" },
  free_shipping: { label: "Envío gratis", icon: Truck, iconBg: "bg-teal-50", iconText: "text-teal-600", description: "Elimina el coste de envío" },
  two_for_one: { label: "2x1", icon: Copy, iconBg: "bg-violet-50", iconText: "text-violet-600", description: "El segundo artículo sale gratis" },
};

const STATUS_META: Record<CampaignStatus, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: "Activa", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  scheduled: { label: "Programada", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  paused: { label: "Pausada", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  ended: { label: "Finalizada", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-300" },
  draft: { label: "Borrador", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-300" },
};

const BADGE_COLORS = ["#111827", "#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#f97316"];

// ── Initial data ──────────────────────────────────────────────────────────────
// Removed: data is now loaded from the API.

const API_TO_UI_TYPE: Record<ApiCampaignType, CampaignType> = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
  FLASH: "flash",
  BUNDLE: "bundle",
  BUY2GET1: "two_for_one",
  FREE_SHIPPING: "free_shipping",
};

const UI_TO_API_TYPE: Record<CampaignType, ApiCampaignType> = {
  percentage: "PERCENTAGE",
  fixed: "FIXED",
  flash: "FLASH",
  bundle: "BUNDLE",
  two_for_one: "BUY2GET1",
  free_shipping: "FREE_SHIPPING",
};

function mapApiToUi(c: ApiCampaign): Campaign {
  const now = new Date().toISOString();
  let status: CampaignStatus = "paused";
  if (c.active) {
    status = c.startDate <= now && now <= c.endDate ? "active" : "scheduled";
  } else if (c.endDate < now) {
    status = "ended";
  }
  const type: CampaignType = API_TO_UI_TYPE[c.type] ?? "percentage";
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    type,
    status,
    discountValue: c.value ?? 0,
    minOrder: c.minOrder ?? 0,
    maxDiscount: c.maxDiscount ?? null,
    appliesTo: c.appliesToCategories?.length ? "categories" : c.appliesToProducts?.length ? "products" : "all",
    categoryIds: c.appliesToCategories ?? [],
    productIds: c.appliesToProducts ?? [],
    buyQty: c.buyQty ?? 2,
    getQty: c.getQty ?? 1,
    startDate: c.startDate.split("T")[0],
    endDate: c.endDate.split("T")[0],
    isFlash: c.isFlash ?? false,
    badgeText: c.badge ?? "",
    badgeColor: c.badgeColor ?? "#111827",
    showOnHome: c.showOnHome ?? false,
    priority: c.priority ?? 3,
    revenue: 0,
    ordersCount: 0,
    usesCount: 0,
  };
}

function uiToPayload(c: Omit<Campaign, "id" | "revenue" | "ordersCount" | "usesCount"> & { id?: string }): CampaignPayload {
  const apiType: ApiCampaignType = UI_TO_API_TYPE[c.type] ?? "PERCENTAGE";
  return {
    name: c.name,
    type: apiType,
    value: c.discountValue ?? 0,
    badge: c.badgeText || undefined,
    badgeColor: c.badgeColor || undefined,
    startDate: c.startDate.includes("T") ? c.startDate : `${c.startDate}T00:00:00Z`,
    endDate: c.endDate.includes("T") ? c.endDate : `${c.endDate}T23:59:59Z`,
    appliesToCategories: c.appliesTo === "categories" ? c.categoryIds : undefined,
    appliesToProducts: c.appliesTo === "products" ? c.productIds : undefined,
    active: c.status === "active" || c.status === "scheduled",
    description: c.description || undefined,
    minOrder: c.minOrder || undefined,
    maxDiscount: c.maxDiscount,
    buyQty: c.buyQty,
    getQty: c.getQty,
    isFlash: c.isFlash,
    showOnHome: c.showOnHome,
    priority: c.priority,
  };
}

const emptyForm: Omit<Campaign, "id" | "revenue" | "ordersCount" | "usesCount"> = {
  name: "", description: "", type: "percentage", status: "draft",
  discountValue: 10, minOrder: 0, maxDiscount: null,
  appliesTo: "all", categoryIds: [], productIds: [],
  buyQty: 2, getQty: 1,
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  isFlash: false,
  badgeText: "", badgeColor: "#111827", showOnHome: false, priority: 3,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const inp = "w-full h-7 px-2.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300";
const lbl = "block text-[11px] text-gray-500 mb-1";

function discountLabel(c: Campaign): string {
  if (c.type === "percentage" || c.type === "flash") return `-${c.discountValue}%`;
  if (c.type === "fixed") return `-$${c.discountValue}`;
  if (c.type === "free_shipping") return "Envío gratis";
  if (c.type === "two_for_one") return "2x1";
  if (c.type === "bundle") return `${c.buyQty}x${c.getQty}`;
  return "";
}

function scopeLabel(c: Campaign, categories: { id: string; name: string }[]): string {
  if (c.appliesTo === "all") return "Todos los productos";
  if (c.appliesTo === "categories") {
    const names = c.categoryIds
      .map(id => categories.find(cat => cat.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Sin categorías";
  }
  return `${c.productIds.length} producto${c.productIds.length !== 1 ? "s" : ""}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Campaign Form Panel
// ─────────────────────────────────────────────────────────────────────────────
interface CampaignPanelProps {
  initial: Omit<Campaign, "id" | "revenue" | "ordersCount" | "usesCount"> & { id?: string };
  onSave: (data: Omit<Campaign, "id" | "revenue" | "ordersCount" | "usesCount"> & { id?: string }) => void;
  onClose: () => void;
  /** All other campaigns — used to detect products already in another campaign */
  otherCampaigns?: Campaign[];
}

function CampaignPanel({ initial, onSave, onClose, otherCampaigns = [] }: CampaignPanelProps) {
  const [form, setForm] = useState({ ...initial });
  const [section, setSection] = useState<"basics" | "discount" | "scope" | "dates" | "display">("basics");
  const [productSearch, setProductSearch] = useState("");
  const isEdit = Boolean(initial.id);

  // Live products from the same source as /home
  const { products: allProducts } = useNexaProducts();
  const { categories: allCategories } = useNexaCategories();

  const set = (field: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleCategory = (id: string) => {
    const next = form.categoryIds.includes(id)
      ? form.categoryIds.filter(c => c !== id)
      : [...form.categoryIds, id];
    set("categoryIds", next);
  };

  const toggleProduct = (id: string) => {
    const next = form.productIds.includes(id)
      ? form.productIds.filter(p => p !== id)
      : [...form.productIds, id];
    set("productIds", next);
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const parentCategories = allCategories.filter(c => !c.parentId);

  // Build set of product IDs and category IDs already claimed by other active campaigns
  const claimedProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of otherCampaigns) {
      if (c.status !== "active" && c.status !== "scheduled") continue;
      for (const pid of c.productIds) ids.add(pid);
    }
    return ids;
  }, [otherCampaigns]);

  const claimedCategoryMap = useMemo(() => {
    const map = new Map<string, string>(); // categoryId -> campaignName
    for (const c of otherCampaigns) {
      if (c.status !== "active" && c.status !== "scheduled") continue;
      for (const catId of c.categoryIds) {
        if (!map.has(catId)) map.set(catId, c.name);
      }
    }
    return map;
  }, [otherCampaigns]);

  const claimedProductMap = useMemo(() => {
    const map = new Map<string, string>(); // productId -> campaignName
    // Build category name → ID lookup for matching products to campaign categories
    const catNameToIds = new Map<string, string[]>();
    for (const cat of allCategories) {
      const existing = catNameToIds.get(cat.name) ?? [];
      existing.push(cat.id);
      catNameToIds.set(cat.name, existing);
      for (const sub of cat.subCategories ?? []) {
        const subExisting = catNameToIds.get(sub.name) ?? [];
        subExisting.push(sub.id);
        catNameToIds.set(sub.name, subExisting);
      }
    }

    for (const c of otherCampaigns) {
      if (c.status !== "active" && c.status !== "scheduled") continue;
      for (const pid of c.productIds) {
        if (!map.has(pid)) map.set(pid, c.name);
      }
      // Also mark products that belong to claimed categories
      if (c.categoryIds.length > 0) {
        const catSet = new Set(c.categoryIds);
        for (const p of allProducts) {
          if (map.has(p.id)) continue;
          // Match product.category (name) to campaign categoryIds (IDs)
          const pCatIds = catNameToIds.get(p.category) ?? [];
          if (pCatIds.some(id => catSet.has(id))) {
            map.set(p.id, c.name);
          }
        }
      }
    }
    return map;
  }, [otherCampaigns, allProducts, allCategories]);

  const validate = (): string | null => {
    if (!form.name.trim()) return "El nombre es obligatorio";
    if (["percentage", "fixed", "flash"].includes(form.type) && form.discountValue <= 0)
      return "El valor del descuento debe ser mayor que 0";
    if (!form.startDate) return "La fecha de inicio es obligatoria";
    if (!form.endDate) return "La fecha de fin es obligatoria";
    if (form.endDate < form.startDate) return "La fecha de fin debe ser posterior a la de inicio";
    if (form.appliesTo === "categories" && form.categoryIds.length === 0)
      return "Selecciona al menos una categoría";
    if (form.appliesTo === "products" && form.productIds.length === 0)
      return "Selecciona al menos un producto";
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    onSave(form);
  };

  const tm = TYPE_META[form.type];
  const TypeIcon = tm.icon;

  const SECTIONS = [
    { id: "basics", label: "Campaña" },
    { id: "discount", label: "Descuento" },
    { id: "scope", label: "Productos" },
    { id: "dates", label: "Vigencia" },
    { id: "display", label: "Presentación" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg ${tm.iconBg} flex items-center justify-center`}>
              <TypeIcon className={`w-3.5 h-3.5 ${tm.iconText}`} strokeWidth={1.5} />
            </div>
            <h2 className="text-sm text-gray-900">
              {isEdit ? "Editar campaña" : "Nueva campaña"}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-px bg-gray-100 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex-shrink-0 h-9 px-4 text-xs transition-colors ${section === s.id ? "bg-white text-gray-900 border-b-2 border-gray-900" : "bg-gray-50 text-gray-500 hover:text-gray-700"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Live preview strip */}
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          <div
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full text-white flex-shrink-0"
            style={{ backgroundColor: form.badgeColor || "#111827" }}
          >
            <TypeIcon className="w-3 h-3" strokeWidth={2} />
            {form.badgeText || discountLabel({ ...form, id: "", revenue: 0, ordersCount: 0, usesCount: 0 } as Campaign)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-900 truncate">{form.name || "Nombre de la campaña"}</p>
            <p className="text-[10px] text-gray-400">{form.startDate} → {form.endDate}</p>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_META[form.status].bg} ${STATUS_META[form.status].text}`}>
            {STATUS_META[form.status].label}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── BASICS ── */}
          {section === "basics" && (
            <>
              <div>
                <label className={lbl}>Nombre de la campaña *</label>
                <input className={inp} placeholder="Ej: Flash Sale Primavera, Tech Week…" value={form.name} onChange={e => set("name", e.target.value)} />
              </div>

              <div>
                <label className={lbl}>Descripción interna</label>
                <textarea
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 resize-none placeholder:text-gray-300"
                  placeholder="Notas para el equipo…"
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                />
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <label className={lbl}>Tipo de campaña *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(TYPE_META) as [CampaignType, typeof TYPE_META[CampaignType]][]).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set("type", key)}
                        className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${form.type === key ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <div className={`w-6 h-6 rounded-lg ${meta.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon className={`w-3 h-3 ${meta.iconText}`} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-900">{meta.label}</p>
                          <p className="text-[10px] text-gray-400 leading-tight">{meta.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <label className={lbl}>Estado inicial</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["draft", "active"] as CampaignStatus[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("status", s)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${form.status === s ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${STATUS_META[s].dot}`} />
                      <p className="text-xs text-gray-700">{STATUS_META[s].label}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">El estado "Programada" se asigna automáticamente si la fecha de inicio es futura.</p>
              </div>
            </>
          )}

          {/* ── DISCOUNT ── */}
          {section === "discount" && (
            <>
              {(form.type === "percentage" || form.type === "flash") && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Porcentaje de descuento *</label>
                      <div className="relative">
                        <input
                          type="number" min={1} max={99}
                          className={inp + " pr-7"}
                          placeholder="20"
                          value={form.discountValue}
                          onChange={e => set("discountValue", Number(e.target.value))}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Descuento máximo ($) <span className="text-gray-300">opcional</span></label>
                      <div className="relative">
                        <input
                          type="number" min={0}
                          className={inp + " pr-5"}
                          placeholder="—"
                          value={form.maxDiscount ?? ""}
                          onChange={e => set("maxDiscount", e.target.value === "" ? null : Number(e.target.value))}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                      </div>
                    </div>
                  </div>
                  {/* Quick picks */}
                  <div>
                    <p className={lbl}>Porcentajes rápidos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[5, 10, 15, 20, 25, 30, 40, 50].map(v => (
                        <button key={v} type="button"
                          onClick={() => set("discountValue", v)}
                          className={`h-6 px-2.5 text-[11px] rounded-lg border transition-colors ${form.discountValue === v ? "bg-gray-600 text-white border-gray-600" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {form.type === "fixed" && (
                <div>
                  <label className={lbl}>Descuento fijo ($) *</label>
                  <div className="relative">
                    <input
                      type="number" min={1}
                      className={inp + " pr-5"}
                      placeholder="50"
                      value={form.discountValue}
                      onChange={e => set("discountValue", Number(e.target.value))}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[5, 10, 20, 30, 50, 75, 100].map(v => (
                      <button key={v} type="button"
                        onClick={() => set("discountValue", v)}
                        className={`h-6 px-2.5 text-[11px] rounded-lg border transition-colors ${form.discountValue === v ? "bg-gray-600 text-white border-gray-600" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
                      >
                        ${v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.type === "bundle" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Compra (cantidad) *</label>
                    <input type="number" min={1} className={inp} value={form.buyQty} onChange={e => set("buyQty", Number(e.target.value))} />
                  </div>
                  <div>
                    <label className={lbl}>Lleva gratis *</label>
                    <input type="number" min={1} className={inp} value={form.getQty} onChange={e => set("getQty", Number(e.target.value))} />
                  </div>
                </div>
              )}

              {form.type === "free_shipping" && (
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl">
                  <p className="text-xs text-teal-700">Elimina el coste de envío para los pedidos que cumplan las condiciones mínimas.</p>
                </div>
              )}

              {form.type === "two_for_one" && (
                <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl">
                  <p className="text-xs text-violet-700">El segundo artículo del mismo producto sale completamente gratis.</p>
                </div>
              )}

              <div className="h-px bg-gray-100" />

              <div>
                <label className={lbl}>Pedido mínimo para activar ($)</label>
                <div className="relative">
                  <input
                    type="number" min={0}
                    className={inp + " pr-5"}
                    placeholder="0"
                    value={form.minOrder}
                    onChange={e => set("minOrder", Number(e.target.value))}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Deja en 0 para que se active en cualquier pedido.</p>
              </div>
            </>
          )}

          {/* ── SCOPE ── */}
          {section === "scope" && (
            <>
              <div>
                <label className={lbl}>Ámbito de aplicación *</label>
                <div className="space-y-2">
                  {([
                    { value: "all", label: "Todos los productos", desc: "Aplica a todo el catálogo" },
                    { value: "categories", label: "Categorías seleccionadas", desc: "Elige una o más categorías" },
                    { value: "products", label: "Productos específicos", desc: "Selecciona productos manualmente" },
                  ] as { value: AppliesTo; label: string; desc: string }[]).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("appliesTo", opt.value)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border text-left transition-all ${form.appliesTo === opt.value ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.appliesTo === opt.value ? "border-gray-500" : "border-gray-300"}`}>
                        {form.appliesTo === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />}
                      </div>
                      <div>
                        <p className="text-xs text-gray-900">{opt.label}</p>
                        <p className="text-[10px] text-gray-400">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category picker */}
              {form.appliesTo === "categories" && (
                <div>
                  <label className={lbl}>Selecciona categorías</label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    {parentCategories.map(cat => {
                      const claimedBy = claimedCategoryMap.get(cat.id);
                      const isSelected = form.categoryIds.includes(cat.id);
                      const isClaimed = !!claimedBy && !isSelected;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => !isClaimed && toggleCategory(cat.id)}
                          disabled={isClaimed}
                          className={`flex items-center justify-between w-full px-3 py-2.5 text-left transition-colors border-b border-gray-50 last:border-0 ${isClaimed ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-gray-50"} ${isSelected ? "bg-gray-50" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-gray-600 border-gray-600" : "border-gray-300"}`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                            </div>
                            <div>
                              <p className="text-xs text-gray-900">{cat.name}</p>
                              {isClaimed && (
                                <p className="text-[10px] text-amber-500">Ya en: {claimedBy}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400">{(cat as any).productCount ?? 0} productos</span>
                        </button>
                      );
                    })}
                  </div>
                  {form.categoryIds.length > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1">{form.categoryIds.length} categoría{form.categoryIds.length !== 1 ? "s" : ""} seleccionada{form.categoryIds.length !== 1 ? "s" : ""}</p>
                  )}
                </div>
              )}

              {/* Product picker */}
              {form.appliesTo === "products" && (
                <div>
                  <label className={lbl}>Selecciona productos</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                    <input
                      className={inp + " pl-7"}
                      placeholder="Buscar por nombre o SKU…"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                    />
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    {filteredProducts.map(p => {
                      const claimedBy = claimedProductMap.get(p.id);
                      const isSelected = form.productIds.includes(p.id);
                      const isClaimed = !!claimedBy && !isSelected;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => !isClaimed && toggleProduct(p.id)}
                          disabled={isClaimed}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors border-b border-gray-50 last:border-0 ${isClaimed ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-gray-50"} ${isSelected ? "bg-gray-50" : ""}`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-gray-600 border-gray-600" : "border-gray-300"}`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                          </div>
                          <img src={p.image} alt={p.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-900 truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400">{p.sku} · ${p.price}</p>
                            {isClaimed && (
                              <p className="text-[10px] text-amber-500">Ya en: {claimedBy}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <p className="px-3 py-4 text-xs text-gray-400 text-center">Sin resultados</p>
                    )}
                  </div>
                  {form.productIds.length > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1">{form.productIds.length} producto{form.productIds.length !== 1 ? "s" : ""} seleccionado{form.productIds.length !== 1 ? "s" : ""}</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── DATES ── */}
          {section === "dates" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Fecha de inicio *</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                    <input type="date" className={inp + " pl-7"} value={form.startDate} onChange={e => set("startDate", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Fecha de fin *</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                    <input type="date" className={inp + " pl-7"} value={form.endDate} onChange={e => set("endDate", e.target.value)} min={form.startDate} />
                  </div>
                </div>
              </div>

              {form.startDate && form.endDate && form.endDate >= form.startDate && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                  <Clock className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                  <p className="text-xs text-gray-600">
                    Duración:{" "}
                    {Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000)}{" "}
                    días
                  </p>
                </div>
              )}

              <div className="h-px bg-gray-100" />

              {/* Flash toggle */}
              <button
                type="button"
                onClick={() => set("isFlash", !form.isFlash)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border text-left transition-colors ${form.isFlash ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50"}`}
              >
                <div className={`relative rounded-full flex-shrink-0 transition-colors ${form.isFlash ? "bg-yellow-400" : "bg-gray-200"}`} style={{ width: 32, height: 18 }}>
                  <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${form.isFlash ? "left-[calc(100%-16px)]" : "left-0.5"}`} />
                </div>
                <div>
                  <p className={`text-xs ${form.isFlash ? "text-yellow-800" : "text-gray-500"}`}>
                    Mostrar contador de cuenta atrás
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Crea urgencia mostrando el tiempo restante en el producto
                  </p>
                </div>
                <Zap className={`w-4 h-4 ml-auto flex-shrink-0 ${form.isFlash ? "text-yellow-500" : "text-gray-300"}`} strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* ── DISPLAY ── */}
          {section === "display" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Texto del badge en producto</label>
                  <input
                    className={inp}
                    placeholder={discountLabel({ ...form, id: "", revenue: 0, ordersCount: 0, usesCount: 0 } as Campaign)}
                    value={form.badgeText}
                    onChange={e => set("badgeText", e.target.value)}
                    maxLength={20}
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">{form.badgeText.length}/20 caracteres</p>
                </div>
                <div>
                  <label className={lbl}>Color del badge</label>
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {BADGE_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set("badgeColor", c)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${form.badgeColor === c ? "border-gray-900 scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer p-0.5"
                      value={form.badgeColor}
                      onChange={e => set("badgeColor", e.target.value)}
                      title="Color personalizado"
                    />
                  </div>
                </div>
              </div>

              {/* Badge preview */}
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-gray-400">Vista previa del badge:</p>
                <span
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: form.badgeColor }}
                >
                  <TypeIcon className="w-3 h-3" strokeWidth={2} />
                  {form.badgeText || discountLabel({ ...form, id: "", revenue: 0, ordersCount: 0, usesCount: 0 } as Campaign) || "OFERTA"}
                </span>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Show on home */}
              <button
                type="button"
                onClick={() => set("showOnHome", !form.showOnHome)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border text-left transition-colors ${form.showOnHome ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
              >
                <div className={`relative rounded-full flex-shrink-0 transition-colors ${form.showOnHome ? "bg-blue-400" : "bg-gray-200"}`} style={{ width: 32, height: 18 }}>
                  <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${form.showOnHome ? "left-[calc(100%-16px)]" : "left-0.5"}`} />
                </div>
                <div>
                  <p className={`text-xs ${form.showOnHome ? "text-blue-800" : "text-gray-500"}`}>
                    Destacar en portada
                  </p>
                  <p className="text-[10px] text-gray-400">Aparece en el banner de ofertas de la página principal</p>
                </div>
                <Star className={`w-4 h-4 ml-auto flex-shrink-0 ${form.showOnHome ? "text-blue-400" : "text-gray-300"}`} strokeWidth={1.5} />
              </button>

              {/* Priority */}
              <div>
                <label className={lbl}>Prioridad (1 = más alta)</label>
                <input
                  type="number" min={1} max={10}
                  className={inp}
                  value={form.priority}
                  onChange={e => set("priority", Number(e.target.value))}
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Si un producto cae en varias campañas activas, se aplica la de mayor prioridad.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex gap-1">
            {SECTIONS.map((s, idx) => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`w-2 h-2 rounded-full transition-colors ${section === s.id ? "bg-gray-600" : "bg-gray-200"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-7 px-4 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleSubmit} className="flex items-center gap-1.5 h-7 px-4 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
              <Check className="w-3.5 h-3.5" /> {isEdit ? "Guardar cambios" : "Crear campaña"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete dialog
// ─────────────────────────────────────────────────────────────────────────────
function DeleteDialog({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm text-gray-900 text-center mb-1">¿Eliminar "{name}"?</h3>
        <p className="text-xs text-gray-400 text-center mb-5">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-8 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 h-8 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Campaign card
// ─────────────────────────────────────────────────────────────────────────────
function CampaignCard({
  campaign,
  onEdit,
  onClone,
  onToggle,
  onDelete,
}: {
  campaign: Campaign;
  onEdit: () => void;
  onClone: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { categories: allCategories } = useNexaCategories();
  const tm = TYPE_META[campaign.type];
  const sm = STATUS_META[campaign.status];
  const TypeIcon = tm.icon;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg ${tm.iconBg} flex items-center justify-center flex-shrink-0`}>
            <TypeIcon className={`w-4 h-4 ${tm.iconText}`} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-900 truncate">{campaign.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{campaign.description || tm.label}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${sm.bg} ${sm.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
          {sm.label}
        </span>
      </div>

      {/* Discount + scope */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full text-white flex-shrink-0"
          style={{ backgroundColor: campaign.badgeColor }}
        >
          {campaign.badgeText || discountLabel(campaign)}
        </span>
        <span className="text-[11px] text-gray-400 truncate">
          {scopeLabel(campaign, allCategories)}
        </span>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-3">
        <Calendar className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
        {campaign.startDate} → {campaign.endDate}
        {campaign.isFlash && <Zap className="w-3 h-3 text-yellow-400 ml-1" strokeWidth={2} />}
        {campaign.showOnHome && <Star className="w-3 h-3 text-blue-400" strokeWidth={2} />}
      </div>

      {/* Stats */}
      {campaign.usesCount > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-gray-50">
          <div>
            <p className="text-[10px] text-gray-400">Usos</p>
            <p className="text-xs text-gray-900">{campaign.usesCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Pedidos</p>
            <p className="text-xs text-gray-900">{campaign.ordersCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Ingresos</p>
            <p className="text-xs text-gray-900">${campaign.revenue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 text-[11px] transition-colors ${campaign.status === "active" ? "text-amber-500 hover:text-amber-700" : "text-green-500 hover:text-green-700"}`}
        >
          {campaign.status === "active"
            ? <><Pause className="w-3 h-3" /> Pausar</>
            : <><Play className="w-3 h-3" /> Activar</>}
        </button>
        <div className="flex gap-1">
          <button onClick={onEdit} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Editar"><Pencil className="w-3 h-3" /></button>
          <button onClick={onClone} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Clonar"><Copy className="w-3 h-3" /></button>
          <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export function AdminCampaigns() {
    const { t } = useLanguage();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "all">("all");
  const [filterType, setFilterType] = useState<CampaignType | "all">("all");
  const [searchQ, setSearchQ] = useState("");
  const [panelData, setPanelData] = useState<
    | { mode: "new"; data: typeof emptyForm }
    | { mode: "edit"; data: Campaign }
    | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      const page = await campaignRepository.findAll({ size: 500 });
      setCampaigns(page.content.map(mapApiToUi));
    } catch {
      toast.error("Error al cargar campañas");
    }
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const visible = useMemo(() => {
    let r = [...campaigns];
    if (filterStatus !== "all") r = r.filter(c => c.status === filterStatus);
    if (filterType !== "all") r = r.filter(c => c.type === filterType);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      r = r.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return r;
  }, [campaigns, filterStatus, filterType, searchQ]);

  /* ── CRUD ─────────────────────────────────────────────── */
  const handleSave = async (data: Omit<Campaign, "id" | "revenue" | "ordersCount" | "usesCount"> & { id?: string }) => {
    try {
      if (data.id) {
        const updated = await campaignRepository.update(data.id, uiToPayload(data));
        setCampaigns(prev => prev.map(c => c.id === data.id ? mapApiToUi(updated) : c));
        toast.success("Campaña actualizada");
      } else {
        const created = await campaignRepository.create(uiToPayload(data));
        setCampaigns(prev => [...prev, mapApiToUi(created)]);
        toast.success("Campaña creada");
      }
      setPanelData(null);
    } catch (err: unknown) {
      toast.error(err instanceof ApiError ? err.message : "Error al guardar campaña");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await campaignRepository.toggleActive(id);
      setCampaigns(prev => prev.map(c => {
        if (c.id !== id) return c;
        const next = c.status === "active" ? "paused" : "active";
        toast.success(`Campaña ${next === "active" ? "activada" : "pausada"}`);
        return { ...c, status: next };
      }));
    } catch (err: unknown) {
      toast.error(err instanceof ApiError ? err.message : "Error al cambiar estado de campaña");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await campaignRepository.delete(deleteTarget.id);
      setCampaigns(prev => prev.filter(c => c.id !== deleteTarget.id));
      toast.success("Campaña eliminada");
      setDeleteTarget(null);
    } catch {
      toast.error("Error al eliminar campaña");
    }
  };

  // Aggregate stats
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const activeCount = campaigns.filter(c => c.status === "active").length;
  const totalUses = campaigns.reduce((s, c) => s + c.usesCount, 0);

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">{t("admin.campaigns.title")}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Crea descuentos, flash sales y ofertas especiales para tus productos</p>
        </div>
        <button
          onClick={() => setPanelData({ mode: "new", data: { ...emptyForm } })}
          className="w-9 h-9 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-all flex items-center justify-center shadow-sm hover:shadow-md flex-shrink-0"
          title="Nueva campaña"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Campañas totales", value: campaigns.length, icon: Layers },
          { label: "Activas ahora", value: activeCount, icon: Zap },
          { label: "Usos totales", value: totalUses.toLocaleString(), icon: ShoppingBag },
          { label: "Ingresos generados", value: `$${totalRevenue.toLocaleString()}`, icon: BarChart2 },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              <s.icon className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg text-gray-900 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["all", "active", "scheduled", "paused", "ended", "draft"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-7 px-3 text-xs rounded-lg transition-colors ${filterStatus === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {s === "all" ? "Todas" : STATUS_META[s].label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="relative">
          <select
            className="h-9 pl-3 pr-7 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 appearance-none"
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
          >
            <option value="all">Todos los tipos</option>
            {(Object.entries(TYPE_META) as [CampaignType, any][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
          <input
            className="w-full h-9 pl-7 pr-3 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
            placeholder="Buscar campañas…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl py-16 text-center">
          <Zap className="w-10 h-10 mx-auto mb-3 text-gray-200" strokeWidth={1} />
          <p className="text-sm text-gray-500 mb-1">No hay campañas</p>
          <p className="text-xs text-gray-400 mb-4">
            {filterStatus !== "all" || filterType !== "all" || searchQ
              ? "Prueba con otros filtros"
              : "Crea tu primera campaña para empezar a ofrecer descuentos"}
          </p>
          {!searchQ && filterStatus === "all" && filterType === "all" && (
            <button
              onClick={() => setPanelData({ mode: "new", data: { ...emptyForm } })}
              className="flex items-center gap-2 h-8 px-4 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors mx-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva campaña
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map(c => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onEdit={() => setPanelData({ mode: "edit", data: c })}
              onClone={() => {
                const { id, revenue, ordersCount, usesCount, ...rest } = c;
                setPanelData({ mode: "new", data: { ...rest, name: `${c.name} (copia)`, status: "draft" } });
              }}
              onToggle={() => handleToggle(c.id)}
              onDelete={() => setDeleteTarget({ id: c.id, name: c.name })}
            />
          ))}
          {/* Quick add card */}
          <button
            onClick={() => setPanelData({ mode: "new", data: { ...emptyForm } })}
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors min-h-40"
          >
            <Plus className="w-5 h-5" strokeWidth={1.5} />
            <p className="text-xs">Nueva campaña</p>
          </button>
        </div>
      )}

      {/* Panels */}
      {panelData && (
        <CampaignPanel
          initial={panelData.mode === "edit" ? panelData.data : panelData.data}
          onSave={handleSave}
          onClose={() => setPanelData(null)}
          otherCampaigns={campaigns.filter(c => c.id !== (panelData.data as Campaign).id)}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          name={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}