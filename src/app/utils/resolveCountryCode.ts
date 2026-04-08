const LOCALES_FOR_LOOKUP = ["es", "en", "pt", "fr", "de", "it"];

/**
 * Resolve a country display name (e.g. "España", "United States") to its
 * ISO 3166-1 alpha-2 code ("ES", "US").  If the value is already a 2-letter
 * code it is returned as-is.
 */
export function resolveCountryCode(
    raw: string,
    knownCodes: string[],
): string {
    const trimmed = raw.trim();
    if (trimmed.length === 2 && /^[A-Z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();

    const lower = trimmed.toLowerCase();

    // Try Intl.DisplayNames reverse lookup across several locales
    for (const locale of LOCALES_FOR_LOOKUP) {
        try {
            const dn = new Intl.DisplayNames([locale], { type: "region" });
            for (const code of knownCodes) {
                if (dn.of(code)?.toLowerCase() === lower) return code;
            }
        } catch { /* locale not supported, skip */ }
    }
    return trimmed; // return as-is (fallback)
}
