/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NexaProductRepository                                       ║
 * ║                                                              ║
 * ║  Fetches products from the NX036 mic-productcategory API.     ║
 * ║  Endpoint: /api/v1/products                                  ║
 * ║  Supports locale, categoryId, page, and size query params.   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { ApiError, NetworkError } from "../lib/AppError";
import { nxFetch } from "../lib/nxFetch";

// ── API base URL ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:6001";
const NX036_PRODUCTS_BASE = `${API_BASE}/api/v1/products`;

// ── API response types ───────────────────────────────────────────────────────

export interface NexaProductTranslation {
    locale: string;
    name: string;
}

// ── Product Detail types (unified variant architecture) ──────────────────────

export interface NexaDetailTranslation {
    locale: string;
    productName: string | null;
    entryName: string | null;
    materialName: string | null;
    packingName: string | null;
    productKey: string | null;
    productPro: string | null;
}

export interface NexaDetailVariantTranslation {
    locale: string;
    variantName: string | null;
}

export interface NexaDetailVariantInventory {
    id: number;
    countryCode: string;
    totalInventory: number;
    cjInventory: number;
    factoryInventory: number;
    verifiedWarehouse: number;
}

export interface NexaDetailVariant {
    vid: string;
    pid: string;
    variantNameEn: string;
    variantSku: string;
    variantUnit: string;
    variantKey: string;
    variantImage: string;
    variantLength: number;
    variantWidth: number;
    variantHeight: number;
    variantVolume: number;
    variantWeight: number;
    variantSellPrice: number;
    variantSugSellPrice: number;
    variantStandard: string | null;
    createTime: string | null;
    createdAt: string;
    updatedAt: string | null;
    translations: NexaDetailVariantTranslation[];
    inventories: NexaDetailVariantInventory[];
}

export interface NexaProduct {
    id: string;
    sku: string;
    categoryId: string;
    name: string;
    bigImage: string;
    productImageSet: string | null;
    sellPrice: string;
    productType: string;
    description: string | null;
    listedNum: number;
    warehouseInventoryNum: number;
    isVideo: boolean;
    createdAt: string;
    updatedAt: string | null;
    translations: NexaProductTranslation[];
    variants: NexaDetailVariant[];
}

export interface NexaProductDetail {
    pid: string;
    productNameEn: string;
    productSku: string;
    bigImage: string;
    productImage: string | null;
    productImageSet: string | null;
    productWeight: string | null;
    productUnit: string | null;
    productType: string;
    categoryId: string;
    categoryName: string | null;
    entryCode: string | null;
    entryNameEn: string | null;
    materialNameEn: string | null;
    materialKey: string | null;
    packingWeight: string | null;
    packingNameEn: string | null;
    packingKey: string | null;
    productKeyEn: string | null;
    productProEn: string | null;
    sellPrice: number;
    description: string | null;
    suggestSellPrice: string | null;
    listedNum: number;
    status: string | null;
    supplierName: string | null;
    supplierId: string | null;
    createrTime: string | null;
    createdAt: string;
    updatedAt: string | null;
    translations: NexaDetailTranslation[];
    variants: NexaDetailVariant[];
}

export interface NexaProductPage {
    content: NexaProduct[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// ── Query params ─────────────────────────────────────────────────────────────

export interface NexaProductQuery {
    locale: string;
    categoryId?: string;
    page?: number;
    size?: number;
}

// ── Repository ───────────────────────────────────────────────────────────────

class NexaProductRepository {
    /**
     * Fetches a page of products from the API.
     * categoryId is optional — omit it to get all products.
     * signal is optional — pass an AbortSignal to cancel the request.
     */
    async findMany(query: NexaProductQuery, signal?: AbortSignal): Promise<NexaProductPage> {
        try {
            const params = new URLSearchParams();
            params.set("locale", query.locale);
            if (query.categoryId) params.set("categoryId", query.categoryId);
            params.set("status", "PUBLISHED");
            params.set("page", String(query.page ?? 0));
            params.set("size", String(query.size ?? 24));

            const url = `${NX036_PRODUCTS_BASE}?${params.toString()}`;
            console.log('[NexaProductRepository] fetch URL:', url);
            const res = await nxFetch(url, { signal });

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch {
                    /* response body was not JSON */
                }
                throw new ApiError(res.status, errorMsg);
            }

            const data: NexaProductPage = await res.json();
            return data;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo conectar con el servicio de productos",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Fetches a single product by its DB ID (UUID or numeric).
     */
    async findById(id: string, locale: string = "es"): Promise<NexaProduct> {
        try {
            const params = new URLSearchParams({ locale });
            const url = `${NX036_PRODUCTS_BASE}/${id}?${params.toString()}`;
            const res = await nxFetch(url);

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch { /* */ }
                throw new ApiError(res.status, errorMsg);
            }

            return (await res.json()) as NexaProduct;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo obtener el producto",
                err instanceof Error ? err : undefined,
            );
        }
    }

    /**
     * Fetches product detail by CJ pid.
     * If the product doesn't exist in the local DB, the backend will fetch it
     * from CJ Dropshipping, persist it, and return it.
     * Returns the full ProductDetail shape (separate table architecture).
     */
    async findDetailByPid(pid: string, locale: string, signal?: AbortSignal): Promise<NexaProductDetail> {
        try {
            const params = new URLSearchParams({ locale });
            const url = `${NX036_PRODUCTS_BASE}/detail/${pid}?${params.toString()}`;
            console.log('[NexaProductRepository] detail URL:', url);
            const res = await nxFetch(url, { signal });

            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch {
                    /* response body was not JSON */
                }
                throw new ApiError(res.status, errorMsg);
            }

            return (await res.json()) as NexaProductDetail;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError(
                "No se pudo obtener el detalle del producto",
                err instanceof Error ? err : undefined,
            );
        }
    }
}

// Singleton
export const nexaProductRepository = new NexaProductRepository();
