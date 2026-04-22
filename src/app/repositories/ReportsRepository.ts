/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ReportsRepository                                           ║
 * ║    GET /api/v1/orders/stats                  (aggregates)    ║
 * ║    GET /api/v1/orders/stats/revenue-by-day   (time series)   ║
 * ║    GET /api/v1/orders/stats/status-distribution              ║
 * ║                                                              ║
 * ║  Admin-only endpoints that feed the Dashboard charts and the ║
 * ║  Reports page. Consumers should degrade gracefully when the  ║
 * ║  backend returns an empty list (no orders in the window).    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { API_BASE } from "../config/api";

export interface RevenueByDay {
    day: string;      // ISO-8601 (YYYY-MM-DD)
    revenue: number;  // gross from non-cancelled / non-refunded orders
    orders: number;   // total order count that day
    refunded: number;
    cancelled: number;
}

export interface StatusCount {
    status: string;   // PENDING / CONFIRMED / PROCESSING / SHIPPED / IN_TRANSIT / DELIVERED / CANCELLED / REFUNDED
    count: number;
}

const BASE = `${API_BASE}/api/v1/orders/stats`;

function qs(from?: Date | string, to?: Date | string): string {
    const params = new URLSearchParams();
    const toIso = (d: Date | string) => typeof d === "string" ? d : d.toISOString();
    if (from) params.set("from", toIso(from));
    if (to) params.set("to", toIso(to));
    const q = params.toString();
    return q ? `?${q}` : "";
}

class ReportsRepository {
    /**
     * Returns one bucket per calendar day in [from, to]. Window defaults to
     * the last 30 days on the server when either bound is omitted.
     */
    async findRevenueByDay(from?: Date | string, to?: Date | string): Promise<RevenueByDay[]> {
        try {
            return handleRes<RevenueByDay[]>(await authFetch(`${BASE}/revenue-by-day${qs(from, to)}`));
        } catch (err) {
            wrapErr(err, "No se pudo obtener la serie de ingresos");
        }
    }

    /**
     * Returns one bucket per order status present inside [from, to].
     * Statuses that have zero orders in the window are not returned; callers
     * should treat a missing status as 0.
     */
    async findStatusDistribution(from?: Date | string, to?: Date | string): Promise<StatusCount[]> {
        try {
            return handleRes<StatusCount[]>(await authFetch(`${BASE}/status-distribution${qs(from, to)}`));
        } catch (err) {
            wrapErr(err, "No se pudo obtener la distribución de estados");
        }
    }
}

export const reportsRepository = new ReportsRepository();
