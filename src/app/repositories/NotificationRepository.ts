/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NotificationRepository                                      ║
 * ║    POST /api/v1/notifications              (create)          ║
 * ║    GET  /api/v1/notifications/{id}         (detail)          ║
 * ║    GET  /api/v1/notifications              (list all)        ║
 * ║    DELETE /api/v1/notifications/{id}       (delete)          ║
 * ║    GET  /api/v1/notifications/recipient/{r}  (by user)       ║
 * ║    CRUD /api/v1/notification-templates     (templates)       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody, Page } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
    id: string;
    type: string;
    recipient: string;
    subject: string;
    body: string;
    status: "PENDING" | "SENT" | "FAILED";
    channel: "EMAIL" | "SMS" | "PUSH";
    createdAt: string;
}

export interface NotificationTemplate {
    id: string;
    name: string;
    channel: "EMAIL" | "SMS" | "PUSH";
    subject: string;
    body: string;
    variables: string[];
    createdAt: string;
    updatedAt: string | null;
}

export interface NotificationTemplatePayload {
    name: string;
    channel: "EMAIL" | "SMS" | "PUSH";
    subject: string;
    body: string;
    variables?: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function handleRes<R>(res: Response): Promise<R> {
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const e: ApiErrorBody = await res.json(); msg = e.message || msg; } catch { /* */ }
        throw new ApiError(res.status, msg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as R);
}

function wrapErr(err: unknown, msg: string): never {
    if (err instanceof ApiError) throw err;
    throw new NetworkError(msg, err instanceof Error ? err : undefined);
}

// ── Repository ───────────────────────────────────────────────────────────────

class NotificationRepository {
    private url = `${API_BASE}/api/v1/notifications`;
    private tplUrl = `${API_BASE}/api/v1/notification-templates`;

    // Notifications
    async findAll(query: Record<string, unknown> = {}): Promise<Page<Notification>> {
        try {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== null) params.set(k, String(v));
            }
            return handleRes<Page<Notification>>(await authFetch(`${this.url}?${params}`));
        } catch (err) { wrapErr(err, "No se pudieron obtener las notificaciones"); }
    }

    async findById(id: string): Promise<Notification> {
        try { return handleRes<Notification>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener la notificación"); }
    }

    async findByRecipient(recipient: string): Promise<Notification[]> {
        try { return handleRes<Notification[]>(await authFetch(`${this.url}/recipient/${recipient}`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener las notificaciones del usuario"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la notificación"); }
    }

    // Templates
    async findAllTemplates(): Promise<NotificationTemplate[]> {
        try { return handleRes<NotificationTemplate[]>(await authFetch(this.tplUrl)); }
        catch (err) { wrapErr(err, "No se pudieron obtener las plantillas"); }
    }

    async findTemplateById(id: string): Promise<NotificationTemplate> {
        try { return handleRes<NotificationTemplate>(await authFetch(`${this.tplUrl}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener la plantilla"); }
    }

    async createTemplate(data: NotificationTemplatePayload): Promise<NotificationTemplate> {
        try {
            return handleRes<NotificationTemplate>(await authFetch(this.tplUrl, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear la plantilla"); }
    }

    async updateTemplate(id: string, data: NotificationTemplatePayload): Promise<NotificationTemplate> {
        try {
            return handleRes<NotificationTemplate>(await authFetch(`${this.tplUrl}/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar la plantilla"); }
    }

    async deleteTemplate(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.tplUrl}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la plantilla"); }
    }
}

export const notificationRepository = new NotificationRepository();
