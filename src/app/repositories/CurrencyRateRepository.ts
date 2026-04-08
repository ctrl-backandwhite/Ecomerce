import { authFetch } from "../lib/authFetch";
import { nxFetch } from "../lib/nxFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { CurrencyRate, SyncResult, ConvertResult } from "../types/currency";
import type { ApiErrorBody } from "../types/api";

const BASE = `${API_BASE}/api/v1/currency-rates`;

async function handleRes<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const b: ApiErrorBody = await res.json(); msg = b.message || msg; } catch { /* */ }
        throw new ApiError(res.status, msg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as T);
}

function wrapErr(err: unknown, msg: string): never {
    if (err instanceof ApiError) throw err;
    throw new NetworkError(msg, err instanceof Error ? err : undefined);
}

/** Public — list all or active-only rates */
export async function findAll(active?: boolean): Promise<CurrencyRate[]> {
    try {
        const qs = active !== undefined ? `?active=${active}` : "";
        const res = await nxFetch(`${BASE}${qs}`);
        return handleRes<CurrencyRate[]>(res);
    } catch (err) { wrapErr(err, "No se pudo obtener las tasas de cambio"); }
}

/** Public — get rate by code */
export async function findByCode(code: string): Promise<CurrencyRate> {
    try {
        const res = await nxFetch(`${BASE}/${code}`);
        return handleRes<CurrencyRate>(res);
    } catch (err) { wrapErr(err, `No se pudo obtener la tasa para ${code}`); }
}

/** Admin — toggle active */
export async function toggleActive(code: string, active: boolean): Promise<CurrencyRate> {
    try {
        const res = await authFetch(`${BASE}/${code}/active`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active }),
        });
        return handleRes<CurrencyRate>(res);
    } catch (err) { wrapErr(err, `No se pudo cambiar el estado de ${code}`); }
}

/** Admin — sync from CurrencyLayer */
export async function sync(): Promise<SyncResult> {
    try {
        const res = await authFetch(`${BASE}/sync`, { method: "POST" });
        return handleRes<SyncResult>(res);
    } catch (err) { wrapErr(err, "No se pudo sincronizar las tasas"); }
}

/** Public — convert amount */
export async function convert(amount: number, from: string, to: string): Promise<ConvertResult> {
    try {
        const qs = `?amount=${amount}&from=${from}&to=${to}`;
        const res = await nxFetch(`${BASE}/convert${qs}`);
        return handleRes<ConvertResult>(res);
    } catch (err) { wrapErr(err, "No se pudo convertir el monto"); }
}
