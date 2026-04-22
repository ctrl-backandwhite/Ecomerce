import { useCallback } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { logger } from "../lib/logger";

/**
 * Hook for Stripe.js integration.
 * Handles tokenization of card details and creation of payment method tokens.
 */
export function useStripe() {
    const stripePromise = useCallback(async (): Promise<Stripe | null> => {
        try {
            // Use public key from environment or hard-coded for now
            const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_51TOv7eFbial...";
            if (!publishableKey) {
                logger.error("Stripe publishable key not configured");
                throw new Error("Stripe publishable key not configured");
            }
            const stripe = await loadStripe(publishableKey);
            return stripe;
        } catch (err) {
            logger.error("Failed to load Stripe.js", err);
            return null;
        }
    }, []);

    /**
     * Create a payment method token from card details.
     * This sends the card data securely to Stripe without passing it through your server.
     *
     * @param cardNumber - Card number (16 digits)
     * @param expiry - Expiry in MM/YY format
     * @param cvc - CVC/CVV code
     * @param billingName - Cardholder name
     * @returns payment method ID (pm_xxxx) or null on error
     */
    const createPaymentMethod = useCallback(
        async (cardNumber: string, expiry: string, cvc: string, billingName: string): Promise<string | null> => {
            try {
                const stripe = await stripePromise();
                if (!stripe) {
                    logger.error("Stripe not loaded");
                    return null;
                }

                // Parse expiry: "MM/YY" → month and year
                const [mm, yy] = expiry.split("/").map((s) => s.trim());
                const month = parseInt(mm, 10);
                const year = 2000 + parseInt(yy, 10);

                // Create payment method using Stripe API
                const response = await stripe.createPaymentMethod({
                    type: "card",
                    card: {
                        number: cardNumber.replace(/\s/g, ""),
                        exp_month: month,
                        exp_year: year,
                        cvc: cvc,
                    },
                    billing_details: {
                        name: billingName,
                    },
                });

                if (response.error) {
                    logger.error("Stripe payment method creation failed", response.error);
                    return null;
                }

                logger.debug("Payment method created successfully", response.paymentMethod?.id);
                return response.paymentMethod?.id || null;
            } catch (err) {
                logger.error("Failed to create payment method", err);
                return null;
            }
        },
        [stripePromise]
    );

    return { createPaymentMethod };
}
