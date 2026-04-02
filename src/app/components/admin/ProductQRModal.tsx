import { useState, useRef, useCallback } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import type { Product } from "../../types/product";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────────────── */
type QRSize = 128 | 192 | 256 | 320;
type QRLevel = "L" | "M" | "Q" | "H";
type QRStyle = "dark" | "light" | "inverted" | "brand";
type URLMode = "store" | "sku" | "barcode" | "custom";

interface ColorScheme { fg: string; bg: string; label: string; preview: string }

const COLOR_SCHEMES: Record<QRStyle, ColorScheme> = {
  dark: { fg: "#111827", bg: "#FFFFFF", label: "Oscuro", preview: "bg-gray-700 border-gray-200" },
  light: { fg: "#374151", bg: "#F9FAFB", label: "Gris suave", preview: "bg-gray-100 border-gray-200" },
  inverted: { fg: "#FFFFFF", bg: "#111827", label: "Invertido", preview: "bg-white border-gray-800 ring-1 ring-gray-800" },
  brand: { fg: "#1D4ED8", bg: "#EFF6FF", label: "Azul NX036", preview: "bg-blue-50 border-blue-200" },
};

const SIZES: { label: string; value: QRSize }[] = [
  { label: "S", value: 128 },
  { label: "M", value: 192 },
  { label: "L", value: 256 },
  { label: "XL", value: 320 },
];

const LEVELS: { label: string; value: QRLevel; hint: string }[] = [
  { label: "L", value: "L", hint: "7% — mínimo" },
  { label: "M", value: "M", hint: "15% — estándar" },
  { label: "Q", value: "Q", hint: "25% — bueno" },
  { label: "H", value: "H", hint: "30% — máximo" },
];

/* ── Helpers ───────────────────────────────────────────────── */
function stockBadge(stock: number) {
  if (stock === 0) return { cls: "bg-red-50 text-red-600", label: "Sin stock" };
  if (stock < 10) return { cls: "bg-amber-50 text-amber-600", label: `Stock bajo (${stock})` };
  return { cls: "bg-green-50 text-green-700", label: `En stock (${stock})` };
}

