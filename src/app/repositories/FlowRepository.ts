import { authFetch } from "../lib/authFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";

export interface FlowStep {
    id: string;
    flowId: string;
    position: number;
    title: string;
    description: string;
    icon: string;
    slaDays: number;
    triggerType: string;
    sendEmail: boolean;
    sendSms: boolean;
    createdAt: string;
    updatedAt: string | null;
}

export interface Flow {
    id: string;
    name: string;
    type: string;
    active: boolean;
    steps: FlowStep[];
    createdAt: string;
    updatedAt: string | null;
}

export interface FlowPayload {
    name: string;
    type: string;
    active?: boolean;
}

class FlowRepository {
    private url = `${API_BASE}/api/v1/flows`;

    async findAll(): Promise<Flow[]> {
        try { return handleRes<Flow[]>(await authFetch(this.url)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los flujos"); }
    }

    async findById(id: string): Promise<Flow> {
        try { return handleRes<Flow>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el flujo"); }
    }

    async create(data: FlowPayload): Promise<Flow> {
        try {
            return handleRes<Flow>(await authFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear el flujo"); }
    }

    async update(id: string, data: FlowPayload): Promise<Flow> {
        try {
            return handleRes<Flow>(await authFetch(`${this.url}/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar el flujo"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el flujo"); }
    }

    async syncSteps(id: string, steps: Partial<FlowStep>[]): Promise<FlowStep[]> {
        try {
            return handleRes<FlowStep[]>(await authFetch(`${this.url}/${id}/steps`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(steps),
            }));
        } catch (err) { wrapErr(err, "No se pudieron sincronizar los pasos"); }
    }
}

export const flowRepository = new FlowRepository();
