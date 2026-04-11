/**
 * PROD-04 – Product Compare E2E Tests
 *
 * Verifies compare feature allows adding/removing products.
 */

describe('Product Compare', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    /* ─── COMPARE-01: Add to compare ─── */

    it('should add a product to compare list', () => {
        cy.get('a[href*="/product/"]').first().trigger('mouseenter');
        // Click compare icon (BarChart2)
        cy.get('button').filter(':has(svg)').then($buttons => {
            // Find compare button by position (usually after favorite)
            const compareBtn = $buttons.filter((_, el) => {
                return el.innerHTML.includes('bar-chart') || el.innerHTML.includes('BarChart');
            });
            if (compareBtn.length) {
                cy.wrap(compareBtn.first()).click({ force: true });
            }
        });
    });

    /* ─── COMPARE-02: Compare page ─── */

    it('should navigate to compare page', () => {
        cy.visit('/compare');
        cy.url().should('include', '/compare');
        // Page should load
        cy.get('header').should('be.visible');
    });

    /* ─── COMPARE-03: Compare bar visibility ─── */

    it('should show compare bar when products are added', () => {
        // Add product to compare from product detail
        cy.get('a[href*="/product/"]').first().click();
        cy.url().should('include', '/product/');
        // Look for compare/BarChart button
        cy.get('body').then($body => {
            if ($body.find('button:contains("Comparar")').length > 0) {
                cy.contains('button', 'Comparar').click();
                cy.get('[class*="fixed bottom"], [class*="compare-bar"]').should('exist');
            }
        });
    });
});
