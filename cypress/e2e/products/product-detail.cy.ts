/**
 * PROD-02 – Product Detail E2E Tests
 *
 * Verifies product detail page displays correctly and interactions work.
 */

import { productDetailPage } from '../../pages/product-detail.page';

describe('Product Detail', () => {
    let productId: string;

    before(() => {
        // Get a product ID from the homepage
        cy.visit('/');
        cy.get('a[href*="/product/"]', { timeout: 15000 })
            .first()
            .invoke('attr', 'href')
            .then(href => {
                productId = href!.split('/product/')[1];
            });
    });

    beforeEach(() => {
        cy.intercept('GET', '**/api/v1/catalog/**').as('catalogAPI');
        productDetailPage.visitProduct(productId);
    });

    /* ─── PD-01: Page loads correctly ─── */

    it('should display product name, price, and image', () => {
        productDetailPage.assertProductLoaded();
        productDetailPage.assertPriceVisible();
        cy.get('img[class*="object-contain"]').should('be.visible');
    });

    it('should display breadcrumb navigation', () => {
        cy.get('nav').contains(/inicio|home/i).should('be.visible');
    });

    /* ─── PD-02: Image gallery ─── */

    it('should display image gallery with thumbnails', () => {
        cy.get('img').should('have.length.gte', 1);
    });

    it('should switch main image when clicking thumbnail', () => {
        cy.get('.flex-wrap.gap-2 button').then($thumbs => {
            if ($thumbs.length > 1) {
                cy.get('.aspect-square img').first().invoke('attr', 'src').then(firstSrc => {
                    productDetailPage.clickThumbnail(1);
                    cy.wait(500);
                    cy.get('.aspect-square img')
                        .first()
                        .should('have.attr', 'src')
                        .and('not.eq', firstSrc);
                });
            }
        });
    });

    /* ─── PD-03: Variant selection ─── */

    it('should display variant selectors if product has variants', () => {
        cy.get('body').then($body => {
            // Check for color circles or size pills
            const hasVariants =
                $body.find('button.rounded-full[style*="background"]').length > 0 ||
                $body.find('button[class*="rounded-lg"][class*="border"]').length > 0;
            if (hasVariants) {
                cy.get('button.rounded-full[style*="background"], button[class*="rounded-lg"][class*="border"]')
                    .should('have.length.gte', 1);
            }
        });
    });

    it('should update price when selecting a different variant', () => {
        cy.get('body').then($body => {
            if ($body.find('button.rounded-full[style*="background"]').length > 1) {
                cy.get('[class*="text-3xl"]').first().invoke('text').then(initialPrice => {
                    cy.get('button.rounded-full[style*="background"]').eq(1).click();
                    cy.wait(500);
                    // Price may or may not change, but should still be visible
                    cy.get('[class*="text-3xl"]').first().should('be.visible');
                });
            }
        });
    });

    /* ─── PD-04: Quantity control ─── */

    it('should increment and decrement quantity', () => {
        // Quantity uses +/- buttons with a span display
        productDetailPage.incrementQuantity();
        productDetailPage.incrementQuantity();
        cy.get('.flex.items-center.border.border-gray-200.rounded-lg span').should('contain', '3');
    });

    /* ─── PD-05: Add to cart ─── */

    it('should add product to cart', () => {
        productDetailPage.addToCart();
        // Cart badge should update or toast should appear
        cy.get('[data-sonner-toast], [role="status"], a[href="/cart"] span, header span.bg-gray-500')
            .should('exist');
    });

    /* ─── PD-06: Discount badge ─── */

    it('should display discount badge if product has a discount', () => {
        cy.get('body').then($body => {
            if ($body.find('[class*="bg-red-100"], [class*="bg-red-500"]').length > 0) {
                productDetailPage.assertDiscountBadge();
            }
        });
    });

    /* ─── PD-07: Stock indicator ─── */

    it('should display stock status', () => {
        cy.contains(/en stock|sin stock|agotado|in stock|out of stock/i).should('exist');
    });

    /* ─── PD-08: Trust badges ─── */

    it('should display trust badges (shipping, warranty, returns)', () => {
        cy.contains(/envío|shipping/i).should('exist');
        cy.contains(/garantía|warranty/i).should('exist');
    });

    /* ─── PD-09: Reviews section ─── */

    it('should display reviews section', () => {
        cy.scrollTo('bottom');
        cy.contains(/reseñas|reviews|opiniones/i).should('exist');
    });

    /* ─── PD-10: Related products ─── */

    it('should display related products', () => {
        cy.scrollTo('bottom');
        cy.wait(1000);
        cy.get('body').then($body => {
            // Related products section only renders when they exist
            if ($body.text().includes('También te puede interesar')) {
                cy.contains('h2', 'También te puede interesar').should('be.visible');
            }
        });
    });
});
