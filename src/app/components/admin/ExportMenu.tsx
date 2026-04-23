import { useState, useRef, useEffect } from "react";
import { Download, FileText, Table2, ChevronDown, Loader2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface ExportMenuProps {
  onCsv:   () => void;
  onPdf:   () => Promise<void>;
  /** Label of section currently being captured, shown during PDF export */
  disabled?: boolean;
}

export function ExportMenu({ onCsv, onPdf, disabled }: ExportMenuProps) {
  const { t } = useLanguage();
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState<"csv" | "pdf" | null>(null);
  const [progress, setProgress]   = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleCsv() {
    setOpen(false);
    setLoading("csv");
    setProgress("Generando CSV…");
    try {
      onCsv();
    } finally {
      // CSV is synchronous-ish; wait a tick before clearing
      setTimeout(() => { setLoading(null); setProgress(""); }, 1200);
    }
  }

  async function handlePdf() {
    setOpen(false);
    setLoading("pdf");
    setProgress("Preparando PDF…");
    try {
      await onPdf();
    } finally {
      setLoading(null);
      setProgress("");
    }
  }

  const busy = loading !== null || disabled;

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => !busy && setOpen(v => !v)}
        disabled={!!busy}
        className="flex items-center gap-1.5 h-7 px-3 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
        ) : (
          <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
        )}
        <span className="max-w-[120px] truncate">
          {loading ? progress : t("admin.dash.exportBtn")}
        </span>
        {!loading && (
          <ChevronDown
            className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={1.5}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && !busy && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* CSV option */}
          <button
            onClick={handleCsv}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-7 h-7 bg-green-50 border border-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Table2 className="w-3.5 h-3.5 text-green-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs text-gray-800">{t("admin.dash.exportBtn")} CSV</p>
              <p className="text-[11px] text-gray-400">Datos tabulares · Excel compatible</p>
            </div>
          </button>

          <div className="border-t border-gray-50 mx-3" />

          {/* PDF option */}
          <button
            onClick={handlePdf}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-7 h-7 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs text-gray-800">{t("admin.dash.exportBtn")} PDF</p>
              <p className="text-[11px] text-gray-400">Incluye gráficos · Listo para imprimir</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
