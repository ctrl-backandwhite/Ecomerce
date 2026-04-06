import { authFetch } from "../lib/authFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";

export interface Setting {
    key: string;
    value: string;
    section: string;
    type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
}

class SettingRepository {
    private url = `${API_BASE}/api/v1/settings`;

    async findAll(): Promise<Setting[]> {
        try { return handleRes<Setting[]>(await authFetch(this.url)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los ajustes"); }
    }

    async findBySection(section: string): Promise<Setting[]> {
        try { return handleRes<Setting[]>(await authFetch(`${this.url}/section/${section}`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los ajustes"); }
    }

    async findByKey(key: string): Promise<Setting> {
        try { return handleRes<Setting>(await authFetch(`${this.url}/${key}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el ajuste"); }
    }

    async save(setting: Setting): Promise<Setting> {
        try {
            return handleRes<Setting>(await authFetch(this.url, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(setting),
            }));
        } catch (err) { wrapErr(err, "No se pudo guardar el ajuste"); }
    }

    async delete(key: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${key}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el ajuste"); }
    }
}

export const settingRepository = new SettingRepository();
