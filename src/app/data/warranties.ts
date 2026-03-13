// ── Warranty types ─────────────────────────────────────────────────────────
export type WarrantyType = "manufacturer" | "store" | "extended" | "limited";

export interface Warranty {
  id: string;
  name: string;
  type: WarrantyType;
  durationMonths: number;
  coverage: string;
  conditions: string;
  includesLabor: boolean;
  includesParts: boolean;
  includesPickup: boolean;
  repairLimit: number | null;
  contactPhone: string;
  contactEmail: string;
  active: boolean;
  productsCount: number;
}

// ── Type metadata ───────────────────────────────────────────────────────────
export const WARRANTY_TYPE_META: Record<WarrantyType, { label: string; bg: string; text: string }> = {
  manufacturer: { label: "Fabricante",   bg: "bg-blue-50",   text: "text-blue-700"   },
  store:        { label: "NEXA",          bg: "bg-violet-50", text: "text-violet-700" },
  extended:     { label: "Extendida",     bg: "bg-green-50",  text: "text-green-700"  },
  limited:      { label: "Limitada",      bg: "bg-amber-50",  text: "text-amber-700"  },
};

// ── Initial warranties ──────────────────────────────────────────────────────
export const initialWarranties: Warranty[] = [
  {
    id: "w1",
    name: "Garantía oficial Apple 1 año",
    type: "manufacturer",
    durationMonths: 12,
    coverage: "Defectos de fabricación en hardware y batería.",
    conditions: "No cubre daños físicos, líquidos ni uso inadecuado. La garantía se activa con la fecha de compra. Reparaciones realizadas en el Servicio Técnico Oficial Apple (ASP). Se puede ampliar con AppleCare+.",
    includesLabor: true,
    includesParts: true,
    includesPickup: false,
    repairLimit: null,
    contactPhone: "+34 900 150 503",
    contactEmail: "soporte-apple@nexa.com",
    active: true,
    productsCount: 3,
  },
  {
    id: "w2",
    name: "Garantía oficial Samsung 2 años",
    type: "manufacturer",
    durationMonths: 24,
    coverage: "Defectos de fabricación y pantalla (excluye roto accidental).",
    conditions: "Cubre defectos de materiales y fabricación. No incluye daños por agua, caídas ni mal uso. Presentar factura de compra en cualquier SAT Samsung autorizado.",
    includesLabor: true,
    includesParts: true,
    includesPickup: false,
    repairLimit: null,
    contactPhone: "+34 902 172 678",
    contactEmail: "soporte-samsung@nexa.com",
    active: true,
    productsCount: 2,
  },
  {
    id: "w3",
    name: "Garantía NEXA 2 años",
    type: "store",
    durationMonths: 24,
    coverage: "Garantía ampliada de tienda con recogida a domicilio incluida.",
    conditions: "Garantía gestionada íntegramente por NEXA. Incluye recogida y entrega a domicilio sin coste. Cubre defectos funcionales detectados en uso normal. Tiempo de resolución máximo: 15 días laborables. Se incluye producto sustituto si la reparación supera 5 días.",
    includesLabor: true,
    includesParts: true,
    includesPickup: true,
    repairLimit: 2,
    contactPhone: "+34 91 123 45 67",
    contactEmail: "garantias@nexa.com",
    active: true,
    productsCount: 7,
  },
  {
    id: "w4",
    name: "Garantía extendida NEXA 3 años",
    type: "extended",
    durationMonths: 36,
    coverage: "Cobertura total ampliada: defectos, desgaste prematuro y asistencia prioritaria.",
    conditions: "Cobertura máxima disponible. Incluye recogida y entrega express (24h). Soporte telefónico prioritario 24/7. Cubre también el desgaste anormal de batería (por debajo del 70% de capacidad). Sin límite de reparaciones durante el periodo de cobertura. Se requiere activación en los primeros 30 días tras la compra.",
    includesLabor: true,
    includesParts: true,
    includesPickup: true,
    repairLimit: null,
    contactPhone: "+34 91 123 45 67",
    contactEmail: "garantias@nexa.com",
    active: true,
    productsCount: 4,
  },
  {
    id: "w5",
    name: "Garantía limitada 6 meses",
    type: "limited",
    durationMonths: 6,
    coverage: "Solo cubre defectos de fabricación verificados en diagnóstico técnico.",
    conditions: "Cobertura limitada a defectos de fabricación documentados. No incluye recogida, mano de obra ni piezas de terceros. El cliente debe llevar el producto al punto de servicio. Diagnóstico previo obligatorio.",
    includesLabor: false,
    includesParts: true,
    includesPickup: false,
    repairLimit: 1,
    contactPhone: "+34 91 123 45 67",
    contactEmail: "garantias@nexa.com",
    active: true,
    productsCount: 2,
  },
  {
    id: "w6",
    name: "Garantía oficial Sony 2 años",
    type: "manufacturer",
    durationMonths: 24,
    coverage: "Defectos de fabricación en todos los productos Sony.",
    conditions: "Cubre defectos de materiales y fabricación según la política de garantía europea Sony. Válida en toda la UE. Presentar prueba de compra. Reparación en SAT Sony autorizado.",
    includesLabor: true,
    includesParts: true,
    includesPickup: false,
    repairLimit: null,
    contactPhone: "+34 902 180 576",
    contactEmail: "soporte-sony@nexa.com",
    active: true,
    productsCount: 1,
  },
];
