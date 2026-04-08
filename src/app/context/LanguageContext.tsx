/**
 * LanguageContext — Manages the current locale for the app.
 *
 * Supports: es (Español), en (English), pt (Português).
 * Persists the user choice in localStorage.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

import { logger } from "../lib/logger";

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
        "nav.login": "Iniciar Sesión",
        "nav.store": "Tu tienda",
        "nav.store.active": "Activa",
        "nav.member": "Miembro NX036",
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
        // ── Slide fallbacks ──
        "slide.fb1.title": "Descubre los Mejores Productos",
        "slide.fb1.subtitle": "Tecnología de vanguardia",
        "slide.fb1.desc": "Ofertas exclusivas con garantía de satisfacción y envío gratis en tu primera compra.",
        "slide.fb1.badge": "Nuevo",
        "slide.fb1.btn": "Ver Ofertas",
        "slide.fb2.title": "Hasta 50% OFF",
        "slide.fb2.subtitle": "Moda & Tendencias",
        "slide.fb2.desc": "Las últimas tendencias de moda con descuentos increíbles. Stock limitado.",
        "slide.fb2.badge": "Oferta",
        "slide.fb2.btn": "Ver Ofertas de Moda",
        "slide.fb3.title": "Gaming al Siguiente Nivel",
        "slide.fb3.subtitle": "Setups Épicos",
        "slide.fb3.desc": "Consolas, periféricos y accesorios para dominar cada partida.",
        "slide.fb3.badge": "Destacado",
        "slide.fb3.btn": "Explorar Gaming",
        "slide.fb4.title": "Electrónica de Alta Gama",
        "slide.fb4.subtitle": "Innovación sin límites",
        "slide.fb4.desc": "Los mejores smartphones, laptops y gadgets con descuentos especiales para miembros NX036.",
        "slide.fb4.badge": "Exclusivo",
        "slide.fb4.btn": "Ver Electrónica",
        "slide.default.btn": "Ver más",
        "slide.chip.discount": "Con descuento",
        "slide.prev": "Anterior",
        "slide.next": "Siguiente",
        "slide.goTo": "Ir a slide",
        // ── Info banner ──
        "banner.freeShipping": "Envío gratis en compras sobre",
        "banner.freeShipping.amount": "$100",
        "banner.secureBuy": "Compra 100% segura",
        "banner.multiPayment": "Múltiples métodos de pago",
        // ── Gift card ──
        "gift.title": "Tarjetas de regalo NX036",
        "gift.subtitle": "El regalo perfecto — envíalo directo al email de quien quieras",
        "gift.cta": "Regalar ahora",
        // ── Home ──
        "home.filters": "Filtros",
        "home.products": "productos",
        "home.results": "resultados",
        "home.featured": "Destacados",
        "home.priceLow": "Precio: menor a mayor",
        "home.priceHigh": "Precio: mayor a menor",
        "home.topRated": "Mejor valorados",
        "home.nameAZ": "Nombre A–Z",
        "home.all": "Todos",
        "home.allProducts": "Todos los Productos",
        "home.searchResults": "Resultados para",
        "home.dealsFor": "Ofertas ·",
        "home.deals": "Ofertas y Descuentos",
        "home.catalogLive": "Catálogo en vivo",
        "home.demoMode": "Modo demo — datos de muestra",
        "home.errorLoading": "Error al cargar productos",
        "home.retry": "Reintentar",
        "home.noResults": "Sin resultados",
        "home.noResultsHint": "Prueba ajustando los filtros o cambia la búsqueda",
        "home.clearFilters": "Limpiar filtros",
        "home.loadingMore": "Cargando más productos...",
        "home.allLoaded": "Todos los productos cargados",
        // ── Features strip ──
        "features.shipping": "Envío Gratis",
        "features.shipping.sub": "En compras sobre $100",
        "features.secure": "Compra Segura",
        "features.secure.sub": "Protección garantizada",
        "features.payment": "Pago Fácil",
        "features.payment.sub": "Múltiples métodos",
        "features.support": "Soporte 24/7",
        "features.support.sub": "Siempre disponible",
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
        "nav.login": "Log In",
        "nav.store": "Your store",
        "nav.store.active": "Active",
        "nav.member": "NX036 Member",
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
        // ── Slide fallbacks ──
        "slide.fb1.title": "Discover the Best Products",
        "slide.fb1.subtitle": "Cutting-edge technology",
        "slide.fb1.desc": "Exclusive deals with satisfaction guarantee and free shipping on your first order.",
        "slide.fb1.badge": "New",
        "slide.fb1.btn": "View Deals",
        "slide.fb2.title": "Up to 50% OFF",
        "slide.fb2.subtitle": "Fashion & Trends",
        "slide.fb2.desc": "The latest fashion trends with incredible discounts. Limited stock.",
        "slide.fb2.badge": "Sale",
        "slide.fb2.btn": "View Fashion Deals",
        "slide.fb3.title": "Gaming to the Next Level",
        "slide.fb3.subtitle": "Epic Setups",
        "slide.fb3.desc": "Consoles, peripherals and accessories to dominate every game.",
        "slide.fb3.badge": "Featured",
        "slide.fb3.btn": "Explore Gaming",
        "slide.fb4.title": "Premium Electronics",
        "slide.fb4.subtitle": "Innovation without limits",
        "slide.fb4.desc": "The best smartphones, laptops and gadgets with special discounts for NX036 members.",
        "slide.fb4.badge": "Exclusive",
        "slide.fb4.btn": "View Electronics",
        "slide.default.btn": "View more",
        "slide.chip.discount": "On sale",
        "slide.prev": "Previous",
        "slide.next": "Next",
        "slide.goTo": "Go to slide",
        // ── Info banner ──
        "banner.freeShipping": "Free shipping on orders over",
        "banner.freeShipping.amount": "$100",
        "banner.secureBuy": "100% secure purchase",
        "banner.multiPayment": "Multiple payment methods",
        // ── Gift card ──
        "gift.title": "NX036 Gift Cards",
        "gift.subtitle": "The perfect gift — send it directly to anyone's email",
        "gift.cta": "Gift now",
        // ── Home ──
        "home.filters": "Filters",
        "home.products": "products",
        "home.results": "results",
        "home.featured": "Featured",
        "home.priceLow": "Price: low to high",
        "home.priceHigh": "Price: high to low",
        "home.topRated": "Top rated",
        "home.nameAZ": "Name A–Z",
        "home.all": "All",
        "home.allProducts": "All Products",
        "home.searchResults": "Results for",
        "home.dealsFor": "Deals ·",
        "home.deals": "Deals & Discounts",
        "home.catalogLive": "Live catalog",
        "home.demoMode": "Demo mode — sample data",
        "home.errorLoading": "Error loading products",
        "home.retry": "Retry",
        "home.noResults": "No results",
        "home.noResultsHint": "Try adjusting filters or changing search",
        "home.clearFilters": "Clear filters",
        "home.loadingMore": "Loading more products...",
        "home.allLoaded": "All products loaded",
        // ── Features strip ──
        "features.shipping": "Free Shipping",
        "features.shipping.sub": "On orders over $100",
        "features.secure": "Secure Purchase",
        "features.secure.sub": "Guaranteed protection",
        "features.payment": "Easy Payment",
        "features.payment.sub": "Multiple methods",
        "features.support": "Support 24/7",
        "features.support.sub": "Always available",
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
        "nav.login": "Entrar",
        "nav.store": "Sua loja",
        "nav.store.active": "Ativa",
        "nav.member": "Membro NX036",
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
        // ── Slide fallbacks ──
        "slide.fb1.title": "Descubra os Melhores Produtos",
        "slide.fb1.subtitle": "Tecnologia de ponta",
        "slide.fb1.desc": "Ofertas exclusivas com garantia de satisfação e frete grátis na sua primeira compra.",
        "slide.fb1.badge": "Novo",
        "slide.fb1.btn": "Ver Ofertas",
        "slide.fb2.title": "Até 50% OFF",
        "slide.fb2.subtitle": "Moda & Tendências",
        "slide.fb2.desc": "As últimas tendências de moda com descontos incríveis. Estoque limitado.",
        "slide.fb2.badge": "Oferta",
        "slide.fb2.btn": "Ver Ofertas de Moda",
        "slide.fb3.title": "Gaming no Próximo Nível",
        "slide.fb3.subtitle": "Setups Épicos",
        "slide.fb3.desc": "Consoles, periféricos e acessórios para dominar cada partida.",
        "slide.fb3.badge": "Destaque",
        "slide.fb3.btn": "Explorar Gaming",
        "slide.fb4.title": "Eletrônicos Premium",
        "slide.fb4.subtitle": "Inovação sem limites",
        "slide.fb4.desc": "Os melhores smartphones, laptops e gadgets com descontos especiais para membros NX036.",
        "slide.fb4.badge": "Exclusivo",
        "slide.fb4.btn": "Ver Eletrônicos",
        "slide.default.btn": "Ver mais",
        "slide.chip.discount": "Com desconto",
        "slide.prev": "Anterior",
        "slide.next": "Próximo",
        "slide.goTo": "Ir ao slide",
        // ── Info banner ──
        "banner.freeShipping": "Frete grátis em compras acima de",
        "banner.freeShipping.amount": "$100",
        "banner.secureBuy": "Compra 100% segura",
        "banner.multiPayment": "Múltiplos métodos de pagamento",
        // ── Gift card ──
        "gift.title": "Cartões presente NX036",
        "gift.subtitle": "O presente perfeito — envie direto para o email de quem quiser",
        "gift.cta": "Presentear agora",
        // ── Home ──
        "home.filters": "Filtros",
        "home.products": "produtos",
        "home.results": "resultados",
        "home.featured": "Destaques",
        "home.priceLow": "Preço: menor a maior",
        "home.priceHigh": "Preço: maior a menor",
        "home.topRated": "Mais avaliados",
        "home.nameAZ": "Nome A–Z",
        "home.all": "Todos",
        "home.allProducts": "Todos os Produtos",
        "home.searchResults": "Resultados para",
        "home.dealsFor": "Ofertas ·",
        "home.deals": "Ofertas e Descontos",
        "home.catalogLive": "Catálogo ao vivo",
        "home.demoMode": "Modo demo — dados de exemplo",
        "home.errorLoading": "Erro ao carregar produtos",
        "home.retry": "Tentar novamente",
        "home.noResults": "Sem resultados",
        "home.noResultsHint": "Tente ajustar os filtros ou alterar a busca",
        "home.clearFilters": "Limpar filtros",
        "home.loadingMore": "Carregando mais produtos...",
        "home.allLoaded": "Todos os produtos carregados",
        // ── Features strip ──
        "features.shipping": "Frete Grátis",
        "features.shipping.sub": "Em compras acima de $100",
        "features.secure": "Compra Segura",
        "features.secure.sub": "Proteção garantida",
        "features.payment": "Pagamento Fácil",
        "features.payment.sub": "Múltiplos métodos",
        "features.support": "Suporte 24/7",
        "features.support.sub": "Sempre disponível",
    },
};

// ── Context ─────────────────────────────────────────────────────────────────
interface LanguageContextType {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: (key: string) => string;
    currentOption: LocaleOption;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function getInitialLocale(): Locale {
    try {
        const stored = localStorage.getItem("nexa-locale");
        if (stored && ["es", "en", "pt"].includes(stored)) return stored as Locale;
    } catch (err) { logger.warn("Suppressed error", err); }
    return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        try { localStorage.setItem("nexa-locale", l); } catch (err) { logger.warn("Suppressed error", err); }
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
