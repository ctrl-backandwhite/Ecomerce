export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: number;
}

export const orders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    customer: {
      name: "María García",
      email: "maria@email.com",
    },
    date: "2026-03-12",
    status: "delivered",
    total: 1548,
    items: 3,
  },
  {
    id: "2",
    orderNumber: "ORD-2024-002",
    customer: {
      name: "Juan Pérez",
      email: "juan@email.com",
    },
    date: "2026-03-11",
    status: "shipped",
    total: 999,
    items: 1,
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    customer: {
      name: "Ana Martínez",
      email: "ana@email.com",
    },
    date: "2026-03-11",
    status: "processing",
    total: 427,
    items: 2,
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    customer: {
      name: "Carlos López",
      email: "carlos@email.com",
    },
    date: "2026-03-10",
    status: "pending",
    total: 1899,
    items: 1,
  },
  {
    id: "5",
    orderNumber: "ORD-2024-005",
    customer: {
      name: "Laura Sánchez",
      email: "laura@email.com",
    },
    date: "2026-03-10",
    status: "delivered",
    total: 648,
    items: 4,
  },
  {
    id: "6",
    orderNumber: "ORD-2024-006",
    customer: {
      name: "Pedro Rodríguez",
      email: "pedro@email.com",
    },
    date: "2026-03-09",
    status: "cancelled",
    total: 249,
    items: 1,
  },
  {
    id: "7",
    orderNumber: "ORD-2024-007",
    customer: {
      name: "Sofía Torres",
      email: "sofia@email.com",
    },
    date: "2026-03-09",
    status: "delivered",
    total: 1298,
    items: 2,
  },
  {
    id: "8",
    orderNumber: "ORD-2024-008",
    customer: {
      name: "Miguel Ángel Ruiz",
      email: "miguel@email.com",
    },
    date: "2026-03-08",
    status: "shipped",
    total: 159,
    items: 1,
  },
];
