/**
 * AuthGuard — layout route component that redirects unauthenticated users to OAuth2 login.
 * Renders <Outlet /> when authenticated, loading spinner while checking.
 */
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

export function AuthGuard() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login(location.pathname + location.search);
    }
  }, [isLoading, isAuthenticated, login, location]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Will redirect via useEffect — show loading meanwhile
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Redirigiendo al inicio de sesión…</p>
      </div>
    );
  }

  return <Outlet />;
}
