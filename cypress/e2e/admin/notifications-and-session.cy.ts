/// <reference types="cypress" />

describe("Admin — slides, session and notifications", () => {
    beforeEach(() => {
        cy.login();
    });

    it("active slides from admin appear on the home hero", () => {
        cy.intercept("GET", "**/api/v1/slides/active").as("activeSlides");

        cy.visit("/");
        cy.wait("@activeSlides").then(({ response }) => {
            expect(response?.statusCode, "public slides/active 200").to.eq(200);
            const body = response?.body as Array<{ active: boolean }> | null;
            expect(body, "body is an array").to.be.an("array");
            expect(body!.every(s => s.active), "every returned slide is active").to.be.true;
            expect(body!.length, "there is at least one active slide").to.be.greaterThan(0);
        });

        cy.get("section, div").contains(/Envío|Verano|Flash|Gaming|Venta/, { timeout: 10_000 }).should("be.visible");
    });

    it("Cerrar sesión from the admin sidebar clears the session", () => {
        cy.visit("/admin");
        cy.get("aside").should("be.visible");

        cy.contains("button", /cerrar sesión/i).click();

        cy.location("pathname", { timeout: 10_000 }).should("eq", "/");

        cy.window().then(win => {
            expect(win.localStorage.getItem("access_token")).to.be.null;
        });
    });

    it("user-menu in top bar exposes Mi perfil and Cerrar sesión", () => {
        cy.visit("/admin");

        cy.get("header button").contains(/admin|administrador|@|[A-Z]{2}/).last().click({ force: true });

        cy.contains("a, button", /mi perfil/i).should("be.visible");
        cy.contains("button", /cerrar sesión/i).should("be.visible");
    });

    it("notifications panel renders items from /api/v1/notifications", () => {
        cy.intercept("GET", "**/api/v1/notifications?*").as("listNotifs");

        cy.visit("/admin");
        cy.wait("@listNotifs").then(({ response }) => {
            expect(response?.statusCode).to.eq(200);
        });

        cy.get("header button:has(svg.lucide-bell)").click();

        cy.contains(/notificaciones/i).should("be.visible");
        cy.get("[class*='overflow-y']")
            .find("div, li, article")
            .its("length")
            .should("be.greaterThan", 0);
    });

    it("marking a notification read hides the unread dot", () => {
        cy.visit("/admin");
        cy.get("header button:has(svg.lucide-bell)").click();

        cy.contains(/marcar todas leídas/i, { timeout: 5000 }).click();

        cy.contains(/0 sin leer|todas leídas/i, { timeout: 5000 }).should("exist");

        cy.get("header button:has(svg.lucide-bell)")
            .find("span.bg-red-500")
            .should("not.exist");
    });
});
