/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NexaProductMapper                                           ║
 * ║                                                              ║
 * ║  Maps the raw API product (NexaProduct) to the domain        ║
 * ║  Product type used throughout the frontend.                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import type { Product, ProductImage, ProductVariant } from "../types/product";
import type { NexaProduct, NexaProductDetail, NexaDetailVariant } from "../repositories/NexaProductRepository";
import type { ProductSearchHit } from "../repositories/SearchRepository";
import { slugify } from "../lib/urls";

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/** Parse a JSON-encoded array string like '["Metal"]' into "Metal". */
function parseJsonArray(raw: string | null): string | null {
    if (!raw) return null;
    try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.join(", ") : raw;
    } catch {
        return raw;
    }
}

/**
 * Split a composite variantKey (e.g. "Red-S") into named attributes
 * using the productKeyEn schema (e.g. "Color-Size").
 * Splits from the right so multi-word first values ("Dark Blue-XL") work.
 */
function parseVariantAttributes(
    productKeyEn: string | null | undefined,
    variantKey: string,
): Record<string, string> {
    if (!productKeyEn || !variantKey) return { key: variantKey };
    const names = productKeyEn.split("-");
    if (names.length === 1) return { [names[0]]: variantKey };

    const result: Record<string, string> = {};
    let remaining = variantKey;

    for (let i = names.length - 1; i >= 0; i--) {
        if (i === 0) {
            result[names[i]] = remaining;
        } else {
            const lastDash = remaining.lastIndexOf("-");
            if (lastDash === -1) {
                result[names[i]] = remaining;
                remaining = "";
            } else {
                result[names[i]] = remaining.substring(lastDash + 1);
                remaining = remaining.substring(0, lastDash);
            }
        }
    }
    return result;
}

function mapVariant(
    v: NexaDetailVariant,
    productKeyEn?: string | null,
    fallbackStock?: number,
): ProductVariant {
    const stock = v.inventories
        ? v.inventories.reduce((sum, inv) => sum + (inv.totalInventory ?? 0), 0)
        : 0;
    return {
        id: v.vid,
        sku: v.variantSku,
        price: v.retailPrice ?? v.variantSellPrice,
        stock_quantity: stock > 0 ? stock : (fallbackStock ?? 0),
        attributes: parseVariantAttributes(productKeyEn, v.variantKey),
    };
}

function buildImages(product: NexaProduct): ProductImage[] {
    const images: ProductImage[] = [];
    const seen = new Set<string>();

    // Main image
    if (product.bigImage) {
        images.push({ url: product.bigImage, alt: product.name, position: 0 });
        seen.add(product.bigImage);
    }

    // Images from productImageSet (comma-separated URLs from CJ)
    if (product.productImageSet) {
        const imageUrls = product.productImageSet.split(",").map(u => u.trim()).filter(Boolean);
        imageUrls.forEach((url, i) => {
            if (!seen.has(url)) {
                seen.add(url);
                images.push({ url, alt: product.name, position: images.length });
            }
        });
    }

    // Variant images (deduplicated)
    if (product.variants) {
        product.variants.forEach((v) => {
            if (v.variantImage && !seen.has(v.variantImage)) {
                seen.add(v.variantImage);
                images.push({ url: v.variantImage, alt: product.name, position: images.length });
            }
        });
    }

    return images;
}

// ── Mapper ───────────────────────────────────────────────────────────────────

/**
 * Maps a single NexaProduct (API shape) to the frontend Product type.
 * categoryName is optional — supplied when the category tree is available.
 */
/** Parse a sell price that may be a range like "0.84-2.94" or a plain number */
function parseSellPrice(val: string | number | null | undefined): { min: number; max?: number } {
    const str = String(val ?? "0");
    const parts = str.split("-").map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (parts.length >= 2) {
        const sorted = parts.sort((a, b) => a - b);
        return { min: sorted[0], max: sorted[sorted.length - 1] };
    }
    return { min: parts[0] ?? 0 };
}

