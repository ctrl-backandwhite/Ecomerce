import { BaseCrudPage } from './base-crud.page';

/**
 * AdminProducts uses a card-based layout (not HTML tables).
 * Each product is a rounded-xl div card with action buttons identified by title attributes.
 * We override table-dependent methods from BaseCrudPage to target these cards.
 */
export class AdminProductsPage extends BaseCrudPage {
    constructor() {
        super('/admin/products');
    }

    /* ── Card selectors (overrides table selectors) ── */
    private readonly productCard = '[class*="bg-white"][class*="border-gray-100"][class*="rounded-xl"][class*="overflow-hidden"]';
    private readonly productRow = '[class*="flex"][class*="items-center"][class*="gap-3"][class*="px-4"][class*="py-3"]';

    /* ── Overrides ── */

    searchInTable(query: string): void {
        cy.get('input[placeholder*="Buscar por nombre"]').clear().type(query);
        cy.wait(500);
    }

    clearSearch(): void {
        cy.get('input[placeholder*="Buscar por nombre"]').clear();
    }

    clickCreate(): void {
        cy.get('button[title*="Nuevo producto"]').click();
    }

    clickViewRow(index: number = 0): void {
        cy.get(this.productCard).eq(index).within(() => {
            cy.get('button[title*="Ver detalle"]').click();
        });
    }

    clickEditRow(index: number = 0): void {
        cy.get(this.productCard).eq(index).within(() => {
            cy.get('button[title*="Editar"]').click();
        });
    }

    clickDeleteRow(index: number = 0): void {
        cy.get(this.productCard).eq(index).within(() => {
            cy.get('button[title*="Eliminar"]').click();
        });
    }

    selectAllRows(): void {
        // Select-all checkbox is in the toolbar above the product cards
        cy.get('input[type="checkbox"]').first().check({ force: true });
    }

    selectRow(index: number): void {
        cy.get(this.productCard).eq(index).find('input[type="checkbox"]').check({ force: true });
    }

    assertTableLoaded(): void {
        cy.get(this.productCard, { timeout: 15000 }).should('have.length.gte', 0);
    }

    assertMinRowCount(min: number): void {
        cy.get(this.productCard, { timeout: 15000 }).should('have.length.gte', min);
    }

    /* ── Specific filters ── */

    filterByCategory(category: string): void {
        this.selectFilter('Categoría', category);
    }

    filterByStatus(status: 'DRAFT' | 'PUBLISHED'): void {
        this.selectFilter('Estado', status);
    }

    /* ── Product-specific actions ── */

    togglePublish(index: number = 0): void {
        cy.get(this.productCard).eq(index).within(() => {
            cy.get('[class*="bg-emerald"], [class*="bg-amber"]').first().click();
        });
    }

    cloneProduct(index: number = 0): void {
        cy.get(this.productCard).eq(index).within(() => {
            cy.get('button[title*="Clonar"]').click();
        });
    }

    openBulkUpload(): void {
        cy.get('button[title*="Carga masiva"]').click();
    }

    /* ── Assertions ── */

    assertProductInTable(name: string): void {
        cy.get(this.productCard).should('contain.text', name);
    }

    assertStatusBadge(index: number, status: string): void {
        cy.get(this.productCard).eq(index).contains(status, { matchCase: false }).should('be.visible');
    }
}

export const adminProductsPage = new AdminProductsPage();
