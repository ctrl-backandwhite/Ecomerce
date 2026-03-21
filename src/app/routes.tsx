import { GiftCardPurchase } from "./pages/GiftCardPurchase";
import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { NotFound } from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import { Dashboard } from "./pages/admin/Dashboard";
import { AdminReports } from "./pages/admin/AdminReports";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminReturns } from "./pages/admin/AdminReturns";
import { AdminCustomers } from "./pages/admin/AdminCustomers";
import { AdminReviews } from "./pages/admin/AdminReviews";
import { AdminCoupons } from "./pages/admin/AdminCoupons";
import { AdminInvoices } from "./pages/admin/AdminInvoices";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminMedia } from "./pages/admin/AdminMedia";
import { AdminSlides } from "./pages/admin/AdminSlides";
import { AdminBrands } from "./pages/admin/AdminBrands";
import { AdminAttributes } from "./pages/admin/AdminAttributes";
import { AdminVariants } from "./pages/admin/AdminVariants";
import { AdminShipping } from "./pages/admin/AdminShipping";
import { AdminTaxes } from "./pages/admin/AdminTaxes";
import { AdminSEO } from "./pages/admin/AdminSEO";
import { AdminEmails } from "./pages/admin/AdminEmails";
import { AdminLoyalty } from "./pages/admin/AdminLoyalty";
import { AdminGiftCards } from "./pages/admin/AdminGiftCards";
import { AdminNewsletter } from "./pages/admin/AdminNewsletter";
import { AdminCampaigns } from "./pages/admin/AdminCampaigns";
import { AdminWarranties } from "./pages/admin/AdminWarranties";
import { AdminFlows } from "./pages/admin/AdminFlows";
import { UserProfile } from "./pages/UserProfile";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { FAQPage } from "./pages/FAQPage";
import { ShippingPage } from "./pages/ShippingPage";
import { LegalPage } from "./pages/LegalPage";
import { OrderTracking } from "./pages/OrderTracking";
import { ComparePage } from "./pages/ComparePage";
import { BrandPage } from "./pages/BrandPage";

export const router = createBrowserRouter([
  {
    // Pathless root route — owns all context providers
    Component: RootLayout,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: Home },
          { path: "producto/:id", Component: ProductDetail },
          { path: "carrito", Component: Cart },
          { path: "checkout", Component: Checkout },
          { path: "cuenta", Component: UserProfile },
          { path: "tarjetas-regalo", Component: GiftCardPurchase },
          // Informativas
          { path: "nosotros", Component: AboutPage },
          { path: "contacto", Component: ContactPage },
          { path: "faq", Component: FAQPage },
          { path: "envios", Component: ShippingPage },
          { path: "legal/:slug", Component: LegalPage },
          { path: "seguimiento", Component: OrderTracking },
          { path: "comparar", Component: ComparePage },
          { path: "marca/:slug", Component: BrandPage },
          { path: "*", Component: NotFound },
        ],
      },
      {
        path: "/admin",
        Component: AdminLayout,
        children: [
          // Panel
          { index: true, Component: Dashboard },
          { path: "reportes", Component: AdminReports },
          // Ventas
          { path: "ordenes", Component: AdminOrders },
          { path: "facturas", Component: AdminInvoices },
          { path: "devoluciones", Component: AdminReturns },
          // Clientes
          { path: "clientes", Component: AdminCustomers },
          { path: "resenas", Component: AdminReviews },
          { path: "cupones", Component: AdminCoupons },
          { path: "puntos", Component: AdminLoyalty },
          { path: "regalo", Component: AdminGiftCards },
          // Catálogo
          { path: "productos", Component: AdminProducts },
          { path: "variantes", Component: AdminVariants },
          { path: "categorias", Component: AdminCategories },
          { path: "marcas", Component: AdminBrands },
          { path: "atributos", Component: AdminAttributes },
          { path: "medios", Component: AdminMedia },
          { path: "garantias", Component: AdminWarranties },
          // Marketing
          { path: "campanas", Component: AdminCampaigns },
          { path: "newsletter", Component: AdminNewsletter },
          { path: "seo", Component: AdminSEO },
          { path: "slides", Component: AdminSlides },
          // Sistema
          { path: "flujos", Component: AdminFlows },
          { path: "envios", Component: AdminShipping },
          { path: "impuestos", Component: AdminTaxes },
          { path: "emails", Component: AdminEmails },
          { path: "configuracion", Component: AdminSettings },
        ],
      },
    ],
  },
]);