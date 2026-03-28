/**
 * Token storage utilities — manages OAuth2 tokens in localStorage.
 */

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const TOKEN_EXPIRES_AT_KEY = "token_expires_at";
const TOKEN_TYPE_KEY = "token_type";
const RETURN_URL_KEY = "auth_return_url";

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

// ── Getters ─────────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getTokenType(): string {
    return localStorage.getItem(TOKEN_TYPE_KEY) ?? "Bearer";
}

// ── Setters ─────────────────────────────────────────────────────────────────

export function storeTokens(response: TokenResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
    localStorage.setItem(TOKEN_TYPE_KEY, response.token_type);
    localStorage.setItem(
        TOKEN_EXPIRES_AT_KEY,
        String(Date.now() + response.expires_in * 1000),
    );
}

export function clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
    localStorage.removeItem(TOKEN_TYPE_KEY);
}

// ── Checks ──────────────────────────────────────────────────────────────────

export function isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
    if (!expiresAt) return true;
    // Consider expired 30 seconds before actual expiry to avoid edge cases
    return Date.now() >= Number(expiresAt) - 30_000;
}

export function hasValidToken(): boolean {
    return getAccessToken() !== null && !isTokenExpired();
}

// ── Return URL ──────────────────────────────────────────────────────────────

export function storeReturnUrl(url: string): void {
    sessionStorage.setItem(RETURN_URL_KEY, url);
}

export function getReturnUrl(): string | null {
    return sessionStorage.getItem(RETURN_URL_KEY);
}

export function clearReturnUrl(): void {
    sessionStorage.removeItem(RETURN_URL_KEY);
}

// ── JWT decode (payload only, no verification) ──────────────────────────────

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const base64 = token.split(".")[1];
        const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(json);
    } catch {
        return null;
    }
}
