import { Check } from "lucide-react";

/* ── Step badge ──────────────────────────────────────────── */
export function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
    return (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition-colors ${done ? "bg-gray-600 text-white"
            : active ? "bg-gray-600 text-white ring-4 ring-gray-600/10"
                : "bg-gray-100 text-gray-400"
            }`}>
            {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : n}
        </div>
    );
}

/* ── Section card ────────────────────────────────────────── */
export function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm ${className}`}>
            {children}
        </div>
    );
}
