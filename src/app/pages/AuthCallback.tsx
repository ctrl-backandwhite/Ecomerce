/**
 * AuthCallback — handles the OAuth2 authorization code redirect.
 * Exchanges the code for tokens and navigates to the saved return URL.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { getReturnUrl, clearReturnUrl } from "../lib/token";

export function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { exchangeCodeForToken } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const exchangeStarted = useRef(false);

    useEffect(() => {
        if (exchangeStarted.current) return;
        exchangeStarted.current = true;

        const code = searchParams.get("code");
        const state = searchParams.get("state") ?? "";

        if (!code) {
            setError("No authorization code received.");
            return;
        }

        // Clean URL immediately — auth codes are single-use
        window.history.replaceState({}, "", window.location.pathname);

        exchangeCodeForToken(code, state)
            .then(() => {
                const returnUrl = getReturnUrl() ?? "/";
                clearReturnUrl();
                navigate(returnUrl, { replace: true });
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "Token exchange failed");
            });
    }, [searchParams, exchangeCodeForToken, navigate]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-600 text-lg">Error de autenticación</p>
                <p className="text-gray-500 text-sm">{error}</p>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => navigate("/")}
                >
                    Volver al inicio
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
                <p className="text-gray-500">Iniciando sesión…</p>
            </div>
        </div>
    );
}
