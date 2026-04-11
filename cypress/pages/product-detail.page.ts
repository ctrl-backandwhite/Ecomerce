import { BasePage } from './base.page';

/**
 * Page Object for the Product Detail page (/product/:id)
 */
export class ProductDetailPage extends BasePage {
    readonly path = '/product';

    /* ── Selectors ── */
    private readonly productName = 'h1';
    private readonly productPrice = 'span.text-3xl';
    private readonly originalPrice = 'span.line-through';
    private readonly addToCartBtn = 'button[title="Agregar al carrito"]';
    private readonly quantityWrapper = '.flex.items-center.border.border-gray-200.rounded-lg';
    private readonly mainImage = '.aspect-square img';
    private readonly thumbnails = '.flex-wrap.gap-2 button';
    private readonly discountBadge = '[class*="bg-red-100"], [class*="bg-red-500"], span.text-red-500';
    private readonly breadcrumb = 'nav';

    /* ── Actions ── */

    visitProduct(productId: string): void {
        cy.visit(`/product/${productId}`);
    }

    addToCart(): void {
        cy.get(this.addToCartBtn).first().click();
    }

    setQuantity(qty: number): void {
        // Quantity uses +/- buttons, not an input
        // First reset to 1 by checking current value
        const plusBtn = `${this.quantityWrapper} button:last-child`;
        for (let i = 1; i < qty; i++) {
            cy.get(plusBtn).click();
        }
    }

    incrementQuantity(): void {
        cy.get(`${this.quantityWrapper} button`).last().click();
    }

    decrementQuantity(): void {
        cy.get(`${this.quantityWrapper} button`).first().click();
    }

    selectVariant(index: number): void {
        cy.get('button.rounded-full[style*="background"]').eq(index).click();
    }

    clickThumbnail(index: number): void {
        cy.get(this.thumbnails).eq(index).click();
    }

    /* ── Assertions ── */

    assertProductLoaded(): void {
        cy.get(this.productName, { timeout: 15000 }).should('be.visible');
    }

    assertPriceVisible(): void {
        cy.get(this.productPrice).should('be.visible');
    }

    assertDiscountBadge(): void {
        cy.get(this.discountBadge).should('exist');
    }

    assertOriginalPrice(): void {
        cy.get(this.originalPrice).should('exist');
    }

    assertBreadcrumb(): void {
        cy.get(this.breadcrumb).should('exist');
    }

    getProductName(): Cypress.Chainable<string> {
        return cy.get(this.productName).first().invoke('text');
    }
}

export const productDetailPage = new ProductDetailPage();
