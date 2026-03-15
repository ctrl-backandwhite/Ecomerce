import { useState, useMemo } from "react";
import {
  Search, X, Star, Check, Trash2, Eye, MessageSquare,
  ThumbsUp, ShieldCheck, Clock, XCircle, CheckCircle2,
  AlertTriangle, Filter,
} from "lucide-react";
import { reviews as initialReviews, type Review } from "../../data/reviews";
import { products } from "../../data/products";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────────────── */
type ReviewStatus = "pending" | "approved" | "rejected";

interface ManagedReview extends Review {
  status: ReviewStatus;
  productName: string;
}

/* ── Seed data: assign statuses ────────────────────────────── */
const STATUS_SEED: ReviewStatus[] = [
  "approved","approved","pending","approved","rejected",
  "approved","pending","approved","approved","pending",
  "approved","approved","rejected","pending","approved",
  "approved","approved","pending","approved","approved",
  "rejected","approved","pending","approved",
];

const INITIAL: ManagedReview[] = initialReviews.map((r, i) => {
  const product = products.find(p => p.id === r.productId);
  return {
    ...r,
    status: STATUS_SEED[i % STATUS_SEED.length] as ReviewStatus,
    productName: product?.name ?? r.productId,
  };
});

/* ── Status meta ───────────────────────────────────────────── */
const STATUS_META: Record<ReviewStatus, { label: string; bg: string; text: string; dot: string; icon: typeof Check }> = {
  pending:  { label: "Pendiente",  bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  icon: Clock        },
  approved: { label: "Aprobada",   bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400",  icon: CheckCircle2 },
  rejected: { label: "Rechazada",  bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-400",    icon: XCircle      },
};

/* ── Stars ─────────────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3 h-3 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

/* ── Detail modal ──────────────────────────────────────────── */
function ReviewDetail({
  review, onClose, onApprove, onReject,
}: {
  review: ManagedReview;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const sm = STATUS_META[review.status];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-500 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
            <div>
              <p className="text-sm text-gray-900">Reseña</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{review.productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Author + meta */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${review.avatarColor}`}>
                {review.avatar}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm text-gray-900">{review.author}</p>
                  {review.verified && (
                    <span className="flex items-center gap-0.5 text-[10px] text-green-600">
                      <ShieldCheck className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{review.date}</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full flex-shrink-0 ${sm.bg} ${sm.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
              {sm.label}
            </span>
          </div>

          {/* Rating + title */}
          <div>
            <Stars rating={review.rating} />
            <p className="text-sm text-gray-900 mt-2">{review.title}</p>
          </div>

          {/* Body */}
          <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
            {review.body}
          </p>

          {/* Helpful */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ThumbsUp className="w-3.5 h-3.5" />
            {review.helpful} personas encontraron útil esta reseña
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="h-7 px-3 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">Cerrar</button>
          {review.status !== "rejected" && (
            <button onClick={() => { onReject(); onClose(); }} className="h-7 px-3 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Rechazar
            </button>
          )}
          {review.status !== "approved" && (
            <button onClick={() => { onApprove(); onClose(); }} className="h-7 px-3 text-xs text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Aprobar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────── */
export function AdminReviews() {
  const [reviews, setReviews]     = useState<ManagedReview[]>(INITIAL);
  const [search,  setSearch]      = useState("");
  const [statusF, setStatusF]     = useState<"all" | ReviewStatus>("all");
  const [ratingF, setRatingF]     = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");
  const [detail,  setDetail]      = useState<ManagedReview | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reviews.filter(r => {
      if (statusF !== "all" && r.status !== statusF) return false;
      if (ratingF !== "all" && r.rating !== Number(ratingF)) return false;
      if (q && !r.author.toLowerCase().includes(q) &&
          !r.productName.toLowerCase().includes(q) &&
          !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [reviews, search, statusF, ratingF]);

  const stats = useMemo(() => ({
    total:    reviews.length,
    pending:  reviews.filter(r => r.status === "pending").length,
    approved: reviews.filter(r => r.status === "approved").length,
    avgRating: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
  }), [reviews]);

  function setStatus(id: string, status: ReviewStatus) {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    const labels = { approved: "Reseña aprobada", rejected: "Reseña rechazada", pending: "Reseña marcada como pendiente" };
    toast.success(labels[status]);
  }

  function handleDelete(id: string) {
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success("Reseña eliminada");
    setDeleteId(null);
  }

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-gray-900">Reseñas</h1>
          <p className="text-xs text-gray-400 mt-0.5">{reviews.length} reseñas en total</p>
        </div>
        {stats.pending > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            {stats.pending} pendiente{stats.pending !== 1 ? "s" : ""} de revisión
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total reseñas",  value: stats.total,    color: "text-gray-700",   icon: MessageSquare },
          { label: "Pendientes",     value: stats.pending,  color: "text-amber-600",  icon: Clock        },
          { label: "Aprobadas",      value: stats.approved, color: "text-green-600",  icon: CheckCircle2 },
          { label: "Valoración media", value: stats.avgRating, color: "text-amber-500", icon: Star       },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              <s.icon className={`w-4 h-4 ${s.color}`} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-lg text-gray-900 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
          <input
            className="w-full h-7 pl-8 pr-7 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300"
            placeholder="Buscar por autor, producto o título…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600"><X className="w-3 h-3" /></button>}
        </div>
        <select value={statusF} onChange={e => setStatusF(e.target.value as any)}
          className="h-7 px-2.5 text-xs text-gray-600 border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
        <select value={ratingF} onChange={e => setRatingF(e.target.value as any)}
          className="h-7 px-2.5 text-xs text-gray-600 border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="all">Todas las valoraciones</option>
          {[5,4,3,2,1].map(n => <option key={n} value={String(n)}>{n} ★</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-1">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="grid grid-cols-[2fr_1.5fr_0.8fr_0.8fr_0.8fr_0.8fr_96px] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
          {[
            { label: "Reseña",     cls: "text-left"   },
            { label: "Producto",   cls: "text-left"   },
            { label: "Valoración", cls: "text-center" },
            { label: "Fecha",      cls: "text-center" },
            { label: "Útil",       cls: "text-right"  },
            { label: "Estado",     cls: "text-left"   },
            { label: "",           cls: "text-right"  },
          ].map(h => (
            <p key={h.label} className={`text-[10px] text-gray-400 uppercase tracking-wider ${h.cls}`}>{h.label}</p>
          ))}
        </div>

        <div className="overflow-auto flex-1">
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No se encontraron reseñas</p>
            </div>
          )}

          {filtered.map((r, i) => {
            const sm = STATUS_META[r.status];
            return (
              <div key={r.id}
                className={`grid grid-cols-[2fr_1.5fr_0.8fr_0.8fr_0.8fr_0.8fr_96px] gap-3 px-4 py-3 items-center hover:bg-gray-50/60 transition-colors ${i !== filtered.length - 1 ? "border-b border-gray-50" : ""}`}
              >
                {/* Reseña: autor + título */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${r.avatarColor}`}>{r.avatar}</div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-900 truncate">{r.author}</p>
                      <p className="text-[11px] text-gray-400 truncate">{r.title}</p>
                    </div>
                  </div>
                </div>
                {/* Producto */}
                <p className="text-xs text-gray-500 truncate text-left">{r.productName}</p>
                {/* Valoración */}
                <div className="flex justify-center"><Stars rating={r.rating} /></div>
                {/* Fecha */}
                <p className="text-xs text-gray-400 text-center tabular-nums">
                  {new Date(r.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                </p>
                {/* Útil */}
                <p className="text-xs text-gray-400 text-right tabular-nums">{r.helpful}</p>
                {/* Estado */}
                <div className="flex items-center">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full ${sm.bg} ${sm.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                    {sm.label}
                  </span>
                </div>
                {/* Acciones */}
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => setDetail(r)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Ver detalle">
                    <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  {r.status !== "approved" && (
                    <button onClick={() => setStatus(r.id, "approved")} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Aprobar">
                      <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button onClick={() => setStatus(r.id, "rejected")} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Rechazar">
                      <XCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  )}
                  <button onClick={() => setDeleteId(r.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <ReviewDetail
          review={detail}
          onClose={() => setDetail(null)}
          onApprove={() => setStatus(detail.id, "approved")}
          onReject={() => setStatus(detail.id, "rejected")}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-sm text-gray-900 mb-1">¿Eliminar reseña?</p>
            <p className="text-xs text-gray-400 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteId(null)} className="h-7 px-4 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="h-7 px-4 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}