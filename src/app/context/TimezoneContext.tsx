/**
 * TimezoneContext — Manages timezone/country selection for the app.
 *
 * Provides a list of countries with their IANA timezones, persists the
 * user choice in localStorage, and exposes a live clock hook.
 */
import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from "react";
import { useLanguage } from "./LanguageContext";

// ── Types ────────────────────────────────────────────────────────────────────

export type Locale = "es" | "en" | "pt";

export interface CountryTimezone {
    code: string;
    country: string;
    flag: string;
    timezone: string;
    utcOffset: string;
    locale: Locale;
}

export const COUNTRY_TIMEZONES: CountryTimezone[] = [
    // ── Latinoamérica (habla hispana → es) ─────────────────────────────────
    { code: "MX", country: "México", flag: "🇲🇽", timezone: "America/Mexico_City", utcOffset: "UTC-6", locale: "es" },
    { code: "GT", country: "Guatemala", flag: "🇬🇹", timezone: "America/Guatemala", utcOffset: "UTC-6", locale: "es" },
    { code: "HN", country: "Honduras", flag: "🇭🇳", timezone: "America/Tegucigalpa", utcOffset: "UTC-6", locale: "es" },
    { code: "SV", country: "El Salvador", flag: "🇸🇻", timezone: "America/El_Salvador", utcOffset: "UTC-6", locale: "es" },
    { code: "NI", country: "Nicaragua", flag: "🇳🇮", timezone: "America/Managua", utcOffset: "UTC-6", locale: "es" },
    { code: "CR", country: "Costa Rica", flag: "🇨🇷", timezone: "America/Costa_Rica", utcOffset: "UTC-6", locale: "es" },
    { code: "PA", country: "Panamá", flag: "🇵🇦", timezone: "America/Panama", utcOffset: "UTC-5", locale: "es" },
    { code: "CU", country: "Cuba", flag: "🇨🇺", timezone: "America/Havana", utcOffset: "UTC-5", locale: "es" },
    { code: "HT", country: "Haití", flag: "🇭🇹", timezone: "America/Port-au-Prince", utcOffset: "UTC-5", locale: "es" },
    { code: "DO", country: "Rep. Dominicana", flag: "🇩🇴", timezone: "America/Santo_Domingo", utcOffset: "UTC-4", locale: "es" },
    { code: "CO", country: "Colombia", flag: "🇨🇴", timezone: "America/Bogota", utcOffset: "UTC-5", locale: "es" },
    { code: "VE", country: "Venezuela", flag: "🇻🇪", timezone: "America/Caracas", utcOffset: "UTC-4", locale: "es" },
    { code: "EC", country: "Ecuador", flag: "🇪🇨", timezone: "America/Guayaquil", utcOffset: "UTC-5", locale: "es" },
    { code: "PE", country: "Perú", flag: "🇵🇪", timezone: "America/Lima", utcOffset: "UTC-5", locale: "es" },
    { code: "BO", country: "Bolivia", flag: "🇧🇴", timezone: "America/La_Paz", utcOffset: "UTC-4", locale: "es" },
    { code: "PY", country: "Paraguay", flag: "🇵🇾", timezone: "America/Asuncion", utcOffset: "UTC-4", locale: "es" },
    { code: "UY", country: "Uruguay", flag: "🇺🇾", timezone: "America/Montevideo", utcOffset: "UTC-3", locale: "es" },
    { code: "AR", country: "Argentina", flag: "🇦🇷", timezone: "America/Argentina/Buenos_Aires", utcOffset: "UTC-3", locale: "es" },
    { code: "CL", country: "Chile", flag: "🇨🇱", timezone: "America/Santiago", utcOffset: "UTC-4", locale: "es" },

    // ── Lusófonos → pt ────────────────────────────────────────────────────────
    { code: "BR", country: "Brasil", flag: "🇧🇷", timezone: "America/Sao_Paulo", utcOffset: "UTC-3", locale: "pt" },
    { code: "PT", country: "Portugal", flag: "🇵🇹", timezone: "Europe/Lisbon", utcOffset: "UTC+0", locale: "pt" },

    // ── Unión Europea (hispanohablante → es, resto → en) ─────────────────────
    { code: "ES", country: "España", flag: "🇪🇸", timezone: "Europe/Madrid", utcOffset: "UTC+1", locale: "es" },
    { code: "FR", country: "Francia", flag: "🇫🇷", timezone: "Europe/Paris", utcOffset: "UTC+1", locale: "en" },
    { code: "DE", country: "Alemania", flag: "🇩🇪", timezone: "Europe/Berlin", utcOffset: "UTC+1", locale: "en" },
    { code: "IT", country: "Italia", flag: "🇮🇹", timezone: "Europe/Rome", utcOffset: "UTC+1", locale: "en" },
    { code: "NL", country: "Países Bajos", flag: "🇳🇱", timezone: "Europe/Amsterdam", utcOffset: "UTC+1", locale: "en" },
    { code: "BE", country: "Bélgica", flag: "🇧🇪", timezone: "Europe/Brussels", utcOffset: "UTC+1", locale: "en" },
    { code: "LU", country: "Luxemburgo", flag: "🇱🇺", timezone: "Europe/Luxembourg", utcOffset: "UTC+1", locale: "en" },
    { code: "IE", country: "Irlanda", flag: "🇮🇪", timezone: "Europe/Dublin", utcOffset: "UTC+0", locale: "en" },
    { code: "AT", country: "Austria", flag: "🇦🇹", timezone: "Europe/Vienna", utcOffset: "UTC+1", locale: "en" },
    { code: "DK", country: "Dinamarca", flag: "🇩🇰", timezone: "Europe/Copenhagen", utcOffset: "UTC+1", locale: "en" },
    { code: "SE", country: "Suecia", flag: "🇸🇪", timezone: "Europe/Stockholm", utcOffset: "UTC+1", locale: "en" },
    { code: "FI", country: "Finlandia", flag: "🇫🇮", timezone: "Europe/Helsinki", utcOffset: "UTC+2", locale: "en" },
    { code: "PL", country: "Polonia", flag: "🇵🇱", timezone: "Europe/Warsaw", utcOffset: "UTC+1", locale: "en" },
    { code: "CZ", country: "Chequia", flag: "🇨🇿", timezone: "Europe/Prague", utcOffset: "UTC+1", locale: "en" },
    { code: "SK", country: "Eslovaquia", flag: "🇸🇰", timezone: "Europe/Bratislava", utcOffset: "UTC+1", locale: "en" },
    { code: "HU", country: "Hungría", flag: "🇭🇺", timezone: "Europe/Budapest", utcOffset: "UTC+1", locale: "en" },
    { code: "SI", country: "Eslovenia", flag: "🇸🇮", timezone: "Europe/Ljubljana", utcOffset: "UTC+1", locale: "en" },
    { code: "HR", country: "Croacia", flag: "🇭🇷", timezone: "Europe/Zagreb", utcOffset: "UTC+1", locale: "en" },
    { code: "RO", country: "Rumanía", flag: "🇷🇴", timezone: "Europe/Bucharest", utcOffset: "UTC+2", locale: "en" },
    { code: "BG", country: "Bulgaria", flag: "🇧🇬", timezone: "Europe/Sofia", utcOffset: "UTC+2", locale: "en" },
    { code: "GR", country: "Grecia", flag: "🇬🇷", timezone: "Europe/Athens", utcOffset: "UTC+2", locale: "en" },
    { code: "CY", country: "Chipre", flag: "🇨🇾", timezone: "Asia/Nicosia", utcOffset: "UTC+2", locale: "en" },
    { code: "MT", country: "Malta", flag: "🇲🇹", timezone: "Europe/Malta", utcOffset: "UTC+1", locale: "en" },
    { code: "EE", country: "Estonia", flag: "🇪🇪", timezone: "Europe/Tallinn", utcOffset: "UTC+2", locale: "en" },
    { code: "LV", country: "Letonia", flag: "🇱🇻", timezone: "Europe/Riga", utcOffset: "UTC+2", locale: "en" },
    { code: "LT", country: "Lituania", flag: "🇱🇹", timezone: "Europe/Vilnius", utcOffset: "UTC+2", locale: "en" },

    // ── Otros → en ───────────────────────────────────────────────────────────
    { code: "US", country: "Estados Unidos", flag: "🇺🇸", timezone: "America/New_York", utcOffset: "UTC-5", locale: "en" },
    { code: "GB", country: "Reino Unido", flag: "🇬🇧", timezone: "Europe/London", utcOffset: "UTC+0", locale: "en" },
    { code: "JP", country: "Japón", flag: "🇯🇵", timezone: "Asia/Tokyo", utcOffset: "UTC+9", locale: "en" },
];

