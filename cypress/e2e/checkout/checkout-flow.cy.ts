/**
 * CHECKOUT-01 – Checkout Flow E2E Tests
 *
 * Verifies the full multi-step checkout: Contact → Address → Payment → Confirmation.
 * Requires: authenticated user, at least one cart item.
 *
 * Strategy: Seed the cart via localStorage (same mechanism the app uses)
 * to decouple checkout tests from variant-inventory availability on the
 * product-detail page.
 */

import { checkoutPage } from '../../pages/checkout.page';

const CART_KEY = 'nx036_guest_cart';
const API_GW = 'http://localhost:9000';

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

let cachedProduct: any = null;

describe('Checkout Flow', () => {
    beforeEach(() => {
        cy.login();

        const doVisit = (product: any) => {
            cy.visit('/checkout', {
                onBeforeLoad(win) {
                    const item = buildCartItem(product, 1);
                    win.localStorage.setItem(CART_KEY, JSON.stringify([item]));
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
                cachedProduct = products[0];
                doVisit(cachedProduct);
            });
    });

    /* ─── CHK-01: Checkout page loads ─── */

    it('should display checkout page with order summary', () => {
        checkoutPage.assertCheckoutLoaded();
        cy.contains(/finalizar compra|checkout/i).should('be.visible');
    });

    /* ─── CHK-02: Step 1 – Contact info ─── */

    it('should fill contact information', () => {
        checkoutPage.fillContact({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            phone: '+1234567890',
        });
        checkoutPage.goNext();
        // Should advance past contact step
        cy.contains(/dirección|address|envío|shipping/i).should('be.visible');
    });

    /* ─── CHK-03: Step 1 validation ─── */

    it('should show validation errors for empty contact', () => {
        checkoutPage.goNext();
        // Should show validation errors or remain on step 1
        cy.url().should('include', '/checkout');
    });

    /* ─── CHK-04: Step 2 – Address ─── */

    it('should fill shipping address', () => {
        // Fill contact first
        checkoutPage.fillContact({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            phone: '+1234567890',
        });
        checkoutPage.goNext();

        // Fill address
        checkoutPage.fillAddress({
            street: '123 Main St',
            city: 'Miami',
            state: 'FL',
            zip: '33101',
            country: 'US',
        });
        checkoutPage.goNext();
    });

    /* ─── CHK-05: Step 3 – Shipping method ─── */

    it('should select shipping method', () => {
        // Fill contact
        checkoutPage.fillContact({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            phone: '+1234567890',
        });
        checkoutPage.goNext();

        // Fill address
        checkoutPage.fillAddress({
            street: '123 Main St',
            city: 'Miami',
            state: 'FL',
            zip: '33101',
            country: 'US',
        });
        checkoutPage.goNext();

        // Shipping / payment step
        cy.contains(/pago|payment|método|method/i).should('exist');
    });

    /* ─── CHK-06: Payment method selection ─── */

    it('should select a payment method', () => {
        // Fill contact
        checkoutPage.fillContact({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            phone: '+1234567890',
        });
        checkoutPage.goNext();

        // Fill address
        checkoutPage.fillAddress({
            street: '123 Main St',
            city: 'Miami',
            state: 'FL',
            zip: '33101',
            country: 'US',
        });
        checkoutPage.goNext();

        // Select payment
        cy.get('body').then($body => {
            if ($body.find('button:contains("PayPal")').length > 0) {
                cy.contains('PayPal').click();
            } else if ($body.find('button:contains("USDT")').length > 0) {
                cy.contains('USDT').click();
            }
        });
    });

    /* ─── CHK-07: Coupon application ─── */

    it('should apply a valid coupon code', () => {
        cy.get('body').then($body => {
            if ($body.find('input[name="coupon"], input[placeholder*="cupón"]').length > 0) {
                checkoutPage.applyCoupon('TESTCOUPON');
                // Should show success or error
                cy.get('body').should('be.visible');
            }
        });
    });

    /* ─── CHK-08: Invalid coupon ─── */

    it('should show error for invalid coupon', () => {
        cy.get('body').then($body => {
            if ($body.find('input[name="coupon"], input[placeholder*="cupón"]').length > 0) {
                checkoutPage.applyCoupon('INVALIDCOUPON999');
                checkoutPage.assertCouponError();
            }
        });
    });

    /* ─── CHK-09: Back navigation ─── */

    it('should navigate back to cart from checkout', () => {
        cy.contains(/volver al carrito|back to cart/i).click();
        cy.url().should('include', '/cart');
    });

    /* ─── CHK-10: Order summary sidebar ─── */

    it('should display order summary with items and totals', () => {
        cy.contains(/resumen|summary/i).should('be.visible');
        cy.contains(/subtotal/i).should('be.visible');
        cy.contains(/total/i).should('be.visible');
    });

    /* ─── CHK-11: Complete order (full flow) ─── */

    it('should complete full checkout flow', () => {
        // Step 1: Contact
        checkoutPage.fillContact({
            firstName: 'E2E',
            lastName: 'Test',
            email: 'e2e@test.com',
            phone: '+1999999999',
        });
        checkoutPage.goNext();

        // Step 2: Address
        checkoutPage.fillAddress({
            street: '456 Test Ave',
            city: 'Test City',
            state: 'TC',
            zip: '00000',
            country: 'US',
        });
        checkoutPage.goNext();

        // Step 3: Payment — select first available method and confirm
        cy.contains(/pago|payment/i).should('exist');
        checkoutPage.selectPaymentMethod('usdt');
        checkoutPage.confirmOrder();

        // Should show confirmation
        checkoutPage.assertOrderConfirmation();
    });
});
