import { useState, useEffect, useMemo } from "react";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import * as CurrencyRateRepository from "../../repositories/CurrencyRateRepository";
import type { CurrencyRate } from "../../types/currency";

export function AdminCurrencyRates() {
    const { t } = useLanguage();
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lastSync, setLastSync] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await CurrencyRateRepository.findAll();
      setRates(data);
      const latest = data
        .filter((r) => r.lastSyncedAt)
        .sort((a, b) => b.lastSyncedAt.localeCompare(a.lastSyncedAt))[0];
      if (latest) setLastSync(latest.lastSyncedAt);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar tasas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await CurrencyRateRepository.sync();
      toast.success(`Sincronización completada: ${result.ratesUpdated} tasas actualizadas`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al sincronizar");
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggle(rate: CurrencyRate) {
    if (rate.currencyCode === "USD") return;
    if (togglingCode) return;
    const prev = rate.active;
    setRates((current) =>
      current.map((r) =>
        r.currencyCode === rate.currencyCode ? { ...r, active: !r.active } : r
      )
    );
    setTogglingCode(rate.currencyCode);
    try {
      await CurrencyRateRepository.toggleActive(rate.currencyCode, !prev);
    } catch (err) {
      setRates((current) =>
        current.map((r) =>
          r.currencyCode === rate.currencyCode ? { ...r, active: prev } : r
        )
      );
      toast.error(err instanceof Error ? err.message : `Error al cambiar ${rate.currencyCode}`);
    } finally {
      setTogglingCode(null);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return rates;
    const q = search.toLowerCase();
    return rates.filter(
      (r) =>
        r.currencyCode.toLowerCase().includes(q) ||
        r.currencyName.toLowerCase().includes(q) ||
        r.countryName.toLowerCase().includes(q)
    );
  }, [rates, search]);

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Monedas</h1>
          {lastSync && (
            <p className="text-xs text-gray-400 mt-0.5">
              Última sincronización: {fmtDate(lastSync)}
            </p>
          )}
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código, nombre o país..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Cargando tasas...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Bandera</th>
                  <th className="px-4 py-3">País</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Símbolo</th>
                  <th className="px-4 py-3">Tasa (vs USD)</th>
                  <th className="px-4 py-3">Timezone</th>
                  <th className="px-4 py-3">Activa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      No se encontraron resultados
                    </td>
                  </tr>
                )}
                {filtered.map((rate) => (
                  <tr key={rate.currencyCode} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-lg">{rate.flagEmoji || "🏳"}</td>
                    <td className="px-4 py-3 text-gray-700">{rate.countryName || "—"}</td>
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">
                      {rate.currencyCode}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{rate.currencySymbol || "—"}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {rate.rate != null ? rate.rate.toFixed(6) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{rate.timezone || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(rate)}
                        disabled={rate.currencyCode === "USD" || togglingCode === rate.currencyCode}
                        title={rate.currencyCode === "USD" ? "USD siempre activo" : undefined}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                          rate.active ? "bg-gray-900" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            rate.active ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
