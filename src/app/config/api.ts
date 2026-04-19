/**
 * Resolve the API base URL at runtime. We prefer the same-origin of the page
 * whenever it's served through a gateway port (9000, 80, 443 or empty) so the
 * storefront works unchanged whether it's reached via:
 *   - localhost:9000          (dev, gateway-proxied front)
 *   - host.docker.internal:9000  (Computer Use container browser)
 *   - https://shop.example.com  (production)
 *
 * When the page is served from Vite's dev server on :5174 we fall back to
 * localhost:9000 because the API never lives on 5174.
 */
function resolveDefaultBase(): string {
    const fallback = "http://localhost:9000";
    if (typeof window === "undefined") return fallback;
    const { origin, port } = window.location;
    const gatewayPorts = ["9000", "", "80", "443"];
    if (gatewayPorts.includes(port)) return origin;
    return fallback;
}

const runtimeDefault = resolveDefaultBase();

export const API_BASE = import.meta.env.VITE_API_BASE ?? runtimeDefault;
export const API_CATALOG = import.meta.env.VITE_API_CATALOG ?? runtimeDefault;
