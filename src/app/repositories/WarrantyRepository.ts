/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  WarrantyRepository                                          ║
 * ║                                                              ║
 * ║  CRUD for warranties:                                        ║
 * ║    GET    /api/v1/warranties         (list all)              ║
 * ║    GET    /api/v1/warranties/{id}    (detail)                ║
 * ║    POST   /api/v1/warranties         (create)                ║
 * ║    PUT    /api/v1/warranties/{id}    (update)                ║
 * ║    DELETE /api/v1/warranties/{id}    (delete)                ║
 * ║    PATCH  /api/v1/warranties/{id}/active (toggle)            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { BaseRepository } from "./BaseRepository";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Warranty {
    id: string;
    name: string;
    type: "MANUFACTURER" | "STORE" | "EXTENDED" | "LIMITED";
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
    createdAt: string;
    updatedAt: string | null;
}

export interface WarrantyPayload {
    name: string;
    type: "MANUFACTURER" | "STORE" | "EXTENDED" | "LIMITED";
    durationMonths: number;
    coverage: string;
    conditions: string;
    includesLabor: boolean;
    includesParts: boolean;
    includesPickup: boolean;
    repairLimit?: number | null;
    contactPhone: string;
    contactEmail: string;
}

// ── Repository ───────────────────────────────────────────────────────────────

class WarrantyRepository extends BaseRepository<Warranty, WarrantyPayload, WarrantyPayload> {
    constructor() {
        super("/api/v1/warranties");
    }

    async toggleActive(id: string): Promise<void> {
        return this.patch(id, "active");
    }
}

export const warrantyRepository = new WarrantyRepository();
