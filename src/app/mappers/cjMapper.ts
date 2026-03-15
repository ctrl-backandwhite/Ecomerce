/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  cjMapper — CJ Dropshipping API → NEXA domain models        ║
 * ║                                                              ║
 * ║  Single responsibility: convert raw CJ API shapes into the  ║
 * ║  canonical Product / Category types used throughout the app. ║
 * ║                                                              ║
 * ║  Rules:                                                      ║
 * ║  • Never throws — all fields have safe defaults.             ║
 * ║  • Pure functions — no side effects, no API calls.           ║
 * ║  • Exported as a namespace object for easy mocking in tests. ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import type {
  Product,
  ProductImage,
  ProductAttribute,
  ProductVariant,
} from "../data/products";
import type { Category } from "../data/adminData";
import type {
  CJProduct,
  CJProductDetail,
  CJProductVariant,
  CJCategory,
} from "../services/cjApi";

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Converts any string to a URL-safe slug. */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parses a CJ `variantKey` field into a flat attribute map.
 *
 * CJ uses several formats in the wild:
 *   • JSON object  : `{"Color":"Red","Size":"XL"}`
 *   • Colon/semi   : `Color:Red;Size:XL`
 *   • Free text    : `Red-XL`  →  { Variante: "Red-XL" }
 */
