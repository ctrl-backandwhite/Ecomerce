/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  useApiResource – Generic hook for repository data fetching  ║
 * ║                                                              ║
 * ║  Encapsulates loading / error / data state for any           ║
 * ║  async fetch function, with auto-reload on mount.            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface ApiResourceState<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
    setData: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * Fetches an array of items from the backend on mount.
 *
 * @param loadFn  – Stable function that returns `Promise<T[]>`.
 *                  Wrap it in `useCallback` if it depends on params.
 * @param autoLoad – Whether to load on mount (default `true`).
 */
export function useApiResource<T>(
    loadFn: () => Promise<T[]>,
    autoLoad = true,
): ApiResourceState<T> {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(autoLoad);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const items = await loadFn();
            if (mountedRef.current) setData(items);
        } catch (err: unknown) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err.message : "Error desconocido");
            }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [loadFn]);

    useEffect(() => {
        mountedRef.current = true;
        if (autoLoad) reload();
        return () => {
            mountedRef.current = false;
        };
    }, [reload, autoLoad]);

    return { data, loading, error, reload, setData };
}

/** Same as useApiResource but expects a single object (e.g. stats). */
export function useApiSingle<T>(
    loadFn: () => Promise<T>,
    autoLoad = true,
): { data: T | null; loading: boolean; error: string | null; reload: () => Promise<void> } {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(autoLoad);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await loadFn();
            if (mountedRef.current) setData(result);
        } catch (err: unknown) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err.message : "Error desconocido");
            }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [loadFn]);

    useEffect(() => {
        mountedRef.current = true;
        if (autoLoad) reload();
        return () => {
            mountedRef.current = false;
        };
    }, [reload, autoLoad]);

    return { data, loading, error, reload };
}
