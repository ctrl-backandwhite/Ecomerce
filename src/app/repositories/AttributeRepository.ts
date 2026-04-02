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
}

export const attributeRepository = new AttributeRepository();
