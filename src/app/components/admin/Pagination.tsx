import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  /** Optional extra content rendered on the right side */
  extra?: React.ReactNode;
}

function getPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) set.add(i);
  const sorted = [...set].sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}

export function Pagination({ page, totalPages, total, pageSize, onChange, extra }: PaginationProps) {
  if (totalPages <= 1 && !extra) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  const pages = getPageRange(page, totalPages);

  return (
    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-4 flex-shrink-0 bg-white">
      {/* Left: count */}
      <span className="text-xs text-gray-400 flex-shrink-0">
        {total === 0 ? "0 resultados" : `${from}–${to} de ${total}`}
      </span>

      {/* Center: page controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-300">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p as number)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors ${
                  page === p
                    ? "bg-gray-600 text-white"
                    : "text-gray-500 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onChange(page + 1)}
            disabled={page === totalPages}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Right: extra slot */}
      {extra && <div className="flex-shrink-0">{extra}</div>}
    </div>
  );
}