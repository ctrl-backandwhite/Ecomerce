import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { NotFound } from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import { Dashboard } from "./pages/admin/Dashboard";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminCustomers } from "./pages/admin/AdminCustomers";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminMedia } from "./pages/admin/AdminMedia";
import { UserProfile } from "./pages/UserProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true,          Component: Home },
      { path: "producto/:id", Component: ProductDetail },
      { path: "carrito",      Component: Cart },
      { path: "checkout",     Component: Checkout },
      { path: "cuenta",       Component: UserProfile },
      { path: "*",            Component: NotFound },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true,              Component: Dashboard },
      { path: "productos",        Component: AdminProducts },
      { path: "categorias",       Component: AdminCategories },
      { path: "medios",           Component: AdminMedia },
      { path: "ordenes",          Component: AdminOrders },
      { path: "clientes",         Component: AdminCustomers },
      { path: "configuracion",    Component: AdminSettings },
    ],
  },
]);