import { authFetch } from "../lib/authFetch";
import { nxFetch } from "../lib/nxFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";

export interface Slide {
    id: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    link: string | null;
    buttonText: string | null;
    position: number;
    active: boolean;
    createdAt: string;
    updatedAt: string | null;
}

export interface SlidePayload {
    title: string;
    subtitle?: string;
    imageUrl: string;
    link?: string;
    buttonText?: string;
    position?: number;
    active?: boolean;
}

class SlideRepository {
    private url = `${API_BASE}/api/v1/slides`;

    async findActive(): Promise<Slide[]> {
        try { return handleRes<Slide[]>(await nxFetch(`${this.url}/active`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los slides"); }
    }

    async findAll(): Promise<Slide[]> {
        try { return handleRes<Slide[]>(await authFetch(this.url)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los slides"); }
    }

    async findById(id: string): Promise<Slide> {
        try { return handleRes<Slide>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el slide"); }
    }

    async create(data: SlidePayload): Promise<Slide> {
        try {
            return handleRes<Slide>(await authFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear el slide"); }
    }

    async update(id: string, data: SlidePayload): Promise<Slide> {
        try {
            return handleRes<Slide>(await authFetch(`${this.url}/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar el slide"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el slide"); }
    }

    async updatePositions(positions: { id: string; position: number }[]): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/positions`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(positions),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudieron actualizar las posiciones"); }
    }
}

export const slideRepository = new SlideRepository();
