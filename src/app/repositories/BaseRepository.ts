/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  BaseRepository                                              ║
 * ║                                                              ║
 * ║  Generic CRUD base class that uses authFetch for all         ║
 * ║  authenticated requests. Provides standard error handling    ║
 * ║  and query building.                                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { Page, ApiErrorBody, PageQuery } from "../types/api";

import { logger } from "../lib/logger";

export abstract class BaseRepository<T, C = Partial<T>, U = Partial<T>> {
    protected readonly baseUrl: string;

    constructor(path: string) {
        this.baseUrl = `${API_BASE}${path}`;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    protected buildParams(query: Record<string, unknown>): string {
        const params = new URLSearchParams();
        for (const [key, val] of Object.entries(query)) {
            if (val !== undefined && val !== null && val !== "") {
                params.set(key, String(val));
            }
        }
        return params.toString();
    }

    protected async handleResponse<R>(res: Response): Promise<R> {
        if (!res.ok) {
            let errorMsg = `HTTP ${res.status}`;
            try {
                const errBody: ApiErrorBody = await res.json();
                errorMsg = errBody.message || errorMsg;
            } catch (err) { logger.warn("Suppressed error", err); }
            throw new ApiError(res.status, errorMsg);
        }
        const text = await res.text();
        return text ? JSON.parse(text) : (undefined as R);
    }

    protected wrapError(err: unknown, fallbackMsg: string): never {
        if (err instanceof ApiError) throw err;
        throw new NetworkError(
            fallbackMsg,
            err instanceof Error ? err : undefined,
        );
    }

    // ── CRUD operations ────────────────────────────────────────────────────

    async findPaged(query: PageQuery & Record<string, unknown> = {}): Promise<Page<T>> {
        try {
            const qs = this.buildParams(query);
            const res = await authFetch(`${this.baseUrl}?${qs}`);
            return this.handleResponse<Page<T>>(res);
        } catch (err) {
            this.wrapError(err, `No se pudo obtener la lista`);
        }
    }

    async findAll(query: Record<string, unknown> = {}): Promise<T[]> {
        try {
            const qs = this.buildParams(query);
            const url = qs ? `${this.baseUrl}?${qs}` : this.baseUrl;
            const res = await authFetch(url);
            return this.handleResponse<T[]>(res);
        } catch (err) {
            this.wrapError(err, `No se pudo obtener la lista`);
        }
    }

    async findById(id: string): Promise<T> {
        try {
            const res = await authFetch(`${this.baseUrl}/${id}`);
            return this.handleResponse<T>(res);
        } catch (err) {
            this.wrapError(err, `No se pudo obtener el recurso ${id}`);
        }
    }

    async create(data: C): Promise<T> {
        try {
            const res = await authFetch(this.baseUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return this.handleResponse<T>(res);
        } catch (err) {
            this.wrapError(err, `No se pudo crear el recurso`);
        }
    }

    async update(id: string, data: U): Promise<T> {
        try {
            const res = await authFetch(`${this.baseUrl}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return this.handleResponse<T>(res);
        } catch (err) {
            this.wrapError(err, `No se pudo actualizar el recurso ${id}`);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.baseUrl}/${id}`, { method: "DELETE" });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
        } catch (err) {
            this.wrapError(err, `No se pudo eliminar el recurso ${id}`);
        }
    }

    async patch(id: string, action: string): Promise<void> {
        try {
            const res = await authFetch(`${this.baseUrl}/${id}/${action}`, {
                method: "PATCH",
                headers: { accept: "*/*" },
            });
            if (!res.ok) {
                let errorMsg = `HTTP ${res.status}`;
                try {
                    const errBody: ApiErrorBody = await res.json();
                    errorMsg = errBody.message || errorMsg;
                } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, errorMsg);
            }
        } catch (err) {
            this.wrapError(err, `No se pudo ejecutar la acción ${action}`);
        }
    }
}
