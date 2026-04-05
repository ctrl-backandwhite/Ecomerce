/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CMS Repositories for mic-cmsservice                         ║
 * ║                                                              ║
 * ║  Slides, Newsletter, GiftCards, Contact, SEO, Campaigns,     ║
 * ║  Loyalty, EmailTemplates, Flows, Settings                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { authFetch } from "../lib/authFetch";
import { nxFetch } from "../lib/nxFetch";
import { ApiError, NetworkError } from "../lib/AppError";
import type { ApiErrorBody, Page } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:9000";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function handleRes<R>(res: Response): Promise<R> {
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const e: ApiErrorBody = await res.json(); msg = e.message || msg; } catch { /* */ }
        throw new ApiError(res.status, msg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as R);
}

function wrapErr(err: unknown, msg: string): never {
    if (err instanceof ApiError) throw err;
    throw new NetworkError(msg, err instanceof Error ? err : undefined);
}

function buildParams(query: Record<string, unknown>): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
    }
    return p.toString();
}

// ═══════════════════════════════════════════════════════════════
// SLIDES
// ═══════════════════════════════════════════════════════════════

export interface Slide {
    id: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    linkUrl: string | null;
    position: number;
    active: boolean;
    createdAt: string;
    updatedAt: string | null;
}

export interface SlidePayload {
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    position?: number;
    active?: boolean;
}

class SlideRepository {
    private url = `${API_BASE}/api/v1/slides`;

