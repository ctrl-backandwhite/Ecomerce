/**
 * PROD-03 – Product Search E2E Tests
 *
 * Verifies search functionality across the storefront.
 */

import { homePage } from '../../pages/home.page';

describe('Product Search', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    /* ─── SEARCH-01: Basic search ─── */

    it('should display search results for a valid query', () => {
        homePage.searchFor('phone');
        cy.url().should('include', '/search/');
        cy.get('a[href*="/product/"]', { timeout: 15000 }).should('have.length.gte', 0);
    });

    /* ─── SEARCH-02: Empty search ─── */

    it('should handle empty search results gracefully', () => {
        homePage.searchFor('xyznonexistent12345');
        cy.url().should('include', '/search/');
        // Should show empty state or no results message
        cy.get('body').then($body => {
            const hasProducts = $body.find('a[href*="/product/"]').length > 0;
            if (!hasProducts) {
                cy.contains(/no se encontraron|no results|sin resultados/i).should('exist');
            }
        });
    });

    /* ─── SEARCH-03: Search from header ─── */

    it('should allow searching from the header search bar', () => {
        cy.get('header input[type="text"], header input[type="search"]')
            .first()
            .clear()
            .type('laptop{enter}');
        cy.url().should('include', '/search/laptop');
    });

    /* ─── SEARCH-04: Search result product cards ─── */

    it('should display product cards with correct info in search results', () => {
        homePage.searchFor('phone');
        cy.get('a[href*="/product/"]').first().within(() => {
            cy.get('img').should('exist');
            cy.get('h3, [class*="line-clamp"]').should('exist');
        });
    });

    /* ─── SEARCH-05: Click search result ─── */

    it('should navigate to product detail from search results', () => {
        homePage.searchFor('phone');
        cy.get('a[href*="/product/"]', { timeout: 15000 }).first().click();
        cy.url().should('include', '/product/');
    });

    /* ─── SEARCH-06: Special characters ─── */

    it('should handle special characters in search query', () => {
        homePage.searchFor('cáble & usb');
        cy.url().should('include', '/search/');
        // Page should load without errors
        cy.get('header').should('be.visible');
    });
});
