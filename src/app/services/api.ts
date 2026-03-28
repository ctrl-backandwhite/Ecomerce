/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  NX036 — Capa de servicios centralizada                          ║
 * ║                                                                  ║
 * ║  Funciones de producto y categoría usan mocks hasta que         ║
 * ║  existan endpoints reales en el backend NX036.                   ║
 * ║                                                                  ║
 * ║  El resto de entidades (órdenes, clientes, reseñas, etc.)       ║
 * ║  permanece en mock hasta que exista un backend propio.           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import type { Product } from "../data/products";
import type { Category } from "../data/adminData";
import type { Brand } from "../data/brands";
import type { Attribute } from "../data/attributes";

export const API_BASE = "https://api.tudominio.com/v1";

// Helper for mock mode
const delay = <T>(data: T): Promise<T> =>
  new Promise((res) => setTimeout(() => res(data), 80));

// ─────────────────────────────────────────────────────────────────────────────
// Re-export types (unchanged — keep all imports working)
// ─────────────────────────────────────────────────────────────────────────────
export type { Product, ProductImage, ProductAttribute, ProductVariant } from "../data/products";
export type { Order as AdminOrder } from "../data/orders";
export type { Customer } from "../data/customers";
export type { Category, SellerStore } from "../data/adminData";
export type { Brand } from "../data/brands";
export type { Review } from "../data/reviews";
export type { Invoice, InvoiceLine, InvoiceStatus } from "../data/invoices";
export type { Order as UserOrder, OrderItem, OrderStatus } from "../data/mockOrders";
export type { Attribute, AttributeValue } from "../data/attributes";

// ─────────────────────────────────────────────────────────────────────────────
// 1. PRODUCTOS — mock (TODO: conectar con API NX036)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductsParams {
  category?: string;
  categoryId?: string;
  subcategory?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  status?: string;
  page?: number;
  limit?: number;
  orderBy?: "PRICE_ASC" | "PRICE_DESC" | "CREATED_AT";
}

/** GET /products — TODO: conectar con API NX036 */
export async function getProducts(_params?: ProductsParams) {
  return delay([] as import("../data/products").Product[]);
}

/** GET /products/:id — TODO: conectar con API NX036 */
export async function getProductById(_id: string) {
  return delay(null);
}

/** GET /products/:slug */
export async function getProductBySlug(slug: string) {
  return getProductById(slug);
}

/** POST /products — optimistic local upsert */
export async function createProduct(data: Partial<Product>) {
  return delay({ ...data, id: `p-${Date.now()}` });
}

/** PUT /products/:id — optimistic local upsert */
export async function updateProduct(id: string, data: Partial<Product>) {
  return delay({ id, ...data });
}

