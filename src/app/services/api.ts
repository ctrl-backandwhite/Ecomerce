/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  NEXA — Capa de servicios centralizada                          ║
 * ║                                                                  ║
 * ║  Para conectar con tu backend real:                              ║
 * ║  1. Cambia API_BASE a la URL de tu servidor.                     ║
 * ║  2. En cada función, descomenta el bloque "── REAL API ──"       ║
 * ║     y comenta (o elimina) el bloque "── MOCK DATA ──".           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// 🔧  CONFIGURACIÓN  — cambia solo esta línea cuando tengas el backend listo
// ─────────────────────────────────────────────────────────────────────────────
export const API_BASE = "https://api.tudominio.com/v1";

// Helper interno para el modo mock
const delay = <T>(data: T): Promise<T> =>
  new Promise((res) => setTimeout(() => res(data), 80));

// ─────────────────────────────────────────────────────────────────────────────
// Re-exportamos todos los tipos para que los componentes no importen
// directamente de /data sino siempre desde /services/api
// ─────────────────────────────────────────────────────────────────────────────
export type { Product, ProductImage, ProductAttribute, ProductVariant } from "../data/products";
export type { Order as AdminOrder }                                      from "../data/orders";
export type { Customer }                                                 from "../data/customers";
export type { Category, SellerStore }                                    from "../data/adminData";
export type { Brand }                                                    from "../data/brands";
export type { Review }                                                   from "../data/reviews";
export type { Invoice, InvoiceLine, InvoiceStatus }                      from "../data/invoices";
export type { Order as UserOrder, OrderItem, OrderStatus }               from "../data/mockOrders";
export type { Attribute, AttributeValue }                                from "../data/attributes";

// ─────────────────────────────────────────────────────────────────────────────
// 1. PRODUCTOS
//    Colección principal del catálogo (16 productos con variantes detalladas)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductsParams {
  category?: string;
  subcategory?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/** GET /products */
export async function getProducts(params?: ProductsParams) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { products } = await import("../data/products");
  let result = [...products];
  if (params?.category)    result = result.filter(p => p.category === params.category);
  if (params?.subcategory) result = result.filter(p => p.subcategory === params.subcategory);
  if (params?.search)      result = result.filter(p => p.name.toLowerCase().includes(params.search!.toLowerCase()));
  if (params?.brand)       result = result.filter(p => p.brand === params.brand);
  if (params?.minPrice)    result = result.filter(p => p.price >= params.minPrice!);
  if (params?.maxPrice)    result = result.filter(p => p.price <= params.maxPrice!);
  if (params?.status)      result = result.filter(p => p.status === params.status);
  return delay(result);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const q = new URLSearchParams(params as any).toString();
  // const res = await fetch(`${API_BASE}/products?${q}`);
  // if (!res.ok) throw new Error("Error fetching products");
  // return res.json();
}

/** GET /products/:slug */
export async function getProductBySlug(slug: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { products } = await import("../data/products");
  return delay(products.find(p => p.slug === slug) ?? null);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/products/${slug}`);
  // if (!res.ok) throw new Error("Product not found");
  // return res.json();
}

/** GET /products/:id */
export async function getProductById(id: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { products } = await import("../data/products");
  return delay(products.find(p => p.id === id) ?? null);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/products/${id}`);
  // if (!res.ok) throw new Error("Product not found");
  // return res.json();
}

/** POST /products */
export async function createProduct(data: Partial<import("../data/products").Product>) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log("POST /products", data);
  return delay({ ...data, id: `p-${Date.now()}` });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/products`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error("Error creating product");
  // return res.json();
}

/** PUT /products/:id */
export async function updateProduct(id: string, data: Partial<import("../data/products").Product>) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`PUT /products/${id}`, data);
  return delay({ id, ...data });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/products/${id}`, {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error("Error updating product");
  // return res.json();
}

/** DELETE /products/:id */
export async function deleteProduct(id: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`DELETE /products/${id}`);
  return delay({ success: true });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
  // if (!res.ok) throw new Error("Error deleting product");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ÓRDENES (Admin)
//    8 órdenes con estados: pending / processing / shipped / delivered / cancelled
// ─────────────────────────────────────────────────────────────────────────────

