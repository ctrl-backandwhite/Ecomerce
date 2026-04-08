/**
 * CurrencyContext — Manages multi-currency support for the storefront.
 *
 * Fetches active currency rates from the CMS backend, auto-detects the
 * user's preferred currency from their selected country (TimezoneContext),
 * persists the choice in localStorage, and provides `formatPrice()` /
 * `convertPrice()` helpers for consistent price display.
 */
import {
    createContext, useContext, useState, useCallback,
    useEffect, useMemo, useRef, type ReactNode,
} from "react";
import { useTimezone } from "./TimezoneContext";
import { useLanguage } from "./LanguageContext";
import type { CurrencyRate } from "../types/currency";
import { COUNTRY_CURRENCY_MAP } from "../types/currency";
import * as currencyRepo from "../repositories/CurrencyRateRepository";
import { logger } from "../lib/logger";

// ── Context shape ────────────────────────────────────────────────────────────

interface CurrencyContextType {
    /** Currently selected currency (null while loading) */
    currency: CurrencyRate | null;
    /** All active currencies */
    rates: CurrencyRate[];
    /** Switch to a different currency by code */
    setCurrencyCode: (code: string) => void;
    /**
     * Convert a USD-base amount to the selected currency and format it.
     * e.g. formatPrice(29.99) → "€27.77" or "$29.99"
     */
    formatPrice: (amountUsd: number) => string;
    /**
     * Convert a USD-base amount to the selected currency (number only).
     */
    convertPrice: (amountUsd: number) => number;
    /**
     * Format a value already in the display currency (no USD→X conversion).
     * Use for amounts not stored in USD, e.g. shipping rates.
     */
    formatDirect: (amount: number) => string;
    /** True while rates are being loaded */
    loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

// ── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "nexa-currency";

function getStoredCurrency(): string | null {
    try { return localStorage.getItem(STORAGE_KEY); }
    catch { return null; }
}

function storeCurrency(code: string) {
    try { localStorage.setItem(STORAGE_KEY, code); }
    catch { /* quota or private mode */ }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const { selectedCountry } = useTimezone();
    const { locale } = useLanguage();
    const [rates, setRates] = useState<CurrencyRate[]>([]);
    const [selectedCode, setSelectedCode] = useState<string>(
        () => getStoredCurrency() || "USD",
    );
    const [loading, setLoading] = useState(true);
    /** Tracks whether initial rate load + stored-pref restore is done. */
    const initialRestoreDone = useRef(false);

    // Fetch active rates on mount
    useEffect(() => {
        let cancelled = false;
        currencyRepo.findAll(true)
            .then((data) => { if (!cancelled) setRates(data); })
            .catch((err) => logger.warn("Failed to load currency rates", err))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // On initial load: restore stored preference (once)
    useEffect(() => {
        if (rates.length === 0 || initialRestoreDone.current) return;
        initialRestoreDone.current = true;
        const stored = getStoredCurrency();
        if (stored && rates.some((r) => r.currencyCode === stored)) {
            setSelectedCode(stored);
            return;
        }
        // No valid stored pref — auto-detect from country
        const mapped = COUNTRY_CURRENCY_MAP[selectedCountry.code];
        if (mapped && rates.some((r) => r.currencyCode === mapped)) {
            setSelectedCode(mapped);
            storeCurrency(mapped);
        }
    }, [rates, selectedCountry.code]);

    // When user changes country, always update currency to match
    useEffect(() => {
        if (rates.length === 0 || !initialRestoreDone.current) return;
        const mapped = COUNTRY_CURRENCY_MAP[selectedCountry.code];
        if (mapped && rates.some((r) => r.currencyCode === mapped)) {
            setSelectedCode(mapped);
            storeCurrency(mapped);
        }
    }, [selectedCountry.code, rates]);

    // Set currency code
    const setCurrencyCode = useCallback((code: string) => {
        setSelectedCode(code);
        storeCurrency(code);
    }, []);

    // Selected rate object
    const currency = useMemo(
        () => rates.find((r) => r.currencyCode === selectedCode) ?? null,
        [rates, selectedCode],
    );

    // Locale string for Intl.NumberFormat (e.g. "es", "en", "pt")
    const intlLocale = useMemo(() => {
        if (locale === "es") return "es-ES";
        if (locale === "pt") return "pt-BR";
        return "en-US";
    }, [locale]);

    const convertPrice = useCallback(
        (amountUsd: number): number => {
            if (!currency || currency.rate === 0) return amountUsd;
            return amountUsd * currency.rate;
        },
        [currency],
    );

    const formatPrice = useCallback(
        (amountUsd: number): string => {
            const converted = convertPrice(amountUsd);
            const code = currency?.currencyCode ?? "USD";
            try {
                return new Intl.NumberFormat(intlLocale, {
                    style: "currency",
                    currency: code,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(converted);
            } catch {
                // Fallback if currency code is invalid for Intl
                const symbol = currency?.currencySymbol ?? "$";
                return `${symbol}${converted.toFixed(2)}`;
            }
        },
        [convertPrice, currency, intlLocale],
    );

    const formatDirect = useCallback(
        (amount: number): string => {
            const code = currency?.currencyCode ?? "USD";
            try {
                return new Intl.NumberFormat(intlLocale, {
                    style: "currency",
                    currency: code,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(amount);
            } catch {
                const symbol = currency?.currencySymbol ?? "$";
                return `${symbol}${amount.toFixed(2)}`;
            }
        },
        [currency, intlLocale],
    );

    const value = useMemo<CurrencyContextType>(
        () => ({ currency, rates, setCurrencyCode, formatPrice, convertPrice, formatDirect, loading }),
        [currency, rates, setCurrencyCode, formatPrice, convertPrice, formatDirect, loading],
    );

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCurrency() {
    const ctx = useContext(CurrencyContext);
    if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
    return ctx;
}
