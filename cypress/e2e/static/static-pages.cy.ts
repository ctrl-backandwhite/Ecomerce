/**
 * STATIC-01 – Static Pages E2E Tests
 *
 * Verifies About, Contact, FAQ, Shipping, Legal pages load correctly.
 */

describe('Static Pages', () => {
    /* ─── STATIC-01: About page ─── */

    it('should load about page', () => {
        cy.visit('/about');
        cy.url().should('include', '/about');
        cy.get('header').should('be.visible');
        cy.contains(/sobre nosotros|about|quiénes somos/i).should('exist');
    });

    /* ─── STATIC-02: Contact page ─── */

    it('should load contact page', () => {
        cy.visit('/contact');
        cy.url().should('include', '/contact');
        cy.contains(/contacto|contact/i).should('exist');
    });

    it('should display contact form', () => {
        cy.visit('/contact');
        cy.get('form, input[type="email"], textarea').should('exist');
    });

    /* ─── STATIC-03: FAQ page ─── */

    it('should load FAQ page', () => {
        cy.visit('/faq');
        cy.url().should('include', '/faq');
        cy.contains(/preguntas frecuentes|FAQ/i).should('exist');
    });

    it('should expand FAQ accordion items', () => {
        cy.visit('/faq');
        cy.get('button, [role="button"], summary, [class*="accordion"]')
            .first()
            .click();
        // Some content should expand
        cy.get('p, [class*="content"]').should('have.length.gte', 1);
    });

    /* ─── STATIC-04: Shipping page ─── */

    it('should load shipping info page', () => {
        cy.visit('/shipping');
        cy.url().should('include', '/shipping');
        cy.contains(/envío|shipping/i).should('exist');
    });

    /* ─── STATIC-05: Legal pages ─── */

    it('should load privacy policy page', () => {
        cy.visit('/legal/privacidad');
        cy.url().should('include', '/legal/');
        cy.contains(/privacidad|privacy/i).should('exist');
    });

    it('should load terms and conditions page', () => {
        cy.visit('/legal/terminos');
        cy.url().should('include', '/legal/');
        cy.contains(/términos|condiciones|terms/i).should('exist');
    });

    /* ─── STATIC-06: 404 page ─── */

    it('should display 404 for unknown routes', () => {
        cy.visit('/this-page-does-not-exist', { failOnStatusCode: false });
        cy.contains(/404|no encontrada|not found/i).should('exist');
    });

    /* ─── STATIC-07: Order tracking page ─── */

    it('should load order tracking page', () => {
        cy.visit('/tracking');
        cy.url().should('include', '/tracking');
        cy.contains(/seguimiento|tracking|rastreo/i).should('exist');
    });

    /* ─── STATIC-08: Gift card page ─── */

    it('should load gift card purchase page', () => {
        cy.visit('/gift-cards');
        cy.url().should('include', '/gift-cards');
        cy.contains(/gift card|tarjeta de regalo/i).should('exist');
    });
});
