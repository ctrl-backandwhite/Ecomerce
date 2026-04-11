/**
 * ADMIN-05 – Admin Customers E2E Tests
 *
 * Verifies customer management: list, search, view details.
 */

import { adminCustomersPage } from '../../pages/admin/customers.page';

describe('Admin Customers', () => {
    beforeEach(() => {
        cy.login();
        adminCustomersPage.visit();
    });

    /* ─── ACUST-01: Table loads ─── */

    it('should display customers table', () => {
        adminCustomersPage.assertTableLoaded();
    });

    /* ─── ACUST-02: Search customers ─── */

    it('should search customers by name or email', () => {
        adminCustomersPage.searchInTable('test');
        cy.wait(1000);
        adminCustomersPage.assertTableLoaded();
    });

    /* ─── ACUST-03: View customer detail ─── */

    it('should open customer detail', () => {
        adminCustomersPage.viewCustomerDetail(0);
        cy.get('[role="dialog"], [class*="drawer"], [class*="fixed"]').should('be.visible');
    });
});
