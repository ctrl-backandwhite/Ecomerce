export interface AttributeValue {
  id: string;
  value: string;
  color?: string; // for color-type attributes
}

export interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: "text" | "color" | "size" | "select";
  values: AttributeValue[];
  usedInProducts: number;
}

export const attributes: Attribute[] = [
  {
    id: "1",
    name: "Color",
    slug: "color",
    type: "color",
    usedInProducts: 45,
    values: [
      { id: "c1", value: "Negro",          color: "#111827" },
      { id: "c2", value: "Blanco",         color: "#F9FAFB" },
      { id: "c3", value: "Gris",           color: "#6B7280" },
      { id: "c4", value: "Azul",           color: "#3B82F6" },
      { id: "c5", value: "Rojo",           color: "#EF4444" },
      { id: "c6", value: "Verde",          color: "#10B981" },
      { id: "c7", value: "Titanio Negro",  color: "#1F1F1F" },
      { id: "c8", value: "Titanio Blanco", color: "#F5F5F0" },
      { id: "c9", value: "Titanio Natural",color: "#C4A882" },
    ],
  },
  {
    id: "2",
    name: "Capacidad",
    slug: "capacidad",
    type: "select",
    usedInProducts: 22,
    values: [
      { id: "cap1", value: "64GB" },
      { id: "cap2", value: "128GB" },
      { id: "cap3", value: "256GB" },
      { id: "cap4", value: "512GB" },
      { id: "cap5", value: "1TB" },
    ],
  },
  {
    id: "3",
    name: "Talla",
    slug: "talla",
    type: "size",
    usedInProducts: 38,
    values: [
      { id: "t1", value: "XS" },
      { id: "t2", value: "S" },
      { id: "t3", value: "M" },
      { id: "t4", value: "L" },
      { id: "t5", value: "XL" },
      { id: "t6", value: "XXL" },
    ],
  },
  {
    id: "4",
    name: "RAM",
    slug: "ram",
    type: "select",
    usedInProducts: 14,
    values: [
      { id: "r1", value: "4GB" },
      { id: "r2", value: "8GB" },
      { id: "r3", value: "16GB" },
      { id: "r4", value: "32GB" },
      { id: "r5", value: "64GB" },
    ],
  },
  {
    id: "5",
    name: "Material",
    slug: "material",
    type: "text",
    usedInProducts: 19,
    values: [
      { id: "m1", value: "Aluminio" },
      { id: "m2", value: "Titanio" },
      { id: "m3", value: "Plástico" },
      { id: "m4", value: "Fibra de carbono" },
      { id: "m5", value: "Cuero" },
      { id: "m6", value: "Tela" },
    ],
  },
];
