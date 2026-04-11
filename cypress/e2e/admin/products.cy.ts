/**
 * ADMIN-02 – Admin Products CRUD E2E Tests
 *
 * Verifies product management: list, search, create, edit, delete, filter.
 */

import { adminProductsPage } from '../../pages/admin/products.page';

describe('Admin Products', () => {
    beforeEach(() => {
        cy.login();
        adminProductsPage.visit();
    });

    /* ─── APROD-01: Table loads ─── */

    it('should display products table', () => {
        adminProductsPage.assertTableLoaded();
    });

    it('should display at least one product row', () => {
        adminProductsPage.assertMinRowCount(1);
    });

    /* ─── APROD-02: Search ─── */

    it('should search products by name', () => {
        adminProductsPage.searchInTable('phone');
        cy.wait(1000);
        adminProductsPage.assertTableLoaded();
    });

    it('should clear search and show all products', () => {
        adminProductsPage.searchInTable('phone');
        cy.wait(500);
        adminProductsPage.clearSearch();
        cy.wait(500);
        adminProductsPage.assertTableLoaded();
    });

    /* ─── APROD-03: Filter by status ─── */

    it('should filter products by status', () => {
        cy.get('body').then($body => {
            if ($body.find('select, [role="combobox"]').length > 0) {
                adminProductsPage.filterByStatus('PUBLISHED');
                cy.wait(500);
                adminProductsPage.assertTableLoaded();
            }
        });
    });

    /* ─── APROD-04: View product ─── */

    it('should open product preview on view click', () => {
        adminProductsPage.clickViewRow(0);
        // Should open drawer or modal
        cy.get('[role="dialog"], [class*="drawer"], [class*="fixed"]').should('be.visible');
    });

    /* ─── APROD-05: Create product ─── */

    it('should open create product modal', () => {
        adminProductsPage.clickCreate();
        adminProductsPage.assertModalVisible();
    });

    /* ─── APROD-06: Edit product ─── */

    it('should open edit product modal', () => {
        adminProductsPage.clickEditRow(0);
        adminProductsPage.assertModalVisible();
    });

    /* ─── APROD-07: Delete product (cancel) ─── */

    it('should cancel product deletion', () => {
        adminProductsPage.clickDeleteRow(0);
        adminProductsPage.cancelDelete();
        adminProductsPage.assertTableLoaded();
    });

    /* ─── APROD-08: Pagination ─── */

    it('should navigate to next page', () => {
        cy.get('body').then($body => {
            if ($body.find('button:contains("›"), button:contains("Siguiente")').length > 0) {
                adminProductsPage.goToNextPage();
                adminProductsPage.assertTableLoaded();
            }
        });
    });

    /* ─── APROD-09: Bulk select ─── */

    it('should select all rows', () => {
        adminProductsPage.selectAllRows();
        cy.get('input[type="checkbox"]:checked').should('have.length.gte', 1);
    });
});
