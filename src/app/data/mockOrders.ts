export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
}

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address: string;
  trackingCode?: string;
}

export const mockOrders: Order[] = [
  {
    id: "ORD-2026-0042",
    date: "2026-03-05",
    status: "delivered",
    trackingCode: "1Z999AA10123456784",
    items: [
      {
        id: "14",
        name: "Teclado Mecánico Inalámbrico",
        image: "https://images.unsplash.com/photo-1608377205700-249f4b48b180?w=200&q=80",
        price: 189,
        quantity: 1,
        category: "Electrónica",
      },
      {
        id: "15",
        name: "Mouse Gaming Ergonómico",
        image: "https://images.unsplash.com/photo-1772531606450-0dd023c265d7?w=200&q=80",
        price: 89,
        quantity: 1,
        category: "Electrónica",
      },
    ],
    subtotal: 278,
    shipping: 0,
    total: 278,
    address: "742 Evergreen Terrace, Apt 4B, New York, NY 10001",
  },
  {
    id: "ORD-2026-0031",
    date: "2026-02-18",
    status: "delivered",
    trackingCode: "9400111899223397623910",
    items: [
      {
        id: "3",
        name: "Auriculares Bluetooth Premium",
        image: "https://images.unsplash.com/photo-1612858249937-1cc0852093dd?w=200&q=80",
        price: 249,
        quantity: 1,
        category: "Audio",
      },
    ],
    subtotal: 249,
    shipping: 0,
    total: 249,
    address: "742 Evergreen Terrace, Apt 4B, New York, NY 10001",
  },
  {
    id: "ORD-2026-0018",
    date: "2026-01-30",
    status: "delivered",
    trackingCode: "JD014600006281479463",
    items: [
      {
        id: "26",
        name: "Silla Gaming Ergonómica Pro",
        image: "https://images.unsplash.com/photo-1551459456-12c91f20a130?w=200&q=80",
        price: 349,
        quantity: 1,
        category: "Gaming",
      },
    ],
    subtotal: 349,
    shipping: 0,
    total: 349,
    address: "350 Fifth Avenue, Suite 2100, New York, NY 10118",
  },
  {
    id: "ORD-2026-0009",
    date: "2026-01-12",
    status: "delivered",
    trackingCode: "1ZW470V20394884877",
    items: [
      {
        id: "1",
        name: "Smartphone Pro Max",
        image: "https://images.unsplash.com/photo-1758186334264-d1ab8a079aa2?w=200&q=80",
        price: 999,
        quantity: 1,
        category: "Electrónica",
      },
      {
        id: "8",
        name: "Gafas de Sol Polarizadas",
        image: "https://images.unsplash.com/photo-1588768897961-332c50c55d18?w=200&q=80",
        price: 159,
        quantity: 1,
        category: "Accesorios",
      },
    ],
    subtotal: 1158,
    shipping: 0,
    total: 1158,
    address: "742 Evergreen Terrace, Apt 4B, New York, NY 10001",
  },
  {
    id: "ORD-2025-0187",
    date: "2025-11-22",
    status: "delivered",
    trackingCode: "GB095723450GB",
    items: [
      {
        id: "7",
        name: "Cámara Profesional 4K",
        image: "https://images.unsplash.com/photo-1722842179085-5423886195ff?w=200&q=80",
        price: 1899,
        quantity: 1,
        category: "Fotografía",
      },
    ],
    subtotal: 1899,
    shipping: 0,
    total: 1899,
    address: "NX036 Oxford Street, 374 Oxford Street, London W1C 1JX",
  },
  {
    id: "ORD-2026-0051",
    date: "2026-03-10",
    status: "shipped",
    trackingCode: "1Z204E380338943508",
    items: [
      {
        id: "4",
        name: "Smartwatch Elite",
        image: "https://images.unsplash.com/photo-1654208398202-1edef1cf23b5?w=200&q=80",
        price: 399,
        quantity: 1,
        category: "Wearables",
      },
    ],
    subtotal: 399,
    shipping: 0,
    total: 399,
    address: "742 Evergreen Terrace, Apt 4B, New York, NY 10001",
  },
];

export const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; dot: string }> = {
  processing: { label: "En Proceso",  color: "text-amber-700",  bg: "bg-amber-50",  dot: "bg-amber-500"  },
  shipped:    { label: "Enviado",     color: "text-blue-700",   bg: "bg-blue-50",   dot: "bg-blue-500"   },
  delivered:  { label: "Entregado",   color: "text-green-700",  bg: "bg-green-50",  dot: "bg-green-500"  },
  cancelled:  { label: "Cancelado",   color: "text-red-700",    bg: "bg-red-50",    dot: "bg-red-500"    },
};