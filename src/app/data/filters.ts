import { Product } from "./products";

/**
 * Display config for the sidebar – what filter groups/options to show per category.
 * Keys must match the `category` field in products.
 */
export const CATEGORY_ATTR_FILTERS: Record<
  string,
  { groupLabel: string; options: string[] }[]
> = {
  Electrónica: [
    {
      groupLabel: "Sistema Operativo",
      options: ["iOS / iPadOS", "Android", "macOS", "Windows"],
    },
    {
      groupLabel: "Tipo de producto",
      options: ["Smartphones", "Laptops", "Tablets"],
    },
  ],
  Audio: [
    {
      groupLabel: "Tipo de conexión",
      options: ["Bluetooth / Wireless", "Cableado"],
    },
  ],
  Fotografía: [
    {
      groupLabel: "Tipo de cámara",
      options: ["Mirrorless / Réflex", "Acción / Deportiva"],
    },
  ],
  Moda: [
    {
      groupLabel: "Género",
      options: ["Hombre", "Mujer", "Unisex"],
    },
  ],
  Gaming: [
    {
      groupLabel: "Tipo de producto",
      options: ["Consolas", "Periféricos"],
    },
  ],
};

/**
 * Matching functions used in Home.tsx to filter products.
 * Keys must align with the option strings defined in CATEGORY_ATTR_FILTERS.
 */
export const ATTR_MATCH: Record<
  string,
  Record<string, (p: Product) => boolean>
> = {
  Electrónica: {
    "iOS / iPadOS": (p) =>
      p.attributes.some(
        (a) =>
          a.name === "Sistema operativo" &&
          (a.value.includes("iOS") || a.value.includes("iPadOS"))
      ),
    Android: (p) =>
      p.attributes.some(
        (a) =>
          a.name === "Sistema operativo" && a.value.includes("Android")
      ),
    macOS: (p) =>
      p.attributes.some(
        (a) =>
          a.name === "Sistema operativo" && a.value.includes("macOS")
      ),
    Windows: (p) =>
      p.attributes.some(
        (a) =>
          (a.name === "Sistema operativo" || a.name === "S.O.") &&
          a.value.includes("Windows")
      ),
    Smartphones: (p) => p.subcategory === "Smartphones",
    Laptops: (p) => p.subcategory === "Laptops",
    Tablets: (p) => p.subcategory === "Tablets",
  },
  Audio: {
    "Bluetooth / Wireless": (p) =>
      p.attributes.some(
        (a) =>
          a.value.toLowerCase().includes("bluetooth") ||
          a.value.toLowerCase().includes("wireless")
      ),
    Cableado: (p) =>
      !p.attributes.some(
        (a) =>
          a.value.toLowerCase().includes("bluetooth") ||
          a.value.toLowerCase().includes("wireless")
      ),
  },
  Fotografía: {
    "Mirrorless / Réflex": (p) =>
      p.attributes.some((a) =>
        a.value.toLowerCase().includes("mirrorless")
      ),
    "Acción / Deportiva": (p) => p.brand === "GoPro",
  },
  Moda: {
    Hombre: (p) =>
      p.attributes.some(
        (a) =>
          a.name === "Género" &&
          (a.value.includes("Hombre") || a.value.includes("hombre"))
      ),
    Mujer: (p) =>
      p.attributes.some(
        (a) =>
          a.name === "Género" &&
          (a.value.includes("Mujer") || a.value.includes("mujer"))
      ),
    Unisex: (p) =>
      p.attributes.some(
        (a) =>
          a.name === "Género" &&
          (a.value.includes("Unisex") || a.value.includes("unisex"))
      ),
  },
  Gaming: {
    Consolas: (p) => p.subcategory === "Consolas",
    Periféricos: (p) => p.subcategory === "Periféricos Gaming",
  },
};