/** DELETE /products/:id — optimistic local remove */
export async function deleteProduct(_id: string) {
  return delay({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ÓRDENES (Admin) — mock
// ─────────────────────────────────────────────────────────────────────────────

export interface OrdersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAdminOrders(params?: OrdersParams) {
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
}

export async function getAdminOrderById(id: string) {
  const { orders } = await import("../data/orders");
  return delay(orders.find(o => o.id === id) ?? null);
}

export async function updateOrderStatus(id: string, status: string) {
  return delay({ id, status });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CLIENTES — mock
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomersParams {
  status?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function getCustomers(params?: CustomersParams) {
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
}

export async function getCustomerById(id: string) {
  const { customers } = await import("../data/customers");
  return delay(customers.find(c => c.id === id) ?? null);
}

export async function updateCustomerStatus(id: string, status: "active" | "inactive") {
  return delay({ id, status });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CATEGORÍAS — mock (TODO: conectar con API NX036)
// ─────────────────────────────────────────────────────────────────────────────

export async function getCategories() {
  return delay([] as Category[]);
}

export async function createCategory(data: Partial<Category>) {
  return delay({ ...data, id: `cat-${Date.now()}` });
}

export async function updateCategory(id: string, data: Partial<Category>) {
  return delay({ id, ...data });
}

export async function deleteCategory(_id: string) {
  return delay({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MARCAS — mock
// ─────────────────────────────────────────────────────────────────────────────

export async function getBrands() {
  const { brands } = await import("../data/brands");
  return delay(brands);
}

export async function createBrand(data: Partial<Brand>) {
  return delay({ ...data, id: `br-${Date.now()}` });
}

export async function updateBrand(id: string, data: Partial<Brand>) {
  return delay({ id, ...data });
}

export async function deleteBrand(_id: string) {
  return delay({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. RESEÑAS — mock
// ─────────────────────────────────────────────────────────────────────────────

export async function getReviewsByProduct(productId: string) {
  const { reviews } = await import("../data/reviews");
  return delay(reviews.filter(r => r.productId === productId));
}

export async function getAllReviews() {
  const { reviews } = await import("../data/reviews");
  return delay(reviews);
}

export async function approveReview(id: string, approved: boolean) {
  return delay({ id, approved });
}

export async function deleteReview(_id: string) {
  return delay({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. FACTURAS — mock
// ─────────────────────────────────────────────────────────────────────────────

export async function getInvoices() {
  const { invoices } = await import("../data/invoices");
  return delay(invoices);
}

export async function getInvoiceById(id: string) {
  const { invoices } = await import("../data/invoices");
  return delay(invoices.find(inv => inv.id === id) ?? null);
}

export async function getInvoiceByOrder(orderNumber: string) {
  const { invoices } = await import("../data/invoices");
  return delay(invoices.find(inv => inv.orderNumber === orderNumber) ?? null);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ÓRDENES DEL USUARIO — mock
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserOrders() {
  const { mockOrders } = await import("../data/mockOrders");
  return delay(mockOrders);
}

export async function getUserOrderById(id: string) {
  const { mockOrders } = await import("../data/mockOrders");
  return delay(mockOrders.find(o => o.id === id) ?? null);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. DASHBOARD / REPORTES — mock
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const { dashboardStats } = await import("../data/adminData");
  const { orders } = await import("../data/orders");
  const { customers } = await import("../data/customers");
  return delay({
    ...dashboardStats,
    totalRevenue: orders.reduce((s, o) => s + o.total, 0),
    totalOrders: orders.length,
    totalCustomers: customers.length,
    totalProducts: 0,
    lowStockCount: 0,
    pendingOrders: orders.filter(o => o.status === "pending").length,
  });
}

export async function getRevenueReport() {
  const MONTHLY = [
    { month: "Ago", revenue: 18400, orders: 142, returns: 8 },
    { month: "Sep", revenue: 22100, orders: 167, returns: 11 },
    { month: "Oct", revenue: 26800, orders: 201, returns: 14 },
    { month: "Nov", revenue: 41200, orders: 318, returns: 22 },
    { month: "Dic", revenue: 58700, orders: 452, returns: 31 },
    { month: "Ene", revenue: 31500, orders: 243, returns: 17 },
    { month: "Feb", revenue: 34200, orders: 264, returns: 15 },
    { month: "Mar", revenue: 38900, orders: 297, returns: 18 },
  ];
  return delay(MONTHLY);
}

export async function getTopProductsReport() {
  const TOP = [
    { name: "iPhone 15 Pro Max", sales: 148, revenue: 224252, growth: 12 },
    { name: "Samsung Galaxy S24 Ultra", sales: 112, revenue: 151088, growth: 8 },
    { name: "Sony WH-1000XM5", sales: 203, revenue: 76937, growth: 24 },
    { name: "Dell XPS 15", sales: 67, revenue: 127233, growth: -3 },
    { name: "Canon EOS R10", sales: 89, revenue: 80011, growth: 15 },
  ];
  return delay(TOP);
}

export async function getDailyOrdersReport() {
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
}

export async function getCategoryDistributionReport() {
  const DIST = [
    { name: "Electrónica", value: 42, color: "#1f2937" },
    { name: "Calzado", value: 18, color: "#6b7280" },
    { name: "Audio", value: 20, color: "#9ca3af" },
    { name: "Fotografía", value: 11, color: "#d1d5db" },
    { name: "Accesorios", value: 9, color: "#e5e7eb" },
  ];
  return delay(DIST);
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. ATRIBUTOS — mock
// ─────────────────────────────────────────────────────────────────────────────

export async function getAttributes() {
  const { attributes } = await import("../data/attributes");
  return delay(attributes);
}

export async function createAttribute(data: Partial<Attribute>) {
  return delay({ ...data, id: `attr-${Date.now()}` });
}

export async function updateAttribute(id: string, data: Partial<Attribute>) {
  return delay({ id, ...data });
}

export async function deleteAttribute(_id: string) {
  return delay({ success: true });
}