import { BasePage } from '../base.page';

/**
 * Page Object for Admin Dashboard (/admin)
 */
export class AdminDashboardPage extends BasePage {
    readonly path = '/admin';

    /* ── Selectors ── */
    private readonly kpiCards = '[class*="rounded"][class*="shadow"], [class*="bg-white"][class*="p-"]';
    private readonly charts = 'canvas, .recharts-wrapper, svg.recharts-surface';
    private readonly activityFeed = '[class*="space-y"]';

    /* ── Sidebar navigation ── */

    navigateTo(label: string): void {
        cy.get('#tour-sidebar a').contains(label).scrollIntoView().click({ force: true });
    }

    navigateToSection(section: string): void {
        const routes: Record<string, string> = {
            orders: '/admin/orders',
            products: '/admin/products',
            customers: '/admin/customers',
            categories: '/admin/categories',
            campaigns: '/admin/campaigns',
            brands: '/admin/brands',
            coupons: '/admin/coupons',
            invoices: '/admin/invoices',
            reports: '/admin/reports',
            settings: '/admin/settings',
            shipping: '/admin/shipping',
            taxes: '/admin/taxes',
            loyalty: '/admin/loyalty',
            media: '/admin/media',
        };
        cy.visit(routes[section] || `/admin/${section}`);
    }

    /* ── Actions ── */

    exportCSV(): void {
        cy.contains('button', /export|csv/i).click();
        cy.contains(/csv/i).click();
    }

    exportPDF(): void {
        cy.contains('button', /export|pdf/i).click();
        cy.contains(/pdf/i).click();
    }

    /* ── Assertions ── */

    assertDashboardLoaded(): void {
        cy.url().should('include', '/admin');
        cy.get(this.kpiCards, { timeout: 15000 }).should('have.length.gte', 1);
    }

    assertKPICardsVisible(minCount: number = 4): void {
        cy.get(this.kpiCards).should('have.length.gte', minCount);
    }

    assertChartsVisible(): void {
        cy.get('#dash-charts', { timeout: 15000 }).scrollIntoView();
        cy.get('.recharts-responsive-container, .recharts-wrapper', { timeout: 15000 }).should('have.length.gte', 1);
    }

    assertSidebarVisible(): void {
        cy.get('#tour-sidebar, nav, aside').should('be.visible');
    }
}

export const adminDashboardPage = new AdminDashboardPage();
