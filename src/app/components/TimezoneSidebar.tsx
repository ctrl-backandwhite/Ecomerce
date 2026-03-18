/**
 * TimezoneSidebar — Aside panel showing live clocks for all configured countries.
 *
 * Slides in from the right when toggled. Shows the selected country highlighted,
 * plus live time for every country in the list.
 */
import { useEffect, useMemo, useState, useRef } from "react";
import { X, Clock, MapPin, Search } from "lucide-react";
import {
    useTimezone,
    COUNTRY_TIMEZONES,
    formatDate,
    type CountryTimezone,
} from "../context/TimezoneContext";
import { useLanguage } from "../context/LanguageContext";

// ── Live clock for a single timezone ────────────────────────────────────────

function formatTimeForTz(timezone: string): string {
    return new Intl.DateTimeFormat("es", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(new Date());
}

function CountryClockCard({
    tz,
    isSelected,
    onClick,
}: {
    tz: CountryTimezone;
    isSelected: boolean;
    onClick: () => void;
}) {
    const [time, setTime] = useState(() => formatTimeForTz(tz.timezone));
    const [date, setDate] = useState(() => formatDate(tz.timezone));

    useEffect(() => {
        const id = setInterval(() => {
            setTime(formatTimeForTz(tz.timezone));
            setDate(formatDate(tz.timezone));
        }, 1000);
        return () => clearInterval(id);
    }, [tz.timezone]);

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group ${isSelected
                ? "bg-gray-900 text-white shadow-md"
                : "bg-white border border-gray-100 hover:border-gray-300 hover:shadow-sm text-gray-700"
                }`}
        >
            <span className="text-lg flex-shrink-0">{tz.flag}</span>

            <div className="flex-1 min-w-0">
                <p
                    className={`text-xs font-medium truncate ${isSelected ? "text-white" : "text-gray-900"
                        }`}
                >
                    {tz.country}
                </p>
                <p
                    className={`text-[10px] ${isSelected ? "text-gray-300" : "text-gray-400"
                        }`}
                >
                    {tz.utcOffset} · {date}
                </p>
            </div>

            <div className="text-right flex-shrink-0">
                <p
                    className={`text-xs font-mono font-semibold tabular-nums ${isSelected ? "text-white" : "text-gray-900"
                        }`}
                >
                    {time}
                </p>
            </div>

            {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            )}
        </button>
    );
}

// ── Sidebar component ───────────────────────────────────────────────────────

export function TimezoneSidebar() {
    const { selectedCountry, setCountry, isSidebarOpen, closeSidebar } =
        useTimezone();
    const { t } = useLanguage();
    const [search, setSearch] = useState("");
    const searchRef = useRef<HTMLInputElement>(null);

    // Reset search when sidebar closes
    useEffect(() => {
        if (!isSidebarOpen) setSearch("");
        else setTimeout(() => searchRef.current?.focus(), 300);
    }, [isSidebarOpen]);

    // Filtered countries
    const filteredCountries = useMemo(() => {
        if (!search.trim()) return COUNTRY_TIMEZONES;
        const q = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return COUNTRY_TIMEZONES.filter((tz) => {
            const name = tz.country.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return name.includes(q) || tz.code.toLowerCase().includes(q) || tz.timezone.toLowerCase().includes(q);
        });
    }, [search]);

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
                            <Clock className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
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

                {/* Selected Country Banner */}
                <div className="px-5 py-4 bg-white border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        {t("tz.selected")}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{selectedCountry.flag}</span>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {selectedCountry.country}
                            </p>
                            <p className="text-xs text-gray-400">
                                {selectedCountry.timezone} · {selectedCountry.utcOffset}
                            </p>
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
                            placeholder={t("tz.searchPlaceholder")}
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

                {/* Country List */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ maxHeight: "calc(100vh - 260px)" }}>
                    <div className="flex items-center justify-between px-1 mb-3">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            {t("tz.allCountries")}
                        </p>
                        <span className="text-xs text-gray-300">{filteredCountries.length}</span>
                    </div>
                    {filteredCountries.length === 0 ? (
                        <div className="text-center py-8">
                            <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">{t("tz.noResults")}</p>
                        </div>
                    ) : (
                        filteredCountries.map((tz) => (
                            <CountryClockCard
                                key={tz.code}
                                tz={tz}
                                isSelected={tz.code === selectedCountry.code}
                                onClick={() => setCountry(tz.code)}
                            />
                        ))
                    )}
                </div>
            </aside>
        </>
    );
}
