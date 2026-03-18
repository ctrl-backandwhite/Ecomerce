/**
 * LanguageContext — Manages the current locale for the app.
 *
 * Supports: es (Español), en (English), pt (Português).
 * Persists the user choice in localStorage.
 */
import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
export type Locale = "es" | "en" | "pt";

export interface LocaleOption {
    code: Locale;
    label: string;
    flag: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "pt", label: "Português", flag: "🇧🇷" },
];

// ── Translation dictionary ──────────────────────────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
    es: {
        "search.placeholder": "Buscar productos...",
        "nav.favorites": "Favoritos",
        "nav.cart": "Carrito",
        "nav.profile": "Mi Perfil",
        "nav.profile.desc": "Datos, pedidos y favoritos",
        "nav.admin": "Panel de Administración",
        "nav.admin.desc": "Gestiona productos y órdenes",
        "nav.admin.short": "Administrar Tienda",
        "nav.logout": "Cerrar Sesión",
        "nav.store": "Tu tienda",
        "nav.store.active": "Activa",
        "nav.member": "Miembro NEXA",
        "menu.products": "Productos",
        "menu.giftcards": "Tarjetas Regalo",
        "menu.about": "Nosotros",
        "menu.contact": "Contacto",
        "tz.title": "Horario Mundial",
        "tz.subtitle": "Hora local por país",
        "tz.selected": "País seleccionado",
        "tz.allCountries": "Todos los países",
        "tz.tooltip": "Horario por país",
        "tz.searchPlaceholder": "Buscar país...",
        "tz.noResults": "No se encontraron países",
    },
    en: {
        "search.placeholder": "Search products...",
        "nav.favorites": "Favorites",
        "nav.cart": "Cart",
        "nav.profile": "My Profile",
        "nav.profile.desc": "Data, orders and favorites",
        "nav.admin": "Admin Panel",
        "nav.admin.desc": "Manage products and orders",
        "nav.admin.short": "Manage Store",
        "nav.logout": "Log Out",
        "nav.store": "Your store",
        "nav.store.active": "Active",
        "nav.member": "NEXA Member",
        "menu.products": "Products",
        "menu.giftcards": "Gift Cards",
        "menu.about": "About Us",
        "menu.contact": "Contact",
        "tz.title": "World Clock",
        "tz.subtitle": "Local time per country",
        "tz.selected": "Selected country",
        "tz.allCountries": "All countries",
        "tz.tooltip": "Country timezones",
        "tz.searchPlaceholder": "Search country...",
        "tz.noResults": "No countries found",
    },
    pt: {
        "search.placeholder": "Buscar produtos...",
        "nav.favorites": "Favoritos",
        "nav.cart": "Carrinho",
        "nav.profile": "Meu Perfil",
        "nav.profile.desc": "Dados, pedidos e favoritos",
        "nav.admin": "Painel de Administração",
        "nav.admin.desc": "Gerencie produtos e pedidos",
        "nav.admin.short": "Gerenciar Loja",
        "nav.logout": "Sair",
        "nav.store": "Sua loja",
        "nav.store.active": "Ativa",
        "nav.member": "Membro NEXA",
        "menu.products": "Produtos",
        "menu.giftcards": "Cartões Presente",
        "menu.about": "Sobre Nós",
        "menu.contact": "Contato",
        "tz.title": "Horário Mundial",
        "tz.subtitle": "Hora local por país",
        "tz.selected": "País selecionado",
        "tz.allCountries": "Todos os países",
        "tz.tooltip": "Fusos horários",
        "tz.searchPlaceholder": "Buscar país...",
        "tz.noResults": "Nenhum país encontrado",
    },
};

// ── Context ─────────────────────────────────────────────────────────────────
interface LanguageContextType {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: (key: string) => string;
    currentOption: LocaleOption;
}

// Persist the context ref on globalThis so Vite HMR doesn't recreate it,
// which would break every useLanguage() consumer on hot-reload.
declare global {
    // eslint-disable-next-line no-var
    var __NEXA_LanguageContext: ReturnType<typeof createContext<LanguageContextType | null>> | undefined;
}

const LanguageContext: React.Context<LanguageContextType | null> =
    globalThis.__NEXA_LanguageContext ??
    (globalThis.__NEXA_LanguageContext = createContext<LanguageContextType | null>(null));

function getInitialLocale(): Locale {
    try {
        const stored = localStorage.getItem("nexa-locale");
        if (stored && ["es", "en", "pt"].includes(stored)) return stored as Locale;
    } catch {
        /* SSR / privacy mode */
    }
    return "es";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        try { localStorage.setItem("nexa-locale", l); } catch { /* noop */ }
    }, []);

    const t = useCallback(
        (key: string) => translations[locale]?.[key] ?? translations.es[key] ?? key,
        [locale],
    );

    const currentOption = LOCALE_OPTIONS.find((o) => o.code === locale) ?? LOCALE_OPTIONS[0];

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t, currentOption }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
    return ctx;
}
