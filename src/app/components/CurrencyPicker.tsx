/**
 * CurrencyPicker — Dropdown to select the store's display currency.
 *
 * Shows only the currencies marked as active in the admin panel.
 * Selecting a currency persists the choice and reloads the page so
 * backend prices are re-fetched with the new X-Currency header.
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

export function CurrencyPicker() {
    const { currency, rates, setCurrencyCode } = useCurrency();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node))
                setOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open]);

    // Focus search when opened
    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 50);
        else setSearch("");
    }, [open]);

    const filtered = useMemo(() => {
        if (!search.trim()) return rates;
        const q = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return rates.filter((r) => {
            const name = r.countryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cName = r.currencyName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return (
                name.includes(q) ||
                cName.includes(q) ||
                r.currencyCode.toLowerCase().includes(q)
            );
        });
    }, [search, rates]);

    const handleSelect = (code: string) => {
        setOpen(false);
        setCurrencyCode(code);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
                title="Cambiar moneda"
            >
                <span className="text-base leading-none">{currency?.flagEmoji ?? "🌐"}</span>
                <span className="text-xs font-medium text-gray-600">
                    {currency?.currencyCode ?? "USD"}
                </span>
                <ChevronDown
                    className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                    strokeWidth={1.5}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-[80] overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar moneda…"
                                className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder-gray-400"
                            />
                            {search && (
                                <button
                                    onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3 h-3" strokeWidth={2} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-64 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">Sin resultados</p>
                        ) : (
                            filtered.map((r) => {
                                const isActive = r.currencyCode === currency?.currencyCode;
                                return (
                                    <button
                                        key={r.currencyCode}
                                        onClick={() => handleSelect(r.currencyCode)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${isActive
                                                ? "bg-gray-50"
                                                : "hover:bg-gray-50"
                                            }`}
                                    >
                                        <span className="text-base leading-none flex-shrink-0">
                                            {r.flagEmoji}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-900 truncate">
                                                {r.countryName}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {r.currencyCode} · {r.currencySymbol}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <Check className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" strokeWidth={2} />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
