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
     * Format a price that is already in the display currency (no conversion).
     * Backend converts prices via X-Currency header; the frontend only formats.
     * e.g. formatPrice(27.77) → "€27.77" or "$29.99"
     */
    formatPrice: (amount: number) => string;
    /**
     * @deprecated Use formatPrice — all amounts now come pre-converted from backend.
     * Kept temporarily for backward compatibility during migration.
     */
    convertPrice: (amountUsd: number) => number;
    /**
     * @deprecated Alias for formatPrice. Use formatPrice instead.
     * Kept temporarily for backward compatibility during migration.
     */
    formatDirect: (amount: number) => string;
    /**
     * Convert a USD-base amount to the selected currency (number only).
     * Use for prices that are NOT pre-converted by the backend
     * (e.g. shipping rates, coupon fixed amounts, gift-card balances).
     */
    convertFromUsd: (amountUsd: number) => number;
    /**
     * Convert a USD-base amount to the selected currency AND format it.
     * Shorthand for `formatPrice(convertFromUsd(amountUsd))`.
     */
    formatFromUsd: (amountUsd: number) => string;
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

    // Switching currency: emit a global event so hooks that fetch price-
    // bearing data (products, cart, reports, dashboard stats…) can refetch
    // with the new X-Currency header. Falls back to a full reload only if
    // no listener responds within 500 ms — keeps the cart / filters / scroll
    // intact in the common path while guaranteeing the UI never shows
    // stale prices after a switch.
    const setCurrencyCode = useCallback((code: string) => {
        if (code === selectedCode) return;
        storeCurrency(code);
        setSelectedCode(code);
        const evt = new CustomEvent("currency:changed", { detail: { code } });
        // If nobody acknowledges the change, fall back to a reload. An
        // acknowledgement is any window-level listener that calls
        // `event.preventDefault()` — hooks that know how to refetch can opt
        // in by preventing the default.
        let ack = false;
        const ackListener = () => { ack = true; };
        window.addEventListener("currency:ack", ackListener, { once: true });
        window.dispatchEvent(evt);
        setTimeout(() => {
            window.removeEventListener("currency:ack", ackListener);
            if (!ack) {
                // Safety net for components that don't yet listen to the event
                window.location.reload();
            }
        }, 500);
    }, [selectedCode]);

    // Selected rate object
    const currency = useMemo(
        () => rates.find((r) => r.currencyCode === selectedCode) ?? null,
        [rates, selectedCode],
    );

    // Build a BCP-47 locale from the user's language + the currency's country (e.g. "es-CO", "en-US", "pt-BR").
    // This ensures Intl.NumberFormat uses the correct currency symbol, grouping separators,
    // and decimal separators for the selected currency's region.
    const intlLocale = useMemo(() => {
        const lang = locale || "en";
        // Prefer the currency's own country for correct formatting, fall back to timezone country
        const country = currency?.countryCode || selectedCountry?.code || "US";
        return `${lang}-${country}`;
    }, [locale, currency, selectedCountry]);

    const convertPrice = useCallback(
        (amountUsd: number): number => {
            // @deprecated — Backend now converts via X-Currency header.
            // Returns amount as-is (identity function) since prices come pre-converted.
            return amountUsd;
        },
        [],
    );

    /** Currencies that conventionally display without decimal places. */
    const ZERO_DECIMAL_CURRENCIES = useMemo(
        () => new Set(["CLP", "COP", "JPY", "KRW", "VND", "PYG", "HUF", "ISK", "TWD"]),
        [],
    );

    const formatPrice = useCallback(
        (amount: number): string => {
            const code = currency?.currencyCode ?? "USD";
            const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(code);
            try {
                return new Intl.NumberFormat(intlLocale, {
                    style: "currency",
                    currency: code,
                    minimumFractionDigits: isZeroDecimal ? 0 : 2,
                    maximumFractionDigits: isZeroDecimal ? 0 : 2,
                }).format(isZeroDecimal ? Math.round(amount) : amount);
            } catch {
                // Fallback if currency code is invalid for Intl
                const symbol = currency?.currencySymbol ?? "$";
                return isZeroDecimal
                    ? `${symbol}${Math.round(amount).toLocaleString()}`
                    : `${symbol}${amount.toFixed(2)}`;
            }
        },
        [currency, intlLocale, ZERO_DECIMAL_CURRENCIES],
    );

    // @deprecated — alias for formatPrice, kept for backward compat
    const formatDirect = formatPrice;

    /**
     * Convert a USD amount to the selected currency using the exchange rate.
     * For prices NOT pre-converted by the product-catalog backend
     * (shipping rates, coupon/gift-card amounts, freeAbove thresholds, etc.).
     */
    const convertFromUsd = useCallback(
        (amountUsd: number): number => {
            if (!currency || currency.rate === 0) return amountUsd;
            return amountUsd * currency.rate;
        },
        [currency],
    );

    /**
     * Convert a USD amount AND format it in the display currency.
     * Shorthand for `formatPrice(convertFromUsd(amountUsd))`.
     */
    const formatFromUsd = useCallback(
        (amountUsd: number): string => formatPrice(convertFromUsd(amountUsd)),
        [formatPrice, convertFromUsd],
    );

    const value = useMemo<CurrencyContextType>(
        () => ({ currency, rates, setCurrencyCode, formatPrice, convertPrice, formatDirect, convertFromUsd, formatFromUsd, loading }),
        [currency, rates, setCurrencyCode, formatPrice, convertPrice, formatDirect, convertFromUsd, formatFromUsd, loading],
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
