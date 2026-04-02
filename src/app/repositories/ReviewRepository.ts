/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ReviewRepository                                            ║
 * ║                                                              ║
 * ║  Public + Admin review operations:                           ║
 * ║    GET  /api/v1/public/products/{pid}/reviews      (public)  ║
 * ║    GET  /api/v1/public/products/{pid}/reviews/stats (public) ║
 * ║    POST /api/v1/reviews/product/{pid}              (create)  ║
 * ║    POST /api/v1/reviews/{id}/helpful               (vote)    ║
 * ║    GET  /api/v1/reviews/admin                      (admin)   ║
 * ║    PATCH /api/v1/reviews/{id}/moderate              (admin)  ║
 * ║    DELETE /api/v1/reviews/{id}                      (admin)  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { nxFetch } from "../lib/nxFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody, Page } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Review {
    id: string;
    productId: string;
    userId: string;
    author: string;
    avatar: string | null;
    rating: number;
    title: string;
    body: string;
    date: string;
    verified: boolean;
    helpful: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    images: string[];
}

export interface ReviewStats {
    productId: string;
    averageRating: number;
    totalReviews: number;
    distribution: Record<string, number>; // "1"..5 => count
}

export interface ReviewPayload {
    rating: number;
    title: string;
    body: string;
    images?: string[];
}

export interface ReviewQuery {
    page?: number;
    size?: number;
    status?: string;
    productId?: string;
    rating?: number;
    sortBy?: string;
    ascending?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function handleRes<R>(res: Response): Promise<R> {
    if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
            const errBody: ApiErrorBody = await res.json();
            errorMsg = errBody.message || errorMsg;
        } catch { /* ignore */ }
        throw new ApiError(res.status, errorMsg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as R);
}

function wrapErr(err: unknown, msg: string): never {
    if (err instanceof ApiError) throw err;
    throw new NetworkError(msg, err instanceof Error ? err : undefined);
}

// ── Repository ───────────────────────────────────────────────────────────────

class ReviewRepository {
    /** Public: get reviews for a product */
    async findByProductId(productId: string, page = 0, size = 10): Promise<Page<Review>> {
        try {
            const params = new URLSearchParams({ page: String(page), size: String(size) });
            const res = await nxFetch(
                `${API_BASE}/api/v1/public/products/${productId}/reviews?${params}`,
            );
            return handleRes<Page<Review>>(res);
        } catch (err) {
            wrapErr(err, "No se pudieron obtener las reseñas");
        }
    }

    /** Public: get review stats for a product */
    async getStats(productId: string): Promise<ReviewStats> {
        try {
            const res = await nxFetch(
                `${API_BASE}/api/v1/public/products/${productId}/reviews/stats`,
            );
            return handleRes<ReviewStats>(res);
        } catch (err) {
            wrapErr(err, "No se pudieron obtener las estadísticas de reseñas");
        }
    }

    /** Authenticated: create a review */
    async create(productId: string, data: ReviewPayload): Promise<Review> {
        try {
            const res = await authFetch(
                `${API_BASE}/api/v1/reviews/product/${productId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                },
            );
            return handleRes<Review>(res);
        } catch (err) {
            wrapErr(err, "No se pudo crear la reseña");
        }
    }

    /** Authenticated: vote helpful */
    async voteHelpful(reviewId: string): Promise<void> {
        try {
            const res = await authFetch(
                `${API_BASE}/api/v1/reviews/${reviewId}/helpful`,
                { method: "POST" },
            );
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) {
            wrapErr(err, "No se pudo votar como útil");
        }
    }

    /** Admin: list all reviews */
    async findAllAdmin(query: ReviewQuery = {}): Promise<Page<Review>> {
        try {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== null) params.set(k, String(v));
            }
            const res = await authFetch(`${API_BASE}/api/v1/reviews/admin?${params}`);
            return handleRes<Page<Review>>(res);
        } catch (err) {
            wrapErr(err, "No se pudieron obtener las reseñas");
        }
    }

    /** Admin: moderate (approve/reject) */
    async moderate(reviewId: string, status: "APPROVED" | "REJECTED"): Promise<void> {
        try {
            const res = await authFetch(
                `${API_BASE}/api/v1/reviews/${reviewId}/moderate`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status }),
                },
            );
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) {
            wrapErr(err, "No se pudo moderar la reseña");
        }
    }

    /** Admin: delete */
    async delete(reviewId: string): Promise<void> {
        try {
            const res = await authFetch(`${API_BASE}/api/v1/reviews/${reviewId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) {
            wrapErr(err, "No se pudo eliminar la reseña");
        }
    }
}

export const reviewRepository = new ReviewRepository();
