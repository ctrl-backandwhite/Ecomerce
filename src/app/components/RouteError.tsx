import { useEffect } from "react";
import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

function isChunkLoadError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (
        error.message.includes("Failed to fetch dynamically imported module") ||
        error.message.includes("Importing a module script failed") ||
        error.name === "ChunkLoadError"
    );
}

export function RouteError() {
    const error = useRouteError();
    const navigate = useNavigate();

    // Auto-reload once on chunk load errors (stale cache after deploy)
    useEffect(() => {
        if (!isChunkLoadError(error)) return;
        const reloaded = sessionStorage.getItem("chunk-reload");
        if (reloaded) return;
        sessionStorage.setItem("chunk-reload", "1");
        window.location.reload();
    }, [error]);

    if (isChunkLoadError(error)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
                <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                <p className="text-base-content/60 text-sm">Actualizando la aplicación…</p>
            </div>
        );
    }

    const status = isRouteErrorResponse(error) ? error.status : null;
    const message =
        isRouteErrorResponse(error)
            ? error.statusText
            : error instanceof Error
                ? error.message
                : "Error inesperado";

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
            <AlertTriangle className="w-14 h-14 text-warning" strokeWidth={1.5} />
            <div className="space-y-1">
                {status && <p className="text-5xl font-bold text-base-content/20">{status}</p>}
                <h1 className="text-xl font-semibold text-base-content">
                    {status === 404 ? "Página no encontrada" : "Algo salió mal"}
                </h1>
                <p className="text-sm text-base-content/50 max-w-xs">{message}</p>
            </div>
            <div className="flex gap-3">
                <button
                    className="btn btn-sm btn-ghost gap-1"
                    onClick={() => window.location.reload()}
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Reintentar
                </button>
                <button
                    className="btn btn-sm btn-primary gap-1"
                    onClick={() => { sessionStorage.removeItem("chunk-reload"); navigate("/"); }}
                >
                    <Home className="w-3.5 h-3.5" /> Inicio
                </button>
            </div>
        </div>
    );
}
