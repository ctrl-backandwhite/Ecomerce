/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  PriceRuleRepository                                         ║
 * ║                                                              ║
 * ║  CRUD operations for price / margin rules against            ║
 * ║  mic-productcategory:                                        ║
 * ║    GET    /api/v1/price-rules           (list all)           ║
 * ║    GET    /api/v1/price-rules/{id}      (detail)             ║
 * ║    POST   /api/v1/price-rules           (create)             ║
 * ║    PUT    /api/v1/price-rules/{id}      (update)             ║
 * ║    DELETE /api/v1/price-rules/{id}      (delete)             ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { BaseRepository } from "./BaseRepository";

// ── Types ────────────────────────────────────────────────────────────────────

export type PriceRuleScope = "GLOBAL" | "CATEGORY" | "PRODUCT" | "VARIANT";
export type MarginType = "PERCENTAGE" | "FIXED";

export interface PriceRule {
    id: string;
    scope: PriceRuleScope;
    scopeId: string | null;
    marginType: MarginType;
    marginValue: number;
    minPrice: number | null;
    maxPrice: number | null;
    priority: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PriceRulePayload {
    scope: PriceRuleScope;
    scopeId?: string | null;
    marginType: MarginType;
    marginValue: number;
    minPrice?: number | null;
    maxPrice?: number | null;
    priority: number;
    active: boolean;
}

// ── Repository ───────────────────────────────────────────────────────────────

class PriceRuleRepository extends BaseRepository<PriceRule, PriceRulePayload, PriceRulePayload> {
    constructor() {
        super("/api/v1/price-rules");
    }
}

export const priceRuleRepository = new PriceRuleRepository();
