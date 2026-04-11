import { BasePage } from '../base.page';

/**
 * Base Page Object for Admin CRUD pages (products, categories, brands, etc.)
 * Provides common table, filter, modal, and pagination helpers.
 */
export class BaseCrudPage extends BasePage {
    readonly path: string;

    constructor(path: string) {
        super();
        this.path = path;
    }

    /* ── Table selectors ── */
    private readonly table = 'table';
    private readonly tableRow = 'table tbody tr';
    private readonly tableHeader = 'table thead th';
    private readonly checkbox = 'input[type="checkbox"]';

    /* ── Filter / Search ── */

    searchInTable(query: string): void {
        cy.get('input[type="search"], input[type="text"], input[placeholder*="Buscar"], input[placeholder*="Search"]')
            .first()
            .clear()
            .type(query);
        cy.wait(500); // debounce
    }

    clearSearch(): void {
        cy.get('input[type="search"], input[type="text"]')
            .first()
            .clear();
    }

    selectFilter(filterLabel: string, optionLabel: string): void {
        cy.contains('button, select, [role="combobox"]', new RegExp(filterLabel, 'i')).click();
        cy.contains(optionLabel).click();
    }

    /* ── CRUD Actions ── */

    clickCreate(): void {
        cy.contains('button', /nuevo|nueva|crear|create|add|agregar/i).click();
    }

    clickEditRow(index: number = 0): void {
        cy.get(this.tableRow).eq(index).within(() => {
            cy.get('button').filter(':has(svg)').then($buttons => {
                // Find edit button (pencil icon) — typically the 2nd action button
                const editBtn = $buttons.filter((_, el) => el.innerHTML.includes('pencil') || el.innerHTML.includes('Pencil') || el.getAttribute('aria-label')?.includes('edit'));
                if (editBtn.length) {
                    cy.wrap(editBtn.first()).click();
                } else {
                    cy.wrap($buttons.eq(1)).click(); // fallback: second action button
                }
            });
        });
    }

    clickDeleteRow(index: number = 0): void {
        cy.get(this.tableRow).eq(index).within(() => {
            cy.get('button').filter(':has(svg)').last().click(); // Delete is typically last
        });
    }

    clickViewRow(index: number = 0): void {
        cy.get(this.tableRow).eq(index).within(() => {
            cy.get('button').filter(':has(svg)').first().click(); // View is typically first
        });
    }

    confirmDelete(): void {
        cy.contains('button', /confirmar|eliminar|delete|confirm|sí/i).click();
    }

    cancelDelete(): void {
        cy.contains('button', /cancelar|cancel|no/i).click();
    }

    /* ── Modal ── */

    getModal(): Cypress.Chainable<JQuery<HTMLElement>> {
        return cy.get('[role="dialog"], [class*="modal"], [class*="fixed inset-0"]');
    }

    fillModalInput(name: string, value: string): void {
        this.getModal().within(() => {
            cy.get(`input[name="${name}"], textarea[name="${name}"]`).clear().type(value);
        });
    }

    submitModal(): void {
        this.getModal().within(() => {
            cy.contains('button', /guardar|save|crear|create|actualizar|update/i).click();
        });
    }

    closeModal(): void {
        this.getModal().within(() => {
            cy.contains('button', /cancelar|cancel|cerrar|close/i).click();
        });
    }

    /* ── Pagination ── */

    goToNextPage(): void {
        cy.contains('button', /siguiente|next|›|»/i).click();
    }

    goToPrevPage(): void {
        cy.contains('button', /anterior|prev|‹|«/i).click();
    }

    goToPage(page: number): void {
        cy.contains('button, a', String(page)).click();
    }

    /* ── Bulk ── */

    selectAllRows(): void {
        cy.get('table thead').find(this.checkbox).check({ force: true });
    }

    selectRow(index: number): void {
        cy.get(this.tableRow).eq(index).find(this.checkbox).check({ force: true });
    }

    /* ── Assertions ── */

    assertTableLoaded(): void {
        cy.get(this.table, { timeout: 15000 }).should('exist');
        cy.get(this.tableRow).should('have.length.gte', 0);
    }

    assertRowCount(expected: number): void {
        cy.get(this.tableRow).should('have.length', expected);
    }

    assertMinRowCount(min: number): void {
        cy.get(this.tableRow).should('have.length.gte', min);
    }

    assertModalVisible(): void {
        this.getModal().should('be.visible');
    }

    assertModalClosed(): void {
        cy.get('[role="dialog"], [class*="modal"]').should('not.exist');
    }

    assertToastSuccess(): void {
        cy.get('[data-sonner-toast], [role="status"]', { timeout: 10000 })
            .should('be.visible');
    }

    assertSearchResults(query: string): void {
        cy.get(this.tableRow).should('have.length.gte', 1);
        cy.get(this.tableRow).first().should('contain.text', query);
    }

    assertEmptyState(): void {
        cy.contains(/no hay|no se encontraron|empty|no results/i).should('be.visible');
    }
}
