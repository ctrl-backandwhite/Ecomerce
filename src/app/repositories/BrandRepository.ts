/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  BrandRepository                                             ║
 * ║                                                              ║
 * ║  CRUD operations for brands against mic-productcategory:     ║
 * ║    GET    /api/v1/brands            (list all)               ║
 * ║    GET    /api/v1/brands/{id}       (detail)                 ║
 * ║    GET    /api/v1/brands/slug/{s}   (by slug)                ║
 * ║    POST   /api/v1/brands            (create)                 ║
 * ║    PUT    /api/v1/brands/{id}       (update)                 ║
 * ║    DELETE /api/v1/brands/{id}       (delete)                 ║
 * ║    PATCH  /api/v1/brands/{id}/status (toggle)                ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { BaseRepository } from "./BaseRepository";
import { authFetch } from "../lib/authFetch";
import { nxFetch } from "../lib/nxFetch";
import type { Page } from "../types/api";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Brand {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    description: string | null;
    status: "ACTIVE" | "INACTIVE";
    productCount: number;
    createdAt: string;
    updatedAt: string | null;
}

export interface BrandPayload {
    name: string;
    slug: string;
    logoUrl?: string;
    websiteUrl?: string;
    description?: string;
}

export interface BrandQuery {
    [key: string]: unknown;
    page?: number;
    size?: number;
    status?: string;
    name?: string;
    sortBy?: string;
    ascending?: boolean;
}

// ── Repository ───────────────────────────────────────────────────────────────

class BrandRepository extends BaseRepository<Brand, BrandPayload, BrandPayload> {
    constructor() {
        super("/api/v1/brands");
    }

    /** Override: backend returns a Page<Brand>, we unwrap .content */
    async findAll(query: Record<string, unknown> = {}): Promise<Brand[]> {
        try {
            const qs = this.buildParams({ size: 200, ...query });
            const url = qs ? `${this.baseUrl}?${qs}` : this.baseUrl;
            const res = await authFetch(url);
            const page = await this.handleResponse<Page<Brand>>(res);
            return page.content;
        } catch (err) {
            this.wrapError(err, "No se pudo obtener las marcas");
        }
    }

    async findBySlug(slug: string): Promise<Brand> {
        try {
            const res = await authFetch(`${this.baseUrl}/slug/${slug}`);
            return this.handleResponse<Brand>(res);
        } catch (err) {
            this.wrapError(err, `No se pudo obtener la marca ${slug}`);
        }
    }

    async toggleStatus(id: string): Promise<void> {
        return this.patch(id, "status");
    }

    /** Public brands list (no auth required for storefront) */
    async findPublic(query: BrandQuery = {}): Promise<Brand[]> {
        try {
            const qs = this.buildParams(query);
            const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";
            const url = `${API_BASE}/api/v1/public/brands?${qs}`;
            const res = await nxFetch(url);
            return this.handleResponse<Brand[]>(res);
        } catch (err) {
            this.wrapError(err, `No se pudo obtener las marcas`);
        }
    }

    /** Public products by brand slug */
    async findProductsByBrand(slug: string, query: Record<string, unknown> = {}): Promise<Page<unknown>> {
        try {
            const qs = this.buildParams(query);
            const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";
            const url = `${API_BASE}/api/v1/public/brands/${slug}/products?${qs}`;
            const res = await nxFetch(url);
            return this.handleResponse<Page<unknown>>(res);
        } catch (err) {
            this.wrapError(err, `No se pudo obtener productos de la marca ${slug}`);
        }
    }
}

export const brandRepository = new BrandRepository();
