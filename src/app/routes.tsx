import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { AuthGuard } from "./components/AuthGuard";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/admin/AdminLayout";

// Helper: lazy-load a named export from a module
function lazyPage<T extends Record<string, unknown>>(
  loader: () => Promise<T>,
  name: keyof T,
) {
  return lazy(() => loader().then((m) => ({ default: m[name] as React.ComponentType })));
}

// ── Public pages ──────────────────────────────────────────────────────────────
const Home            = lazyPage(() => import("./pages/Home"),             "Home");
const ProductDetail   = lazyPage(() => import("./pages/ProductDetail"),    "ProductDetail");
const Cart            = lazyPage(() => import("./pages/Cart"),             "Cart");
const Checkout        = lazyPage(() => import("./pages/Checkout"),         "Checkout");
const UserProfile     = lazyPage(() => import("./pages/UserProfile"),      "UserProfile");
const GiftCardPurchase= lazyPage(() => import("./pages/GiftCardPurchase"), "GiftCardPurchase");
const AboutPage       = lazyPage(() => import("./pages/AboutPage"),        "AboutPage");
const ContactPage     = lazyPage(() => import("./pages/ContactPage"),      "ContactPage");
const FAQPage         = lazyPage(() => import("./pages/FAQPage"),          "FAQPage");
const ShippingPage    = lazyPage(() => import("./pages/ShippingPage"),     "ShippingPage");
const LegalPage       = lazyPage(() => import("./pages/LegalPage"),        "LegalPage");
const OrderTracking   = lazyPage(() => import("./pages/OrderTracking"),    "OrderTracking");
const ComparePage     = lazyPage(() => import("./pages/ComparePage"),      "ComparePage");
const BrandPage       = lazyPage(() => import("./pages/BrandPage"),        "BrandPage");
const NotFound        = lazyPage(() => import("./pages/NotFound"),         "NotFound");
const AuthCallback    = lazyPage(() => import("./pages/AuthCallback"),    "AuthCallback");

// ── Admin pages ───────────────────────────────────────────────────────────────
const Dashboard         = lazyPage(() => import("./pages/admin/Dashboard"),         "Dashboard");
const AdminReports      = lazyPage(() => import("./pages/admin/AdminReports"),      "AdminReports");
const AdminProducts     = lazyPage(() => import("./pages/admin/AdminProducts"),     "AdminProducts");
const AdminOrders       = lazyPage(() => import("./pages/admin/AdminOrders"),       "AdminOrders");
const AdminReturns      = lazyPage(() => import("./pages/admin/AdminReturns"),      "AdminReturns");
const AdminCustomers    = lazyPage(() => import("./pages/admin/AdminCustomers"),    "AdminCustomers");
const AdminReviews      = lazyPage(() => import("./pages/admin/AdminReviews"),      "AdminReviews");
const AdminCoupons      = lazyPage(() => import("./pages/admin/AdminCoupons"),      "AdminCoupons");
const AdminInvoices     = lazyPage(() => import("./pages/admin/AdminInvoices"),     "AdminInvoices");
const AdminSettings     = lazyPage(() => import("./pages/admin/AdminSettings"),     "AdminSettings");
const AdminCategories   = lazyPage(() => import("./pages/admin/AdminCategories"),   "AdminCategories");
const AdminMedia        = lazyPage(() => import("./pages/admin/AdminMedia"),        "AdminMedia");
const AdminSlides       = lazyPage(() => import("./pages/admin/AdminSlides"),       "AdminSlides");
const AdminBrands       = lazyPage(() => import("./pages/admin/AdminBrands"),       "AdminBrands");
const AdminAttributes   = lazyPage(() => import("./pages/admin/AdminAttributes"),   "AdminAttributes");
const AdminVariants     = lazyPage(() => import("./pages/admin/AdminVariants"),     "AdminVariants");
const AdminShipping     = lazyPage(() => import("./pages/admin/AdminShipping"),     "AdminShipping");
const AdminTaxes        = lazyPage(() => import("./pages/admin/AdminTaxes"),        "AdminTaxes");
const AdminSEO          = lazyPage(() => import("./pages/admin/AdminSEO"),          "AdminSEO");
const AdminEmails       = lazyPage(() => import("./pages/admin/AdminEmails"),       "AdminEmails");
const AdminLoyalty      = lazyPage(() => import("./pages/admin/AdminLoyalty"),      "AdminLoyalty");
const AdminGiftCards    = lazyPage(() => import("./pages/admin/AdminGiftCards"),    "AdminGiftCards");
const AdminNewsletter   = lazyPage(() => import("./pages/admin/AdminNewsletter"),   "AdminNewsletter");
const AdminCampaigns    = lazyPage(() => import("./pages/admin/AdminCampaigns"),    "AdminCampaigns");
const AdminWarranties   = lazyPage(() => import("./pages/admin/AdminWarranties"),   "AdminWarranties");
const AdminFlows        = lazyPage(() => import("./pages/admin/AdminFlows"),        "AdminFlows");

