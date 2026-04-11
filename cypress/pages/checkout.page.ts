import { BasePage } from './base.page';

/**
 * Page Object for the Checkout flow (/checkout)
 */
export class CheckoutPage extends BasePage {
    readonly path = '/checkout';

    /* ── Step indicators ── */
    private readonly stepIndicator = '[data-testid="step-indicator"]';
    private readonly nextBtn = 'button:contains("Siguiente"), button:contains("Next"), button:contains("Continuar")';
    private readonly backBtn = 'button:contains("Atrás"), button:contains("Back"), button:contains("Volver")';
    private readonly orderSummary = '[data-testid="order-summary"]';

    /* ── Actions ── */

    goNext(): void {
        cy.contains('button', /siguiente|next|continuar/i).click();
    }

    goBack(): void {
        cy.contains('button', /atrás|back|volver/i).click();
    }

    /* Step 1: Contact */
    fillContact(data: { firstName?: string; lastName?: string; email: string; phone: string }): void {
        cy.get('input[type="email"]').first().clear().type(data.email);
        cy.get('input[type="tel"]').first().clear().type(data.phone);
    }

    /* Step 2: Address */
    fillAddress(data: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }): void {
        // Select "new address" option if not already selected
        cy.get('body').then($body => {
            if ($body.find('input[placeholder*="Street"]').length === 0) {
                cy.contains('otra dirección').click({ force: true });
            }
        });
        // Fill the manual home delivery form using placeholder selectors
        cy.get('input[placeholder*="Full name"]').clear().type('E2E Test User');
        cy.get('input[placeholder*="Street"]').clear().type(data.street);
        cy.get('input[placeholder*="New York"]').clear().type(data.city);
        cy.get('input[placeholder*="NY"]').clear().type(data.state);
        cy.get('input[placeholder*="10001"]').clear().type(data.zip);
        cy.get('input[placeholder*="United States"]').clear().type(data.country);
    }

    /* Step 3: Shipping */
    selectShippingMethod(index: number = 0): void {
        cy.get('[data-testid="shipping-option"], input[name="shipping"]').eq(index).click();
    }

    /* Step 4: Payment */
    selectPaymentMethod(method: 'card' | 'paypal' | 'usdt' | 'btc'): void {
        cy.contains(method, { matchCase: false }).click();
    }

    confirmOrder(): void {
        cy.contains('button', /confirmar|confirm|pagar|place order/i).click();
    }

    /* Coupon */
    applyCoupon(code: string): void {
        cy.get('input[name="coupon"], input[placeholder*="cupón"], input[placeholder*="coupon"]')
            .clear()
            .type(code);
        cy.contains('button', /aplicar|apply/i).click();
    }

    /* ── Assertions ── */

    assertCheckoutLoaded(): void {
        cy.url().should('include', '/checkout');
    }

    assertOnStep(stepNumber: number): void {
        cy.get(this.stepIndicator)
            .find('.active, [aria-current="step"]')
            .should('contain', String(stepNumber));
    }

    assertOrderSummaryVisible(): void {
        cy.get(this.orderSummary).should('be.visible');
    }

    assertOrderConfirmation(): void {
        cy.contains(/confirmación|confirmado|order confirmed|número de orden/i, { timeout: 20000 })
            .should('be.visible');
    }

    assertCouponApplied(): void {
        cy.contains(/descuento|discount/i).should('be.visible');
    }

    assertCouponError(): void {
        cy.contains(/inválido|invalid|no encontrado|not found/i).should('be.visible');
    }

    assertValidationErrors(): void {
        cy.get('.text-red-500, .text-error, [role="alert"]').should('have.length.gte', 1);
    }
}

export const checkoutPage = new CheckoutPage();
