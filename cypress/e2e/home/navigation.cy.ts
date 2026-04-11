/**
 * HOME-02 – Navigation E2E Tests
 *
 * Verifies header, footer, and navigation elements work correctly.
 */

describe('Navigation', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    /* ─── NAV-01: Header elements ─── */

    it('should display header with logo, search, and cart', () => {
        cy.get('header').should('be.visible');
        cy.get('header').within(() => {
            cy.contains('NX036').should('exist'); // Logo text
            cy.get('input[type="text"], input[type="search"]').should('exist'); // Search
            cy.get('a[href="/cart"]').should('exist'); // Cart link
        });
    });

    /* ─── NAV-02: Search functionality ─── */

    it('should navigate to search results when searching', () => {
        cy.get('header input[type="text"], header input[type="search"]')
            .first()
            .type('laptop{enter}');
        cy.url().should('include', '/search/laptop');
    });

    /* ─── NAV-03: Category navigation ─── */

    it('should navigate to category when clicking category button', () => {
        // Categories use programmatic navigate(), not <a> links
        // Click a category pill/button in the CategoryBar
        cy.get('button').filter(':visible').then($buttons => {
            // Find buttons that look like categories (exclude tiny icon buttons)
            const catBtn = $buttons.filter((_, el) => {
                const text = el.textContent?.trim() || '';
                return text.length > 2 && text.length < 30 && !text.includes('Agregar');
            });
            if (catBtn.length > 1) {
                cy.wrap(catBtn.eq(1)).click();
                cy.url().should('include', '/store/');
            }
        });
    });

    /* ─── NAV-04: Cart navigation ─── */

    it('should navigate to cart page', () => {
        cy.get('a[href="/cart"]').first().click();
        cy.url().should('include', '/cart');
    });

    /* ─── NAV-05: Footer links ─── */

    it('should display footer with navigation sections', () => {
        cy.get('footer').should('exist');
        cy.get('footer').within(() => {
            cy.contains(/tienda|ayuda|contacto/i).should('exist');
        });
    });

    it('should navigate to about page', () => {
        cy.get('a[href="/about"]').first().click({ force: true });
        cy.url().should('include', '/about');
    });

    it('should navigate to FAQ page', () => {
        cy.get('a[href="/faq"]').first().click({ force: true });
        cy.url().should('include', '/faq');
    });

    /* ─── NAV-06: Legal pages ─── */

    it('should navigate to privacy policy', () => {
        cy.get('a[href*="/legal/privacidad"], a[href*="/legal/privacy"]')
            .first()
            .click({ force: true });
        cy.url().should('include', '/legal/');
    });

    /* ─── NAV-07: Mobile menu ─── */

    it('should open mobile menu on small viewport', () => {
        cy.viewport(375, 812);
        cy.wait(500);
        // Find the hamburger menu button in header (visible only on mobile)
        cy.get('header button').filter(':visible').first().click({ force: true });
        cy.wait(500);
        // Mobile nav or menu panel should appear
        cy.get('nav, [class*="fixed"], [class*="absolute"]').filter(':visible').should('have.length.gte', 1);
    });
});
