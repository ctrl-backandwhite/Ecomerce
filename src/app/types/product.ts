/* ── Product types (UI-facing, mapped from NexaProduct by NexaProductMapper) ── */

export interface ProductImage {
    url: string;
    alt: string;
    position: number;
}

export interface ProductAttribute {
    name: string;
    value: string;
}

export interface ProductVariant {
    id: string;
    sku: string;
    price: number;
    stock_quantity: number;
    attributes: Record<string, string>;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    sku: string;
    brand: string;
    description: string;
    shortDescription: string;
    price: number;
    priceMax?: number;
    originalPrice?: number;
    salePrice?: number;
    costPrice?: number;
    taxClass: string;
    category: string;
    /** Original category UUID from the backend; stable across locale changes. */
    categoryId?: string;
    subcategory: string;
    keywords: string[];
    image: string;
    images: ProductImage[];
    rating: number;
    reviews: number;
    stock: number;
    barcode: string;
    stockStatus: "in_stock" | "out_of_stock" | "backorder";
    manageStock: boolean;
    allowBackorder: boolean;
    attributes: ProductAttribute[];
    variants: ProductVariant[];
    weight: number;
    dimensions: { length: number; width: number; height: number };
    shippingClass: string;
    metaTitle: string;
    metaDescription: string;
    status: "active" | "draft" | "archived";
    visibility: "public" | "private" | "hidden";
    featured: boolean;
    warrantyId?: string;
    /** ISO 4217 currency code from backend (e.g. "EUR") */
    currencyCode?: string;
    /** Currency symbol from backend (e.g. "€") */
    currencySymbol?: string;
}
