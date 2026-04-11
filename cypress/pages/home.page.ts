import { BasePage } from './base.page';

/**
 * Page Object for the Homepage (/ and /store)
 */
export class HomePage extends BasePage {
    readonly path = '/';

    /* ── Selectors (real DOM — no data-testid in source) ── */
    private readonly promoSlider = '.slick-slider, .embla, [class*="carousel"], [class*="slider"]';
    private readonly categoryBar = 'nav';
    private readonly productCard = 'a[href*="/product/"]';
    private readonly flashDealsSection = 'section.bg-white.border-b';
    private readonly flashDealsHeading = 'h2';
    private readonly searchInput = 'input[type="text"], input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Search"]';
    private readonly sortSelect = 'select';

    /* ── Actions ── */

    visitStore(catSlug?: string, subcatSlug?: string): void {
        const path = subcatSlug
            ? `/store/${catSlug}/${subcatSlug}`
            : catSlug
                ? `/store/${catSlug}`
                : '/store';
        cy.visit(path);
    }

    searchFor(query: string): void {
        cy.get('header').find(this.searchInput).first().clear().type(`${query}{enter}`);
    }

    clickFirstProduct(): void {
        cy.get(this.productCard).first().click();
    }

    clickProductByIndex(index: number): void {
        cy.get(this.productCard).eq(index).click();
    }

    sortBy(value: 'featured' | 'price-low' | 'price-high' | 'rating' | 'name'): void {
        cy.get(this.sortSelect).first().select(value);
    }

    /* ── Assertions ── */

    assertHomepageLoaded(): void {
        cy.url().should('include', '/store');
        cy.get('header').should('be.visible');
    }

    assertProductsVisible(minCount = 1): void {
        cy.get(this.productCard, { timeout: 15000 }).should('have.length.gte', minCount);
    }

    assertFlashDealsVisible(): void {
        cy.contains('h2', 'Ofertas Flash', { timeout: 10000 }).should('be.visible');
    }

    assertCategoryBarVisible(): void {
        cy.get(this.categoryBar).should('exist');
    }

    getProductCards(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.get(this.productCard);
    }
}

export const homePage = new HomePage();
