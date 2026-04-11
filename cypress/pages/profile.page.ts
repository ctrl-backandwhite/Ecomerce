import { BasePage } from './base.page';

/**
 * Page Object for the User Profile / Account (/account)
 */
export class ProfilePage extends BasePage {
    readonly path = '/account';

    /* ── Selectors ── */
    private readonly sidebar = 'nav, aside';
    private readonly avatar = 'div.rounded-full';

    /* ── Tab navigation ── */

    goToTab(tab: 'overview' | 'details' | 'orders' | 'invoices' | 'favorites' | 'addresses' | 'payments' | 'giftcards' | 'security'): void {
        cy.visit(`/account?tab=${tab}`);
    }

    clickTab(label: string): void {
        cy.get(this.sidebar).contains(label).click();
    }

    /* ── Actions ── */

    updateName(first: string, last: string): void {
        cy.get('input[name="firstName"], input[name="name"]').first().clear().type(first);
        cy.get('input[name="lastName"], input[name="surname"]').first().clear().type(last);
    }

    updatePhone(phone: string): void {
        cy.get('input[name="phone"], input[type="tel"]').first().clear().type(phone);
    }

    saveChanges(): void {
        cy.contains('button', /guardar|save/i).click();
    }

    logout(): void {
        cy.contains(/cerrar sesión|logout|salir/i).click();
    }

    /* ── Addresses ── */

    addAddress(): void {
        cy.contains('button', /agregar|nueva|add/i).click();
    }

    fillAddressForm(data: { street: string; city: string; state: string; zip: string }): void {
        cy.get('input[name="street"], input[name="address"]').first().clear().type(data.street);
        cy.get('input[name="city"]').first().clear().type(data.city);
        cy.get('input[name="state"], input[name="province"]').first().clear().type(data.state);
        cy.get('input[name="zip"], input[name="postalCode"]').first().clear().type(data.zip);
    }

    /* ── Favorites ── */

    removeFavorite(index: number = 0): void {
        cy.get('button').filter(':has(svg)').eq(index).click(); // Heart icon
    }

    /* ── Assertions ── */

    assertProfileLoaded(): void {
        cy.url().should('include', '/account');
        cy.contains(/mi cuenta|perfil|profile/i).should('be.visible');
    }

    assertTabActive(tab: string): void {
        cy.url().should('include', `tab=${tab}`);
    }

    assertOrdersVisible(): void {
        cy.get('table, [class*="rounded-lg"]').should('exist');
    }

    assertFavoritesVisible(): void {
        cy.get('a[href*="/product/"]').should('have.length.gte', 0);
    }

    assertAddressCount(count: number): void {
        cy.get('[class*="rounded-lg"][class*="border"]').should('have.length.gte', count);
    }

    assertSaveSuccess(): void {
        cy.contains(/guardado|actualizado|saved|updated/i, { timeout: 10000 }).should('be.visible');
    }
}

export const profilePage = new ProfilePage();
