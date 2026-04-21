import { useEffect, useState } from "react";
import {
    cjShippingQuoteRepository,
    CountryNotAllowedError,
    type CjFreightOption,
    type CjProductLine,
} from "../repositories/CjShippingQuoteRepository";

interface Input {
    countryCode: string | null | undefined;
    province?: string;
    city?: string;
    postCode?: string;
    products: CjProductLine[];
    /** When false the hook stays idle — useful while the address step is still empty. */
    enabled?: boolean;
}

interface Result {
    options: CjFreightOption[];
    loading: boolean;
    error: Error | null;
    /** True only when the backend responded 422 ({@link CountryNotAllowedError}). */
    countryBlocked: boolean;
}

/**
 * Calls `/api/v1/checkout/shipping-quote` with a debounce (350 ms) every time
 * destination or products change. Consumers should render their own UI for
 * `countryBlocked` (CJ does not ship there) vs `error` (CJ is down — keep the
 * flat-rate fallback visible).
 */
export function useCjShippingQuote({
    countryCode,
    province,
    city,
    postCode,
    products,
    enabled = true,
}: Input): Result {
    const [options, setOptions] = useState<CjFreightOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [countryBlocked, setCountryBlocked] = useState(false);

    const cacheKey = `${countryCode ?? ""}|${province ?? ""}|${city ?? ""}|${postCode ?? ""}|` +
        products.map((p) => `${p.vid}x${p.quantity}`).join(",");

    useEffect(() => {
        if (!enabled || !countryCode || products.length === 0) {
            setOptions([]);
            setCountryBlocked(false);
            setError(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        setCountryBlocked(false);

        const timer = setTimeout(() => {
            cjShippingQuoteRepository
                .getQuote({
                    products,
                    destination: { countryCode, province, city, postCode },
                })
                .then((res) => {
                    if (cancelled) return;
                    setOptions(res ?? []);
                })
                .catch((err: unknown) => {
                    if (cancelled) return;
                    if (err instanceof CountryNotAllowedError) {
                        setCountryBlocked(true);
                        setOptions([]);
                    } else {
                        setError(err instanceof Error ? err : new Error(String(err)));
                    }
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 350);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey, enabled]);

    return { options, loading, error, countryBlocked };
}
