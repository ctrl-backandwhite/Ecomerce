/* ─── PKCE helpers (OAuth2 Authorization Code + PKCE) ───── */

function pkceVerifier(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~';
    const v = new Uint8Array(128);
    crypto.getRandomValues(v);
    return Array.from(v, b => chars[b % chars.length]).join('');
}

function pkceChallenge(verifier: string): Promise<string> {
    return crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(verifier))
        .then(buf => {
            let s = '';
            new Uint8Array(buf).forEach(b => (s += String.fromCharCode(b)));
            return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        });
}

/* ─── Token exchange + localStorage seed ───────────────── */

function exchangeCodeAndStore(callbackUrl: string, verifier: string): void {
    const code = new URL(callbackUrl).searchParams.get('code')!;

    cy.request({
        method: 'POST',
        url: 'http://localhost:6001/oauth2/token',
        form: true,
        body: {
            grant_type: 'authorization_code',
            client_id: 'ecommerce-client',
            code,
            redirect_uri: 'http://localhost:9000/auth/callback',
            code_verifier: verifier,
        },
    }).then(tokenResp => {
        const { access_token, refresh_token, expires_in, token_type } = tokenResp.body;
        const expiresAt = Date.now() + (expires_in ?? 3600) * 1000;

        cy.visit('/', {
            failOnStatusCode: false,
            onBeforeLoad(win) {
                win.localStorage.setItem('access_token', access_token);
                win.localStorage.setItem('token_expires_at', String(expiresAt));
                win.localStorage.setItem('token_type', token_type || 'Bearer');
                if (refresh_token) {
                    win.localStorage.setItem('refresh_token', refresh_token);
                }
            },
        });
    });
}

/* ─── Login command ────────────────────────────────────── */

Cypress.Commands.add('login', () => {
    cy.session(
        'ecommerce-auth-session',
        () => {
            const verifier = pkceVerifier();

            cy.wrap(pkceChallenge(verifier), { log: false }).then(
                (challenge: string) => {
                    const state = crypto.randomUUID();

                    const authorizeUrl =
                        'http://localhost:6001/oauth2/authorize?' +
                        new URLSearchParams({
                            response_type: 'code',
                            client_id: 'ecommerce-client',
                            redirect_uri: 'http://localhost:9000/auth/callback',
                            scope: 'openid',
                            response_mode: 'query',
                            state,
                            code_challenge: challenge,
                            code_challenge_method: 'S256',
                        }).toString();

                    // 1) Authenticate — POST login credentials
                    cy.request({
                        method: 'POST',
                        url: 'http://localhost:6001/login',
                        form: true,
                        body: { username: 'jfinol02@gmail.com', password: 'Motorola25*' },
                        followRedirect: false,
                    }).then(() => {
                        // 2) Call authorize with the authenticated session cookie
                        cy.request({
                            url: authorizeUrl,
                            followRedirect: false,
                        }).then(authResp => {
                            const callbackUrl = authResp.headers['location'] as string;
                            exchangeCodeAndStore(callbackUrl, verifier);
                        });
                    });
                },
            );
        },
        {
            validate() {
                cy.window().then(win => {
                    const token = win.localStorage.getItem('access_token');
                    const exp = Number(win.localStorage.getItem('token_expires_at'));
                    expect(token).to.be.a('string').and.not.be.empty;
                    expect(exp).to.be.greaterThan(Date.now());
                });
            },
        },
    );
});

/* ─── Add to cart command ──────────────────────────────── */

Cypress.Commands.add('addToCart', (productIndex: number = 0) => {
    cy.get('[data-testid="product-card"]').eq(productIndex).within(() => {
        cy.get('[data-testid="add-to-cart"]').click();
    });
});

/* ─── Clear cart command ───────────────────────────────── */

Cypress.Commands.add('clearCart', () => {
    cy.window().then(win => {
        win.localStorage.removeItem('cart');
    });
});

/* ─── Type declarations ────────────────────────────────── */

declare global {
    namespace Cypress {
        interface Chainable {
            login(): Chainable<void>;
            addToCart(productIndex?: number): Chainable<void>;
            clearCart(): Chainable<void>;
        }
    }
}

export { };