export function mapNexaProduct(
    raw: NexaProduct,
    categoryName?: string,
): Product {
    // Prefer sellPriceRaw (pre-converted numeric) over parsing the string
    const { min: price, max: priceMax } = raw.sellPriceRaw != null
        ? { min: raw.sellPriceRaw, max: undefined }
        : parseSellPrice(raw.sellPrice);
    const { min: cost } = raw.costPriceRaw != null
        ? { min: raw.costPriceRaw }
        : parseSellPrice(raw.costPrice);
    const firstVariant = raw.variants?.[0];

    // Calculate total inventory across all variant inventories
    const totalInventory = raw.variants
        ? raw.variants.reduce((sum, v) =>
            sum + (v.inventories
                ? v.inventories.reduce((s, inv) => s + (inv.totalInventory ?? 0), 0)
                : 0), 0)
        : 0;

    // Fallback stock: listing endpoint rarely ships real inventory rows, so use
    // warehouseInventoryNum, then listedNum (CJ active-seller count) as an
    // availability signal — same policy as mapNexaProductDetail to avoid
    // mismatches between the listing and the product page.
    const effectiveStock = totalInventory > 0
        ? totalInventory
        : (raw.warehouseInventoryNum > 0
            ? raw.warehouseInventoryNum
            : (raw.listedNum > 0 ? raw.listedNum : 0));

    return {
        id: raw.id,
        name: raw.name,
        slug: slugify(raw.name),
        sku: raw.sku,
        brand: "",
        description: raw.description || raw.name,
        shortDescription: raw.description ? stripHtml(raw.description).substring(0, 200) : raw.name,
        price,
        priceMax,
        costPrice: cost || undefined,
        taxClass: "standard",
        category: categoryName ?? raw.categoryId,
        subcategory: "",
        keywords: [],
        image: raw.bigImage,
        images: buildImages(raw),
        rating: 0,
        reviews: 0,
        stock: effectiveStock,
        barcode: raw.sku,
        stockStatus: effectiveStock > 0 ? "in_stock" : "out_of_stock",
        manageStock: true,
        allowBackorder: false,
        attributes: [],
        variants: raw.variants ? raw.variants.map(v => mapVariant(v)) : [],
        weight: firstVariant ? firstVariant.variantWeight / 1000 : 0,        // CJ reports grams → convert to kg
        dimensions: firstVariant
            ? {
                length: firstVariant.variantLength / 10,   // CJ reports mm → convert to cm
                width: firstVariant.variantWidth / 10,
                height: firstVariant.variantHeight / 10,
            }
            : { length: 0, width: 0, height: 0 },
        shippingClass: "standard",
        metaTitle: raw.name,
        metaDescription: raw.name,
        status: "active",
        visibility: "public",
        featured: false,
        currencyCode: raw.currencyCode,
        currencySymbol: raw.currencySymbol,
    };
}

/**
 * Maps an array of NexaProduct to Product[].
 * categoryMap: Record<categoryId, categoryName> for resolving names.
 */
export function mapNexaProducts(
    rawProducts: NexaProduct[],
    categoryMap?: Record<string, string>,
): Product[] {
    return rawProducts.map((raw) =>
        mapNexaProduct(raw, categoryMap?.[raw.categoryId]),
    );
}

// ── Detail mapper ────────────────────────────────────────────────────────────

function buildDetailImages(detail: NexaProductDetail): ProductImage[] {
    const images: ProductImage[] = [];
    const seen = new Set<string>();
    const name = detail.productNameEn;

    // Main image
    if (detail.bigImage) {
        images.push({ url: detail.bigImage, alt: name, position: 0 });
        seen.add(detail.bigImage);
    }

    // Product images (JSON array string like '["url1","url2"]')
    if (detail.productImage) {
        try {
            const parsed = JSON.parse(detail.productImage);
            if (Array.isArray(parsed)) {
                parsed.forEach((url: string) => {
                    if (url && !seen.has(url)) {
                        seen.add(url);
                        images.push({ url, alt: name, position: images.length });
                    }
                });
            }
        } catch {
            // Not JSON — treat as single URL
            if (!seen.has(detail.productImage)) {
                seen.add(detail.productImage);
                images.push({ url: detail.productImage, alt: name, position: images.length });
            }
        }
    }

    // Images from productImageSet (comma-separated URLs)
    if (detail.productImageSet) {
        const imageUrls = detail.productImageSet.split(",").map(u => u.trim()).filter(Boolean);
        imageUrls.forEach((url) => {
            if (!seen.has(url)) {
                seen.add(url);
                images.push({ url, alt: name, position: images.length });
            }
        });
    }

    // Variant images (deduplicated)
    if (detail.variants) {
        detail.variants.forEach((v) => {
            if (v.variantImage && !seen.has(v.variantImage)) {
                seen.add(v.variantImage);
                images.push({ url: v.variantImage, alt: name, position: images.length });
            }
        });
    }

    return images;
}

/**
 * Maps a NexaProductDetail (from the product_details table) to the
 * frontend Product type used throughout the UI.
 */