export interface OrdersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** GET /orders */
export async function getAdminOrders(params?: OrdersParams) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { orders } = await import("../data/orders");
  let result = [...orders];
  if (params?.status && params.status !== "all")
    result = result.filter(o => o.status === params.status);
  if (params?.search) {
    const q = params.search.toLowerCase();
    result = result.filter(o =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q),
    );
  }
  return delay(result);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const q = new URLSearchParams(params as any).toString();
  // const res = await fetch(`${API_BASE}/orders?${q}`);
  // if (!res.ok) throw new Error("Error fetching orders");
  // return res.json();
}

/** GET /orders/:id */
export async function getAdminOrderById(id: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { orders } = await import("../data/orders");
  return delay(orders.find(o => o.id === id) ?? null);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/orders/${id}`);
  // if (!res.ok) throw new Error("Order not found");
  // return res.json();
}

/** PUT /orders/:id/status */
export async function updateOrderStatus(id: string, status: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`PUT /orders/${id}/status`, { status });
  return delay({ id, status });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/orders/${id}/status`, {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ status }),
  // });
  // if (!res.ok) throw new Error("Error updating order status");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CLIENTES
//    Perfil de compradores con historial de compras
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomersParams {
  status?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/** GET /customers */
export async function getCustomers(params?: CustomersParams) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { customers } = await import("../data/customers");
  let result = [...customers];
  if (params?.status && params.status !== "all")
    result = result.filter(c => c.status === params.status);
  if (params?.search) {
    const q = params.search.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }
  return delay(result);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const q = new URLSearchParams(params as any).toString();
  // const res = await fetch(`${API_BASE}/customers?${q}`);
  // if (!res.ok) throw new Error("Error fetching customers");
  // return res.json();
}

/** GET /customers/:id */
export async function getCustomerById(id: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { customers } = await import("../data/customers");
  return delay(customers.find(c => c.id === id) ?? null);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/customers/${id}`);
  // if (!res.ok) throw new Error("Customer not found");
  // return res.json();
}

/** PUT /customers/:id/status */
export async function updateCustomerStatus(id: string, status: "active" | "inactive") {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`PUT /customers/${id}/status`, { status });
  return delay({ id, status });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/customers/${id}/status`, {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ status }),
  // });
  // if (!res.ok) throw new Error("Error updating customer status");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CATEGORÍAS
//    Árbol de categorías padre/hijo con conteo de productos
// ─────────────────────────────────────────────────────────────────────────────

/** GET /categories */
export async function getCategories() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { categories } = await import("../data/adminData");
  return delay(categories);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/categories`);
  // if (!res.ok) throw new Error("Error fetching categories");
  // return res.json();
}

/** POST /categories */
export async function createCategory(data: Partial<import("../data/adminData").Category>) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log("POST /categories", data);
  return delay({ ...data, id: `cat-${Date.now()}` });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/categories`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error("Error creating category");
  // return res.json();
}

/** PUT /categories/:id */
export async function updateCategory(id: string, data: Partial<import("../data/adminData").Category>) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`PUT /categories/${id}`, data);
  return delay({ id, ...data });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/categories/${id}`, {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error("Error updating category");
  // return res.json();
}

/** DELETE /categories/:id */
export async function deleteCategory(id: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`DELETE /categories/${id}`);
  return delay({ success: true });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/categories/${id}`, { method: "DELETE" });
  // if (!res.ok) throw new Error("Error deleting category");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MARCAS
//    10 marcas (Apple, Samsung, Sony, Nike, Adidas, Bose, Logitech, LG, Canon, Xiaomi)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /brands */
export async function getBrands() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { brands } = await import("../data/brands");
  return delay(brands);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/brands`);
  // if (!res.ok) throw new Error("Error fetching brands");
  // return res.json();
}

/** POST /brands */
export async function createBrand(data: Partial<import("../data/brands").Brand>) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log("POST /brands", data);
  return delay({ ...data, id: `br-${Date.now()}` });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/brands`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error("Error creating brand");
  // return res.json();
}

/** PUT /brands/:id */
export async function updateBrand(id: string, data: Partial<import("../data/brands").Brand>) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`PUT /brands/${id}`, data);
  return delay({ id, ...data });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/brands/${id}`, {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error("Error updating brand");
  // return res.json();
}

/** DELETE /brands/:id */
export async function deleteBrand(id: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`DELETE /brands/${id}`);
  return delay({ success: true });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/brands/${id}`, { method: "DELETE" });
  // if (!res.ok) throw new Error("Error deleting brand");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. RESEÑAS
