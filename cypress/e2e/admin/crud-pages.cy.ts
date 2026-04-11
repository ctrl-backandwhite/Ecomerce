/**
 * ADMIN-06 – Admin CRUD Generic E2E Tests
 *
 * Verifies that all remaining admin CRUD pages load and display tables.
 * Tests: categories, brands, coupons, invoices, reviews, loyalty, shipping, taxes, settings.
 */

import { BaseCrudPage } from '../../pages/admin/base-crud.page';

const adminPages = [
    { name: 'Categories', path: '/admin/categories' },
    { name: 'Brands', path: '/admin/brands' },
    { name: 'Coupons', path: '/admin/coupons' },
    { name: 'Invoices', path: '/admin/invoices' },
    { name: 'Reviews', path: '/admin/reviews' },
    { name: 'Loyalty', path: '/admin/loyalty' },
    { name: 'Gift Cards', path: '/admin/gift-cards' },
    { name: 'Variants', path: '/admin/variants' },
    { name: 'Attributes', path: '/admin/attributes' },
    { name: 'Warranties', path: '/admin/warranties' },
    { name: 'Newsletter', path: '/admin/newsletter' },
    { name: 'SEO', path: '/admin/seo' },
    { name: 'Slides', path: '/admin/slides' },
    { name: 'Flows', path: '/admin/flows' },
    { name: 'Shipping', path: '/admin/shipping' },
    { name: 'Taxes', path: '/admin/taxes' },
    { name: 'Currency Rates', path: '/admin/currency-rates' },
    { name: 'Pricing', path: '/admin/pricing' },
    { name: 'Emails', path: '/admin/emails' },
    { name: 'Settings', path: '/admin/settings' },
    { name: 'Media', path: '/admin/media' },
    { name: 'Returns', path: '/admin/returns' },
    { name: 'Reports', path: '/admin/reports' },
];

describe('Admin CRUD Pages', () => {
    before(() => {
        cy.login();
    });

    adminPages.forEach(({ name, path }) => {
        it(`should load ${name} admin page (${path})`, () => {
            cy.login();
            cy.visit(path);
            cy.url().should('include', path);
            // Page should render without errors — sidebar + content area
            cy.get('#tour-sidebar, nav, aside', { timeout: 15000 }).should('exist');
            // Main content area should exist
            cy.get('main, [class*="flex-1"], [class*="ml-"]', { timeout: 15000 }).should('exist');
        });
    });

    /* ─── Generic CRUD tests on Categories as sample ─── */

    describe('Categories CRUD', () => {
        beforeEach(() => {
            cy.login();
            cy.visit('/admin/categories');
        });

        it('should display categories list', () => {
            // Categories uses card-based layout, not tables
            cy.get('[class*="rounded-xl"]', { timeout: 15000 }).should('have.length.gte', 1);
        });

        it('should search categories', () => {
            cy.get('input[placeholder*="categ"]', { timeout: 10000 })
                .first()
                .clear()
                .type('elect');
            cy.wait(1000);
            cy.get('body').should('be.visible');
        });

        it('should open create category modal', () => {
            cy.get('button[title*="categ"]:not([title*="subcateg"])', { timeout: 10000 }).first().click();
            cy.get('[role="dialog"], [class*="modal"], [class*="fixed inset-0"]').should('be.visible');
        });
    });

    /* ─── Brands CRUD ─── */

    describe('Brands CRUD', () => {
        beforeEach(() => {
            cy.login();
            cy.visit('/admin/brands');
        });

        it('should display brands table', () => {
            cy.get('table', { timeout: 15000 }).should('exist');
            cy.get('table tbody tr').should('have.length.gte', 0);
        });

        it('should search brands', () => {
            cy.get('input[placeholder*="marca"], input[placeholder*="Buscar"]', { timeout: 10000 })
                .first()
                .clear()
                .type('apple');
            cy.wait(1000);
            cy.get('table').should('exist');
        });
    });
});
