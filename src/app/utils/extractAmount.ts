/**
 * Extract a numeric amount from a value that may be:
 * - a plain number
 * - a Money-like object { amount: number }  (backend JSONB)
 * - null / undefined
 */
export function extractAmount(val: unknown): number {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "object" && val !== null && "amount" in val)
        return Number((val as Record<string, unknown>).amount) || 0;
    return Number(val) || 0;
}
