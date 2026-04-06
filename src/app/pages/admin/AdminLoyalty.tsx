import { useState, useEffect, useCallback } from "react";
import { Star, Gift, Pencil, Check, X, Award, Loader2, ShoppingCart, MessageSquare, UserPlus, UserCheck, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logger } from "../../lib/logger";

import {
  type LoyaltyRule as ApiLoyaltyRule,
  type LoyaltyTier as ApiLoyaltyTier,
  type LoyaltyAction,
  type LoyaltyTierPayload,
  type LoyaltyRulePayload,
  loyaltyRepository,
} from "../../repositories/LoyaltyRepository";

/* ── Action i18n + icons ──────────────────────────────────────── */
const ACTION_META: Record<LoyaltyAction, { label: string; icon: typeof Star }> = {
  PURCHASE: { label: "Compra (por cada €)", icon: ShoppingCart },
  REVIEW: { label: "Reseña de producto", icon: MessageSquare },
  REFERRAL: { label: "Referir un amigo", icon: UserPlus },
  REGISTRATION: { label: "Registro de cuenta", icon: UserCheck },
};
const ALL_ACTIONS: LoyaltyAction[] = ["PURCHASE", "REVIEW", "REFERRAL", "REGISTRATION"];

/* ── Tier visual styles (by name) ─────────────────────────────── */
const TIER_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  Bronze: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
  Silver: { color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
  Gold: { color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-100" },
  Platinum: { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-100" },
};
const DEFAULT_STYLE = { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };

function tierStyle(name: string) {
  return TIER_STYLE[name] ?? DEFAULT_STYLE;
}

/* ─── Tier Form Modal ─────────────────────────────────────────── */
function TierFormModal({ tier, open, onClose, onSave }: {
  tier: ApiLoyaltyTier | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: LoyaltyTierPayload, id?: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [minPts, setMinPts] = useState("0");
  const [maxPts, setMaxPts] = useState("999");
  const [mult, setMult] = useState("1.0");
  const [bens, setBens] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tier) {
      setName(tier.name);
      setMinPts(String(tier.minPoints));
      setMaxPts(String(tier.maxPoints));
      setMult(String(tier.multiplier));
      setBens((tier.benefits ?? []).map(b => b.label).join(", "));
    } else {
      setName(""); setMinPts("0"); setMaxPts("999"); setMult("1.0"); setBens("");
    }
  }, [tier, open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      const payload: LoyaltyTierPayload = {
        name: name.trim(),
        minPoints: Number(minPts) || 0,
        maxPoints: Number(maxPts) || 999,
        multiplier: Number(mult) || 1,
        benefits: bens.split(",").map(s => s.trim()).filter(Boolean).map(label => ({ label })),
      };
      await onSave(payload, tier?.id);
      onClose();
    } catch (err) { logger.warn("Suppressed error", err); } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm text-gray-900">{tier ? "Editar nivel" : "Nuevo nivel"}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-gray-400 uppercase tracking-wider">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none" placeholder="ej. Gold" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-wider">Puntos mín.</label>
              <input type="number" value={minPts} onChange={e => setMinPts(e.target.value)} className="mt-1 w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-wider">Puntos máx.</label>
              <input type="number" value={maxPts} onChange={e => setMaxPts(e.target.value)} className="mt-1 w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-gray-400 uppercase tracking-wider">Multiplicador</label>
            <input type="number" step="0.1" value={mult} onChange={e => setMult(e.target.value)} className="mt-1 w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-gray-400 uppercase tracking-wider">Beneficios (separados por coma)</label>
            <input value={bens} onChange={e => setBens(e.target.value)} className="mt-1 w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none" placeholder="Puntos x2, Envío gratis" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 h-9 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 h-9 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? "Guardando…" : tier ? "Actualizar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Rule Form Modal ─────────────────────────────────────────── */
function RuleFormModal({ rule, open, onClose, onSave, existingActions }: {
  rule: ApiLoyaltyRule | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: LoyaltyRulePayload, id?: string) => Promise<void>;
  existingActions: LoyaltyAction[];
}) {
  const [action, setAction] = useState<LoyaltyAction>("PURCHASE");
  const [pts, setPts] = useState("1");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rule) {
      setAction(rule.action);
      setPts(String(rule.pointsPerUnit));
      setActive(rule.active);
    } else {
      const available = ALL_ACTIONS.filter(a => !existingActions.includes(a));
      setAction(available[0] ?? "PURCHASE");
      setPts("1");
      setActive(true);
    }
  }, [rule, open, existingActions]);

  if (!open) return null;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave({ action, pointsPerUnit: Number(pts) || 1, active }, rule?.id);
      onClose();
    } catch (err) { logger.warn("Suppressed error", err); } finally { setSaving(false); }
  };

  const availableActions = rule
    ? ALL_ACTIONS
    : ALL_ACTIONS.filter(a => !existingActions.includes(a));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm text-gray-900">{rule ? "Editar regla" : "Nueva regla"}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-gray-400 uppercase tracking-wider">Acción</label>
            <select
              value={action}
              onChange={e => setAction(e.target.value as LoyaltyAction)}
              disabled={!!rule}
              className="mt-1 w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none disabled:opacity-50 bg-white"
            >
              {availableActions.map(a => (
                <option key={a} value={a}>{ACTION_META[a]?.label ?? a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-gray-400 uppercase tracking-wider">Puntos por unidad</label>
            <input type="number" min="1" value={pts} onChange={e => setPts(e.target.value)} className="mt-1 w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`relative w-9 h-5 rounded-full transition-colors ${active ? "bg-gray-500" : "bg-gray-200"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${active ? "left-4" : "left-0.5"}`} />
            </button>
            <span className="text-sm text-gray-600">{active ? "Activa" : "Inactiva"}</span>
          </label>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 h-9 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 h-9 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? "Guardando…" : rule ? "Actualizar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ────────────────────────────────────── */
function DeleteModal({ open, label, onClose, onConfirm }: {
  open: boolean; label: string; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  if (!open) return null;
  const handleConfirm = async () => {
    setDeleting(true);
    try { await onConfirm(); onClose(); } catch (err) { logger.warn("Suppressed error", err); } finally { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-6 text-center">
        <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm text-gray-900 mb-1">¿Eliminar {label}?</p>
        <p className="text-xs text-gray-400 mb-5">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-9 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleConfirm} disabled={deleting} className="flex-1 h-9 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export function AdminLoyalty() {
  const [tiers, setTiers] = useState<ApiLoyaltyTier[]>([]);
  const [rules, setRules] = useState<ApiLoyaltyRule[]>([]);
  const [loading, setLoading] = useState(true);

  /* modal state */
  const [tierModal, setTierModal] = useState<{ open: boolean; tier: ApiLoyaltyTier | null }>({ open: false, tier: null });
  const [ruleModal, setRuleModal] = useState<{ open: boolean; rule: ApiLoyaltyRule | null }>({ open: false, rule: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; label: string; onConfirm: () => Promise<void> }>({ open: false, label: "", onConfirm: async () => { } });

  /* ── Load data ───────────────────────────────────────────────── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([
        loyaltyRepository.findAllTiers(),
        loyaltyRepository.findAllRules(),
      ]);
      setTiers(t);
      setRules(r);
    } catch {
      toast.error("Error al cargar datos de fidelidad");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Tier CRUD ───────────────────────────────────────────────── */
  const saveTier = async (data: LoyaltyTierPayload, id?: string) => {
    try {
      if (id) {
        const updated = await loyaltyRepository.updateTier(id, data);
        setTiers(prev => prev.map(t => t.id === id ? updated : t));
        toast.success("Nivel actualizado");
      } else {
        const created = await loyaltyRepository.createTier(data);
        setTiers(prev => [...prev, created]);
        toast.success("Nivel creado");
      }
    } catch {
      toast.error(id ? "Error al actualizar nivel" : "Error al crear nivel");
      throw new Error();
    }
  };

  const confirmDeleteTier = (tier: ApiLoyaltyTier) => {
    setDeleteModal({
      open: true,
      label: `el nivel "${tier.name}"`,
      onConfirm: async () => {
        try {
          await loyaltyRepository.deleteTier(tier.id);
          setTiers(prev => prev.filter(t => t.id !== tier.id));
          toast.success("Nivel eliminado");
        } catch {
          toast.error("Error al eliminar nivel");
          throw new Error();
        }
      },
    });
  };

  /* ── Rule CRUD ───────────────────────────────────────────────── */
  const saveRule = async (data: LoyaltyRulePayload, id?: string) => {
    try {
      if (id) {
        const updated = await loyaltyRepository.updateRule(id, data);
        setRules(prev => prev.map(r => r.id === id ? updated : r));
        toast.success("Regla actualizada");
      } else {
        const created = await loyaltyRepository.createRule(data);
        setRules(prev => [...prev, created]);
        toast.success("Regla creada");
      }
    } catch {
      toast.error(id ? "Error al actualizar regla" : "Error al crear regla");
      throw new Error();
    }
  };

  const toggleRule = async (rule: ApiLoyaltyRule) => {
    try {
      await loyaltyRepository.updateRule(rule.id, {
        action: rule.action,
        pointsPerUnit: rule.pointsPerUnit,
        active: !rule.active,
      });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
      toast.success("Regla actualizada");
    } catch {
      toast.error("Error al actualizar regla");
    }
  };

  const confirmDeleteRule = (rule: ApiLoyaltyRule) => {
    setDeleteModal({
      open: true,
      label: `la regla "${ACTION_META[rule.action]?.label ?? rule.action}"`,
      onConfirm: async () => {
        try {
          await loyaltyRepository.deleteRule(rule.id);
          setRules(prev => prev.filter(r => r.id !== rule.id));
          toast.success("Regla eliminada");
        } catch {
          toast.error("Error al eliminar regla");
          throw new Error();
        }
      },
    });
  };

  /* ── Stats ───────────────────────────────────────────────────── */
  const totalTiers = tiers.length;
  const activeRulesCount = rules.filter(r => r.active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Modals */}
      <TierFormModal tier={tierModal.tier} open={tierModal.open} onClose={() => setTierModal({ open: false, tier: null })} onSave={saveTier} />
      <RuleFormModal rule={ruleModal.rule} open={ruleModal.open} onClose={() => setRuleModal({ open: false, rule: null })} onSave={saveRule} existingActions={rules.map(r => r.action)} />
      <DeleteModal open={deleteModal.open} label={deleteModal.label} onClose={() => setDeleteModal(p => ({ ...p, open: false }))} onConfirm={deleteModal.onConfirm} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Programa de fidelidad</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gestiona niveles y reglas de puntos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Niveles configurados", value: totalTiers, icon: Award },
          { label: "Reglas activas", value: `${activeRulesCount}/${rules.length}`, icon: Star },
          { label: "Multiplicador máx.", value: tiers.length ? `x${Math.max(...tiers.map(t => t.multiplier))}` : "—", icon: Gift },
          { label: "Puntos mín. top tier", value: tiers.length ? `${tiers[tiers.length - 1].minPoints.toLocaleString()} pts` : "—", icon: Star },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <s.icon className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg text-gray-900 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Tiers ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Niveles de fidelidad</p>
            <button
              onClick={() => setTierModal({ open: true, tier: null })}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Plus className="w-3 h-3" /> Añadir
            </button>
          </div>
          {tiers.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
              <Award className="w-6 h-6 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-400">No hay niveles configurados</p>
            </div>
          )}
          {tiers.map(tier => {
            const style = tierStyle(tier.name);
            const perks = (tier.benefits ?? []).map(b => b.label).join(", ");
            return (
              <div key={tier.id} className={`border ${style.border} rounded-xl p-4 ${style.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className={`w-4 h-4 ${style.color}`} strokeWidth={1.5} />
                    <p className={`text-sm font-medium ${style.color}`}>{tier.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 mr-1">
                      {tier.minPoints.toLocaleString()}–{tier.maxPoints.toLocaleString()} pts
                    </span>
                    <button
                      onClick={() => setTierModal({ open: true, tier })}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors"
                    >
                      <Pencil className="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                      onClick={() => confirmDeleteTier(tier)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{perks || "Sin beneficios definidos"}</p>
                  <span className="text-xs text-gray-400">x{tier.multiplier}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Rules ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Reglas de puntos</p>
            <button
              onClick={() => setRuleModal({ open: true, rule: null })}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Plus className="w-3 h-3" /> Añadir
            </button>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {rules.length === 0 && (
              <div className="p-6 text-center">
                <Star className="w-6 h-6 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-gray-400">No hay reglas configuradas</p>
              </div>
            )}
            {rules.map((r, i) => {
              const meta = ACTION_META[r.action] ?? { label: r.action, icon: Star };
              const Icon = meta.icon;
              return (
                <div key={r.id} className={`flex items-center justify-between px-4 py-3 ${i !== rules.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-gray-500" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">{meta.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">+{r.pointsPerUnit} pts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRuleModal({ open: true, rule: r })}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Pencil className="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                      onClick={() => confirmDeleteRule(r)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                    <button
                      onClick={() => toggleRule(r)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${r.active ? "bg-gray-500" : "bg-gray-200"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${r.active ? "left-4" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tier detail table */}
      {tiers.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Detalle de niveles</p>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
              {["Nivel", "Mín. pts", "Máx. pts", "Multiplicador", "Beneficios"].map(h => (
                <p key={h} className="text-[10px] text-gray-400 uppercase tracking-wider">{h}</p>
              ))}
            </div>
            {tiers.map((tier, i) => {
              const style = tierStyle(tier.name);
              return (
                <div key={tier.id} className={`grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-3 px-4 py-3 items-center ${i !== tiers.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <span className={`inline-flex items-center gap-1.5 text-sm ${style.color}`}>
                    <Award className="w-3.5 h-3.5" strokeWidth={1.5} /> {tier.name}
                  </span>
                  <p className="text-sm text-gray-700 tabular-nums">{tier.minPoints.toLocaleString()}</p>
                  <p className="text-sm text-gray-700 tabular-nums">{tier.maxPoints.toLocaleString()}</p>
                  <p className="text-sm text-gray-700 tabular-nums">x{tier.multiplier}</p>
                  <p className="text-xs text-gray-500">{(tier.benefits ?? []).map(b => b.label).join(", ") || "—"}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}