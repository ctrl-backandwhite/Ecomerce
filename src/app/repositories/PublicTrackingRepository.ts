/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  PublicTrackingRepository                                    ║
 * ║    GET /api/v1/orders/public/tracking/{orderId}?exp=&sig=    ║
 * ║                                                              ║
 * ║  Unauthenticated tracking for guests arriving from a         ║
 * ║  confirmation / shipment email. The link is HMAC-signed by   ║
 * ║  TrackingUrlSigner on the backend; the frontend just forwards║
 * ║  the exp + sig query params verbatim.                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { nxFetch } from "../lib/nxFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { API_BASE } from "../config/api";
import type { TrackingEvent } from "./TrackingRepository";

export interface PublicTrackingPayload {
    orderId: string;
    orderStatus: string;
    cjOrderId: string;
    cjStatus: string;
    trackNumber: string;
    events: TrackingEvent[];
    stateHistory: Array<{ fromStatus: string | null; toStatus: string; changedAt: string; reason: string | null }>;
    snapshot: Array<{ productId: string; productName: string; productImage: string; quantity: number; priceUsd: number }>;
}

class PublicTrackingRepository {
    async find(orderId: string, exp: string, sig: string): Promise<PublicTrackingPayload> {
        try {
            const params = new URLSearchParams({ exp, sig });
            const url = `${API_BASE}/api/v1/orders/public/tracking/${encodeURIComponent(orderId)}?${params.toString()}`;
            return handleRes<PublicTrackingPayload>(await nxFetch(url));
        } catch (err) {
            wrapErr(err, "No se pudo cargar el seguimiento público");
        }
    }
}

export const publicTrackingRepository = new PublicTrackingRepository();
