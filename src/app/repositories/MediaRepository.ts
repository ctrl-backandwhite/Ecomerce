/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  MediaRepository                                             ║
 * ║                                                              ║
 * ║  Media file management:                                      ║
 * ║    POST   /api/v1/media/upload       (upload file)           ║
 * ║    GET    /api/v1/media              (list all)              ║
 * ║    GET    /api/v1/media/{id}         (detail)                ║
 * ║    PUT    /api/v1/media/{id}         (update metadata)       ║
 * ║    DELETE /api/v1/media/{id}         (delete)                ║
 * ║    GET    /api/v1/media/images/{fn}  (serve image)           ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { handleRes, wrapErr } from "../lib/apiHelpers";
import { ApiError } from "../lib/AppError";
import { API_BASE } from "../config/api";
import type { Page } from "../types/api";

const BASE_URL = `${API_BASE}/api/v1/media`;

// ── Types ────────────────────────────────────────────────────────────────────

export interface MediaFile {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    thumbnailUrl: string | null;
    category: "PRODUCT" | "BRAND" | "SLIDE" | "GENERAL";
    tags: string[];
    alt: string | null;
    width: number | null;
    height: number | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface MediaMetadataPayload {
    alt?: string;
    title?: string;
}

export interface MediaQuery {
    page?: number;
    size?: number;
    contentType?: string;
    sortBy?: string;
    ascending?: boolean;
}

// ── Repository ───────────────────────────────────────────────────────────────

class MediaRepository {
    async findAll(query: MediaQuery = {}): Promise<Page<MediaFile>> {
        try {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(query)) {
                if (v !== undefined && v !== null) params.set(k, String(v));
            }
            const res = await authFetch(`${BASE_URL}?${params}`);
            return handleRes<Page<MediaFile>>(res);
        } catch (err) {
            wrapErr(err, "No se pudieron obtener los archivos");
        }
    }

    async findById(id: string): Promise<MediaFile> {
        try {
            const res = await authFetch(`${BASE_URL}/${id}`);
            return handleRes<MediaFile>(res);
        } catch (err) {
            wrapErr(err, `No se pudo obtener el archivo ${id}`);
        }
    }

    async upload(file: File): Promise<MediaFile> {
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await authFetch(`${BASE_URL}/upload`, {
                method: "POST",
                body: formData,
            });
            return handleRes<MediaFile>(res);
        } catch (err) {
            wrapErr(err, "No se pudo subir el archivo");
        }
    }

    async updateMetadata(id: string, data: MediaMetadataPayload): Promise<MediaFile> {
        try {
            const res = await authFetch(`${BASE_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return handleRes<MediaFile>(res);
        } catch (err) {
            wrapErr(err, `No se pudo actualizar el archivo ${id}`);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${BASE_URL}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) {
            wrapErr(err, `No se pudo eliminar el archivo ${id}`);
        }
    }

    /** Get the serving URL for an image filename */
    getImageUrl(filename: string): string {
        return `${BASE_URL}/images/${filename}`;
    }
}

export const mediaRepository = new MediaRepository();
