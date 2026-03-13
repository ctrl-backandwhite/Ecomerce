import { useState } from "react";
import { Mail, Users, TrendingUp, Send, X, Download, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  email: string;
  name: string;
  subscribedAt: string;
  status: "active" | "unsubscribed" | "bounced";
  source: "checkout" | "popup" | "footer" | "import";
  tags: string[];
}

const STATUS_META = {
  active:       { label: "Activo",      bg: "bg-green-50",  text: "text-green-700", dot: "bg-green-400"  },
  unsubscribed: { label: "Baja",        bg: "bg-gray-100",  text: "text-gray-500",  dot: "bg-gray-300"   },
  bounced:      { label: "Bounce",      bg: "bg-red-50",    text: "text-red-600",   dot: "bg-red-400"    },
};

const initSubs: Subscriber[] = [
  { id: "s1", email: "maria@email.com",  name: "María García",    subscribedAt: "01/03/2026", status: "active",       source: "popup",    tags: ["cliente","vip"]       },
  { id: "s2", email: "juan@email.com",   name: "Juan Pérez",      subscribedAt: "05/03/2026", status: "active",       source: "checkout", tags: ["cliente"]             },
  { id: "s3", email: "ana@email.com",    name: "Ana Martínez",    subscribedAt: "08/03/2026", status: "active",       source: "footer",   tags: ["cliente","newsletter"]},
  { id: "s4", email: "carlos@email.com", name: "Carlos López",    subscribedAt: "10/03/2026", status: "unsubscribed", source: "popup",    tags: []                      },
  { id: "s5", email: "sofia@email.com",  name: "Sofía Torres",    subscribedAt: "11/03/2026", status: "active",       source: "checkout", tags: ["vip"]                 },
  { id: "s6", email: "laura@email.com",  name: "Laura Sánchez",   subscribedAt: "12/03/2026", status: "active",       source: "footer",   tags: ["newsletter"]          },
  { id: "s7", email: "miguel@email.com", name: "Miguel A. Ruiz",  subscribedAt: "12/03/2026", status: "bounced",      source: "import",   tags: []                      },
  { id: "s8", email: "pedro@email.com",  name: "Pedro Rodríguez", subscribedAt: "13/03/2026", status: "active",       source: "popup",    tags: []                      },
];

const SOURCE_LABELS: Record<string, string> = {
  checkout: "Checkout", popup: "Popup web", footer: "Footer", import: "Importación",
};

export function AdminNewsletter() {
  const [subs, setSubs] = useState<Subscriber[]>(initSubs);
  const [statusF, setStatusF] = useState<"all" | Subscriber["status"]>("all");
  const [showCompose, setShowCompose] = useState(false);
  const [campaign, setCampaign] = useState({ subject: "", body: "" });

  const filtered = statusF === "all" ? subs : subs.filter(s => s.status === statusF);
  const activeCount = subs.filter(s => s.status === "active").length;

  const remove = (id: string) => {
    setSubs(prev => prev.filter(s => s.id !== id));
    toast.success("Suscriptor eliminado");
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Newsletter</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gestiona suscriptores y envía campañas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success("CSV exportado")}
            className="flex items-center gap-2 h-8 px-4 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 h-8 px-4 text-xs text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Nueva campaña
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total suscriptores", value: subs.length,                                      icon: Users      },
          { label: "Activos",            value: activeCount,                                       icon: Check      },
          { label: "Bajas",              value: subs.filter(s => s.status === "unsubscribed").length, icon: X      },
          { label: "Tasa de activos",    value: `${Math.round((activeCount / subs.length) * 100)}%`, icon: TrendingUp },
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

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "active", "unsubscribed", "bounced"] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusF(s)}
            className={`h-7 px-3 text-xs rounded-lg transition-colors ${statusF === s ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}
          >
            {s === "all" ? "Todos" : STATUS_META[s].label}
            <span className="ml-1.5 opacity-60">
              {s === "all" ? subs.length : subs.filter(sub => sub.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.7fr_auto] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
          {["Suscriptor", "Email", "Fuente", "Suscrito", "Etiquetas", "Estado", ""].map(h => (
            <p key={h} className="text-[10px] text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>
        {filtered.map((s, i) => {
          const sm = STATUS_META[s.status];
          return (
            <div key={s.id} className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.7fr_auto] gap-3 px-4 py-3 items-center ${i !== filtered.length - 1 ? "border-b border-gray-50" : ""}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 flex-shrink-0">
                  {s.name.slice(0, 1)}
                </div>
                <p className="text-sm text-gray-900">{s.name}</p>
              </div>
              <p className="text-xs text-gray-500 truncate">{s.email}</p>
              <p className="text-xs text-gray-400">{SOURCE_LABELS[s.source]}</p>
              <p className="text-xs text-gray-400">{s.subscribedAt}</p>
              <div className="flex flex-wrap gap-1">
                {s.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${sm.bg} ${sm.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                {sm.label}
              </span>
              <button onClick={() => remove(s.id)} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Compose campaign modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowCompose(false)} />
          <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-sm text-gray-900">Nueva campaña</p>
              <button onClick={() => setShowCompose(false)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Destinatarios</label>
                <select className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none">
                  <option>Todos los activos ({activeCount})</option>
                  <option>Etiqueta: vip</option>
                  <option>Etiqueta: cliente</option>
                  <option>Etiqueta: newsletter</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Asunto *</label>
                <input value={campaign.subject} onChange={e => setCampaign(c => ({ ...c, subject: e.target.value }))}
                  placeholder="Asunto del email…"
                  className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Contenido</label>
                <textarea value={campaign.body} onChange={e => setCampaign(c => ({ ...c, body: e.target.value }))}
                  rows={10} placeholder="Escribe el contenido del email…"
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300 resize-none" />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button onClick={() => { toast.info("Email de prueba enviado"); }}
                className="flex-1 h-8 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Enviar prueba
              </button>
              <button
                onClick={() => {
                  if (!campaign.subject) { toast.error("El asunto es obligatorio"); return; }
                  toast.success(`Campaña enviada a ${activeCount} suscriptores`);
                  setShowCompose(false);
                  setCampaign({ subject: "", body: "" });
                }}
                className="flex-1 h-8 text-xs text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Enviar campaña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