//    24 reseñas distribuidas entre los 16 productos del catálogo
// ─────────────────────────────────────────────────────────────────────────────

/** GET /reviews?productId=:productId */
export async function getReviewsByProduct(productId: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { reviews } = await import("../data/reviews");
  return delay(reviews.filter(r => r.productId === productId));
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/reviews?productId=${productId}`);
  // if (!res.ok) throw new Error("Error fetching reviews");
  // return res.json();
}

/** GET /reviews  (admin — todas las reseñas) */
export async function getAllReviews() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { reviews } = await import("../data/reviews");
  return delay(reviews);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/reviews`);
  // if (!res.ok) throw new Error("Error fetching reviews");
  // return res.json();
}

/** PUT /reviews/:id/approve */
export async function approveReview(id: string, approved: boolean) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`PUT /reviews/${id}/approve`, { approved });
  return delay({ id, approved });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/reviews/${id}/approve`, {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ approved }),
  // });
  // if (!res.ok) throw new Error("Error approving review");
  // return res.json();
}

/** DELETE /reviews/:id */
export async function deleteReview(id: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`DELETE /reviews/${id}`);
  return delay({ success: true });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/reviews/${id}`, { method: "DELETE" });
  // if (!res.ok) throw new Error("Error deleting review");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. FACTURAS
//    8 facturas vinculadas a las órdenes del admin
//    Estados: paid / pending / overdue / void
// ─────────────────────────────────────────────────────────────────────────────

/** GET /invoices */
export async function getInvoices() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { invoices } = await import("../data/invoices");
  return delay(invoices);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/invoices`);
  // if (!res.ok) throw new Error("Error fetching invoices");
  // return res.json();
}

/** GET /invoices/:id */
export async function getInvoiceById(id: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { invoices } = await import("../data/invoices");
  return delay(invoices.find(inv => inv.id === id) ?? null);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/invoices/${id}`);
  // if (!res.ok) throw new Error("Invoice not found");
  // return res.json();
}

/** GET /invoices/by-order/:orderNumber */
export async function getInvoiceByOrder(orderNumber: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { invoices } = await import("../data/invoices");
  return delay(invoices.find(inv => inv.orderNumber === orderNumber) ?? null);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/invoices/by-order/${orderNumber}`);
  // if (!res.ok) throw new Error("Invoice not found");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ÓRDENES DEL USUARIO (perfil /cuenta)
//    Historial de compras del cliente logueado con tracking codes
// ─────────────────────────────────────────────────────────────────────────────

/** GET /user/orders */
export async function getUserOrders() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { mockOrders } = await import("../data/mockOrders");
  return delay(mockOrders);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/user/orders`, {
  //   headers: { Authorization: `Bearer ${getAuthToken()}` },
  // });
  // if (!res.ok) throw new Error("Error fetching user orders");
  // return res.json();
}

/** GET /user/orders/:id */
export async function getUserOrderById(id: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { mockOrders } = await import("../data/mockOrders");
  return delay(mockOrders.find(o => o.id === id) ?? null);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/user/orders/${id}`, {
  //   headers: { Authorization: `Bearer ${getAuthToken()}` },
  // });
  // if (!res.ok) throw new Error("Order not found");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. DASHBOARD / REPORTES
//    KPIs, ingresos mensuales, top productos, distribución por categoría
// ─────────────────────────────────────────────────────────────────────────────

/** GET /dashboard/stats */
export async function getDashboardStats() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { dashboardStats } = await import("../data/adminData");
  const { orders }         = await import("../data/orders");
  const { products }       = await import("../data/products");
  const { customers }      = await import("../data/customers");
  return delay({
    ...dashboardStats,
    totalRevenue:    orders.reduce((s, o) => s + o.total, 0),
    totalOrders:     orders.length,
    totalCustomers:  customers.length,
    totalProducts:   products.length,
    lowStockCount:   products.filter(p => p.stock < 10).length,
    pendingOrders:   orders.filter(o => o.status === "pending").length,
  });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/dashboard/stats`);
  // if (!res.ok) throw new Error("Error fetching dashboard stats");
  // return res.json();
}

