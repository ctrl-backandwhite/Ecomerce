/**
 * Authenticated fetch wrapper.
 * Adds Authorization header and handles 401 with token refresh.
 */
import { getAccessToken, getRefreshToken, storeTokens, clearTokens, getTokenType, isTokenExpired } from "./token";
import type { TokenResponse } from "./token";
import { getSessionId } from "./sessionId";

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL as string;
const CLIENT_ID = import.meta.env.VITE_OAUTH2_CLIENT_ID as string;

/** Endpoints that should never carry an Authorization header */
const SKIP_AUTH_PATHS = ["/oauth2/token", "/oauth2/authorize"];

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
        const body = new URLSearchParams({
            grant_type: "refresh_token",
            client_id: CLIENT_ID,
            refresh_token: refreshToken,
        });

        const res = await fetch(`${GATEWAY_URL}/oauth2/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            credentials: "include",
            body,
        });

        if (!res.ok) return false;

        const data: TokenResponse = await res.json();
        storeTokens(data);
        return true;
    } catch {
        return false;
    }
}

async function refreshOnce(): Promise<boolean> {
    if (isRefreshing && refreshPromise) return refreshPromise;
    isRefreshing = true;
    refreshPromise = doRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
    });
    return refreshPromise;
}

/**
 * Drop-in replacement for `fetch` that:
 * 1. Injects the `Authorization: Bearer <token>` header
 * 2. Retries once on 401 after refreshing the token
 * 3. Returns the original 401 response if refresh fails
 */
export async function authFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const shouldSkip = SKIP_AUTH_PATHS.some((p) => url.includes(p));

    function attachHeaders(options?: RequestInit): RequestInit {
        const headers = new Headers(options?.headers);

        // Always attach session id for guest cart support
        headers.set("X-Session-Id", getSessionId());

        // Propagate current locale
        const lang = localStorage.getItem("nexa-locale") || navigator.language || "es";
        headers.set("Accept-Language", lang);

        // Propagate selected currency for backend price conversion
        const currencyCode = localStorage.getItem("nexa-currency") || "USD";
        headers.set("X-Currency", currencyCode);

        // Gateway authentication token
        headers.set("X-nx036-auth", `NX036.${btoa(`${CLIENT_ID}:${Date.now()}`)}`);

        if (!shouldSkip) {
            const token = getAccessToken();
            if (token) {
                headers.set("Authorization", `${getTokenType()} ${token}`);
            }
        }

        return { ...options, headers };
    }

    // Proactively refresh expired tokens before the request.
    // The gateway is pass-through: an expired JWT won't return 401, it just
    // drops the auth headers, so downstream services return empty data.
    if (!shouldSkip && getAccessToken() && isTokenExpired()) {
        await refreshOnce();
    }

    const response = await fetch(input, attachHeaders(init));

    if (response.status === 401 && !shouldSkip) {
        const refreshed = await refreshOnce();
        if (refreshed) {
            return fetch(input, attachHeaders(init));
        }
        // Refresh failed — clear tokens; AuthContext will detect and redirect
        clearTokens();
    }

    return response;
}
