/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  nxFetch                                                      ║
 * ║                                                              ║
 * ║  Drop-in replacement for native `fetch` that adds the        ║
 * ║  X-nx036-auth header to every request directed to the        ║
 * ║  NX036 backend. OAuth2 protocol endpoints (/oauth2/...) are  ║
 * ║  excluded.                                                   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const CLIENT_ID = import.meta.env.VITE_OAUTH2_CLIENT_ID as string;

/** OAuth2 protocol paths that never need the nx036 header */
const SKIP_PATHS = ["/oauth2/token", "/oauth2/authorize", "/.well-known/"];

function generateNxToken(): string {
    return `NX036.${btoa(`${CLIENT_ID}:${Date.now()}`)}`;
}

/**
 * Wrapper around native `fetch` that injects `X-nx036-auth`.
 * Signature is identical to `window.fetch`.
 */
export function nxFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    const url =
        typeof input === "string"
            ? input
            : input instanceof URL
                ? input.href
                : input.url;

    if (SKIP_PATHS.some((p) => url.includes(p))) {
        return fetch(input, init);
    }

    const headers = new Headers(init?.headers);
    headers.set("X-nx036-auth", generateNxToken());

    return fetch(input, { ...init, headers });
}
