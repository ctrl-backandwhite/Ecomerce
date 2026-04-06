/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  TrackingRepository                                          ║
 * ║    GET  /api/v1/tracking/orders/{orderId}                    ║
 * ║    POST /api/v1/tracking                                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { ApiErrorBody } from "../types/api";

import { logger } from "../lib/logger";

const BASE_URL = `${API_BASE}/api/v1/tracking`;

export interface TrackingEvent {
    id: string;
    orderId: string;
    status: string;
    location: string | null;
    description: string;
    timestamp: string;
}

export interface AddTrackingEventPayload {
    orderId: string;
    status: string;
    location?: string;
    description: string;
}

class TrackingRepository {
    async getByOrderId(orderId: string): Promise<TrackingEvent[]> {
        try {
            const res = await authFetch(`${BASE_URL}/orders/${orderId}`);
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try { const e: ApiErrorBody = await res.json(); msg = e.message || msg; } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, msg);
            }
            return (await res.json()) as TrackingEvent[];
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError("No se pudo obtener el seguimiento", err instanceof Error ? err : undefined);
        }
    }

    async addEvent(data: AddTrackingEventPayload): Promise<TrackingEvent> {
        try {
            const res = await authFetch(BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try { const e: ApiErrorBody = await res.json(); msg = e.message || msg; } catch (err) { logger.warn("Suppressed error", err); }
                throw new ApiError(res.status, msg);
            }
            return (await res.json()) as TrackingEvent;
        } catch (err) {
            if (err instanceof ApiError) throw err;
            throw new NetworkError("No se pudo agregar el evento de seguimiento", err instanceof Error ? err : undefined);
        }
    }
}

export const trackingRepository = new TrackingRepository();
