import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Globe, Search, Check, X } from "lucide-react";
import { toast } from "sonner";
import * as currencyRepo from "../../repositories/CurrencyRateRepository";
import type { CurrencyRate } from "../../types/currency";

export function AdminCurrencyRates() {
    const [rates, setRates] = useState<CurrencyRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await currencyRepo.findAll();
            setRates(data);
        } catch {
            toast.error("Error al cargar las tasas de cambio");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const result = await currencyRepo.sync();
            toast.success(`Sincronización completada: ${result.ratesUpdated} tasas actualizadas`);
            await load();
        } catch {
            toast.error("Error al sincronizar desde CurrencyLayer");
        } finally {
            setSyncing(false);
        }
    };

    const handleToggle = async (code: string, current: boolean) => {
        try {
            await currencyRepo.toggleActive(code, !current);
            setRates((prev) =>
                prev.map((r) => r.currencyCode === code ? { ...r, active: !current } : r),
            );
            toast.success(`${code} ${!current ? "activada" : "desactivada"}`);
        } catch {
            toast.error(`Error al cambiar estado de ${code}`);
        }
    };

    const filtered = rates.filter((r) => {
        const q = search.toLowerCase();
        const matchesSearch =
            r.currencyCode.toLowerCase().includes(q) ||
            r.currencyName.toLowerCase().includes(q) ||
            r.countryName.toLowerCase().includes(q);
        const matchesFilter =
            filter === "all" || (filter === "active" ? r.active : !r.active);
        return matchesSearch && matchesFilter;
    });

    const activeCount = rates.filter((r) => r.active).length;

    const FILTERS: { key: typeof filter; label: string }[] = [
        { key: "all", label: "Todas" },
        { key: "active", label: "Activas" },
        { key: "inactive", label: "Inactivas" },
    ];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg text-gray-900 tracking-tight">Tasas de Cambio</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {rates.length} monedas · {activeCount} activas
                    </p>
                </div>
                <button
                    className="inline-flex items-center gap-2 h-8 px-4 text-xs text-white bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    onClick={handleSync}
                    disabled={syncing}
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Sincronizando…" : "Sincronizar"}
                </button>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                    <input
                        type="text"
                        placeholder="Buscar por código, nombre o país…"
                        className="w-full h-8 pl-8 pr-3 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            className={`h-7 px-3 text-[11px] rounded-md transition-colors ${filter === f.key
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                            onClick={() => setFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <Globe className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm text-gray-400">
                        {search ? "Sin resultados para la búsqueda" : "No hay tasas disponibles. Sincroniza desde la API."}
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-5 py-3 text-[10px] text-gray-400 uppercase tracking-widest w-10" />
                                    <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-widest">Moneda</th>
                                    <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-widest">País</th>
                                    <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-widest text-right">Tasa / USD</th>
                                    <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-widest text-center">Idioma</th>
                                    <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-widest text-center">Estado</th>
                                    <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-widest text-right">Última sync</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((r) => (
                                    <tr
                                        key={r.currencyCode}
                                        className="hover:bg-gray-50/60 transition-colors"
                                    >
                                        {/* Flag */}
                                        <td className="px-5 py-2.5 text-lg">{r.flagEmoji}</td>

                                        {/* Code + Name */}
                                        <td className="px-4 py-2.5">
                                            <p className="text-xs text-gray-900 font-medium">{r.currencyCode}</p>
                                            <p className="text-[10px] text-gray-400 leading-snug">{r.currencyName}</p>
                                        </td>

                                        {/* Country */}
                                        <td className="px-4 py-2.5">
                                            <p className="text-xs text-gray-600">{r.countryName}</p>
                                        </td>

                                        {/* Rate */}
                                        <td className="px-4 py-2.5 text-right">
                                            <span className="text-xs text-gray-900 font-mono tabular-nums">
                                                {r.rate.toFixed(4)}
                                            </span>
                                        </td>

                                        {/* Language */}
                                        <td className="px-4 py-2.5 text-center">
                                            <span className="inline-flex text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {r.language}
                                            </span>
                                        </td>

                                        {/* Toggle */}
                                        <td className="px-4 py-2.5 text-center">
                                            <button
                                                onClick={() => handleToggle(r.currencyCode, r.active)}
                                                className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 cursor-pointer ${r.active ? "bg-green-400" : "bg-gray-200"
                                                    }`}
                                                title={r.active ? "Desactivar" : "Activar"}
                                            >
                                                <span
                                                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all flex items-center justify-center ${r.active ? "left-[calc(100%-18px)]" : "left-0.5"
                                                        }`}
                                                >
                                                    {r.active
                                                        ? <Check className="w-2.5 h-2.5 text-green-600" strokeWidth={3} />
                                                        : <X className="w-2.5 h-2.5 text-gray-300" strokeWidth={3} />
                                                    }
                                                </span>
                                            </button>
                                        </td>

                                        {/* Last synced */}
                                        <td className="px-4 py-2.5 text-right">
                                            <span className="text-[10px] text-gray-400">
                                                {r.lastSyncedAt
                                                    ? new Date(r.lastSyncedAt).toLocaleString("es", {
                                                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                                                    })
                                                    : "—"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] text-gray-400">
                            Mostrando {filtered.length} de {rates.length}
                        </p>
                        <p className="text-[10px] text-gray-400">
                            {activeCount} activas · {rates.length - activeCount} inactivas
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
