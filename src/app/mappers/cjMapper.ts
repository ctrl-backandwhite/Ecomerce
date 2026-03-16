/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  supplierMapper — Supplier API → NEXA domain models          ║
 * ║                                                              ║
 * ║  Single responsibility: convert raw supplier API shapes into ║
 * ║  the canonical Product / Category types used throughout the  ║
 * ║  app.                                                        ║
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
  CJProductListItem,
} from "../services/cjApi";
import { getCategoryById, getCategoryByName } from "../data/categoryLookup";

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
 * Parses a CJ sell-price string into a numeric value (USD).
 *
 * The API returns prices as strings in two formats:
 *   • Single value : "3.69"
 *   • Range        : "4.36 -- 6.14"  →  we take the minimum (lowest dropship cost)
 *
 * Returns 0 on any parse failure so callers never receive NaN.
 */
function parseCJPrice(raw: string | null | undefined): number {
  if (!raw) return 0;
  const parts = raw
    .split("--")
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));
  return parts.length > 0 ? Math.min(...parts) : 0;
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
   * Maps a lightweight `CJProductListItem` (returned by `/product/listV2`) to the
   * internal `Product` type. Suitable for catalog cards — variants and full
   * description are intentionally omitted to keep memory usage low.
   *
   * Key field differences vs. `/product/query`:
   *   id        → was pid
   *   nameEn    → was productNameEn
   *   bigImage  → was productImage
   *   sellPrice → string ("3.69" or "4.36 -- 6.14"), not a number
   *   sku       → provided directly
   *   warehouseInventoryNum → total warehouse stock
   */
  productListItem(cj: CJProductListItem): Product {
    const price = parseCJPrice(cj.sellPrice);
    const stock = cj.warehouseInventoryNum ?? 999;
    // Resolve category hierarchy: categoryFirstName → category, categorySecondName → subcategory
    const catInfo = getCategoryById(cj.categoryId);
    return {
      id:               cj.id,
      name:             cj.nameEn,
      slug:             cj.id,
      sku:              cj.sku ?? `CJ-${cj.id.slice(0, 8).toUpperCase()}`,
      brand:            "NEXA",
      description:      "",
      shortDescription: "",
      price,
      taxClass:         "standard",
      category:         catInfo.category,
      subcategory:      catInfo.subcategory,
      keywords:         [],
      image:            cj.bigImage ?? "",
      images:           cj.bigImage
        ? [{ url: cj.bigImage, alt: cj.nameEn, position: 0 }]
        : [],
      rating:           0,
      reviews:          0,
      stock,
      barcode:          "",
      stockStatus:      stock > 0 ? "in_stock" : "out_of_stock",
      manageStock:      false,
      allowBackorder:   true,
      attributes:       [],
      variants:         [],
      weight:           0,
      dimensions:       { length: 0, width: 0, height: 0 },
      shippingClass:    "standard",
      metaTitle:        cj.nameEn,
      metaDescription:  "",
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
      brand:            "NEXA",
      description:      cj.description ?? "",
      shortDescription: cj.categoryName ?? "",
      price:            parseCJPrice(cj.sellPrice),
      taxClass:         "standard",
      // Prefer ID lookup (more accurate), fall back to name lookup
      category:         (() => {
        const byId   = getCategoryById(cj.categoryId);
        if (byId.category !== "Other") return byId.category;
        return getCategoryByName(cj.categoryName).category;
      })(),
      subcategory:      (() => {
        const byId   = getCategoryById(cj.categoryId);
        if (byId.category !== "Other") return byId.subcategory;
        return getCategoryByName(cj.categoryName).subcategory;
      })(),
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
   * Maps a `CJCategory` (already flattened by `flattenCJCategories`) to the
   * internal `Category` type used across admin and storefront.
   *
   * Level mapping:
   *   1 → root parent (parent_id = null)
   *   2 → second-level group (parent_id = categoryFirstId)
   *   3 → leaf / product category (parent_id = categorySecondId)
   *
   * @param order Zero-based index for display ordering.
   */
  category(cj: CJCategory, order: number): Category {
    return {
      id:           cj.categoryId,
      name:         cj.categoryName,
      slug:         slugify(cj.categoryName),
      description:  "",
      keywords:     [],
      parent_id:    cj.parentId ?? null,
      productCount: 0,
      status:       "active",
      published:    true,
      order,
    };
  },
} as const;