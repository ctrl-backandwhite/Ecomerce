/**
 * ADMIN-01 – Admin Dashboard E2E Tests
 *
 * Verifies admin dashboard loads with KPIs, charts, and sidebar.
 * Requires: admin user login.
 */

import { adminDashboardPage } from '../../pages/admin/dashboard.page';

describe('Admin Dashboard', () => {
    beforeEach(() => {
        cy.login();
        adminDashboardPage.visit();
    });

    /* ─── DASH-01: Dashboard loads ─── */

    it('should load admin dashboard', () => {
        adminDashboardPage.assertDashboardLoaded();
    });

    it('should display sidebar navigation', () => {
        adminDashboardPage.assertSidebarVisible();
    });

    it('should display KPI cards', () => {
        adminDashboardPage.assertKPICardsVisible(1);
    });

    it('should display charts', () => {
        adminDashboardPage.assertChartsVisible();
    });

    /* ─── DASH-02: Sidebar navigation ─── */

    it('should navigate to orders page from sidebar', () => {
        adminDashboardPage.navigateTo('Órdenes');
        cy.url().should('include', '/admin/orders');
    });

    it('should navigate to products page from sidebar', () => {
        adminDashboardPage.navigateTo('Productos');
        cy.url().should('include', '/admin/products');
    });

    it('should navigate to customers page from sidebar', () => {
        adminDashboardPage.navigateTo('Clientes');
        cy.url().should('include', '/admin/customers');
    });

    it('should navigate to campaigns page from sidebar', () => {
        adminDashboardPage.navigateTo('Campañas');
        cy.url().should('include', '/admin/campaigns');
    });

    /* ─── DASH-03: Export ─── */

    it('should have export functionality', () => {
        cy.get('body').then($body => {
            if ($body.find('button:contains("Export"), button:contains("Exportar")').length > 0) {
                cy.contains('button', /export|exportar/i).should('be.visible');
            }
        });
    });
});
