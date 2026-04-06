import { authFetch } from "../lib/authFetch";
import { nxFetch } from "../lib/nxFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { Page } from "../types/api";

export interface SeoPage {
    id: string;
    path: string;
    metaTitle: string;
    metaDescription: string | null;
    indexable: boolean;
    seoScore: number | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface SeoPagePayload {
    path: string;
    metaTitle: string;
    metaDescription?: string;
    indexable?: boolean;
    seoScore?: number;
}

class SeoPageRepository {
    private url = `${API_BASE}/api/v1/seo`;

    async findAll(): Promise<SeoPage[]> {
        try {
            const page = await handleRes<Page<SeoPage>>(await authFetch(this.url));
            return page.content;
        } catch (err) { wrapErr(err, "No se pudieron obtener las páginas SEO"); }
    }

    async findById(id: string): Promise<SeoPage> {
        try { return handleRes<SeoPage>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener la página SEO"); }
    }

    async findByPath(path: string): Promise<SeoPage> {
        try {
            const params = new URLSearchParams({ path });
            return handleRes<SeoPage>(await nxFetch(`${this.url}/path?${params}`));
        } catch (err) { wrapErr(err, "No se pudo obtener la página SEO"); }
    }

    async create(data: SeoPagePayload): Promise<SeoPage> {
        try {
            return handleRes<SeoPage>(await authFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear la página SEO"); }
    }

    async update(id: string, data: SeoPagePayload): Promise<SeoPage> {
        try {
            return handleRes<SeoPage>(await authFetch(`${this.url}/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar la página SEO"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la página SEO"); }
    }
}

export const seoPageRepository = new SeoPageRepository();
