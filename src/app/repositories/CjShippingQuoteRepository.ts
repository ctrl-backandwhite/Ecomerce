/**
 * CjShippingQuoteRepository
 *   POST /api/v1/checkout/shipping-quote  — real CJ freight options for a cart
 *
 * The backend validates the destination country against `cj_allowed_countries`
 * and returns 422 when CJ does not ship there; any other 4xx/5xx signals an
 * upstream CJ outage. The hook in ShippingStep renders a fallback in both
 * cases so the user always sees *something* rather than a blank list.
 */

import { authFetch } from "../lib/authFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { API_BASE } from "../config/api";

const ENDPOINT = `${API_BASE}/api/v1/checkout/shipping-quote`;

export interface CjProductLine {
    vid: string;
    quantity: number;
}

export interface CjDestination {
    countryCode: string;
    province?: string;
    city?: string;
    postCode?: string;
}

export interface CjShippingQuoteRequest {
    products: CjProductLine[];
    destination: CjDestination;
}

/** Freight option as returned by CJ (see CjFreightOption). */
export interface CjFreightOption {
    logisticName: string;
    logisticPrice: number;
    logisticPriceCn?: number;
    logisticAging?: string;
    taxesFee?: number;
    clearanceOperationFee?: number;
}

export class CountryNotAllowedError extends Error {
    constructor(public readonly countryCode: string) {
        super(`CJ does not ship to ${countryCode}`);
        this.name = "CountryNotAllowedError";
    }
}

class CjShippingQuoteRepository {
    async getQuote(req: CjShippingQuoteRequest): Promise<CjFreightOption[]> {
        try {
            const res = await authFetch(ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req),
            });
            if (res.status === 422) {
                throw new CountryNotAllowedError(req.destination.countryCode);
            }
            return await handleRes<CjFreightOption[]>(res);
        } catch (err) {
            if (err instanceof CountryNotAllowedError) throw err;
            wrapErr(err, "No se pudo obtener la cotización de envío");
        }
    }
}

export const cjShippingQuoteRepository = new CjShippingQuoteRepository();
