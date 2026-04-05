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
import { authFetch } from "../lib/authFetch";
import type { Page } from "../types/api";

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

    /** Override: backend returns Page<Warranty>, unwrap .content */
    async findAll(query: Record<string, unknown> = {}): Promise<Warranty[]> {
        try {
            const qs = this.buildParams({ size: 200, ...query });
            const url = qs ? `${this.baseUrl}?${qs}` : this.baseUrl;
            const res = await authFetch(url);
            const page = await this.handleResponse<Page<Warranty>>(res);
            return page.content;
        } catch (err) {
            this.wrapError(err, "No se pudo obtener las garantías");
        }
    }

    async toggleActive(id: string): Promise<void> {
        return this.patch(id, "active");
    }
}

export const warrantyRepository = new WarrantyRepository();
