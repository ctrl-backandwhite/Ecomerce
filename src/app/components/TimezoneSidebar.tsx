/**
 * TimezoneSidebar — Aside panel for selecting the store's display currency.
 *
 * Slides in from the right when toggled. Shows active currencies from the admin,
 * and selecting one also sets the associated country (language, timezone).
 */
import { useEffect, useMemo, useState, useRef } from "react";
import { X, MapPin, Search, Coins, Check } from "lucide-react";
import { useTimezone } from "../context/TimezoneContext";
import { useLanguage } from "../context/LanguageContext";
import { useCurrency } from "../context/CurrencyContext";

// ── Sidebar component ───────────────────────────────────────────────────────

export function TimezoneSidebar() {
    const { selectedCountry, setCountry, countries, isSidebarOpen, closeSidebar } =
        useTimezone();
    const { t, setLocale } = useLanguage();
    const { currency, rates, setCurrencyCode } = useCurrency();
    const [search, setSearch] = useState("");
    const searchRef = useRef<HTMLInputElement>(null);

    // Reset search when sidebar closes
    useEffect(() => {
        if (!isSidebarOpen) setSearch("");
        else setTimeout(() => searchRef.current?.focus(), 300);
    }, [isSidebarOpen]);

    // Filtered currencies
    const filteredCurrencies = useMemo(() => {
        if (!search.trim()) return rates;
        const q = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return rates.filter((r) => {
            const name = r.countryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cName = r.currencyName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return name.includes(q) || cName.includes(q) || r.currencyCode.toLowerCase().includes(q);
        });
    }, [search, rates]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeSidebar();
        };
        if (isSidebarOpen) {
            document.addEventListener("keydown", handler);
            return () => document.removeEventListener("keydown", handler);
        }
    }, [isSidebarOpen, closeSidebar]);

    const handleCurrencySelect = (code: string) => {
        const rate = rates.find((r) => r.currencyCode === code);
        if (rate && rate.countryCode !== "XX" && countries.some((c) => c.code === rate.countryCode)) {
            setCountry(rate.countryCode);
        }
        // Persist the locale explicitly before setCurrencyCode() triggers a
        // full page reload. Using rate.language avoids relying on the
        // countries list already containing the selected entry.
        if (rate?.language) {
            const nextLocale = rate.language === "es" ? "es" : rate.language === "pt" ? "pt" : "en";
            setLocale(nextLocale);
            try { localStorage.setItem("nexa-locale", nextLocale); } catch { /* ignore */ }
        }
        closeSidebar();
        setCurrencyCode(code);
    };

    return (
        <>
            {/* Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity"
                    onClick={closeSidebar}
                />
            )}

            {/* Aside panel */}
            <aside
                className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-gray-50 border-l border-gray-200 z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Coins className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">
                                {t("tz.title")}
                            </h2>
                            <p className="text-xs text-gray-400">{t("tz.subtitle")}</p>
                        </div>
                    </div>
                    <button
                        onClick={closeSidebar}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Selected Banner */}
                <div className="px-5 py-4 bg-white border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        {t("tz.selected")}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{selectedCountry.flag}</span>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                                {selectedCountry.country}
                            </p>
                            <p className="text-xs text-gray-400">
                                {selectedCountry.timezone} · {selectedCountry.utcOffset}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-gray-700">{currency?.currencyCode ?? "USD"}</p>
                            <p className="text-[10px] text-gray-400">{currency?.currencySymbol ?? "$"}</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="px-4 pt-4 pb-2 bg-gray-50 sticky top-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar moneda…"
                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
                        />
                        {search && (
                            <button
                                onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Currency List */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ maxHeight: "calc(100vh - 280px)" }}>
                    <div className="flex items-center justify-between px-1 mb-3">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Monedas activas
                        </p>
                        <span className="text-xs text-gray-300">{filteredCurrencies.length}</span>
                    </div>
                    {filteredCurrencies.length === 0 ? (
                        <div className="text-center py-8">
                            <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Sin resultados</p>
                        </div>
                    ) : (
                        filteredCurrencies.map((r) => {
                            const isActive = r.currencyCode === currency?.currencyCode;
                            return (
                                <button
                                    key={r.currencyCode}
                                    onClick={() => handleCurrencySelect(r.currencyCode)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group ${isActive
                                        ? "bg-gray-900 text-white shadow-md"
                                        : "bg-white border border-gray-100 hover:border-gray-300 hover:shadow-sm text-gray-700"
                                        }`}
                                >
                                    <span className="text-lg flex-shrink-0">{r.flagEmoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-medium truncate ${isActive ? "text-white" : "text-gray-900"}`}>
                                            {r.countryName}
                                        </p>
                                        <p className={`text-[10px] ${isActive ? "text-gray-300" : "text-gray-400"}`}>
                                            {r.currencyName} · {r.currencySymbol}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-xs font-mono font-semibold ${isActive ? "text-white" : "text-gray-900"}`}>
                                            {r.currencyCode}
                                        </p>
                                        <p className={`text-[10px] ${isActive ? "text-gray-300" : "text-gray-400"}`}>
                                            {r.rate === 1 ? "Base" : `1 USD = ${r.rate.toFixed(2)}`}
                                        </p>
                                    </div>
                                    {isActive && (
                                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" strokeWidth={2} />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>
        </>
    );
}
