import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { AuthGuard } from "./components/AuthGuard";
import { Layout } from "./components/Layout";
import { AccountLayout } from "./components/AccountLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { RouteError } from "./components/RouteError";

// Helper: lazy-load a named export from a module
function lazyPage<T extends Record<string, unknown>>(
  loader: () => Promise<T>,
  name: keyof T,
) {
  return lazy(() => loader().then((m) => ({ default: m[name] as React.ComponentType })));
}

// ── Public pages ──────────────────────────────────────────────────────────────
const Home = lazyPage(() => import("./pages/Home"), "Home");
const ProductDetail = lazyPage(() => import("./pages/ProductDetail"), "ProductDetail");
const Cart = lazyPage(() => import("./pages/Cart"), "Cart");
const Checkout = lazyPage(() => import("./pages/Checkout"), "Checkout");
const UserProfile = lazyPage(() => import("./pages/UserProfile"), "UserProfile");
const GiftCardPurchase = lazyPage(() => import("./pages/GiftCardPurchase"), "GiftCardPurchase");
const AboutPage = lazyPage(() => import("./pages/AboutPage"), "AboutPage");
const ContactPage = lazyPage(() => import("./pages/ContactPage"), "ContactPage");
const FAQPage = lazyPage(() => import("./pages/FAQPage"), "FAQPage");
const ShippingPage = lazyPage(() => import("./pages/ShippingPage"), "ShippingPage");
const LegalPage = lazyPage(() => import("./pages/LegalPage"), "LegalPage");
const OrderTracking = lazyPage(() => import("./pages/OrderTracking"), "OrderTracking");
const ComparePage = lazyPage(() => import("./pages/ComparePage"), "ComparePage");
const BrandPage = lazyPage(() => import("./pages/BrandPage"), "BrandPage");
const NotFound = lazyPage(() => import("./pages/NotFound"), "NotFound");
const AuthCallback = lazyPage(() => import("./pages/AuthCallback"), "AuthCallback");

// ── Admin pages ───────────────────────────────────────────────────────────────
const Dashboard = lazyPage(() => import("./pages/admin/Dashboard"), "Dashboard");
const AdminReports = lazyPage(() => import("./pages/admin/AdminReports"), "AdminReports");
const AdminProducts = lazyPage(() => import("./pages/admin/AdminProducts"), "AdminProducts");
const AdminOrders = lazyPage(() => import("./pages/admin/AdminOrders"), "AdminOrders");
const AdminReturns = lazyPage(() => import("./pages/admin/AdminReturns"), "AdminReturns");
const AdminCustomers = lazyPage(() => import("./pages/admin/AdminCustomers"), "AdminCustomers");
const AdminReviews = lazyPage(() => import("./pages/admin/AdminReviews"), "AdminReviews");
const AdminCoupons = lazyPage(() => import("./pages/admin/AdminCoupons"), "AdminCoupons");
const AdminInvoices = lazyPage(() => import("./pages/admin/AdminInvoices"), "AdminInvoices");
const AdminSettings = lazyPage(() => import("./pages/admin/AdminSettings"), "AdminSettings");
const AdminCategories = lazyPage(() => import("./pages/admin/AdminCategories"), "AdminCategories");
const AdminMedia = lazyPage(() => import("./pages/admin/AdminMedia"), "AdminMedia");
const AdminSlides = lazyPage(() => import("./pages/admin/AdminSlides"), "AdminSlides");
const AdminBrands = lazyPage(() => import("./pages/admin/AdminBrands"), "AdminBrands");
const AdminAttributes = lazyPage(() => import("./pages/admin/AdminAttributes"), "AdminAttributes");
const AdminVariants = lazyPage(() => import("./pages/admin/AdminVariants"), "AdminVariants");
const AdminShipping = lazyPage(() => import("./pages/admin/AdminShipping"), "AdminShipping");
const AdminTaxes = lazyPage(() => import("./pages/admin/AdminTaxes"), "AdminTaxes");
const AdminSEO = lazyPage(() => import("./pages/admin/AdminSEO"), "AdminSEO");
const AdminEmails = lazyPage(() => import("./pages/admin/AdminEmails"), "AdminEmails");
const AdminLoyalty = lazyPage(() => import("./pages/admin/AdminLoyalty"), "AdminLoyalty");
const AdminGiftCards = lazyPage(() => import("./pages/admin/AdminGiftCards"), "AdminGiftCards");
const AdminNewsletter = lazyPage(() => import("./pages/admin/AdminNewsletter"), "AdminNewsletter");
const AdminCampaigns = lazyPage(() => import("./pages/admin/AdminCampaigns"), "AdminCampaigns");
const AdminWarranties = lazyPage(() => import("./pages/admin/AdminWarranties"), "AdminWarranties");
const AdminFlows = lazyPage(() => import("./pages/admin/AdminFlows"), "AdminFlows");