// ── Context ─────────────────────────────────────────────────────────────────

interface TimezoneContextType {
    selectedCountry: CountryTimezone;
    setCountry: (code: string) => void;
    countries: CountryTimezone[];
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
}

const TimezoneContext = createContext<TimezoneContextType | null>(null);

function getInitialCountry(): string {
    try {
        const stored = localStorage.getItem("nexa-timezone-country");
        if (stored && COUNTRY_TIMEZONES.find((c) => c.code === stored)) return stored;
    } catch {
        /* SSR / privacy */
    }
    return "ES";
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
    const { setLocale } = useLanguage();
    const [countryCode, setCountryCode] = useState<string>(getInitialCountry);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const setCountry = useCallback((code: string) => {
        setCountryCode(code);
        // Auto-switch UI language based on the selected country
        const country = COUNTRY_TIMEZONES.find((c) => c.code === code);
        if (country) setLocale(country.locale);
        try {
            localStorage.setItem("nexa-timezone-country", code);
        } catch {
            /* noop */
        }
    }, [setLocale]);

    // Sync locale with the stored country on first mount
    useEffect(() => {
        const country = COUNTRY_TIMEZONES.find((c) => c.code === countryCode);
        if (country) setLocale(country.locale);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // only on mount

    const toggleSidebar = useCallback(() => setIsSidebarOpen((v) => !v), []);
    const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

    const selectedCountry =
        COUNTRY_TIMEZONES.find((c) => c.code === countryCode) ?? COUNTRY_TIMEZONES[0];

    return (
        <TimezoneContext.Provider
            value={{
                selectedCountry,
                setCountry,
                countries: COUNTRY_TIMEZONES,
                isSidebarOpen,
                toggleSidebar,
                closeSidebar,
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
