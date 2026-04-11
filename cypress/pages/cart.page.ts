import { BasePage } from './base.page';

/**
 * Page Object for the Cart page (/cart)
 *
 * Cart items are div.bg-white.rounded-lg.shadow-sm cards.
 * Quantity uses +/- icon buttons (lucide Minus/Plus).
 * Remove button has title="Eliminar del carrito".
 */
export class CartPage extends BasePage {
    readonly path = '/cart';

    /* ── Selectors ── */
    private readonly cartItem = '.min-h-screen .bg-white.rounded-lg.shadow-sm';

    /* ── Actions ── */

    incrementItem(index: number): void {
        cy.get(this.cartItem).eq(index).within(() => {
            cy.get('button').filter(':has(svg.lucide-plus)').click();
        });
    }

    decrementItem(index: number): void {
        cy.get(this.cartItem).eq(index).within(() => {
            cy.get('button').filter(':has(svg.lucide-minus)').click();
        });
    }

    removeItem(index: number): void {
        cy.get(this.cartItem).eq(index).within(() => {
            cy.get('button[title="Eliminar del carrito"]').click();
        });
    }

    goToCheckout(): void {
        cy.contains('button', /proceder al pago|pagar|checkout/i).click();
    }

    /* ── Assertions ── */

    assertCartLoaded(): void {
        cy.url().should('include', '/cart');
    }

    assertItemCount(count: number): void {
        if (count === 0) {
            cy.get(this.cartItem).should('not.exist');
        } else {
            cy.get(this.cartItem).should('have.length', count);
        }
    }

    assertEmpty(): void {
        cy.contains(/vacío|empty|no hay/i).should('be.visible');
    }

    assertNotEmpty(): void {
        cy.get(this.cartItem, { timeout: 15000 }).should('have.length.gte', 1);
    }

    getSubtotal(): Cypress.Chainable<string> {
        return cy.contains('span', 'Subtotal').siblings('span').invoke('text');
    }

    getItems(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.get(this.cartItem);
    }
}

export const cartPage = new CartPage();
