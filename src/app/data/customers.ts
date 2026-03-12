export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  joinDate: string;
  status: "active" | "inactive";
}

export const customers: Customer[] = [
  {
    id: "1",
    name: "María García",
    email: "maria@email.com",
    phone: "+1 234 567 8901",
    orders: 12,
    totalSpent: 4560,
    joinDate: "2025-01-15",
    status: "active",
  },
  {
    id: "2",
    name: "Juan Pérez",
    email: "juan@email.com",
    phone: "+1 234 567 8902",
    orders: 8,
    totalSpent: 2340,
    joinDate: "2025-02-20",
    status: "active",
  },
  {
    id: "3",
    name: "Ana Martínez",
    email: "ana@email.com",
    phone: "+1 234 567 8903",
    orders: 15,
    totalSpent: 6780,
    joinDate: "2024-11-10",
    status: "active",
  },
  {
    id: "4",
    name: "Carlos López",
    email: "carlos@email.com",
    phone: "+1 234 567 8904",
    orders: 3,
    totalSpent: 890,
    joinDate: "2026-01-05",
    status: "active",
  },
  {
    id: "5",
    name: "Laura Sánchez",
    email: "laura@email.com",
    phone: "+1 234 567 8905",
    orders: 20,
    totalSpent: 9120,
    joinDate: "2024-09-12",
    status: "active",
  },
  {
    id: "6",
    name: "Pedro Rodríguez",
    email: "pedro@email.com",
    phone: "+1 234 567 8906",
    orders: 1,
    totalSpent: 249,
    joinDate: "2026-03-01",
    status: "inactive",
  },
  {
    id: "7",
    name: "Sofía Torres",
    email: "sofia@email.com",
    phone: "+1 234 567 8907",
    orders: 6,
    totalSpent: 3450,
    joinDate: "2025-04-18",
    status: "active",
  },
  {
    id: "8",
    name: "Miguel Ángel Ruiz",
    email: "miguel@email.com",
    phone: "+1 234 567 8908",
    orders: 4,
    totalSpent: 1560,
    joinDate: "2025-06-22",
    status: "active",
  },
];
