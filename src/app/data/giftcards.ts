// ── Gift card design catalogue ────────────────────────────────────────────────
export interface GiftCardDesign {
  id: string;
  name: string;
  from: string;
  to: string;
  accent: string;
  patternClass: string;
  emoji: string;
}

export const GIFT_CARD_DESIGNS: GiftCardDesign[] = [
  {
    id: "classic",
    name: "Clásica",
    from: "#111827",
    to: "#374151",
    accent: "#F9FAFB",
    patternClass: "pattern-classic",
    emoji: "✦",
  },
  {
    id: "premium",
    name: "Premium",
    from: "#78350F",
    to: "#D97706",
    accent: "#FEF3C7",
    patternClass: "pattern-premium",
    emoji: "◆",
  },
  {
    id: "birthday",
    name: "Cumpleaños",
    from: "#4C1D95",
    to: "#7C3AED",
    accent: "#EDE9FE",
    patternClass: "pattern-birthday",
    emoji: "✿",
  },
  {
    id: "love",
    name: "Amor",
    from: "#9D174D",
    to: "#EC4899",
    accent: "#FCE7F3",
    patternClass: "pattern-love",
    emoji: "♥",
  },
  {
    id: "nature",
    name: "Naturaleza",
    from: "#064E3B",
    to: "#059669",
    accent: "#D1FAE5",
    patternClass: "pattern-nature",
    emoji: "❋",
  },
  {
    id: "ocean",
    name: "Ocean",
    from: "#1E3A5F",
    to: "#0EA5E9",
    accent: "#E0F2FE",
    patternClass: "pattern-ocean",
    emoji: "◉",
  },
];

export const GIFT_CARD_AMOUNTS = [25, 50, 75, 100, 150, 200];

// ── User-side gift card data types ───────────────────────────────────────────
export type GCStatus = "active" | "used" | "expired";

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
  scheduledDate?: string;
  designId: string;
  status: "delivered" | "pending" | "redeemed";
}

// ── Mock received cards ───────────────────────────────────────────────────────
export const mockReceivedCards: ReceivedGiftCard[] = [
  {
    id: "rc1",
    code: "NX036-A7B3-CX91",
    balance: 75,
    originalAmount: 100,
    fromName: "Carlos García",
    fromEmail: "carlos@example.com",
    message: "¡Feliz cumpleaños! Espero que encuentres algo que te guste mucho en NX036 🎉",
    receivedDate: "10/02/2026",
    expiryDate: "10/02/2027",
    designId: "birthday",
    status: "active",
    isActivated: true,
  },
  {
    id: "rc2",
    code: "NX036-B2K5-MT44",
    balance: 50,
    originalAmount: 50,
    fromName: "Laura Martínez",
    fromEmail: "laura@example.com",
    message: "Un pequeño detalle para que te regales algo especial ♥",
    receivedDate: "14/02/2026",
    expiryDate: "14/02/2027",
    designId: "love",
    status: "active",
    isActivated: true,
  },
  {
    id: "rc3",
    code: "NX036-C9P1-DR72",
    balance: 0,
    originalAmount: 25,
    fromName: "Equipo NX036",
    fromEmail: "gifts@nx036.com",
    message: "Como cliente VIP, te regalamos este bono de bienvenida.",
    receivedDate: "01/01/2026",
    expiryDate: "01/01/2027",
    designId: "premium",
    status: "used",
    isActivated: true,
  },
];

export const mockSentCards: SentGiftCard[] = [
  {
    id: "sc1",
    code: "NX036-D4R8-KL29",
    amount: 50,
    toName: "Ana López",
    toEmail: "ana@example.com",
    message: "Para que te compres algo bonito ✨",
    sentDate: "05/03/2026",
    designId: "nature",
    status: "delivered",
  },
  {
    id: "sc2",
    code: "NX036-E6W2-NZ83",
    amount: 100,
    toName: "Pedro Sánchez",
    toEmail: "pedro@example.com",
    message: "¡Felicitaciones por tu ascenso!",
    sentDate: "01/03/2026",
    designId: "premium",
    status: "redeemed",
  },
];
