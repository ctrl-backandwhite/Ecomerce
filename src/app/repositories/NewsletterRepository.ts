import { authFetch } from "../lib/authFetch";
import { nxFetch } from "../lib/nxFetch";
import { handleRes, wrapErr, buildParams } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { Page } from "../types/api";

export interface NewsletterSubscriber {
    id: string;
    email: string;
    status: "ACTIVE" | "UNSUBSCRIBED";
    subscribedAt: string;
    unsubscribedAt: string | null;
    source: string | null;
    createdAt: string;
    updatedAt: string | null;
}

class NewsletterRepository {
    private url = `${API_BASE}/api/v1/newsletter`;

    async subscribe(email: string): Promise<void> {
        try {
            const res = await nxFetch(`${this.url}/subscribe`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo suscribir al newsletter"); }
    }

    async unsubscribe(email: string): Promise<void> {
        try {
            const res = await nxFetch(`${this.url}/unsubscribe`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo cancelar la suscripción"); }
    }

    async findAll(query: Record<string, unknown> = {}): Promise<Page<NewsletterSubscriber>> {
        try {
            const qs = buildParams(query);
            return handleRes<Page<NewsletterSubscriber>>(await authFetch(`${this.url}?${qs}`));
        } catch (err) { wrapErr(err, "No se pudieron obtener los suscriptores"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el suscriptor"); }
    }

    async count(): Promise<number> {
        try { return handleRes<number>(await authFetch(`${this.url}/count`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el conteo"); }
    }
}

export const newsletterRepository = new NewsletterRepository();
