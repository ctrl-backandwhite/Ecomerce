/* ── Admin types (Category, SellerStore) ────────────────────── */

export interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    description: string;
    keywords: string[];
    parent_id: string | null;
    productCount: number;
    status: "active" | "inactive";
    published: boolean;
    order: number;
}

export interface Subcategory {
    id: string;
    name: string;
    slug: string;
    productCount: number;
    status: "active" | "inactive";
    order: number;
}

export interface SellerStore {
    id: string;
    name: string;
    slug: string;
    ownerName: string;
    ownerEmail: string;
    category: string;
    status: "active" | "pending" | "suspended" | "draft";
    totalSales: number;
    totalRevenue: number;
    rating: number;
    reviewCount: number;
    joinDate: string;
    phone: string;
    website: string;
    description: string;
    verified: boolean;
}