/** GET /reports/revenue?range=8m */
export async function getRevenueReport() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const MONTHLY = [
    { month: "Ago", revenue: 18400, orders: 142, returns: 8  },
    { month: "Sep", revenue: 22100, orders: 167, returns: 11 },
    { month: "Oct", revenue: 26800, orders: 201, returns: 14 },
    { month: "Nov", revenue: 41200, orders: 318, returns: 22 },
    { month: "Dic", revenue: 58700, orders: 452, returns: 31 },
    { month: "Ene", revenue: 31500, orders: 243, returns: 17 },
    { month: "Feb", revenue: 34200, orders: 264, returns: 15 },
    { month: "Mar", revenue: 38900, orders: 297, returns: 18 },
  ];
  return delay(MONTHLY);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/reports/revenue?range=8m`);
  // if (!res.ok) throw new Error("Error fetching revenue report");
  // return res.json();
}

/** GET /reports/top-products */
export async function getTopProductsReport() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const TOP = [
    { name: "iPhone 15 Pro Max",       sales: 148, revenue: 224252, growth: 12  },
    { name: "Samsung Galaxy S24 Ultra", sales: 112, revenue: 151088, growth:  8  },
    { name: "Sony WH-1000XM5",         sales: 203, revenue:  76937, growth: 24  },
    { name: "Dell XPS 15",             sales:  67, revenue: 127233, growth: -3  },
    { name: "Canon EOS R10",           sales:  89, revenue:  80011, growth: 15  },
  ];
  return delay(TOP);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/reports/top-products`);
  // if (!res.ok) throw new Error("Error fetching top products");
  // return res.json();
}

/** GET /reports/daily-orders */
export async function getDailyOrdersReport() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const DAILY = [
    { day: "L", orders: 38 },
    { day: "M", orders: 52 },
    { day: "X", orders: 45 },
    { day: "J", orders: 61 },
    { day: "V", orders: 78 },
    { day: "S", orders: 94 },
    { day: "D", orders: 43 },
  ];
  return delay(DAILY);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/reports/daily-orders`);
  // if (!res.ok) throw new Error("Error fetching daily orders");
  // return res.json();
}

/** GET /reports/category-distribution */
export async function getCategoryDistributionReport() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const DIST = [
    { name: "Electrónica", value: 42, color: "#1f2937" },
    { name: "Calzado",     value: 18, color: "#6b7280" },
    { name: "Audio",       value: 20, color: "#9ca3af" },
    { name: "Fotografía",  value: 11, color: "#d1d5db" },
    { name: "Accesorios",  value:  9, color: "#e5e7eb" },
  ];
  return delay(DIST);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/reports/category-distribution`);
  // if (!res.ok) throw new Error("Error fetching category distribution");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. ATRIBUTOS DEL CATÁLOGO
//     Color, Talla, Material, Sistema Operativo, Conectividad…
// ─────────────────────────────────────────────────────────────────────────────

/** GET /attributes */
export async function getAttributes() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { attributes } = await import("../data/attributes");
  return delay(attributes);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/attributes`);
  // if (!res.ok) throw new Error("Error fetching attributes");
  // return res.json();
}

/** POST /attributes */
export async function createAttribute(data: Partial<import("../data/attributes").Attribute>) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log("POST /attributes", data);
  return delay({ ...data, id: `attr-${Date.now()}` });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/attributes`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error("Error creating attribute");
  // return res.json();
}

/** PUT /attributes/:id */
export async function updateAttribute(id: string, data: Partial<import("../data/attributes").Attribute>) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`PUT /attributes/${id}`, data);
  return delay({ id, ...data });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/attributes/${id}`, {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error("Error updating attribute");
  // return res.json();
}

/** DELETE /attributes/:id */
export async function deleteAttribute(id: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log(`DELETE /attributes/${id}`);
  return delay({ success: true });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/attributes/${id}`, { method: "DELETE" });
  // if (!res.ok) throw new Error("Error deleting attribute");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. TIENDAS / SELLERS
//     5 vendedores con estados: active / pending / suspended / draft
// ─────────────────────────────────────────────────────────────────────────────

