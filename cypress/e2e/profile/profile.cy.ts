/**
 * PROFILE-01 – User Profile E2E Tests
 *
 * Verifies user account pages: overview, orders, favorites, addresses, security.
 */

import { profilePage } from '../../pages/profile.page';

describe('User Profile', () => {
    beforeEach(() => {
        cy.login();
    });

    /* ─── PROF-01: Profile overview ─── */

    it('should display profile overview page', () => {
        profilePage.goToTab('overview');
        profilePage.assertProfileLoaded();
    });

    it('should display user name and email', () => {
        profilePage.goToTab('overview');
        cy.contains(/@|gmail/i).should('be.visible');
    });

    /* ─── PROF-02: Profile details ─── */

    it('should display personal details tab', () => {
        profilePage.goToTab('details');
        profilePage.assertTabActive('details');
        cy.contains('Información Personal').should('be.visible');
        // Click edit to reveal input fields
        cy.contains('button', /editar/i).click();
        cy.get('input[name="phone"]').should('exist');
    });

    /* ─── PROF-03: Orders tab ─── */

    it('should display orders history', () => {
        profilePage.goToTab('orders');
        profilePage.assertTabActive('orders');
        profilePage.assertOrdersVisible();
    });

    /* ─── PROF-04: Invoices tab ─── */

    it('should display invoices tab', () => {
        profilePage.goToTab('invoices');
        profilePage.assertTabActive('invoices');
    });

    /* ─── PROF-05: Favorites tab ─── */

    it('should display favorites tab', () => {
        profilePage.goToTab('favorites');
        profilePage.assertTabActive('favorites');
    });

    /* ─── PROF-06: Addresses tab ─── */

    it('should display addresses tab', () => {
        profilePage.goToTab('addresses');
        profilePage.assertTabActive('addresses');
    });

    it('should add a new address', () => {
        profilePage.goToTab('addresses');
        profilePage.addAddress();
        // Fill required label and recipient name
        cy.get('input[name="label"]').clear().type('Casa Test');
        cy.get('input[name="name"]').clear().type('E2E Tester');
        profilePage.fillAddressForm({
            street: '789 Cypress Blvd',
            city: 'Test City',
            state: 'TS',
            zip: '12345',
        });
        profilePage.saveChanges();
    });

    /* ─── PROF-07: Payments tab ─── */

    it('should display payments tab', () => {
        profilePage.goToTab('payments');
        profilePage.assertTabActive('payments');
    });

    /* ─── PROF-08: Gift cards tab ─── */

    it('should display gift cards tab', () => {
        profilePage.goToTab('giftcards');
        profilePage.assertTabActive('giftcards');
    });

    /* ─── PROF-09: Security tab ─── */

    it('should display security tab', () => {
        profilePage.goToTab('security');
        profilePage.assertTabActive('security');
    });

    /* ─── PROF-10: Tab navigation ─── */

    it('should navigate between tabs', () => {
        profilePage.goToTab('overview');
        profilePage.assertTabActive('overview');

        profilePage.goToTab('orders');
        profilePage.assertTabActive('orders');

        profilePage.goToTab('favorites');
        profilePage.assertTabActive('favorites');
    });

    /* ─── PROF-11: Logout from profile ─── */

    it('should logout from profile page', () => {
        profilePage.goToTab('overview');
        profilePage.logout();
        // After logout, user should be redirected to home
        cy.url({ timeout: 15000 }).should('not.include', '/account');
        cy.window().then(win => {
            expect(win.localStorage.getItem('access_token')).to.be.null;
        });
    });
});
