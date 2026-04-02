/* ── Review type ────────────────────────────────────────────── */

export interface Review {
    id: string;
    productId: string;
    author: string;
    avatar: string;
    avatarColor: string;
    rating: number;
    title: string;
    body: string;
    date: string;
    verified: boolean;
    helpful: number;
    images?: string[];
}