export const router = createBrowserRouter([
  {
    // Pathless root route — owns all context providers (including AuthProvider)
    Component: RootLayout,
    children: [
      // Public: OAuth2 callback (no auth guard)
      { path: "/auth/callback", Component: AuthCallback },
      {
        // Protected: all app routes require authentication
        Component: AuthGuard,
        children: [
          {
            path: "/",
            Component: Layout,
            children: [
              { index: true,              Component: Home },
              { path: "tienda",                          Component: Home },
              { path: "tienda/:catSlug",                 Component: Home },
              { path: "tienda/:catSlug/:subcatSlug",     Component: Home },
              { path: "buscar/:query",                   Component: Home },
              { path: "producto/:id",     Component: ProductDetail },
              { path: "carrito",          Component: Cart },
              { path: "checkout",         Component: Checkout },
              { path: "cuenta",           Component: UserProfile },
              { path: "tarjetas-regalo",  Component: GiftCardPurchase },
              { path: "nosotros",         Component: AboutPage },
              { path: "contacto",         Component: ContactPage },
              { path: "faq",              Component: FAQPage },
              { path: "envios",           Component: ShippingPage },
              { path: "legal/:slug",      Component: LegalPage },
              { path: "seguimiento",      Component: OrderTracking },
              { path: "comparar",         Component: ComparePage },
              { path: "marca/:slug",      Component: BrandPage },
              { path: "*",                Component: NotFound },
            ],
          },
          {
            path: "/admin",
            Component: AdminLayout,
            children: [
              { index: true,              Component: Dashboard },
              { path: "reportes",         Component: AdminReports },
              { path: "ordenes",          Component: AdminOrders },
              { path: "facturas",         Component: AdminInvoices },
              { path: "devoluciones",     Component: AdminReturns },
              { path: "clientes",         Component: AdminCustomers },
              { path: "resenas",          Component: AdminReviews },
              { path: "cupones",          Component: AdminCoupons },
              { path: "puntos",           Component: AdminLoyalty },
              { path: "regalo",           Component: AdminGiftCards },
              { path: "productos",        Component: AdminProducts },
              { path: "variantes",        Component: AdminVariants },
              { path: "categorias",       Component: AdminCategories },
              { path: "marcas",           Component: AdminBrands },
              { path: "atributos",        Component: AdminAttributes },
              { path: "medios",           Component: AdminMedia },
              { path: "garantias",        Component: AdminWarranties },
              { path: "campanas",         Component: AdminCampaigns },
              { path: "newsletter",       Component: AdminNewsletter },
              { path: "seo",              Component: AdminSEO },
              { path: "slides",           Component: AdminSlides },
              { path: "flujos",           Component: AdminFlows },
              { path: "envios",           Component: AdminShipping },
              { path: "impuestos",        Component: AdminTaxes },
              { path: "emails",           Component: AdminEmails },
              { path: "configuracion",    Component: AdminSettings },
            ],
          },
        ],
      },
    ],
  },
]);
