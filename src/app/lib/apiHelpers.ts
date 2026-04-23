/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  apiHelpers — shared request helpers for all repositories    ║
 * ║                                                              ║
 * ║  Centralises handleRes, wrapErr and buildParams so every     ║
 * ║  repository file doesn't have to duplicate them.             ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { ApiError, NetworkError } from "./AppError";
import type { ApiErrorBody } from "../types/api";

import { logger } from "./logger";

/**
 * Parse a fetch Response, throwing ApiError on non-2xx status.
 * Returns the parsed JSON body, or undefined when the body is empty.
 */
export async function handleRes<R>(res: Response): Promise<R> {
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        let code: string | undefined;
        try {
            const e: ApiErrorBody = await res.json();
            msg = e.message || msg;
            code = e.code;
        } catch (err) { logger.warn("Suppressed error", err); }
        throw new ApiError(res.status, msg, undefined, code);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as R);
}

/**
 * Re-throw ApiErrors as-is; wrap anything else in a NetworkError.
 * Always throws — return type is `never`.
 */
export function wrapErr(err: unknown, msg: string): never {
    if (err instanceof ApiError) throw err;
    throw new NetworkError(msg, err instanceof Error ? err : undefined);
}

/**
 * Build a query-string from a key/value map, skipping null/undefined/empty values.
 */
export function buildParams(query: Record<string, unknown>): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
    }
    return p.toString();
}
