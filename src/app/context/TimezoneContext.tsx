/**
 * TimezoneContext — Manages timezone/country selection for the app.
 *
 * Builds the country list dynamically from **active** currency rates
 * fetched from the CMS backend. Only countries whose currency has been
 * activated in the admin panel will appear in the sidebar.
 */
import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    type ReactNode,
} from "react";
import { useLanguage } from "./LanguageContext";
import { logger } from "../lib/logger";
import * as currencyRepo from "../repositories/CurrencyRateRepository";
import type { CurrencyRate } from "../types/currency";

// ── Types ────────────────────────────────────────────────────────────────────

export type Locale = "es" | "en" | "pt";

export interface CountryTimezone {
    code: string;
    country: string;
    flag: string;
    timezone: string;
    utcOffset: string;
    locale: Locale;
    currencyCode: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fallback entry while active rates are loading. */
const FALLBACK_COUNTRY: CountryTimezone = {
    code: "US", country: "Estados Unidos", flag: "🇺🇸",
    timezone: "America/New_York", utcOffset: "UTC-5", locale: "en",
    currencyCode: "USD",
};

/** Compute UTC offset string from an IANA timezone (e.g. "UTC-6"). */
function computeUtcOffset(timezone: string): string {
    try {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            timeZoneName: "shortOffset",
        }).formatToParts(new Date());
        const tz = parts.find((p) => p.type === "timeZoneName");
        return tz?.value?.replace("GMT", "UTC") ?? "UTC";
    } catch {
        return "UTC";
    }
}

/** Get country display name in Spanish via Intl.DisplayNames. */
function countryNameEs(code: string, fallback: string): string {
    try {
        const dn = new Intl.DisplayNames(["es"], { type: "region" });
        return dn.of(code) ?? fallback;
    } catch {
        return fallback;
    }
}

function toLocale(lang: string): Locale {
    if (lang === "es") return "es";
    if (lang === "pt") return "pt";
    return "en";
}

/** Parse "UTC-5" / "UTC+2:30" to a numeric offset for sorting. */
function parseOffset(utc: string): number {
    const m = utc.match(/UTC([+-]\d+(?::\d+)?)?/);
    if (!m || !m[1]) return 0;
    const [h, min] = m[1].split(":");
    return parseInt(h, 10) + (min ? parseInt(min, 10) / 60 : 0);
}

/** Build CountryTimezone[] from active CurrencyRate[], deduplicated by countryCode. */
function buildCountries(rates: CurrencyRate[]): CountryTimezone[] {
    const seen = new Set<string>();
    const result: CountryTimezone[] = [];

    for (const r of rates) {
        if (r.countryCode === "XX" || r.countryName === "N/A" || r.countryName === "Unknown") continue;
        if (seen.has(r.countryCode)) continue;
        seen.add(r.countryCode);

        result.push({
            code: r.countryCode,
            country: countryNameEs(r.countryCode, r.countryName),
            flag: r.flagEmoji,
            timezone: r.timezone,
            utcOffset: computeUtcOffset(r.timezone),
            locale: toLocale(r.language),
            currencyCode: r.currencyCode,
        });
    }

    result.sort((a, b) => parseOffset(a.utcOffset) - parseOffset(b.utcOffset));
    return result;
}

// ── Context ─────────────────────────────────────────────────────────────────

interface TimezoneContextType {
    selectedCountry: CountryTimezone;
    setCountry: (code: string) => void;
    countries: CountryTimezone[];
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    loading: boolean;
}

const TimezoneContext = createContext<TimezoneContextType | null>(null);

function getInitialCountry(): string {
    try {
        const stored = localStorage.getItem("nexa-timezone-country");
        if (stored) return stored;
    } catch (err) { logger.warn("Suppressed error", err); }
    return "US";
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
    const { setLocale } = useLanguage();
    const [countryCode, setCountryCode] = useState<string>(getInitialCountry);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [countries, setCountries] = useState<CountryTimezone[]>([FALLBACK_COUNTRY]);
    const [loading, setLoading] = useState(true);

    // Fetch active currency rates → build country list
    useEffect(() => {
        let cancelled = false;
        currencyRepo.findAll(true)
            .then((rates) => {
                if (cancelled) return;
                const built = buildCountries(rates);
                if (built.length > 0) setCountries(built);
            })
            .catch((err) => logger.warn("Failed to load active currencies for timezone", err))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const selectedCountry = useMemo(
        () => countries.find((c) => c.code === countryCode) ?? countries[0],
        [countries, countryCode],
    );

    const setCountry = useCallback((code: string) => {
        setCountryCode(code);
        const country = countries.find((c) => c.code === code);
        if (country) setLocale(country.locale);
        try { localStorage.setItem("nexa-timezone-country", code); }
        catch (err) { logger.warn("Suppressed error", err); }
    }, [countries, setLocale]);

    // Keep the locale in sync with the selected country: runs after the
    // countries list is populated and again whenever the country changes.
    useEffect(() => {
        if (loading) return;
        const country = countries.find((c) => c.code === countryCode);
        if (country) setLocale(country.locale);
    }, [loading, countryCode, countries, setLocale]);

    const toggleSidebar = useCallback(() => setIsSidebarOpen((v) => !v), []);
    const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

    return (
        <TimezoneContext.Provider
            value={{
                selectedCountry,
                setCountry,
                countries,
                isSidebarOpen,
                toggleSidebar,
                closeSidebar,
                loading,
            }}
        >
            {children}
        </TimezoneContext.Provider>
    );
}

export function useTimezone() {
    const ctx = useContext(TimezoneContext);
    if (!ctx) throw new Error("useTimezone must be used within TimezoneProvider");
    return ctx;
}

// ── Live clock hook ─────────────────────────────────────────────────────────

export function useLiveClock(timezone: string) {
    const [time, setTime] = useState(() => formatTime(timezone));

    useEffect(() => {
        const id = setInterval(() => setTime(formatTime(timezone)), 1000);
        return () => clearInterval(id);
    }, [timezone]);

    return time;
}

function formatTime(timezone: string): string {
    return new Intl.DateTimeFormat("es", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(new Date());
}

export function formatDate(timezone: string): string {
    return new Intl.DateTimeFormat("es", {
        timeZone: timezone,
        weekday: "short",
        day: "numeric",
        month: "short",
    }).format(new Date());
}
