import { BaseCrudPage } from './base-crud.page';

export class AdminCustomersPage extends BaseCrudPage {
    constructor() {
        super('/admin/customers');
    }

    /* ── Overrides ── */

    searchInTable(query: string): void {
        cy.get('input[placeholder*="nombre o email"]')
            .clear()
            .type(query);
        cy.wait(500);
    }

    /* ── Customer-specific actions ── */

    viewCustomerDetail(index: number = 0): void {
        cy.get('table tbody tr', { timeout: 15000 })
            .should('have.length.gte', 1)
            .eq(index)
            .find('button')
            .filter(':has(svg)')
            .first()
            .click();
    }

    /* ── Assertions ── */

    assertCustomerInTable(emailOrName: string): void {
        cy.get('table tbody').should('contain.text', emailOrName);
    }
}

export const adminCustomersPage = new AdminCustomersPage();