/** GET /stores */
export async function getStores() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { sellerStores } = await import("../data/adminData");
  return delay(sellerStores);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/stores`);
  // if (!res.ok) throw new Error("Error fetching stores");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. NEWSLETTER
//     Suscripción al boletín (solo escritura)
// ─────────────────────────────────────────────────────────────────────────────

/** POST /newsletter/subscribe */
export async function subscribeNewsletter(email: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log("POST /newsletter/subscribe", { email });
  return delay({ success: true, email });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ email }),
  // });
  // if (!res.ok) throw new Error("Error subscribing to newsletter");
  // return res.json();
}

/** DELETE /newsletter/unsubscribe */
export async function unsubscribeNewsletter(email: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log("DELETE /newsletter/unsubscribe", { email });
  return delay({ success: true });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/newsletter/unsubscribe`, {
  //   method: "DELETE",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ email }),
  // });
  // if (!res.ok) throw new Error("Error unsubscribing from newsletter");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. AUTENTICACIÓN DEL USUARIO
//     Login / registro / perfil (actualmente gestionado por UserContext)
// ─────────────────────────────────────────────────────────────────────────────

/** POST /auth/login */
export async function loginUser(email: string, password: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log("POST /auth/login", { email, password });
  return delay({ token: "mock-jwt-token", user: { email, name: "Usuario NEXA" } });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/auth/login`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ email, password }),
  // });
  // if (!res.ok) throw new Error("Credenciales incorrectas");
  // return res.json();
}

/** POST /auth/register */
export async function registerUser(data: { name: string; email: string; password: string }) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  console.log("POST /auth/register", data);
  return delay({ token: "mock-jwt-token", user: data });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/auth/register`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error("Error registering user");
  // return res.json();
}

/** GET /auth/me */
export async function getCurrentUser() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  return delay(null);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/auth/me`, {
  //   headers: { Authorization: `Bearer ${getAuthToken()}` },
  // });
  // if (!res.ok) return null;
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. CUPONES
// ─────────────────────────────────────────────────────────────────────────────

/** GET /coupons */
export async function getCoupons() {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  return delay([
    { id: "1", code: "WELCOME10", type: "percent", value: 10, minOrder: 0,    uses: 142, maxUses: null, active: true,  expires: null            },
    { id: "2", code: "VERANO20",  type: "percent", value: 20, minOrder: 50,   uses:  88, maxUses: 200,  active: true,  expires: "2026-08-31"     },
    { id: "3", code: "ENVIO0",    type: "shipping", value: 0, minOrder: 30,   uses:  54, maxUses: null, active: true,  expires: null            },
    { id: "4", code: "FLASH50",   type: "fixed",   value: 50, minOrder: 200,  uses: 200, maxUses: 200,  active: false, expires: "2026-02-14"    },
    { id: "5", code: "NEXA15",    type: "percent", value: 15, minOrder: 75,   uses:  31, maxUses: 500,  active: true,  expires: "2026-12-31"    },
  ]);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/coupons`);
  // if (!res.ok) throw new Error("Error fetching coupons");
  // return res.json();
}

/** POST /coupons/validate */
export async function validateCoupon(code: string, orderTotal: number) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const coupons = await getCoupons() as any[];
  const coupon = coupons.find((c: any) => c.code === code.toUpperCase() && c.active);
  if (!coupon) return delay({ valid: false, message: "Cupón no válido o expirado" });
  if (orderTotal < coupon.minOrder) return delay({ valid: false, message: `Pedido mínimo $${coupon.minOrder}` });
  return delay({ valid: true, coupon });
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/coupons/validate`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ code, orderTotal }),
  // });
  // if (!res.ok) throw new Error("Error validating coupon");
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. SEGUIMIENTO DE PEDIDO (público)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /tracking/:code */
export async function trackOrder(code: string) {
  // ── MOCK DATA ──────────────────────────────────────────────────────────────
  const { mockOrders } = await import("../data/mockOrders");
  const order = mockOrders.find(o => o.trackingCode === code);
  return delay(order ?? null);
  // ── REAL API ───────────────────────────────────────────────────────────────
  // const res = await fetch(`${API_BASE}/tracking/${code}`);
  // if (!res.ok) return null;
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidad interna — obtiene el JWT guardado en localStorage
// Descomenta cuando implementes autenticación real
// ─────────────────────────────────────────────────────────────────────────────
// function getAuthToken(): string | null {
//   return localStorage.getItem("nexa_token");
// }
