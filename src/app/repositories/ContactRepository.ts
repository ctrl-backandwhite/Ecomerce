import { authFetch } from "../lib/authFetch";
import { nxFetch } from "../lib/nxFetch";
import { handleRes, wrapErr, buildParams } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { Page } from "../types/api";

export interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export interface ContactPayload {
    name: string;
    email: string;
    subject: string;
    message: string;
}

class ContactRepository {
    private url = `${API_BASE}/api/v1/contact`;

    async submit(data: ContactPayload): Promise<void> {
        try {
            const res = await nxFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo enviar el mensaje"); }
    }

    async findAll(query: Record<string, unknown> = {}): Promise<Page<ContactMessage>> {
        try {
            const qs = buildParams(query);
            return handleRes<Page<ContactMessage>>(await authFetch(`${this.url}?${qs}`));
        } catch (err) { wrapErr(err, "No se pudieron obtener los mensajes"); }
    }

    async findById(id: string): Promise<ContactMessage> {
        try { return handleRes<ContactMessage>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el mensaje"); }
    }

    async markAsRead(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}/read`, { method: "PATCH", headers: { accept: "*/*" } });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo marcar como leído"); }
    }
}

export const contactRepository = new ContactRepository();