function parseVariantAttributes(v: CJProductVariant): Record<string, string> {
  if (v.variantKey) {
    // ── Try JSON object ──
    try {
      const parsed = JSON.parse(v.variantKey);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      /* not JSON */
    }

    // ── Try k:v;k:v ──
    if (v.variantKey.includes(":")) {
      const attrs: Record<string, string> = {};
      v.variantKey.split(";").forEach((part) => {
        const sep = part.indexOf(":");
        if (sep > -1) {
          attrs[part.slice(0, sep).trim()] = part.slice(sep + 1).trim();
        }
      });
      if (Object.keys(attrs).length) return attrs;
    }

    // ── Fallback: raw value ──
    return { Variante: v.variantKey };
  }

  if (v.variantNameEn) return { Variante: v.variantNameEn };
  if (v.variantName)   return { Variante: v.variantName };

  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Public mapper namespace
// ─────────────────────────────────────────────────────────────────────────────

export const cjMapper = {
  /**
   * Maps a lightweight `CJProduct` (returned by `/product/listV2`) to the
   * internal `Product` type. Suitable for catalog cards — variants and full
   * description are intentionally omitted to keep memory usage low.
   */
  productListItem(cj: CJProduct): Product {
    return {
      id:               cj.pid,
      name:             cj.productNameEn,
      slug:             cj.pid,
      sku:              `CJ-${cj.pid.slice(0, 8).toUpperCase()}`,
      brand:            "CJ Dropshipping",
      description:      "",
      shortDescription: cj.categoryName ?? "CJ Dropshipping",
      price:            cj.sellPrice ?? 0,
      taxClass:         "standard",
      category:         cj.categoryName ?? "Dropshipping",
      subcategory:      "",
      keywords:         [],
      image:            cj.productImage ?? "",
      images:           cj.productImage
        ? [{ url: cj.productImage, alt: cj.productNameEn, position: 0 }]
        : [],
      rating:           0,
      reviews:          0,
      stock:            999,
      barcode:          "",
      stockStatus:      "in_stock",
      manageStock:      false,
      allowBackorder:   true,
      attributes:       [],
      variants:         [],
      weight:           cj.productWeight ?? 0,
      dimensions:       { length: 0, width: 0, height: 0 },
      shippingClass:    "standard",
      metaTitle:        cj.productNameEn,
      metaDescription:  cj.categoryName ?? "",
      status:           "active",
      visibility:       "public",
      featured:         false,
    };
  },

  /**
   * Maps a full `CJProductDetail` (returned by `/product/query`) to the
   * internal `Product` type with variants, attributes, gallery, and dimensions.
   */
  productDetail(cj: CJProductDetail): Product {
    // ── Map variants ──────────────────────────────────────────────────────
    const variants: ProductVariant[] = (cj.variants ?? []).map((v) => ({
      id:              v.vid,
      sku:             v.variantSku,
      price:           v.variantPrice ?? 0,
      stock_quantity:  v.variantStock ?? 0,
      attributes:      parseVariantAttributes(v),
    }));

    const totalStock =
      variants.length > 0
        ? variants.reduce((sum, v) => sum + v.stock_quantity, 0)
        : 999;

    // ── Build gallery (deduplicated) ──────────────────────────────────────
    const seenUrls  = new Set<string>();
    const images: ProductImage[] = [];
    const rawImages = [
      cj.productImage,
      ...(cj.productImages ?? []),
      ...(cj.variants ?? [])
        .map((v) => v.variantImage)
        .filter(Boolean) as string[],
    ];
    rawImages.forEach((url, pos) => {
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        images.push({ url, alt: `${cj.productNameEn} ${pos + 1}`, position: pos });
      }
    });

    // ── Derive attribute summary from variant data ────────────────────────
    const attrKeys = new Set<string>();
    variants.forEach((v) => Object.keys(v.attributes).forEach((k) => attrKeys.add(k)));
    const attributes: ProductAttribute[] = Array.from(attrKeys).map((name) => ({
      name,
      value: [...new Set(variants.map((v) => v.attributes[name]).filter(Boolean))].join(", "),
    }));

    // Additional descriptive attributes from product-level fields
    if (cj.productWeight && cj.productWeight > 0) {
      attributes.push({ name: "Peso", value: `${cj.productWeight}g` });
    }
    if (cj.productUnit) {
      attributes.push({ name: "Unidad", value: cj.productUnit });
    }
    if (cj.productSku) {
      attributes.push({ name: "SKU Proveedor", value: cj.productSku });
    }
    if (cj.categoryName) {
      attributes.push({ name: "Categoría CJ", value: cj.categoryName });
    }

    return {
      id:               cj.pid,
      name:             cj.productNameEn,
      slug:             cj.pid,
      sku:              cj.productSku ?? `CJ-${cj.pid.slice(0, 8).toUpperCase()}`,
      brand:            "CJ Dropshipping",
      description:      cj.description ?? "",
      shortDescription: cj.categoryName ?? "CJ Dropshipping",
      price:            cj.sellPrice ?? 0,
      taxClass:         "standard",
      category:         cj.categoryName ?? "Dropshipping",
      subcategory:      "",
      keywords:         [],
      image:            cj.productImage ?? "",
      images,
      rating:           0,
      reviews:          0,
      stock:            totalStock,
      barcode:          "",
      stockStatus:      totalStock > 0 ? "in_stock" : "out_of_stock",
      manageStock:      variants.length > 0,
      allowBackorder:   false,
      attributes,
      variants,
      weight:           cj.productWeight ?? 0,
      dimensions: {
        length: cj.productDimensionLength ?? 0,
        width:  cj.productDimensionWidth  ?? 0,
        height: cj.productDimensionHeight ?? 0,
      },
      shippingClass:    "standard",
      metaTitle:        cj.productNameEn,
      metaDescription:  cj.categoryName ?? "",
      status:           "active",
      visibility:       "public",
      featured:         false,
    };
  },

  /**
   * Maps a `CJCategory` to the internal `Category` type.
   * @param order Zero-based index used as display order.
   */
  category(cj: CJCategory, order: number): Category {
    return {
      id:           cj.categoryId,
      name:         cj.categoryName,
      slug:         slugify(cj.categoryName),
      description:  "",
      keywords:     [],
      parent_id:    cj.parentId ?? null,
      productCount: cj.productCount ?? 0,
      status:       "active",
      published:    true,
      order,
    };
  },
} as const;
