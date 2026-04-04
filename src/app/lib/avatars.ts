/* ── Default avatar registry ──────────────────────────────────────────
 *  Default avatars are stored in the DB as short identifiers: "default:1"
 *  through "default:10". This module builds the inline SVG data URIs at
 *  runtime so nothing large is persisted server-side.
 * ─────────────────────────────────────────────────────────────────────── */

function buildAvatar(bg: string, fg: string, paths: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="60" fill="${bg}"/>
    <g fill="${fg}">${paths}</g>
  </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Ordered list – index 0 → "default:1", index 9 → "default:10" */
export const DEFAULT_AVATARS: string[] = [
    // 1 – Person
    buildAvatar("#6366f1", "#e0e7ff",
        `<circle cx="60" cy="42" r="18"/><ellipse cx="60" cy="95" rx="32" ry="24"/>`),
    // 2 – Cat
    buildAvatar("#ec4899", "#fce7f3",
        `<polygon points="35,55 28,28 48,42"/><polygon points="85,55 92,28 72,42"/><circle cx="60" cy="62" r="22"/><circle cx="52" cy="58" r="3" fill="#ec4899"/><circle cx="68" cy="58" r="3" fill="#ec4899"/><ellipse cx="60" cy="66" rx="4" ry="2.5" fill="#ec4899"/>`),
    // 3 – Robot
    buildAvatar("#14b8a6", "#ccfbf1",
        `<rect x="38" y="35" width="44" height="40" rx="8"/><rect x="48" y="48" width="8" height="8" rx="2" fill="#14b8a6"/><rect x="64" y="48" width="8" height="8" rx="2" fill="#14b8a6"/><rect x="52" y="62" width="16" height="4" rx="1" fill="#14b8a6"/><rect x="56" y="26" width="8" height="12" rx="4"/><rect x="28" y="50" width="10" height="6" rx="3"/><rect x="82" y="50" width="10" height="6" rx="3"/>`),
    // 4 – Star
    buildAvatar("#f59e0b", "#fef3c7",
        `<polygon points="60,22 68,46 94,46 73,60 80,84 60,70 40,84 47,60 26,46 52,46"/>`),
    // 5 – Bear
    buildAvatar("#8b5cf6", "#ede9fe",
        `<circle cx="38" cy="38" r="14"/><circle cx="82" cy="38" r="14"/><circle cx="60" cy="62" r="28"/><circle cx="50" cy="56" r="4" fill="#8b5cf6"/><circle cx="70" cy="56" r="4" fill="#8b5cf6"/><ellipse cx="60" cy="68" rx="6" ry="4" fill="#8b5cf6"/>`),
    // 6 – Ghost
    buildAvatar("#64748b", "#e2e8f0",
        `<path d="M38,85 L38,52 A22,22 0 0,1 82,52 L82,85 L74,75 L66,85 L60,75 L54,85 L46,75 Z"/><circle cx="52" cy="54" r="4" fill="#64748b"/><circle cx="68" cy="54" r="4" fill="#64748b"/>`),
    // 7 – Flower
    buildAvatar("#e11d48", "#ffe4e6",
        `<circle cx="60" cy="40" r="12"/><circle cx="46" cy="55" r="12"/><circle cx="74" cy="55" r="12"/><circle cx="50" cy="72" r="12"/><circle cx="70" cy="72" r="12"/><circle cx="60" cy="58" r="10" fill="#facc15"/>`),
    // 8 – Diamond
    buildAvatar("#0ea5e9", "#e0f2fe",
        `<polygon points="60,20 92,60 60,100 28,60"/><polygon points="60,34 78,60 60,86 42,60" fill="#0ea5e9" opacity="0.3"/>`),
    // 9 – Fox
    buildAvatar("#f97316", "#fff7ed",
        `<polygon points="30,70 30,30 60,55"/><polygon points="90,70 90,30 60,55"/><ellipse cx="60" cy="68" rx="24" ry="20"/><circle cx="52" cy="62" r="3" fill="#f97316"/><circle cx="68" cy="62" r="3" fill="#f97316"/><polygon points="56,72 60,78 64,72" fill="#f97316"/>`),
    // 10 – Astronaut
    buildAvatar("#6d28d9", "#f5f3ff",
        `<circle cx="60" cy="50" r="24"/><rect x="44" y="44" width="32" height="18" rx="9" fill="#a5b4fc"/><circle cx="54" cy="52" r="3" fill="#6d28d9"/><circle cx="66" cy="52" r="3" fill="#6d28d9"/><rect x="52" y="74" width="16" height="16" rx="4"/><rect x="46" y="80" width="8" height="14" rx="3"/><rect x="66" y="80" width="8" height="14" rx="3"/>`),
];

/**
 * Resolve an avatar value to a displayable image src.
 *  - "default:3"  → inline SVG data URI for avatar #3
 *  - any other string (URL / data URI) → returned as-is
 *  - empty string → empty string (caller should show initials fallback)
 */
export function resolveAvatar(value: string): string {
    if (!value) return "";
    const match = value.match(/^default:(\d+)$/);
    if (match) {
        const idx = parseInt(match[1], 10) - 1;
        return DEFAULT_AVATARS[idx] ?? "";
    }
    return value;
}

/**
 * Check if a value is a default avatar identifier.
 */
export function isDefaultAvatar(value: string): boolean {
    return /^default:\d+$/.test(value);
}
