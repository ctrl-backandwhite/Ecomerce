import { useState, useEffect, useCallback } from "react";
import { Search, Pencil, Check, X, TrendingUp, Globe, Link2 } from "lucide-react";
import { toast } from "sonner";
import { type SeoPage as ApiSeoPage, type SeoPagePayload, seoPageRepository } from "../../repositories/CmsRepository";

interface SEOEntry {
  id: string;
  page: string;
  url: string;
  title: string;
  description: string;
  score: number;
  indexed: boolean;
}

// Removed: data is now loaded from the API.

function mapApiToUi(s: ApiSeoPage): SEOEntry {
  const label = s.path === "/" ? "Inicio" : s.path.replace(/^\//, "").replace(/\/.*$/, "").replace(/-/g, " ");
  return {
    id: s.id,
    page: label.charAt(0).toUpperCase() + label.slice(1) || s.path,
    url: s.path,
    title: s.title,
    description: s.description,
    score: 70,
    indexed: true,
  };
}

function uiToPayload(e: SEOEntry): SeoPagePayload {
  return {
    path: e.url,
    title: e.title,
    description: e.description,
  };
}

const scoreColor = (s: number) =>
  s >= 80 ? "text-green-600 bg-green-50" :
    s >= 60 ? "text-amber-600 bg-amber-50" :
      "text-red-600 bg-red-50";

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${score >= 80 ? "bg-green-400" : score >= 60 ? "bg-amber-400" : "bg-red-400"}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

export function AdminSEO() {
  const [entries, setEntries] = useState<SEOEntry[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SEOEntry>>({});
  const [search, setSearch] = useState("");

  const loadEntries = useCallback(async () => {
    try {
      const data = await seoPageRepository.findAll();
      setEntries(data.map(mapApiToUi));
    } catch {
      toast.error("Error al cargar páginas SEO");
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const filtered = entries.filter(e =>
    !search ||
    e.page.toLowerCase().includes(search.toLowerCase()) ||
    e.url.includes(search.toLowerCase())
  );

  const startEdit = (e: SEOEntry) => {
    setEditing(e.id);
    setEditData({ title: e.title, description: e.description });
  };

  const saveEdit = async (id: string) => {
    try {
      const current = entries.find(e => e.id === id);
      if (!current) return;
      const updated = { ...current, ...editData };
      await seoPageRepository.update(id, uiToPayload(updated));
      setEntries(prev => prev.map(e => e.id === id ? updated : e));
      setEditing(null);
      toast.success("Meta datos actualizados");
    } catch {
      toast.error("Error al guardar los meta datos");
    }
  };

  const avg = Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length);

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">SEO & Meta datos</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gestiona títulos, descripciones y visibilidad en buscadores</p>
        </div>
        <button
          onClick={() => toast.info("Sitemap generado")}
          className="flex items-center gap-2 h-8 px-4 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Globe className="w-3.5 h-3.5" strokeWidth={1.5} /> Generar Sitemap
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Puntuación media", value: avg, color: scoreColor(avg) },
          { label: "Páginas indexadas", value: entries.filter(e => e.indexed).length, color: "text-green-600 bg-green-50" },
          { label: "No indexadas", value: entries.filter(e => !e.indexed).length, color: "text-gray-600 bg-gray-50" },
          { label: "A mejorar (<70)", value: entries.filter(e => e.score < 70).length, color: "text-amber-600 bg-amber-50" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
            <p className="text-lg text-gray-900 leading-none tabular-nums">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar página…"
          className="w-full h-7 pl-8 pr-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300"
        />
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {filtered.map(entry => (
          <div key={entry.id} className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-gray-900">{entry.page}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Link2 className="w-3 h-3" strokeWidth={1.5} />
                  <span className="font-mono">{entry.url}</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${entry.indexed ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {entry.indexed ? "Indexada" : "No indexada"}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {editing !== entry.id ? (
                  <button
                    onClick={() => startEdit(entry)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                ) : (
                  <>
                    <button onClick={() => saveEdit(entry.id)} className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => setEditing(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editing === entry.id ? (
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">Meta título</label>
                  <input
                    value={editData.title ?? ""}
                    onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                    className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                  />
                  <p className={`text-[10px] mt-1 ${(editData.title?.length ?? 0) > 60 ? "text-red-500" : "text-gray-400"}`}>
                    {editData.title?.length ?? 0}/60 caracteres
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">Meta descripción</label>
                  <textarea
                    value={editData.description ?? ""}
                    onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 resize-none"
                  />
                  <p className={`text-[10px] mt-1 ${(editData.description?.length ?? 0) > 160 ? "text-red-500" : "text-gray-400"}`}>
                    {editData.description?.length ?? 0}/160 caracteres
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Título</p>
                  <p className="text-xs text-blue-600 truncate">{entry.title}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Descripción</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{entry.description}</p>
                </div>
                <div className="mt-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Puntuación SEO</p>
                  <ScoreBar score={entry.score} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <TrendingUp className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <p className="text-xs text-blue-800 mb-0.5">Consejos SEO</p>
          <p className="text-xs text-blue-700">
            Los títulos deben tener entre 50–60 caracteres. Las meta descripciones entre 120–160 caracteres.
            Usa palabras clave relevantes al principio.
          </p>
        </div>
      </div>

    </div>
  );
}