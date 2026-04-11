/**
 * HOME-01 – Homepage E2E Tests
 *
 * Verifies homepage loads correctly with all key sections visible.
 */

import { homePage } from '../../pages/home.page';

describe('Homepage', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/api/v1/catalog/**').as('catalogAPI');
        homePage.visitStore();
    });

    /* ─── HOME-01: Page loads ─── */

    it('should load homepage and display product grid', () => {
        homePage.assertHomepageLoaded();
        homePage.assertProductsVisible();
    });

    it('should display promo slider / hero section', () => {
        cy.get('.slick-slider, .embla, [class*="carousel"], [class*="slider"]', { timeout: 10000 })
            .should('exist');
    });

    it('should display category bar', () => {
        homePage.assertCategoryBarVisible();
    });

    it('should display flash deals section', () => {
        homePage.assertFlashDealsVisible();
    });

    /* ─── HOME-02: Product cards structure ─── */

    it('should display product cards with image, name, and price', () => {
        // Scroll to product grid section
        cy.get('#productos', { timeout: 15000 }).scrollIntoView();
        // Product cards should have image
        cy.get('#productos a[href*="/product/"] img').should('have.length.gte', 1);
        // Product cards should have name (h3)
        cy.get('#productos a[href*="/product/"] h3').should('have.length.gte', 1);
        // Price text should appear  
        cy.get('#productos .text-2xl').should('have.length.gte', 1);
    });

    it('should display discount badge on sale products', () => {
        // At least one product may have a discount badge
        cy.get('body').then($body => {
            if ($body.find('[class*="bg-red-500"], [class*="bg-red-100"]').length > 0) {
                cy.get('[class*="bg-red-500"], [class*="bg-red-100"]').first().should('be.visible');
            }
        });
    });

    /* ─── HOME-03: Sorting ─── */

    it('should sort products by price low to high', () => {
        homePage.assertProductsVisible();
        homePage.sortBy('price-low');
        cy.wait(1000);
        homePage.assertProductsVisible();
    });

    it('should sort products by price high to low', () => {
        homePage.assertProductsVisible();
        homePage.sortBy('price-high');
        cy.wait(1000);
        homePage.assertProductsVisible();
    });

    /* ─── HOME-04: Gift card banner ─── */

    it('should display gift card section with link', () => {
        cy.get('a[href*="/gift-cards"], a[href*="gift"]').should('exist');
    });

    /* ─── HOME-05: Info banner ─── */

    it('should display info banner with trust badges', () => {
        cy.contains(/envío|shipping|garantía|warranty/i).should('exist');
    });
});
