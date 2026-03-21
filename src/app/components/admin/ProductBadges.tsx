import { Loader2 } from "lucide-react";

export function stockVariant(stock: number): "green" | "amber" | "red" {
  if (stock > 20) return "green";
  if (stock > 5) return "amber";
  return "red";
}

export function Badge({ label, variant }: { label: string; variant: "green" | "amber" | "red" | "gray" }) {
  const cls = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-gray-100 text-gray-500",
  }[variant];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export function StatusBadge({
  status,
  onClick,
  loading: toggling,
}: {
  status: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  const isPublished = status === "PUBLISHED";
  const clickable = !!onClick;
  return (
    <span
      role={clickable ? "button" : undefined}
      tabIndex={clickable && !toggling ? 0 : undefined}
      aria-disabled={toggling || undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (!toggling) onClick?.();
      }}
      onKeyDown={(e) => {
        if (clickable && !toggling && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`inline-flex items-center justify-center text-[10px] leading-none min-w-[62px] px-2 py-1 rounded-full font-medium transition-all duration-200 ${isPublished
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
        : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
        } ${clickable ? "cursor-pointer hover:ring-2 hover:shadow-sm" : "cursor-default"} ${toggling ? "opacity-50" : ""
        }`}
    >
      {toggling ? (
        <Loader2 className="w-3 h-3 animate-spin mr-1" strokeWidth={1.5} />
      ) : null}
      {isPublished ? "Publicado" : "Borrador"}
    </span>
  );
}
