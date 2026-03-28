/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth2 authorization code flow.
 * Uses SHA-256 for code challenge generation per RFC 7636.
 */

const VERIFIER_LENGTH = 128;
const STORAGE_KEY = "pkce_verifier";
const STATE_KEY = "oauth_state";

function randomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

export function generateCodeVerifier(): string {
  return randomString(VERIFIER_LENGTH);
}

export function generateState(): string {
  return randomString(32);
}

export function generateNonce(): string {
  return randomString(32);
}

// ── Session storage helpers ─────────────────────────────────────────────────

export function storeVerifier(verifier: string): void {
  sessionStorage.setItem(STORAGE_KEY, verifier);
}

export function getVerifier(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearVerifier(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function storeState(state: string): void {
  sessionStorage.setItem(STATE_KEY, state);
}

export function getStoredState(): string | null {
  return sessionStorage.getItem(STATE_KEY);
}

export function clearState(): void {
  sessionStorage.removeItem(STATE_KEY);
}
