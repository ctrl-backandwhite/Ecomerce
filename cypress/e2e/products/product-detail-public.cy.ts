/// <reference types="cypress" />

/**
 * Regression: product detail must be reachable WITHOUT authentication.
 * Before the fix the storefront hit /api/v1/products/detail/{pid} (admin-only)
 * and got a 401. The public endpoint /api/v1/public/products/detail/{pid}
 * should answer 200 for anonymous visitors and the page must render.
 */
describe("Product detail — anonymous access (public endpoint)", () => {
    beforeEach(() => {
        cy.intercept("GET", "**/api/v1/public/products/detail/*").as("publicDetail");
    });

    it("clicking a product card on the storefront opens its detail page", () => {
        cy.visit("/store");

        cy.get('a[href*="/product/"]', { timeout: 15_000 })
            .first()
            .click();

        cy.wait("@publicDetail").its("response.statusCode").should("eq", 200);

        cy.location("pathname").should("match", /^\/product\//);
        cy.get("h1", { timeout: 10_000 }).should("be.visible").and("not.be.empty");
        cy.contains("button", /agregar al carrito/i).should("be.visible");
    });

    it("deep-linking to a product URL loads its detail without auth", () => {
        const pid = "1927FE6E-35FE-4EFB-A04F-719C668E8355";
        cy.visit(`/product/${pid}`);

        cy.wait("@publicDetail").then(({ request, response }) => {
            expect(request.url).to.include(`/products/detail/${pid}`);
            expect(response?.statusCode, "detail endpoint returns 200").to.eq(200);
            const body = response?.body as Record<string, unknown>;
            expect(body).to.have.property("pid");
            expect(body).to.have.property("productNameEn");
            expect(body).to.have.property("variants");
        });

        cy.get("h1").should("be.visible");
    });
});
