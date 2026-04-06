import { authFetch } from "../lib/authFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    htmlBody: string;
    textBody: string | null;
    variables: string[];
    createdAt: string;
    updatedAt: string | null;
}

export interface EmailTemplatePayload {
    name: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    variables?: string[];
}

class EmailTemplateRepository {
    private url = `${API_BASE}/api/v1/email-templates`;

    async findAll(): Promise<EmailTemplate[]> {
        try { return handleRes<EmailTemplate[]>(await authFetch(this.url)); }
        catch (err) { wrapErr(err, "No se pudieron obtener las plantillas"); }
    }

    async findById(id: string): Promise<EmailTemplate> {
        try { return handleRes<EmailTemplate>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener la plantilla"); }
    }

    async create(data: EmailTemplatePayload): Promise<EmailTemplate> {
        try {
            return handleRes<EmailTemplate>(await authFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear la plantilla"); }
    }

    async update(id: string, data: EmailTemplatePayload): Promise<EmailTemplate> {
        try {
            return handleRes<EmailTemplate>(await authFetch(`${this.url}/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar la plantilla"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la plantilla"); }
    }
}

export const emailTemplateRepository = new EmailTemplateRepository();
