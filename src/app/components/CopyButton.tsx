import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyButtonProps {
  /** Value placed on the clipboard. */
  value: string;
  /** Toast text shown after a successful copy. */
  successMessage?: string;
  /** Tooltip on the button (also used as accessible label). */
  title?: string;
  /** Optional extra classes for sizing/colour overrides. */
  className?: string;
}

/**
 * Small icon-only button that copies `value` to the clipboard, flashes a
 * Check icon for feedback and emits a sonner toast. Used next to order /
 * invoice / gift-card identifiers so the buyer can paste them into a
 * support ticket without selecting the text by hand.
 */
export function CopyButton({
  value,
  successMessage = "Copiado",
  title = "Copiar",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(successMessage);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ${className}`.trim()}
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-500" strokeWidth={2} />
      ) : (
        <Copy className="w-3 h-3" strokeWidth={1.5} />
      )}
    </button>
  );
}