export function mapNexaProductDetail(raw: NexaProductDetail): Product {
    // Prefer sellPriceRaw (pre-converted numeric) over parsing the string
    const { min: price, max: priceMax } = raw.sellPriceRaw != null
        ? { min: raw.sellPriceRaw, max: undefined }
        : parseSellPrice(raw.sellPrice);
    const suggestedPrice = raw.suggestSellPrice ? parseFloat(raw.suggestSellPrice) : undefined;
    const firstVariant = raw.variants?.[0];

    // Calculate total inventory across all variant inventories
    const totalInventory = raw.variants
        ? raw.variants.reduce((sum, v) =>
            sum + (v.inventories
                ? v.inventories.reduce((s, inv) => s + (inv.totalInventory ?? 0), 0)
                : 0), 0)
        : 0;

    // Fallback stock: if no real inventory data, use listedNum as availability signal
    const effectiveStock = totalInventory > 0 ? totalInventory : (raw.listedNum > 0 ? raw.listedNum : 0);

    // Variant stock fallback: distribute effectiveStock across variants when
    // no real inventory records exist. This prevents "out of stock" on products
    // that have warehouse/listedNum data but empty variant inventories.
    const variantCount = raw.variants?.length ?? 1;
    const variantFallbackStock = effectiveStock > 0
        ? Math.ceil(effectiveStock / variantCount)
        : 0;

    // ── Build attributes ("Ficha técnica") from detail fields ──
    const attrs: { name: string; value: string }[] = [];
    const pushAttr = (name: string, value: string | null | undefined) => {
        if (value) attrs.push({ name, value });
    };
    pushAttr("Tipo de producto", raw.productType);
    pushAttr("Peso del producto", raw.productWeight);
    pushAttr("Unidad", raw.productUnit);
    pushAttr("Material", parseJsonArray(raw.materialNameEn));
    pushAttr("Embalaje", parseJsonArray(raw.packingNameEn));
    pushAttr("Peso con empaque", raw.packingWeight);
    pushAttr("Código arancelario", raw.entryCode);
    pushAttr("Clasificación aduanera", raw.entryNameEn);
    pushAttr("Opciones", raw.productKeyEn);
    if (suggestedPrice && suggestedPrice > 0) {
        pushAttr("Precio sugerido de venta", `$${suggestedPrice.toFixed(2)}`);
    }
    pushAttr("Vendedores activos", raw.listedNum > 0 ? String(raw.listedNum) : null);
    pushAttr("Estado CJ", raw.status === "3" ? "Activo" : raw.status);
    if (raw.createrTime) {
        pushAttr("Publicado en CJ", new Date(raw.createrTime).toLocaleDateString("es-ES", {
            day: "numeric", month: "long", year: "numeric",
        }));
    }

    // ── Extract subcategory from categoryName path ──
    const categoryParts = raw.categoryName?.split(" > ") ?? [];
    const topCategory = categoryParts[0] || raw.categoryId;
    const subCategory = categoryParts.length > 1 ? categoryParts.slice(1).join(" > ") : "";

    return {
        id: raw.pid,
        name: raw.productNameEn,
        slug: slugify(raw.productNameEn),
        sku: raw.productSku,
        brand: raw.supplierName ?? "",
        description: raw.description || raw.productNameEn,
        shortDescription: raw.description ? stripHtml(raw.description).substring(0, 200) : raw.productNameEn,
        price,
        priceMax,
        originalPrice: (suggestedPrice && suggestedPrice > price) ? suggestedPrice : undefined,
        taxClass: "standard",
        category: topCategory,
        subcategory: subCategory,
        keywords: [],
        image: raw.bigImage,
        images: buildDetailImages(raw),
        rating: 0,
        reviews: 0,
        stock: effectiveStock,
        barcode: raw.productSku,
        stockStatus: effectiveStock > 0 ? "in_stock" : "out_of_stock",
        manageStock: true,
        allowBackorder: false,
        attributes: attrs,
        variants: raw.variants
            ? raw.variants.map(v => mapVariant(v, raw.productKeyEn, variantFallbackStock))
            : [],
        weight: firstVariant ? firstVariant.variantWeight / 1000 : 0,        // CJ reports grams → convert to kg
        dimensions: firstVariant
            ? {
                length: firstVariant.variantLength / 10,   // CJ reports mm → convert to cm
                width: firstVariant.variantWidth / 10,
                height: firstVariant.variantHeight / 10,
            }
            : { length: 0, width: 0, height: 0 },
        shippingClass: "standard",
        metaTitle: raw.productNameEn,
        metaDescription: raw.productNameEn,
        status: "active",
        visibility: "public",
        featured: false,
        currencyCode: raw.currencyCode,
        currencySymbol: raw.currencySymbol,
    };
}

export function mapSearchHitToProduct(hit: ProductSearchHit): Product {
    return {
        id: hit.id,
        name: hit.name,
        slug: hit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sku: "",
        brand: hit.brandName ?? "",
        description: hit.description ?? hit.name,
        shortDescription: hit.description ? hit.description.substring(0, 200) : hit.name,
        price: hit.price ?? 0,
        originalPrice: hit.originalPrice ?? undefined,
        taxClass: "standard",
        category: hit.categoryName ?? "",
        subcategory: "",
        keywords: [],
        image: hit.imageUrl ?? "",
        images: [],
        rating: 0,
        reviews: 0,
        stock: hit.totalStock,
        barcode: "",
        stockStatus: hit.inStock ? "in_stock" : "out_of_stock",
        manageStock: false,
        allowBackorder: false,
        attributes: [],
        variants: [],
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        shippingClass: "",
        metaTitle: "",
        metaDescription: "",
        status: "active",
        visibility: "public",
        featured: false,
    };
}
