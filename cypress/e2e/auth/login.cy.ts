/**
 * AUTH-01 – Login / Logout E2E Tests
 *
 * Prerequisites: Auth server running on :6001, API Gateway on :9000, App on :5174
 */

describe('Authentication', () => {
    /* ─── AUTH-01: OAuth2 PKCE Login ─── */

    it('should login via OAuth2 PKCE and store tokens in localStorage', () => {
        cy.login();
        cy.visit('/');
        cy.window().then(win => {
            expect(win.localStorage.getItem('access_token')).to.be.a('string').and.not.be.empty;
            expect(Number(win.localStorage.getItem('token_expires_at'))).to.be.greaterThan(Date.now());
        });
    });

    it('should show authenticated user menu after login', () => {
        cy.login();
        cy.visit('/');
        // Authenticated user sees avatar or initials, not login button
        cy.get('header').within(() => {
            cy.get('div.rounded-full, [class*="avatar"]').should('exist');
        });
    });

    /* ─── AUTH-02: Protected routes redirect ─── */

    it('should redirect unauthenticated users away from /checkout', () => {
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.visit('/checkout', { failOnStatusCode: false });
        // Should not remain on checkout
        cy.url().should('not.include', '/checkout');
    });

    it('should redirect unauthenticated users away from /account', () => {
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.visit('/account', { failOnStatusCode: false });
        cy.url().should('not.include', '/account');
    });

    it('should redirect unauthenticated users away from /admin', () => {
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.visit('/admin', { failOnStatusCode: false });
        cy.url().should('not.include', '/admin');
    });

    /* ─── AUTH-03: Logout ─── */

    it('should clear tokens on logout', () => {
        cy.login();
        cy.visit('/');

        // Open user dropdown and click logout
        cy.get('header button').filter(':has(div.rounded-full)').first().click();
        cy.contains(/cerrar sesión|log out|logout|salir/i).should('be.visible').click();

        // logout() calls clearTokens() then window.location.href = "/"
        // Wait for the full page reload to complete
        cy.url().should('include', '/');
        cy.window().its('localStorage').invoke('getItem', 'access_token').should('be.null');
    });

    /* ─── AUTH-04: Session persistence ─── */

    it('should maintain session across page reload', () => {
        cy.login();
        cy.visit('/');
        cy.reload();
        cy.window().then(win => {
            expect(win.localStorage.getItem('access_token')).to.be.a('string').and.not.be.empty;
        });
        cy.get('header').within(() => {
            cy.get('div.rounded-full, [class*="avatar"]').should('exist');
        });
    });
});
