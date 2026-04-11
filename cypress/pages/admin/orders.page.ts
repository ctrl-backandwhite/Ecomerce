import { BaseCrudPage } from './base-crud.page';

export class AdminOrdersPage extends BaseCrudPage {
    constructor() {
        super('/admin/orders');
    }

    /* ── Overrides for orders-specific selectors ── */

    searchInTable(query: string): void {
        cy.get('input[placeholder*="orden"], input[placeholder*="cliente"]').first().clear().type(query);
        cy.wait(500);
    }

    clearSearch(): void {
        cy.get('input[placeholder*="orden"], input[placeholder*="cliente"]').first().clear();
    }

    /* ── Filters ── */

    filterByStatus(status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'): void {
        this.selectFilter('Estado', status);
    }

    /* ── Order-specific actions ── */

    openOrderDrawer(index: number = 0): void {
        cy.get('table tbody tr', { timeout: 15000 }).eq(index).within(() => {
            cy.get('button').filter(':has(svg)').first().click();
        });
    }

    changeOrderStatus(newStatus: string): void {
        cy.get('[role="dialog"], [class*="drawer"], [class*="fixed"]')
            .contains(newStatus, { matchCase: false })
            .click();
    }

    /* ── Assertions ── */

    assertOrderDrawerOpen(): void {
        cy.get('[class*="fixed"][class*="inset-0"], [role="dialog"]', { timeout: 10000 }).should('be.visible');
    }

    assertOrderStatus(index: number, status: string): void {
        cy.get('table tbody tr').eq(index).contains(status, { matchCase: false }).should('be.visible');
    }
}

export const adminOrdersPage = new AdminOrdersPage();
