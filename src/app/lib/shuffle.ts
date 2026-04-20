/**
 * Deterministic shuffle helpers.
 *
 * The storefront wants the "Featured" product order to look fresh on each
 * visit, but stable during a single session so the user doesn't see items
 * jumping around while scrolling or navigating.
 *
 * Strategy:
 *   - Generate (or read) a numeric seed stored in sessionStorage under
 *     `nx036_shuffle_seed`. A new browser tab / after closing the tab
 *     gets a new seed → a new order.
 *   - Fisher-Yates shuffle with a tiny LCG PRNG seeded from that value,
 *     so the same seed always produces the same permutation.
 */

const SEED_KEY = "nx036_shuffle_seed";

function readOrCreateSeed(): number {
    if (typeof window === "undefined") return 1;
    try {
        const existing = window.sessionStorage.getItem(SEED_KEY);
        if (existing) {
            const parsed = Number(existing);
            if (Number.isFinite(parsed) && parsed > 0) return parsed;
        }
        const fresh = Math.floor(Math.random() * 2_147_483_647) + 1;
        window.sessionStorage.setItem(SEED_KEY, String(fresh));
        return fresh;
    } catch {
        // sessionStorage blocked (private mode, etc.) — fall back to a
        // per-render random seed. Order still changes on reload.
        return Math.floor(Math.random() * 2_147_483_647) + 1;
    }
}

export function getSessionShuffleSeed(): number {
    return readOrCreateSeed();
}

/**
 * Returns a new array with the input shuffled deterministically by the seed.
 * Pass the same seed to get the same permutation across renders.
 */
export function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
    const out = [...arr];
    let s = seed >>> 0 || 1;
    const rand = () => {
        // LCG constants from Numerical Recipes
        s = (Math.imul(1664525, s) + 1013904223) >>> 0;
        return s / 4_294_967_296;
    };
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
