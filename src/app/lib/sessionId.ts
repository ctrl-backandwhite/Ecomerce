/**
 * Anonymous session ID utility.
 *
 * Generates a UUID v4 on first visit and persists it in localStorage.
 * Used as X-Session-Id header for guest cart / checkout flows.
 * Cleared when the user logs in (cart merge replaces guest cart).
 */

const SESSION_KEY = "nx_session_id";

function generateUUID(): string {
    return crypto.randomUUID();
}

/**
 * Returns the current session ID, creating one if it doesn't exist yet.
 */
export function getSessionId(): string {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
        id = generateUUID();
        localStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

/**
 * Clears the anonymous session ID (call after login + cart merge).
 */
export function clearSessionId(): void {
    localStorage.removeItem(SESSION_KEY);
}
