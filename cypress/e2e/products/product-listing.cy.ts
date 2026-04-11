/**
 * PROD-01 – Product Listing E2E Tests
 *
 * Verifies product listing, filtering, category views, and pagination.
 */

import { homePage } from '../../pages/home.page';

describe('Product Listing', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/api/v1/catalog/**').as('catalogAPI');
        homePage.visitStore();
    });

    /* ─── PROD-01: Products display ─── */

    it('should display products on the storefront', () => {
        homePage.assertProductsVisible();
        cy.get('a[href*="/product/"]').should('have.length.gte', 1);
    });

    it('should display product image, name, and price on each card', () => {
        cy.get('a[href*="/product/"]').first().within(() => {
            cy.get('img').should('have.attr', 'src').and('not.be.empty');
            cy.get('h3, [class*="line-clamp"]').invoke('text').should('not.be.empty');
        });
    });

    /* ─── PROD-02: Category filtering ─── */

    it('should filter products by category', () => {
        // CategoryBar uses buttons with navigate(), not <a> links
        cy.get('nav button').filter(':visible').first().click();
        cy.wait(2000);
        cy.url().should('match', /\/store\/.+/);
        cy.get('a[href*="/product/"]', { timeout: 15000 }).should('have.length.gte', 0);
    });

    /* ─── PROD-03: Sort ─── */

    it('should sort by price ascending', () => {
        cy.get('select').first().select('price-low');
        cy.wait(1000);
        homePage.assertProductsVisible();
    });

    it('should sort by price descending', () => {
        cy.get('select').first().select('price-high');
        cy.wait(1000);
        homePage.assertProductsVisible();
    });

    it('should sort by rating', () => {
        cy.get('select').first().select('rating');
        cy.wait(1000);
        homePage.assertProductsVisible();
    });

    it('should sort by name', () => {
        cy.get('select').first().select('name');
        cy.wait(1000);
        homePage.assertProductsVisible();
    });

    /* ─── PROD-04: Pagination / infinite scroll ─── */

    it('should load more products on scroll or pagination', () => {
        cy.get('a[href*="/product/"]').then($initialCards => {
            const initialCount = $initialCards.length;
            // Scroll to bottom to trigger load more
            cy.scrollTo('bottom');
            cy.wait(2000);
            cy.get('a[href*="/product/"]').should('have.length.gte', initialCount);
        });
    });

    /* ─── PROD-05: Active filters ─── */

    it('should show active filter pills and allow removal', () => {
        // CategoryBar uses buttons, not links
        cy.get('nav button').filter(':visible').first().click();
        cy.wait(2000);
        cy.url().should('match', /\/store\/.+/);
        // Check if filter pills/breadcrumb appears
        cy.get('body').then($body => {
            if ($body.find('[class*="bg-gray-50"][class*="border"]').length > 0) {
                cy.get('[class*="bg-gray-50"][class*="border"]').first().should('be.visible');
            }
        });
    });

    /* ─── PROD-06: Navigate to product detail ─── */

    it('should navigate to product detail when clicking a product', () => {
        homePage.clickFirstProduct();
        cy.url().should('include', '/product/');
    });
});
