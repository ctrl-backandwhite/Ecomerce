/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CMS Repositories — barrel re-exports                        ║
 * ║                                                              ║
 * ║  Slides, Newsletter, GiftCards, Contact, SEO, Campaigns,     ║
 * ║  Loyalty, EmailTemplates, Flows, Settings                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

export { slideRepository } from "./SlideRepository";
export type { Slide, SlidePayload } from "./SlideRepository";

export { newsletterRepository } from "./NewsletterRepository";
export type { NewsletterSubscriber } from "./NewsletterRepository";

export { adminGiftCardRepository } from "./AdminGiftCardRepository";
export type { GiftCardDesign, GiftCard, GiftCardTransaction, GiftCardPurchasePayload } from "./AdminGiftCardRepository";

export { contactRepository } from "./ContactRepository";
export type { ContactMessage, ContactPayload } from "./ContactRepository";

export { seoPageRepository } from "./SeoPageRepository";
export type { SeoPage, SeoPagePayload } from "./SeoPageRepository";

export { campaignRepository } from "./CampaignRepository";
export type { Campaign, CampaignPayload, ApiCampaignType } from "./CampaignRepository";

export { loyaltyRepository } from "./LoyaltyRepository";
export type { LoyaltyAction, LoyaltyTier, LoyaltyTierPayload, LoyaltyRule, LoyaltyRulePayload, LoyaltyBalance, LoyaltyHistory } from "./LoyaltyRepository";

export { emailTemplateRepository } from "./EmailTemplateRepository";
export type { EmailTemplate, EmailTemplatePayload } from "./EmailTemplateRepository";

export { flowRepository } from "./FlowRepository";
export type { Flow, FlowPayload, FlowStep } from "./FlowRepository";

export { settingRepository } from "./SettingRepository";
export type { Setting } from "./SettingRepository";
