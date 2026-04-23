/* ── Gift-card types & design catalogue ─────────────────────── */

export interface GiftCardDesign {
    id: string;
    name: string;
    from: string;
    to: string;
    accent: string;
    patternClass: string;
    emoji: string;
}

/** Available card visual themes. */
export const GIFT_CARD_DESIGNS: GiftCardDesign[] = [
    { id: "classic", name: "Clásica", from: "#111827", to: "#374151", accent: "#F9FAFB", patternClass: "pattern-classic", emoji: "✦" },
    { id: "premium", name: "Premium", from: "#78350F", to: "#D97706", accent: "#FEF3C7", patternClass: "pattern-premium", emoji: "◆" },
    { id: "birthday", name: "Cumpleaños", from: "#4C1D95", to: "#7C3AED", accent: "#EDE9FE", patternClass: "pattern-birthday", emoji: "✿" },
    { id: "love", name: "Amor", from: "#9D174D", to: "#EC4899", accent: "#FCE7F3", patternClass: "pattern-love", emoji: "♥" },
    { id: "nature", name: "Naturaleza", from: "#064E3B", to: "#059669", accent: "#D1FAE5", patternClass: "pattern-nature", emoji: "❋" },
    { id: "ocean", name: "Ocean", from: "#1E3A5F", to: "#0EA5E9", accent: "#E0F2FE", patternClass: "pattern-ocean", emoji: "◉" },
];

/** Preset denomination options. */
export const GIFT_CARD_AMOUNTS = [25, 50, 75, 100, 150, 200];

export type GCStatus = "pending" | "active" | "used" | "expired";

export interface ReceivedGiftCard {
    id: string;
    code: string;
    balance: number;
    originalAmount: number;
    fromName: string;
    fromEmail: string;
    message: string;
    receivedDate: string;
    expiryDate: string;
    designId: string;
    status: GCStatus;
    isActivated: boolean;
}

export interface SentGiftCard {
    id: string;
    code: string;
    amount: number;
    toName: string;
    toEmail: string;
    message: string;
    sentDate: string;
    /** Localised day-level label (for display). */
    scheduledDate?: string;
    /** ISO-8601 instant so a live countdown can tick toward the exact moment. */
    scheduledAt?: string;
    designId: string;
    status: "delivered" | "scheduled" | "pending" | "redeemed";
}
