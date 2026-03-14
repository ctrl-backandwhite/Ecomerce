import { useState } from "react";
import { Star, Gift, TrendingUp, Users, Pencil, Check, X, Award } from "lucide-react";
import { toast } from "sonner";

const members = [
  { id: "u1", name: "María García",     email: "maria@email.com",  points: 3842, tier: "Gold",     spent: 4820, lastActivity: "13/03/2026" },
  { id: "u2", name: "Carlos López",     email: "carlos@email.com", points: 1920, tier: "Silver",   spent: 2410, lastActivity: "10/03/2026" },
  { id: "u3", name: "Ana Martínez",     email: "ana@email.com",    points: 780,  tier: "Bronze",   spent: 975,  lastActivity: "11/03/2026" },
  { id: "u4", name: "Laura Sánchez",    email: "laura@email.com",  points: 5210, tier: "Platinum", spent: 6520, lastActivity: "13/03/2026" },
  { id: "u5", name: "Juan Pérez",       email: "juan@email.com",   points: 420,  tier: "Bronze",   spent: 530,  lastActivity: "11/03/2026" },
  { id: "u6", name: "Sofía Torres",     email: "sofia@email.com",  points: 2100, tier: "Gold",     spent: 2640, lastActivity: "09/03/2026" },
];

const TIERS = [
  { name: "Bronze",   color: "text-amber-700",    bg: "bg-amber-50",    border: "border-amber-100", minPoints: 0,    perks: "Puntos x1, descuentos básicos" },
  { name: "Silver",   color: "text-gray-600",     bg: "bg-gray-100",    border: "border-gray-200",  minPoints: 1000, perks: "Puntos x1.5, envío gratis +€50" },
  { name: "Gold",     color: "text-yellow-700",   bg: "bg-yellow-50",   border: "border-yellow-100",minPoints: 3000, perks: "Puntos x2, envío gratis, soporte prioritario" },
  { name: "Platinum", color: "text-violet-700",   bg: "bg-violet-50",   border: "border-violet-100",minPoints: 5000, perks: "Puntos x3, todo incluido, acceso anticipado a ofertas" },
];

const TIER_META: Record<string, typeof TIERS[0]> = {};
TIERS.forEach(t => { TIER_META[t.name] = t; });

const rules = [
  { id: "r1", desc: "Compra completada",       points: "1 pto. / €1",   active: true  },
  { id: "r2", desc: "Reseña verificada",        points: "+25 pts",       active: true  },
  { id: "r3", desc: "Primera compra",           points: "+100 pts",      active: true  },
  { id: "r4", desc: "Cumpleaños del cliente",   points: "+50 pts",       active: true  },
  { id: "r5", desc: "Referido registrado",      points: "+150 pts",      active: false },
  { id: "r6", desc: "Suscripción newsletter",   points: "+20 pts",       active: true  },
];

export function AdminLoyalty() {
  const [activeRules, setActiveRules] = useState(rules);
  const [editRate, setEditRate] = useState(false);
  const [rate, setRate] = useState("1");

  const toggleRule = (id: string) => {
    setActiveRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    toast.success("Regla actualizada");
  };

  const totalPoints = members.reduce((s, m) => s + m.points, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Programa de fidelidad</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gestiona niveles, reglas de puntos y miembros</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Miembros activos",   value: members.length,                                    icon: Users    },
          { label: "Puntos en circulación", value: totalPoints.toLocaleString(),                   icon: Star     },
          { label: "Miembros Gold+",     value: members.filter(m => ["Gold","Platinum"].includes(m.tier)).length, icon: Award },
          { label: "Canje estimado",     value: `$${(totalPoints * 0.01).toFixed(0)}`,             icon: Gift     },
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
        {/* Tiers */}
        <div className="space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Niveles de fidelidad</p>
          {TIERS.map(tier => (
            <div key={tier.name} className={`border ${tier.border} rounded-xl p-4 ${tier.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className={`w-4 h-4 ${tier.color}`} strokeWidth={1.5} />
                  <p className={`text-sm ${tier.color}`}>{tier.name}</p>
                </div>
                <span className="text-xs text-gray-500">{tier.minPoints.toLocaleString()}+ pts</span>
              </div>
              <p className="text-xs text-gray-500">{tier.perks}</p>
              <p className="text-xs text-gray-400 mt-1">
                {members.filter(m => m.tier === tier.name).length} miembros
              </p>
            </div>
          ))}
        </div>

        {/* Rules */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Reglas de puntos</p>
            {editRate ? (
              <div className="flex items-center gap-2">
                <input value={rate} onChange={e => setRate(e.target.value)} className="w-16 h-6 px-2 text-xs border border-gray-200 rounded-lg focus:outline-none" />
                <span className="text-xs text-gray-400">pts/€</span>
                <button onClick={() => { setEditRate(false); toast.success("Tasa actualizada"); }} className="w-6 h-6 flex items-center justify-center text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-3 h-3" /></button>
                <button onClick={() => setEditRate(false)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <button onClick={() => setEditRate(true)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                <Pencil className="w-3 h-3" /> Tasa: {rate} pt/€
              </button>
            )}
          </div>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {activeRules.map((r, i) => (
              <div key={r.id} className={`flex items-center justify-between px-4 py-3 ${i !== activeRules.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div>
                  <p className="text-sm text-gray-900">{r.desc}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.points}</p>
                </div>
                <button
                  onClick={() => toggleRule(r.id)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${r.active ? "bg-gray-900" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${r.active ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Members table */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Miembros destacados</p>
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_0.8fr_1fr_1fr_0.9fr] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
            {[
              { label: "Cliente",         cls: "text-left"   },
              { label: "Nivel",           cls: "text-left"   },
              { label: "Puntos",          cls: "text-right"  },
              { label: "Total gastado",   cls: "text-right"  },
              { label: "Último acceso",   cls: "text-center" },
              { label: "Acciones",        cls: "text-right"  },
            ].map(h => (
              <p key={h.label} className={`text-[10px] text-gray-400 uppercase tracking-wider ${h.cls}`}>{h.label}</p>
            ))}
          </div>
          {members.map((m, i) => {
            const tm = TIER_META[m.tier];
            return (
              <div key={m.id} className={`grid grid-cols-[2fr_1fr_0.8fr_1fr_1fr_0.9fr] gap-3 px-4 py-3 items-center ${i !== members.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div>
                  <p className="text-sm text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${tm.bg} ${tm.color}`}>
                  <Award className="w-2.5 h-2.5" strokeWidth={1.5} /> {m.tier}
                </span>
                <p className="text-sm text-gray-900 text-right tabular-nums">{m.points.toLocaleString()}</p>
                <p className="text-sm text-gray-700 text-right tabular-nums">${m.spent.toLocaleString()}</p>
                <p className="text-xs text-gray-400 text-center">{m.lastActivity}</p>
                <div className="flex gap-1 justify-end">
                  <button onClick={() => toast.info(`Ajustar puntos de ${m.name}`)} className="h-6 px-2 text-[11px] text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Ajustar pts
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}