/* ── Modal ─────────────────────────────────────────────────── */
export function ProductQRModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const base = typeof window !== "undefined" ? window.location.origin : "https://nx036.com";

  /* ── State ── */
  const [urlMode, setUrlMode] = useState<URLMode>("store");
  const [customUrl, setCustomUrl] = useState("");
  const [qrSize, setQrSize] = useState<QRSize>(256);
  const [qrStyle, setQrStyle] = useState<QRStyle>("dark");
  const [qrLevel, setQrLevel] = useState<QRLevel>("M");
  const [copied, setCopied] = useState(false);
  const [logoOn, setLogoOn] = useState(false);
  const [margin, setMargin] = useState(true);

  const svgContainerRef = useRef<HTMLDivElement>(null);

  /* ── Computed URL ── */
  const qrValue = (() => {
    if (urlMode === "store") return `${base}/producto/${product.id}`;
    if (urlMode === "sku") return product.sku || `SKU-${product.id}`;
    if (urlMode === "barcode") return product.barcode || `BC-${product.id}`;
    return customUrl.trim() || `${base}/producto/${product.id}`;
  })();

  const scheme = COLOR_SCHEMES[qrStyle];
  const badge = stockBadge(product.stock);

  /* ── Actions ── */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      toast.success("URL copiada al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  }, [qrValue]);

  const handleDownloadPNG = useCallback(() => {
    const canvas = document.querySelector("#qr-canvas-preview canvas") as HTMLCanvasElement;
    if (!canvas) { toast.error("No se pudo generar el PNG"); return; }
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.download = `qr-${product.slug || product.id}.png`;
    a.href = url;
    a.click();
    toast.success("QR descargado como PNG");
  }, [product]);

  const handleDownloadSVG = useCallback(() => {
    const svg = svgContainerRef.current?.querySelector("svg");
    if (!svg) { toast.error("No se pudo generar el SVG"); return; }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `qr-${product.slug || product.id}.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("QR descargado como SVG");
  }, [product]);

  const handlePrint = useCallback(() => {
    const canvas = document.querySelector("#qr-canvas-preview canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "width=400,height=500");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><title>QR – ${product.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, sans-serif; }
  body { display: flex; flex-direction: column; align-items: center; justify-content: center;
         min-height: 100vh; background: #fff; padding: 32px; }
  .name  { font-size: 13px; color: #111; margin-bottom: 4px; text-align:center; }
  .sku   { font-size: 11px; color: #6b7280; margin-bottom: 20px; text-align:center; }
  img    { width: ${qrSize}px; height: ${qrSize}px; }
  .url   { font-size: 9px; color: #9ca3af; margin-top: 14px; word-break: break-all; text-align:center; max-width: 260px; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  <p class="name">${product.name}</p>
  <p class="sku">SKU: ${product.sku || "—"}</p>
  <img src="${dataUrl}" />
  <p class="url">${qrValue}</p>
  <script>window.onload = () => { window.print(); window.close(); }</script>
</body></html>`);
    win.document.close();
  }, [product, qrSize, qrValue]);

  /* ── Shared input style ── */
  const field = "w-full text-xs text-gray-900 border border-gray-200 rounded-lg px-2.5 h-7 focus:outline-none focus:border-gray-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-2xl my-4 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-100 overflow-hidden flex-shrink-0 mt-0.5">
              {product.image
                ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-gray-300" strokeWidth={1.5} /></div>
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <QrCode className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                <h2 className="text-sm text-gray-900 truncate">Código QR — {product.name}</h2>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {product.sku && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded px-2 py-0.5">
                    <Tag className="w-2.5 h-2.5" strokeWidth={1.5} />
                    {product.sku}
                  </span>
                )}
                <span className={`inline-flex items-center text-[10px] rounded px-2 py-0.5 ${badge.cls}`}>
                  {badge.label}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded px-2 py-0.5">
                  <Layers className="w-2.5 h-2.5" strokeWidth={1.5} />
                  {product.category}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="grid sm:grid-cols-[auto_1fr] gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

          {/* Left: QR preview */}
          <div className="flex flex-col items-center justify-center px-8 py-8 bg-gray-50/50 gap-4">
            {/* Canvas for display + download PNG */}
            <div
              id="qr-canvas-preview"
              className="rounded-xl overflow-hidden shadow-sm border border-gray-200 flex items-center justify-center"
              style={{ backgroundColor: scheme.bg, padding: margin ? 16 : 0 }}
            >
              <QRCodeCanvas
                value={qrValue}
                size={Math.min(qrSize, 220)}
                bgColor={scheme.bg}
                fgColor={scheme.fg}
                level={qrLevel}
                marginSize={0}
                imageSettings={
                  logoOn && product.image
                    ? { src: product.image, width: Math.min(qrSize, 220) * 0.22, height: Math.min(qrSize, 220) * 0.22, excavate: true }
                    : undefined
                }
              />
            </div>

            {/* Hidden SVG for SVG download */}
            <div ref={svgContainerRef} className="hidden" aria-hidden>
              <QRCodeSVG
                value={qrValue}
                size={qrSize}
                bgColor={scheme.bg}
                fgColor={scheme.fg}
                level={qrLevel}
                marginSize={margin ? 2 : 0}
              />
            </div>

            {/* URL display */}
            <p className="text-[10px] text-gray-400 text-center max-w-[220px] break-all leading-relaxed">
              {qrValue}
            </p>

            {/* Size selector chips */}
            <div className="flex items-center gap-1">
              {SIZES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setQrSize(value)}
                  className={`w-8 h-7 text-xs rounded-lg border transition-all ${qrSize === value
                    ? "border-gray-600 bg-gray-600 text-white"
                    : "border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}
                >
                  {label}
                </button>
              ))}
              <span className="text-[10px] text-gray-300 ml-1">{qrSize}px</span>
            </div>
          </div>

          {/* Right: Options */}
          <div className="px-5 py-5 space-y-5">

            {/* URL mode */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2.5">Contenido del QR</p>
              <div className="space-y-1.5">
                {([
                  { value: "store", icon: ExternalLink, label: "URL de la tienda", hint: `/producto/${product.id}` },
                  { value: "sku", icon: Tag, label: "Código SKU", hint: product.sku || "SKU" },
                  { value: "barcode", icon: QrCode, label: "Código de barras", hint: product.barcode || "Barcode" },
                  { value: "custom", icon: Package, label: "URL personalizada", hint: "Introduce una URL" },
                ] as const).map(({ value, icon: Icon, label, hint }) => (
                  <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      onClick={() => setUrlMode(value)}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${urlMode === value ? "border-gray-600 bg-gray-600" : "border-gray-300 group-hover:border-gray-500"
                        }`}
                    >
                      {urlMode === value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-xs text-gray-700 flex-1">{label}</span>
                    <span className="text-[10px] text-gray-300 truncate max-w-[80px]">{hint}</span>
                  </label>
                ))}
              </div>
              {urlMode === "custom" && (
                <input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className={`${field} mt-2`}
                  placeholder="https://..."
                />
              )}
            </div>

            {/* Color scheme */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2.5">Color</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.entries(COLOR_SCHEMES) as [QRStyle, ColorScheme][]).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => setQrStyle(key)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${qrStyle === key
                      ? "border-gray-900 bg-gray-50 text-gray-900"
                      : "border-gray-100 text-gray-500 hover:border-gray-300"
                      }`}
                  >
                    <div className={`w-4 h-4 rounded border flex-shrink-0 ${s.preview}`} />
                    {s.label}
                    {qrStyle === key && <Check className="w-3 h-3 ml-auto text-gray-900" strokeWidth={2} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Error correction */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2.5">Corrección de error</p>
              <div className="flex gap-1">
                {LEVELS.map(({ label, value, hint }) => (
                  <button
                    key={value}
                    onClick={() => setQrLevel(value)}
                    title={hint}
                    className={`flex-1 h-7 text-xs rounded-lg border transition-all ${qrLevel === value
                      ? "border-gray-600 bg-gray-600 text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-300 mt-1">
                {LEVELS.find((l) => l.value === qrLevel)?.hint}
              </p>
            </div>

            {/* Extras */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2.5">Opciones</p>
              <div className="space-y-2">
                {/* Logo overlay */}
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-gray-700">Superponer imagen del producto</span>
                  <div
                    onClick={() => setLogoOn((v) => !v)}
                    className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${logoOn ? "bg-gray-500" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${logoOn ? "left-4" : "left-0.5"}`} />
                  </div>
                </label>
                {/* Margin */}
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-gray-700">Incluir margen alrededor</span>
                  <div
                    onClick={() => setMargin((v) => !v)}
                    className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${margin ? "bg-gray-500" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${margin ? "left-4" : "left-0.5"}`} />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer / Actions ── */}
        <div className="flex items-center gap-2 flex-wrap px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs border rounded-xl px-3.5 py-2 transition-all ${copied
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-white"
              }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
            {copied ? "¡Copiado!" : "Copiar URL"}
          </button>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 rounded-xl px-3.5 py-2 hover:border-gray-400 hover:bg-white transition-all"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            PNG
          </button>

          <button
            onClick={handleDownloadSVG}
            className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 rounded-xl px-3.5 py-2 hover:border-gray-400 hover:bg-white transition-all"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            SVG
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 rounded-xl px-3.5 py-2 hover:border-gray-400 hover:bg-white transition-all"
          >
            <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
            Imprimir
          </button>

          <button
            onClick={onClose}
            className="ml-auto text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-xl px-3.5 py-2 hover:bg-white transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}