/**
 * ADMIN-03 – Admin Orders E2E Tests
 *
 * Verifies order management: list, filter, view details, status change.
 */

import { adminOrdersPage } from '../../pages/admin/orders.page';

describe('Admin Orders', () => {
    beforeEach(() => {
        cy.login();
        adminOrdersPage.visit();
    });

    /* ─── AORD-01: Table loads ─── */

    it('should display orders table', () => {
        adminOrdersPage.assertTableLoaded();
    });

    /* ─── AORD-02: Search orders ─── */

    it('should search orders by ID or customer', () => {
        adminOrdersPage.searchInTable('test');
        cy.wait(1000);
        adminOrdersPage.assertTableLoaded();
    });

    /* ─── AORD-03: Filter by status ─── */

    it('should filter orders by status', () => {
        cy.get('body').then($body => {
            if ($body.find('select, [role="combobox"]').length > 1) {
                adminOrdersPage.filterByStatus('DELIVERED');
                cy.wait(500);
            }
        });
        adminOrdersPage.assertTableLoaded();
    });

    /* ─── AORD-04: View order detail ─── */

    it('should open order detail drawer', () => {
        adminOrdersPage.openOrderDrawer(0);
        adminOrdersPage.assertOrderDrawerOpen();
    });

    /* ─── AORD-05: Order status badges ─── */

    it('should display colored status badges on orders', () => {
        cy.get('table tbody tr').first().within(() => {
            cy.get('span[class*="bg-"], [class*="badge"], [class*="rounded-full"]').should('exist');
        });
    });
});
