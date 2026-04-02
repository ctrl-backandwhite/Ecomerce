/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Common API types shared across all repositories             ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/** Standard paginated response from Spring Boot controllers. */
export interface Page<T> {
    content: T[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

/** Standard error body from the backend. */
export interface ApiErrorBody {
    code: string;
    message: string;
    details: string[];
    timeStamp: string;
}

/** Common query parameters for paginated endpoints. */
export interface PageQuery {
    page?: number;
    size?: number;
    sortBy?: string;
    ascending?: boolean;
}