    async findActive(): Promise<Slide[]> {
        try { return handleRes<Slide[]>(await nxFetch(`${this.url}/active`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los slides"); }
    }

    async findAll(): Promise<Slide[]> {
        try { return handleRes<Slide[]>(await authFetch(this.url)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los slides"); }
    }

    async findById(id: string): Promise<Slide> {
        try { return handleRes<Slide>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el slide"); }
    }

    async create(data: SlidePayload): Promise<Slide> {
        try {
            return handleRes<Slide>(await authFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear el slide"); }
    }

    async update(id: string, data: SlidePayload): Promise<Slide> {
        try {
            return handleRes<Slide>(await authFetch(`${this.url}/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar el slide"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el slide"); }
    }

    async updatePositions(positions: { id: string; position: number }[]): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/positions`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(positions),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudieron actualizar las posiciones"); }
    }
}

export const slideRepository = new SlideRepository();

// ═══════════════════════════════════════════════════════════════
// NEWSLETTER
// ═══════════════════════════════════════════════════════════════

export interface NewsletterSubscriber {
    id: string;
    email: string;
    subscribedAt: string;
    active: boolean;
}

class NewsletterRepository {
    private url = `${API_BASE}/api/v1/newsletter`;

    async subscribe(email: string): Promise<void> {
        try {
            const res = await nxFetch(`${this.url}/subscribe`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo suscribir al newsletter"); }
    }

    async unsubscribe(email: string): Promise<void> {
        try {
            const res = await nxFetch(`${this.url}/unsubscribe`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo cancelar la suscripción"); }
    }

    async findAll(query: Record<string, unknown> = {}): Promise<Page<NewsletterSubscriber>> {
        try {
            const qs = buildParams(query);
            return handleRes<Page<NewsletterSubscriber>>(await authFetch(`${this.url}?${qs}`));
        } catch (err) { wrapErr(err, "No se pudieron obtener los suscriptores"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el suscriptor"); }
    }

    async count(): Promise<number> {
        try { return handleRes<number>(await authFetch(`${this.url}/count`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el conteo"); }
    }
}

export const newsletterRepository = new NewsletterRepository();

// ═══════════════════════════════════════════════════════════════
// GIFT CARDS
// ═══════════════════════════════════════════════════════════════

export interface GiftCardDesign {
    id: string;
    name: string;
    from: string;
    to: string;
    accent: string;
    patternClass: string;
    emoji: string;
    active: boolean;
}

export interface GiftCard {
    id: string;
    code: string;
    designId: string;
    buyerId: string;
    recipientName: string | null;
    recipientEmail: string | null;
    originalAmount: number;
    balance: number;
    message: string | null;
    status: "PENDING" | "ACTIVE" | "USED" | "EXPIRED" | "VOID";
    sendDate: string | null;
    expiryDate: string | null;
    activatedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface GiftCardTransaction {
    id: string;
    giftCardId: string;
    type: "PURCHASE" | "REDEMPTION" | "REFUND";
    amount: number;
    orderId: string | null;
    createdAt: string;
}

export interface GiftCardPurchasePayload {
    designId: string;
    amount: number;
    recipientEmail?: string;
    message?: string;
}

class GiftCardRepository {
    private url = `${API_BASE}/api/v1/gift-cards`;

    // Public
    async findActiveDesigns(): Promise<GiftCardDesign[]> {
        try { return handleRes<GiftCardDesign[]>(await nxFetch(`${this.url}/designs/active`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los diseños"); }
    }

    async purchase(data: GiftCardPurchasePayload): Promise<GiftCard> {
        try {
            return handleRes<GiftCard>(await authFetch(`${this.url}/purchase`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo comprar la tarjeta regalo"); }
    }

    async findByCode(code: string): Promise<GiftCard> {
        try { return handleRes<GiftCard>(await authFetch(`${this.url}/code/${code}`)); }
        catch (err) { wrapErr(err, "No se encontró la tarjeta regalo"); }
    }

    async getBalance(code: string): Promise<{ balance: number }> {
        try { return handleRes<{ balance: number }>(await authFetch(`${this.url}/code/${code}/balance`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el saldo"); }
    }

    async redeem(data: { code: string; amount: number; orderId: string }): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/redeem`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo canjear la tarjeta regalo"); }
    }

    // Admin
    async findAllDesigns(): Promise<GiftCardDesign[]> {
        try { return handleRes<GiftCardDesign[]>(await authFetch(`${this.url}/designs`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los diseños"); }
    }

    async createDesign(data: Partial<GiftCardDesign>): Promise<GiftCardDesign> {
        try {
            return handleRes<GiftCardDesign>(await authFetch(`${this.url}/designs`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear el diseño"); }
    }

    async updateDesign(id: string, data: Partial<GiftCardDesign>): Promise<GiftCardDesign> {
        try {
            return handleRes<GiftCardDesign>(await authFetch(`${this.url}/designs/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar el diseño"); }
    }

    async deleteDesign(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/designs/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el diseño"); }
    }

    async findAll(query: Record<string, unknown> = {}): Promise<Page<GiftCard>> {
        try {
            const qs = buildParams(query);
            return handleRes<Page<GiftCard>>(await authFetch(`${this.url}?${qs}`));
        } catch (err) { wrapErr(err, "No se pudieron obtener las tarjetas regalo"); }
    }

    async findById(id: string): Promise<GiftCard> {
        try { return handleRes<GiftCard>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener la tarjeta regalo"); }
    }

    async findTransactions(id: string): Promise<GiftCardTransaction[]> {
        try { return handleRes<GiftCardTransaction[]>(await authFetch(`${this.url}/${id}/transactions`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener las transacciones"); }
    }
}

export const giftCardRepository = new GiftCardRepository();

// ═══════════════════════════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════════════════════════

export interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export interface ContactPayload {
    name: string;
    email: string;
    subject: string;
    message: string;
}

class ContactRepository {
    private url = `${API_BASE}/api/v1/contact`;

    async submit(data: ContactPayload): Promise<void> {
        try {
            const res = await nxFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo enviar el mensaje"); }
    }

    async findAll(query: Record<string, unknown> = {}): Promise<Page<ContactMessage>> {
        try {
            const qs = buildParams(query);
            return handleRes<Page<ContactMessage>>(await authFetch(`${this.url}?${qs}`));
        } catch (err) { wrapErr(err, "No se pudieron obtener los mensajes"); }
    }

    async findById(id: string): Promise<ContactMessage> {
        try { return handleRes<ContactMessage>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el mensaje"); }
    }

    async markAsRead(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}/read`, { method: "PATCH", headers: { accept: "*/*" } });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo marcar como leído"); }
    }
}

export const contactRepository = new ContactRepository();

// ═══════════════════════════════════════════════════════════════
// SEO PAGES
// ═══════════════════════════════════════════════════════════════

export interface SeoPage {
    id: string;
    path: string;
    title: string;
    description: string;
    keywords: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    canonicalUrl: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface SeoPagePayload {
    path: string;
    title: string;
    description: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
}

class SeoPageRepository {
    private url = `${API_BASE}/api/v1/seo`;

    async findAll(): Promise<SeoPage[]> {
        try { return handleRes<SeoPage[]>(await authFetch(this.url)); }
        catch (err) { wrapErr(err, "No se pudieron obtener las páginas SEO"); }
    }

    async findById(id: string): Promise<SeoPage> {
        try { return handleRes<SeoPage>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener la página SEO"); }
    }

    async findByPath(path: string): Promise<SeoPage> {
        try {
            const params = new URLSearchParams({ path });
            return handleRes<SeoPage>(await nxFetch(`${this.url}/path?${params}`));
        } catch (err) { wrapErr(err, "No se pudo obtener la página SEO"); }
    }

    async create(data: SeoPagePayload): Promise<SeoPage> {
        try {
            return handleRes<SeoPage>(await authFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear la página SEO"); }
    }

    async update(id: string, data: SeoPagePayload): Promise<SeoPage> {
        try {
            return handleRes<SeoPage>(await authFetch(`${this.url}/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar la página SEO"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la página SEO"); }
    }
}

export const seoPageRepository = new SeoPageRepository();

// ═══════════════════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

export interface Campaign {
    id: string;
    name: string;
    description: string | null;
    type: "DISCOUNT" | "FLASH_SALE" | "SEASONAL" | "LOYALTY";
    startDate: string;
    endDate: string;
    active: boolean;
    bannerUrl: string | null;
    discount: number | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface CampaignPayload {
    name: string;
    description?: string;
    type: "DISCOUNT" | "FLASH_SALE" | "SEASONAL" | "LOYALTY";
    startDate: string;
    endDate: string;
    bannerUrl?: string;
    discount?: number;
    active?: boolean;
}

class CampaignRepository {
    private url = `${API_BASE}/api/v1/campaigns`;

    async findActive(): Promise<Campaign[]> {
        try { return handleRes<Campaign[]>(await nxFetch(`${this.url}/active`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener las campañas activas"); }
    }

    async findAll(query: Record<string, unknown> = {}): Promise<Page<Campaign>> {
        try {
            const qs = buildParams(query);
            return handleRes<Page<Campaign>>(await authFetch(`${this.url}?${qs}`));
        } catch (err) { wrapErr(err, "No se pudieron obtener las campañas"); }
    }

    async findById(id: string): Promise<Campaign> {
        try { return handleRes<Campaign>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener la campaña"); }
    }

    async create(data: CampaignPayload): Promise<Campaign> {
        try {
            return handleRes<Campaign>(await authFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear la campaña"); }
    }

    async update(id: string, data: CampaignPayload): Promise<Campaign> {
        try {
            return handleRes<Campaign>(await authFetch(`${this.url}/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar la campaña"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la campaña"); }
    }

    async toggleActive(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}/toggle`, { method: "PATCH", headers: { accept: "*/*" } });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo cambiar el estado de la campaña"); }
    }
}

export const campaignRepository = new CampaignRepository();

// ═══════════════════════════════════════════════════════════════
// LOYALTY
// ═══════════════════════════════════════════════════════════════

export interface LoyaltyTier {
    id: string;
    name: string;
    minPoints: number;
    multiplier: number;
    benefits: string;
    createdAt: string;
}

export interface LoyaltyTierPayload {
    name: string;
    minPoints: number;
    multiplier: number;
    benefits: string;
}

export interface LoyaltyRule {
    id: string;
    name: string;
    event: string;
    points: number;
    active: boolean;
    createdAt: string;
}

export interface LoyaltyRulePayload {
    name: string;
    event: string;
    points: number;
    active?: boolean;
}

export interface LoyaltyBalance {
    userId: string;
    points: number;
    tier: string;
}

export interface LoyaltyHistory {
    id: string;
    type: "EARN" | "REDEEM";
    points: number;
    description: string;
    createdAt: string;
}

class LoyaltyRepository {
    private url = `${API_BASE}/api/v1/loyalty`;

    // Tiers
    async findAllTiers(): Promise<LoyaltyTier[]> {
        try { return handleRes<LoyaltyTier[]>(await authFetch(`${this.url}/tiers`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los niveles"); }
    }

    async createTier(data: LoyaltyTierPayload): Promise<LoyaltyTier> {
        try {
            return handleRes<LoyaltyTier>(await authFetch(`${this.url}/tiers`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear el nivel"); }
    }

    async updateTier(id: string, data: LoyaltyTierPayload): Promise<LoyaltyTier> {
        try {
            return handleRes<LoyaltyTier>(await authFetch(`${this.url}/tiers/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar el nivel"); }
    }

    async deleteTier(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/tiers/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el nivel"); }
    }

    // Rules
    async findAllRules(): Promise<LoyaltyRule[]> {
        try { return handleRes<LoyaltyRule[]>(await authFetch(`${this.url}/rules`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener las reglas"); }
    }

    async createRule(data: LoyaltyRulePayload): Promise<LoyaltyRule> {
        try {
            return handleRes<LoyaltyRule>(await authFetch(`${this.url}/rules`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear la regla"); }
    }

    async updateRule(id: string, data: LoyaltyRulePayload): Promise<LoyaltyRule> {
        try {
            return handleRes<LoyaltyRule>(await authFetch(`${this.url}/rules/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar la regla"); }
    }

    async deleteRule(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/rules/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la regla"); }
    }

    // User loyalty
    async getBalance(): Promise<LoyaltyBalance> {
        try { return handleRes<LoyaltyBalance>(await authFetch(`${this.url}/balance`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el saldo de puntos"); }
    }

    async getHistory(query: Record<string, unknown> = {}): Promise<Page<LoyaltyHistory>> {
        try {
            const qs = buildParams(query);
            return handleRes<Page<LoyaltyHistory>>(await authFetch(`${this.url}/history?${qs}`));
        } catch (err) { wrapErr(err, "No se pudo obtener el historial"); }
    }
}

export const loyaltyRepository = new LoyaltyRepository();

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    htmlBody: string;
    textBody: string | null;
    variables: string[];
    createdAt: string;
    updatedAt: string | null;
}

export interface EmailTemplatePayload {
    name: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    variables?: string[];
}

class EmailTemplateRepository {
    private url = `${API_BASE}/api/v1/email-templates`;

    async findAll(): Promise<EmailTemplate[]> {
        try { return handleRes<EmailTemplate[]>(await authFetch(this.url)); }
        catch (err) { wrapErr(err, "No se pudieron obtener las plantillas"); }
    }

    async findById(id: string): Promise<EmailTemplate> {
        try { return handleRes<EmailTemplate>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener la plantilla"); }
    }

    async create(data: EmailTemplatePayload): Promise<EmailTemplate> {
        try {
            return handleRes<EmailTemplate>(await authFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear la plantilla"); }
    }

    async update(id: string, data: EmailTemplatePayload): Promise<EmailTemplate> {
        try {
            return handleRes<EmailTemplate>(await authFetch(`${this.url}/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar la plantilla"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar la plantilla"); }
    }
}

export const emailTemplateRepository = new EmailTemplateRepository();

// ═══════════════════════════════════════════════════════════════
// FLOWS
// ═══════════════════════════════════════════════════════════════

export interface FlowStep {
    id: string;
    flowId: string;
    name: string;
    type: string;
    config: Record<string, unknown>;
    position: number;
}

export interface Flow {
    id: string;
    name: string;
    description: string | null;
    trigger: string;
    active: boolean;
    steps: FlowStep[];
    createdAt: string;
    updatedAt: string | null;
}

export interface FlowPayload {
    name: string;
    description?: string;
    trigger: string;
    active?: boolean;
}

class FlowRepository {
    private url = `${API_BASE}/api/v1/flows`;

    async findAll(): Promise<Flow[]> {
        try { return handleRes<Flow[]>(await authFetch(this.url)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los flujos"); }
    }

    async findById(id: string): Promise<Flow> {
        try { return handleRes<Flow>(await authFetch(`${this.url}/${id}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el flujo"); }
    }

    async create(data: FlowPayload): Promise<Flow> {
        try {
            return handleRes<Flow>(await authFetch(this.url, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo crear el flujo"); }
    }

    async update(id: string, data: FlowPayload): Promise<Flow> {
        try {
            return handleRes<Flow>(await authFetch(`${this.url}/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            }));
        } catch (err) { wrapErr(err, "No se pudo actualizar el flujo"); }
    }

    async delete(id: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el flujo"); }
    }

    async syncSteps(id: string, steps: Partial<FlowStep>[]): Promise<FlowStep[]> {
        try {
            return handleRes<FlowStep[]>(await authFetch(`${this.url}/${id}/steps`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(steps),
            }));
        } catch (err) { wrapErr(err, "No se pudieron sincronizar los pasos"); }
    }
}

export const flowRepository = new FlowRepository();

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

export interface Setting {
    key: string;
    value: string;
    section: string;
    type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
}

class SettingRepository {
    private url = `${API_BASE}/api/v1/settings`;

    async findAll(): Promise<Setting[]> {
        try { return handleRes<Setting[]>(await authFetch(this.url)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los ajustes"); }
    }

    async findBySection(section: string): Promise<Setting[]> {
        try { return handleRes<Setting[]>(await authFetch(`${this.url}/section/${section}`)); }
        catch (err) { wrapErr(err, "No se pudieron obtener los ajustes"); }
    }

    async findByKey(key: string): Promise<Setting> {
        try { return handleRes<Setting>(await authFetch(`${this.url}/${key}`)); }
        catch (err) { wrapErr(err, "No se pudo obtener el ajuste"); }
    }

    async save(setting: Setting): Promise<Setting> {
        try {
            return handleRes<Setting>(await authFetch(this.url, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(setting),
            }));
        } catch (err) { wrapErr(err, "No se pudo guardar el ajuste"); }
    }

    async delete(key: string): Promise<void> {
        try {
            const res = await authFetch(`${this.url}/${key}`, { method: "DELETE" });
            if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
        } catch (err) { wrapErr(err, "No se pudo eliminar el ajuste"); }
    }
}

export const settingRepository = new SettingRepository();
