import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    hasValidToken,
    storeTokens,
    isTokenExpired,
    decodeJwtPayload,
    storeReturnUrl,
} from "../lib/token";
import type { TokenResponse } from "../lib/token";
import { authFetch } from "../lib/authFetch";
import { logger } from "../lib/logger";

import {
    generateCodeVerifier,
    generateCodeChallenge,
    generateState,
    generateNonce,
    storeVerifier,
    getVerifier,
    clearVerifier,
    storeState,
    getStoredState,
    clearState,
} from "../lib/pkce";

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL as string;
const CLIENT_ID = import.meta.env.VITE_OAUTH2_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_OAUTH2_REDIRECT_URI as string;

export interface AuthUser {
    sid: string;
    id: number;
    firstName: string;
    lastName: string;
    nickName: string;
    email: string;
    roles: string[];
    groups: string[];
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    accessToken: string | null;
    roles: string[];
    user: AuthUser | null;
    login: (returnUrl?: string) => Promise<void>;
    logout: () => Promise<void>;
    exchangeCodeForToken: (code: string, state: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractRoles(token: string): string[] {
    const payload = decodeJwtPayload(token);
    if (!payload) return [];
    const raw =
        (payload.roles as string[]) ??
        (payload.authorities as string[]) ??
        (typeof payload.scope === "string" ? (payload.scope as string).split(" ") : []);
    return Array.isArray(raw) ? raw : [];
}

function extractUser(token: string): AuthUser | null {
    const payload = decodeJwtPayload(token);
    if (!payload) return null;
    return {
        sid: (payload.sid as string) ?? "",
        id: (payload.id as number) ?? 0,
        firstName: (payload.firstName as string) ?? "",
        lastName: (payload.lastName as string) ?? "",
        nickName: (payload.nickName as string) ?? "",
        email: (payload.sub as string) ?? "",
        roles: extractRoles(token),
        groups: Array.isArray(payload.groups) ? (payload.groups as string[]) : [],
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(() => hasValidToken());
    const [isLoading, setIsLoading] = useState(true);
    const [roles, setRoles] = useState<string[]>(() => {
        const token = getAccessToken();
        return token ? extractRoles(token) : [];
    });
    const [user, setUser] = useState<AuthUser | null>(() => {
        const token = getAccessToken();
        return token ? extractUser(token) : null;
    });

    // On mount: check token validity and try silent refresh if expired
    useEffect(() => {
        async function init() {
            if (hasValidToken()) {
                const token = getAccessToken()!;
                setIsAuthenticated(true);
                setRoles(extractRoles(token));
                setUser(extractUser(token));
                setIsLoading(false);
                return;
            }

            // Token expired but refresh token exists — try refresh
            if (getAccessToken() && isTokenExpired() && getRefreshToken()) {
                try {
                    const body = new URLSearchParams({
                        grant_type: "refresh_token",
                        client_id: CLIENT_ID,
                        refresh_token: getRefreshToken()!,
                    });

                    const res = await fetch(`${GATEWAY_URL}/oauth2/token`, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        credentials: "include",
                        body,
                    });

                    if (res.ok) {
                        const data: TokenResponse = await res.json();
                        storeTokens(data);
                        setIsAuthenticated(true);
                        setRoles(extractRoles(data.access_token));
                        setUser(extractUser(data.access_token));
                        setIsLoading(false);
                        return;
                    }
                } catch (err) { logger.warn("Suppressed error", err); }
            }

            clearTokens();
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
        }

        init();
    }, []);

    const login = useCallback(async (returnUrl?: string) => {
        if (returnUrl) storeReturnUrl(returnUrl);

        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        const state = generateState();
        const nonce = generateNonce();

        storeVerifier(verifier);
        storeState(state);

        const params = new URLSearchParams({
            response_type: "code",
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            scope: "openid",
            response_mode: "query",
            state,
            nonce,
            code_challenge: challenge,
            code_challenge_method: "S256",
        });

        window.location.href = `${GATEWAY_URL}/oauth2/authorize?${params}`;
    }, []);

    // ── Recover from silent session loss ──────────────────────────────────────
    // authFetch fires `auth:session-expired` when a 401 comes back and the
    // refresh token is already dead. Wipe every auth remnant and send the user
    // straight through the OAuth2 flow again so they return to the same page
    // (checkout, account, admin) — not the home — after logging back in.
    useEffect(() => {
        function handleSessionExpired() {
            clearTokens();
            setIsAuthenticated(false);
            setRoles([]);
            setUser(null);
            const current = window.location.pathname + window.location.search;
            // Only force a login redirect for protected areas. For public
            // pages (home, product detail…) a silent downgrade to guest is
            // enough and avoids an annoying redirect loop for logged-out
            // visitors.
            if (current.startsWith("/admin") || current.startsWith("/profile")
                    || current.startsWith("/checkout")) {
                // login(current) stores the returnUrl and redirects to the
                // OAuth2 authorize endpoint. AuthCallback then navigates back
                // to `current` so the user resumes exactly where they were.
                login(current);
            }
        }
        window.addEventListener("auth:session-expired", handleSessionExpired);
        return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
    }, [login]);

    const exchangeCodeForToken = useCallback(async (code: string, state: string) => {
        // Validate state
        const storedState = getStoredState();
        if (storedState && storedState !== state) {
            throw new Error("Invalid OAuth2 state parameter");
        }
        clearState();

        const verifier = getVerifier();
        clearVerifier();

        const body = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: CLIENT_ID,
            code,
            redirect_uri: REDIRECT_URI,
            ...(verifier ? { code_verifier: verifier } : {}),
        });

        const res = await fetch(`${GATEWAY_URL}/oauth2/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            credentials: "include",
            body,
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Token exchange failed: ${res.status} ${text}`);
        }

        const data: TokenResponse = await res.json();
        storeTokens(data);
        setIsAuthenticated(true);
        setRoles(extractRoles(data.access_token));
        setUser(extractUser(data.access_token));
    }, []);

    const logout = useCallback(async () => {
        // 1) Best-effort: ask the API to revoke the current access token.
        try {
            await authFetch(`${GATEWAY_URL}/api/v1/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch (err) { logger.warn("Suppressed error", err); }

        // 2) Wipe every auth-related item from browser storage.
        clearTokens();

        // 3) Invalidate the Spring Security session + OAuth2 client cookies
        //    by hitting the canonical /logout endpoint. A hidden form POST is
        //    used so CSRF + cookies flow correctly and the browser handles
        //    the final redirect, leaving the SPA with no stale session.
        const form = document.createElement("form");
        form.method = "POST";
        form.action = `${GATEWAY_URL}/logout`;
        form.style.display = "none";
        const redirect = document.createElement("input");
        redirect.type = "hidden";
        redirect.name = "redirect_uri";
        redirect.value = "/";
        form.appendChild(redirect);
        document.body.appendChild(form);
        form.submit();
    }, []);

    const accessToken = useMemo(() => (isAuthenticated ? getAccessToken() : null), [isAuthenticated]);

    const value = useMemo<AuthContextType>(
        () => ({
            isAuthenticated,
            isLoading,
            accessToken,
            roles,
            user,
            login,
            logout,
            exchangeCodeForToken,
        }),
        [isAuthenticated, isLoading, accessToken, roles, user, login, logout, exchangeCodeForToken],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