export const router = createBrowserRouter([
  {
    // Pathless root route — owns all context providers (including AuthProvider)
    Component: RootLayout,
    errorElement: <RouteError />,
    children: [
      // OAuth2 callback
      { path: "/auth/callback", Component: AuthCallback },
      // Standalone pages — no Header / Footer
      { path: "/gift-cards", Component: GiftCardPurchase },
      {
        // Public pages — no login required
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: Home },
          { path: "store", Component: Home },
          { path: "store/:catSlug", Component: Home },
          { path: "store/:catSlug/:subcatSlug", Component: Home },
          { path: "search/:query", Component: Home },
          { path: "product/:id", Component: ProductDetail },
          { path: "cart", Component: Cart },
          { path: "checkout", Component: Checkout },
          { path: "about", Component: AboutPage },
          { path: "contact", Component: ContactPage },
          { path: "faq", Component: FAQPage },
          { path: "shipping", Component: ShippingPage },
          { path: "legal/:slug", Component: LegalPage },
          { path: "tracking", Component: OrderTracking },
          { path: "compare", Component: ComparePage },
          { path: "brand/:slug", Component: BrandPage },
          { path: "*", Component: NotFound },
        ],
      },
      {
        // Protected user pages — requires authentication
        Component: AuthGuard,
        children: [
          {
            path: "/",
            Component: AccountLayout,
            children: [
              { path: "account", Component: UserProfile },
            ],
          },
        ],
      },
      {
        // Protected — requires authentication
        path: "/admin",
        Component: AuthGuard,
        children: [
          {
            Component: AdminLayout,
            children: [
              { index: true, Component: Dashboard },
              { path: "reports", Component: AdminReports },
              { path: "orders", Component: AdminOrders },
              { path: "invoices", Component: AdminInvoices },
              { path: "returns", Component: AdminReturns },
              { path: "customers", Component: AdminCustomers },
              { path: "reviews", Component: AdminReviews },
              { path: "coupons", Component: AdminCoupons },
              { path: "loyalty", Component: AdminLoyalty },
              { path: "gift-cards", Component: AdminGiftCards },
              { path: "products", Component: AdminProducts },
              { path: "variants", Component: AdminVariants },
              { path: "categories", Component: AdminCategories },
              { path: "brands", Component: AdminBrands },
              { path: "attributes", Component: AdminAttributes },
              { path: "media", Component: AdminMedia },
              { path: "warranties", Component: AdminWarranties },
              { path: "campaigns", Component: AdminCampaigns },
              { path: "newsletter", Component: AdminNewsletter },
              { path: "seo", Component: AdminSEO },
              { path: "slides", Component: AdminSlides },
              { path: "flows", Component: AdminFlows },
              { path: "shipping", Component: AdminShipping },
              { path: "taxes", Component: AdminTaxes },
              { path: "emails", Component: AdminEmails },
              { path: "settings", Component: AdminSettings },
            ],
          },
        ],
      },
    ],
  },
]);
