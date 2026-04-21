import { useEffect, useRef, useMemo } from "react";
import { shippingRepository } from "../../../repositories/ShippingRepository";
import {
    cjShippingQuoteRepository,
    CountryNotAllowedError,
    type CjProductLine,
} from "../../../repositories/CjShippingQuoteRepository";
import { useTimezone } from "../../../context/TimezoneContext";
import { useCart } from "../../../context/CartContext";
import { resolveCountryCode } from "../../../utils/resolveCountryCode";
import { logger } from "../../../lib/logger";
import type { CheckoutState, CheckoutAction } from "../types";
import type { Address } from "../../../context/UserContext";

/**
 * Checkout shipping hook — wired to CJ Dropshipping's real freight quote
 * endpoint (`POST /api/v1/checkout/shipping-quote`).
 *
 * Behaviour:
 *  • Asks CJ for options as soon as a destination country can be resolved.
 *  • On CJ 422 response (country not in `cj_allowed_countries`) sets
 *    `cjCountryBlocked` so the UI can block checkout with an actionable msg.
 *  • On any other CJ failure falls back to the legacy flat-rate repository,
 *    so a CJ outage does not leave the customer staring at a blank list.
 */
export function useShippingOptions(
    subtotal: number,
    selectedAddrId: string,
    selectedAddr: Address | null | undefined,
    manualAddr: CheckoutState["manualAddr"],
    newMode: CheckoutState["newMode"],
    dispatch: React.Dispatch<CheckoutAction>,
) {
    const { selectedCountry, countries } = useTimezone();
    const { items } = useCart();
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const fallbackCountry = selectedCountry?.code ?? "US";

    const knownCodes = useMemo(() => countries.map((c) => c.code), [countries]);

    // CJ expects a `vid` (variant id). When the cart item has a selected
    // variant we pass that; otherwise we fall back to the product id so
    // single-SKU products still get a real CJ quote instead of silently
    // dropping to the flat-rate legacy shipping.
    const cartLines: CjProductLine[] = useMemo(
        () => items
            .map((it) => ({ vid: it.variantId ?? it.productId ?? it.id, quantity: it.quantity }))
            .filter((l) => !!l.vid),
        [items],
    );

    useEffect(() => {
        clearTimeout(timer.current);
        if (subtotal === 0) return;

        // Resolve destination from selected address or manual form.
        let country = fallbackCountry;
        let province: string | undefined;
        let city: string | undefined;
        let postCode: string | undefined;

        if (selectedAddr) {
            country = selectedAddr.country ? resolveCountryCode(selectedAddr.country, knownCodes) : fallbackCountry;
            province = selectedAddr.state ?? undefined;
            city = selectedAddr.city ?? undefined;
            postCode = selectedAddr.zip ?? undefined;
        } else if (selectedAddrId === "new" && newMode === "home" && manualAddr.country) {
            country = resolveCountryCode(manualAddr.country, knownCodes);
            province = manualAddr.state || undefined;
            city = manualAddr.city || undefined;
            postCode = manualAddr.zip || undefined;
        }

        timer.current = setTimeout(() => {
            let cancelled = false;
            dispatch({
                type: "PATCH",
                payload: {
                    shippingLoading: true,
                    cjCountryBlocked: false,
                    cjBlockedCountry: null,
                    cjQuoteError: null,
                },
            });

            const tryLegacy = () =>
                shippingRepository.getOptions({ country, subtotal: String(subtotal) }).then((opts) => {
                    if (cancelled) return;
                    dispatch({
                        type: "PATCH",
                        payload: {
                            shippingOptions: opts,
                            selectedShippingId: opts.length > 0 ? opts[0].id : null,
                        },
                    });
                });

            const tryCj = async () => {
                if (cartLines.length === 0) throw new Error("no-cj-variants");
                const opts = await cjShippingQuoteRepository.getQuote({
                    products: cartLines,
                    destination: { countryCode: country, province, city, postCode },
                });
                if (cancelled) return;
                const mapped = (opts ?? []).map((o) => ({
                    id: o.logisticName,
                    name: o.logisticName,
                    carrier: o.logisticName,
                    estimatedDays: parseDeliveryDays(o.logisticAging),
                    price: o.logisticPrice,
                    freeAbove: null,
                }));
                dispatch({
                    type: "PATCH",
                    payload: {
                        shippingOptions: mapped,
                        selectedShippingId: mapped[0]?.id ?? null,
                    },
                });
            };

            tryCj()
                .catch((err: unknown) => {
                    if (cancelled) return Promise.resolve();
                    if (err instanceof CountryNotAllowedError) {
                        dispatch({
                            type: "PATCH",
                            payload: {
                                shippingOptions: [],
                                selectedShippingId: null,
                                cjCountryBlocked: true,
                                cjBlockedCountry: country,
                            },
                        });
                        return Promise.resolve();
                    }
                    logger.warn("CJ quote failed, falling back to legacy shipping", err);
                    dispatch({ type: "PATCH", payload: { cjQuoteError: "CJ_QUOTE_FAILED" } });
                    return tryLegacy();
                })
                .finally(() => {
                    if (!cancelled) dispatch({ type: "PATCH", payload: { shippingLoading: false } });
                });

            return () => { cancelled = true; };
        }, 400);
        return () => clearTimeout(timer.current);
    }, [
        subtotal, selectedAddrId, selectedAddr, manualAddr.country, manualAddr.state,
        manualAddr.city, manualAddr.zip, newMode, fallbackCountry, knownCodes, cartLines, dispatch,
    ]);
}

/** Parse CJ's aging string ("12-18 días" / "5-10") → average integer days. */
function parseDeliveryDays(raw?: string): number {
    if (!raw) return 15;
    const nums = raw.match(/\d+/g);
    if (!nums) return 15;
    const parsed = nums.map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n));
    if (parsed.length === 0) return 15;
    if (parsed.length === 1) return parsed[0];
    return Math.round((parsed[0] + parsed[1]) / 2);
}
