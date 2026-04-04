import { Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router";

/**
 * Minimal layout for account pages — no Header/Footer.
 * The UserProfile page owns its own sidebar navigation.
 */
export function AccountLayout() {
    return (
        <div className="h-dvh overflow-hidden bg-gray-50 flex flex-col">
            <ScrollRestoration />
            <Suspense
                fallback={
                    <div className="flex items-center justify-center h-screen">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                    </div>
                }
            >
                <Outlet />
            </Suspense>
        </div>
    );
}
