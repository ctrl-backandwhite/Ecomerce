/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  AttributeRepository                                         ║
 * ║                                                              ║
 * ║  CRUD for product attributes:                                ║
 * ║    GET    /api/v1/attributes         (list all)              ║
 * ║    GET    /api/v1/attributes/{id}    (detail)                ║
 * ║    POST   /api/v1/attributes         (create)                ║
 * ║    PUT    /api/v1/attributes/{id}    (update)                ║
 * ║    DELETE /api/v1/attributes/{id}    (delete)                ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { BaseRepository } from "./BaseRepository";
import { authFetch } from "../lib/authFetch";
import type { Page } from "../types/api";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AttributeValue {
    id: string;
    value: string;
    color?: string | null;
}

export interface Attribute {
    id: string;
    name: string;
    slug: string;
    type: "TEXT" | "COLOR" | "SIZE" | "SELECT";
    values: AttributeValue[];
    usedInProducts: number;
    createdAt: string;
    updatedAt: string | null;
}

export interface AttributePayload {
    name: string;
    slug?: string;
    type: "TEXT" | "COLOR" | "SIZE" | "SELECT";
    values: { value: string; color?: string }[];
}

// ── Repository ───────────────────────────────────────────────────────────────

class AttributeRepository extends BaseRepository<Attribute, AttributePayload, AttributePayload> {
    constructor() {
        super("/api/v1/attributes");
    }

    /** Override: backend returns Page<Attribute>, unwrap .content */
    async findAll(query: Record<string, unknown> = {}): Promise<Attribute[]> {
        try {
            const qs = this.buildParams({ size: 200, ...query });
            const url = qs ? `${this.baseUrl}?${qs}` : this.baseUrl;
            const res = await authFetch(url);
            const page = await this.handleResponse<Page<Attribute>>(res);
            return page.content;
        } catch (err) {
            this.wrapError(err, "No se pudo obtener los atributos");
        }
    }
}

export const attributeRepository = new AttributeRepository();
