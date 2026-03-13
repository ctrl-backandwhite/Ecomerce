/* ── Invoice data ───────────────────────────────────────────── */

export type InvoiceStatus = "paid" | "pending" | "overdue" | "void";

export interface InvoiceLine {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  lines: InvoiceLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: string;
  notes?: string;
}

export const invoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "FAC-2026-001",
    orderNumber: "ORD-2024-001",
    date: "2026-03-12",
    dueDate: "2026-04-12",
    status: "paid",
    customer: { name: "María García", email: "maria@email.com", phone: "+1 212 555 0101", address: "350 Fifth Avenue, Apt 4B, New York, NY 10118, US" },
    lines: [
      { name: "Apple iPhone 15 Pro Max 256GB Natural Titanium", sku: "APL-IP15PM-256NT", quantity: 1, unitPrice: 1199, total: 1199 },
      { name: "Apple MagSafe Charger 15W", sku: "APL-MAGSAFE-15W", quantity: 2, unitPrice: 39, total: 78 },
    ],
    subtotal: 1277, shipping: 0, tax: 127.70, total: 1404.70,
    paymentMethod: "Visa ···· 4242",
  },
  {
    id: "inv-002",
    invoiceNumber: "FAC-2026-002",
    orderNumber: "ORD-2024-002",
    date: "2026-03-11",
    dueDate: "2026-04-11",
    status: "pending",
    customer: { name: "Juan Pérez", email: "juan@email.com", phone: "+1 212 555 0202", address: "530 Atlantic Ave, Brooklyn, NY 11217, US" },
    lines: [
      { name: "Samsung Galaxy S24 Ultra 256GB Titanium Black", sku: "SAM-S24U-256BLK", quantity: 1, unitPrice: 1349, total: 1349 },
    ],
    subtotal: 1349, shipping: 0, tax: 134.90, total: 1483.90,
    paymentMethod: "Mastercard ···· 5555",
  },
  {
    id: "inv-003",
    invoiceNumber: "FAC-2026-003",
    orderNumber: "ORD-2024-003",
    date: "2026-03-11",
    dueDate: "2026-04-11",
    status: "paid",
    customer: { name: "Ana Martínez", email: "ana@email.com", phone: "+34 91 555 0303", address: "Calle Gran Vía 45, 2ºA, Madrid 28013, España" },
    lines: [
      { name: "Sony WH-1000XM5 Wireless Headphones Black", sku: "SNY-WH1000XM5-BLK", quantity: 1, unitPrice: 379, total: 379 },
      { name: "Sony WLA-NS7 Wireless TV Adapter", sku: "SNY-WLANS7", quantity: 1, unitPrice: 49, total: 49 },
    ],
    subtotal: 428, shipping: 0, tax: 42.80, total: 470.80,
    paymentMethod: "PayPal · ana@email.com",
  },
  {
    id: "inv-004",
    invoiceNumber: "FAC-2026-004",
    orderNumber: "ORD-2024-004",
    date: "2026-03-10",
    dueDate: "2026-04-10",
    status: "overdue",
    customer: { name: "Carlos López", email: "carlos@email.com", phone: "+1 212 555 0404", address: "168-16 Jamaica Ave, Queens, NY 11432, US" },
    lines: [
      { name: "Dell XPS 15 (2024) Intel i7 32GB 1TB", sku: "DELL-XPS15-I7-32", quantity: 1, unitPrice: 1899, total: 1899 },
    ],
    subtotal: 1899, shipping: 0, tax: 189.90, total: 2088.90,
    paymentMethod: "Visa ···· 1234",
  },
  {
    id: "inv-005",
    invoiceNumber: "FAC-2026-005",
    orderNumber: "ORD-2024-005",
    date: "2026-03-10",
    dueDate: "2026-04-10",
    status: "paid",
    customer: { name: "Laura Sánchez", email: "laura@email.com", phone: "+34 93 555 0505", address: "Passeig de Gràcia 92, 4ºB, Barcelona 08008, España" },
    lines: [
      { name: "Nike Air Max 270 Black/White Talla 42", sku: "NK-AM270-42BLK", quantity: 1, unitPrice: 149, total: 149 },
      { name: "Adidas Ultraboost 23 White Talla 40", sku: "ADI-UB23-40WHT", quantity: 1, unitPrice: 189, total: 189 },
      { name: "Nike Dri-FIT Training Tee Black M", sku: "NK-DRIFT-M-BLK", quantity: 2, unitPrice: 35, total: 70 },
    ],
    subtotal: 408, shipping: 0, tax: 40.80, total: 448.80,
    paymentMethod: "Mastercard ···· 8888",
  },
  {
    id: "inv-006",
    invoiceNumber: "FAC-2026-006",
    orderNumber: "ORD-2024-006",
    date: "2026-03-09",
    dueDate: "2026-04-09",
    status: "void",
    customer: { name: "Pedro Rodríguez", email: "pedro@email.com", phone: "+1 212 555 0606", address: "2 Penn Plaza, New York, NY 10121, US" },
    lines: [
      { name: "JBL Charge 5 Portable Speaker Blue", sku: "JBL-CHG5-BLU", quantity: 1, unitPrice: 149, total: 149 },
    ],
    subtotal: 149, shipping: 15, tax: 14.90, total: 178.90,
    paymentMethod: "PayPal · pedro@email.com",
    notes: "Pedido cancelado por el cliente. Factura anulada.",
  },
  {
    id: "inv-007",
    invoiceNumber: "FAC-2026-007",
    orderNumber: "ORD-2024-007",
    date: "2026-03-09",
    dueDate: "2026-04-09",
    status: "paid",
    customer: { name: "Sofía Torres", email: "sofia@email.com", phone: "+44 20 555 0707", address: "374 Oxford Street, London W1C 1JX, UK" },
    lines: [
      { name: "Canon EOS R10 + RF-S 18-45mm IS STM Kit", sku: "CAN-EOSR10-KIT", quantity: 1, unitPrice: 899, total: 899 },
      { name: "Canon LP-E17 Battery Pack", sku: "CAN-LPE17", quantity: 2, unitPrice: 69, total: 138 },
    ],
    subtotal: 1037, shipping: 0, tax: 103.70, total: 1140.70,
    paymentMethod: "Visa ···· 9876",
  },
  {
    id: "inv-008",
    invoiceNumber: "FAC-2026-008",
    orderNumber: "ORD-2024-008",
    date: "2026-03-08",
    dueDate: "2026-04-08",
    status: "pending",
    customer: { name: "Miguel Ángel Ruiz", email: "miguel@email.com", phone: "+34 91 555 0808", address: "Calle Serrano 12, 1ºA, Madrid 28001, España" },
    lines: [
      { name: "Logitech MX Master 3 Wireless Mouse Graphite", sku: "LOG-MXM3-GRY", quantity: 1, unitPrice: 109, total: 109 },
    ],
    subtotal: 109, shipping: 15, tax: 10.90, total: 134.90,
    paymentMethod: "USDT (TRC-20)",
  },
];
