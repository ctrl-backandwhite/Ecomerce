/**
 * CART-01 – Shopping Cart E2E Tests
 *
 * Verifies cart operations: add, remove, update quantity, checkout navigation.
 *
 * Cart items: div.bg-white.rounded-lg.shadow-sm cards inside min-h-screen.
 * Cart is persisted in localStorage under key "nx036_guest_cart".
 *
 * Strategy: Seed the cart via localStorage (same mechanism the app uses)
 * with a real product fetched from the API. This decouples cart-page tests
 * from variant-inventory availability on the product-detail page.
 */

import { cartPage } from '../../pages/cart.page';

const CART_KEY = 'nx036_guest_cart';
const API_GW = 'http://localhost:9000';

/**
 * Build a minimal CartItem object from raw API product data.
 * The shape matches what CartContext stores in localStorage.
 */
function buildCartItem(raw: any, qty = 1) {
    return {
        id: raw.id,
        productId: raw.id,
        name: raw.name,
        slug: (raw.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sku: raw.sku ?? '',
        brand: '',
        description: raw.name,
        shortDescription: raw.name,
        price: raw.sellPriceRaw ?? parseFloat(raw.sellPrice) ?? 9.99,
        taxClass: 'standard',
        category: raw.categoryId ?? '',
        subcategory: '',
        keywords: [],
        image: raw.bigImage ?? '',
        images: raw.bigImage ? [{ url: raw.bigImage, alt: raw.name, position: 0 }] : [],
        rating: 0,
        reviews: 0,
        stock: raw.listedNum ?? 50,
        barcode: '',
        stockStatus: 'in_stock',
        manageStock: true,
        allowBackorder: false,
        attributes: [],
        variants: [],
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        shippingClass: 'standard',
        metaTitle: '',
        metaDescription: '',
        status: 'active',
        visibility: 'public',
        featured: false,
        currencyCode: raw.currencyCode ?? 'USD',
        currencySymbol: raw.currencySymbol ?? '$',
        quantity: qty,
    };
}

/** Cached product from API so we only fetch once per run */
let cachedProduct: any = null;

/**
 * Seed the guest cart in localStorage with one product from the API.
 * Must be called inside `onBeforeLoad` or after `cy.visit`.
 */
function seedCart(win: Cypress.AUTWindow, product: any, qty = 1) {
    const item = buildCartItem(product, qty);
    win.localStorage.setItem(CART_KEY, JSON.stringify([item]));
}

/**
 * Fetch a product from the API and seed LocalStorage before the page loads.
 * Uses onBeforeLoad to set localStorage before React hydrates.
 */
function visitCartWithProduct(qty = 1) {
    const doVisit = (product: any) => {
        cy.visit('/cart', {
            onBeforeLoad(win) {
                seedCart(win, product, qty);
            },
        });
    };

    if (cachedProduct) {
        doVisit(cachedProduct);
        return;
    }

    cy.request({ url: `${API_GW}/api/v1/products?page=0&size=5`, failOnStatusCode: false })
        .then(resp => {
            const products = resp.body?.content ?? resp.body ?? [];
            cachedProduct = products[0] ?? {
                id: 'test-product-001',
                name: 'Test Product',
                sku: 'TEST-001',
                sellPriceRaw: 9.99,
                sellPrice: '9.99',
                bigImage: '',
                listedNum: 100,
                currencyCode: 'USD',
                currencySymbol: '$',
            };
            doVisit(cachedProduct);
        });
}

describe('Shopping Cart', () => {

    beforeEach(() => {
        cachedProduct = null;
    });

    /* ─── CART-01: Empty cart ─── */

    it('should display empty cart message', () => {
        cy.visit('/cart', {
            onBeforeLoad(win) { win.localStorage.removeItem(CART_KEY); },
        });
        cartPage.assertEmpty();
    });

    /* ─── CART-02: Product appears in cart after seeding ─── */

    it('should display seeded product in cart', () => {
        visitCartWithProduct();
        cartPage.assertNotEmpty();
        cy.get('.min-h-screen .bg-white.rounded-lg.shadow-sm')
            .first()
            .should('be.visible');
    });

    /* ─── CART-03: Increment quantity ─── */

    it('should increment item quantity in cart', () => {
        visitCartWithProduct();
        cartPage.assertNotEmpty();
        cartPage.incrementItem(0);
        cy.wait(500);
        cy.get('.min-h-screen .bg-white.rounded-lg.shadow-sm').first()
            .find('span.w-10.text-center').should('contain', '2');
    });

    /* ─── CART-04: Decrement quantity ─── */

    it('should decrement item quantity in cart', () => {
        visitCartWithProduct(2);
        cartPage.assertNotEmpty();
        cartPage.decrementItem(0);
        cy.wait(500);
        cy.get('.min-h-screen .bg-white.rounded-lg.shadow-sm').first()
            .find('span.w-10.text-center').should('contain', '1');
    });

    /* ─── CART-05: Remove item ─── */

    it('should remove item from cart', () => {
        visitCartWithProduct();
        cartPage.assertNotEmpty();
        cartPage.removeItem(0);
        cartPage.assertEmpty();
    });

    /* ─── CART-06: Order summary ─── */

    it('should display order summary with subtotal', () => {
        visitCartWithProduct();
        cy.contains('span', /subtotal/i).should('be.visible');
    });

    /* ─── CART-07: Proceed to checkout ─── */

    it('should navigate to checkout when clicking proceed', () => {
        cy.login();
        visitCartWithProduct();
        cartPage.goToCheckout();
        cy.url().should('include', '/checkout');
    });

    /* ─── CART-08: Cart persistence ─── */

    it('should persist cart items after page reload', () => {
        visitCartWithProduct();
        cartPage.assertNotEmpty();
        cy.reload();
        cartPage.assertNotEmpty();
    });

    /* ─── CART-09: Continue shopping ─── */

    it('should navigate back to store when clicking continue shopping', () => {
        cy.visit('/cart', {
            onBeforeLoad(win) { win.localStorage.removeItem(CART_KEY); },
        });
        cy.contains(/continuar comprando|continue shopping|explorar/i).click();
        cy.url().should('include', '/');
    });
});
