import { useState, useEffect, useCallback } from "react";
import { brandRepository, type Brand } from "../repositories/BrandRepository";

export interface UseBrandsResult {
    brands: Brand[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useBrands(): UseBrandsResult {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBrands = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Storefront hook: hit the public endpoint (no token required)
            const data = await brandRepository.findPublic();
            setBrands(data);
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Error al cargar marcas";
            setError(msg);
            setBrands([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    return { brands, loading, error, refetch: fetchBrands };
}
