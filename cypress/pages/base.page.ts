/**
 * Base Page Object — shared helpers for all page objects.
 */
export abstract class BasePage {
    abstract readonly path: string;

    visit(): void {
        cy.visit(this.path);
    }

    assertUrl(expected?: string): void {
        cy.url().should('include', expected ?? this.path);
    }

    /** Wait for the page container to be present in the DOM. */
    assertLoaded(selector: string, timeout = 15000): void {
        cy.get(selector, { timeout }).should('exist');
    }

    /** Intercept a GET request and alias it. */
    interceptGet(pattern: string, alias: string): void {
        cy.intercept('GET', pattern).as(alias);
    }

    /** Intercept a POST request and alias it. */
    interceptPost(pattern: string, alias: string): void {
        cy.intercept('POST', pattern).as(alias);
    }

    /** Type into a search input and press Enter. */
    search(query: string): void {
        cy.get('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Search"]')
            .first()
            .clear()
            .type(`${query}{enter}`);
    }

    /** Get the cart badge count from the header. */
    getCartBadge(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.get('[data-testid="cart-badge"], .badge');
    }
}
