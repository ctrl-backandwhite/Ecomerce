/**
 * ADMIN-04 – Admin Campaigns E2E Tests
 *
 * Verifies campaign management: list, stats, search, filters,
 * CRUD (create / edit / delete), all 5 form tabs, toggle active,
 * and round-trip field persistence.
 */

import { adminCampaignsPage } from '../../pages/admin/campaigns.page';

const UNIQUE = `CY-${Date.now()}`;

describe('Admin Campaigns', () => {
    beforeEach(() => {
        cy.login();
        adminCampaignsPage.visit();
    });

    /* ═══════════════════════════════════════════════════════════
     * Section 1 – Page loads & structure
     * ══════════════════════════════════════════════════════════ */

    it('ACAMP-01  should display campaigns grid', () => {
        adminCampaignsPage.assertTableLoaded();
    });

    it('ACAMP-02  should display page header and stats', () => {
        cy.contains('h1', 'Campañas promocionales').should('be.visible');
        adminCampaignsPage.assertStatsVisible();
    });

    it('ACAMP-03  should display at least one campaign card', () => {
        adminCampaignsPage.assertMinRowCount(1);
    });

    /* ═══════════════════════════════════════════════════════════
     * Section 2 – Search & Filters
     * ══════════════════════════════════════════════════════════ */

    it('ACAMP-04  should search campaigns by name', () => {
        adminCampaignsPage.searchInTable('verano');
        cy.wait(800);
        adminCampaignsPage.assertTableLoaded();
    });

    it('ACAMP-05  should clear search and show all campaigns', () => {
        adminCampaignsPage.searchInTable('xyz-nothing');
        cy.wait(500);
        adminCampaignsPage.clearSearch();
        cy.wait(500);
        adminCampaignsPage.assertMinRowCount(1);
    });

    it('ACAMP-06  should filter by status tab', () => {
        adminCampaignsPage.filterByStatus('Todas');
        adminCampaignsPage.assertTableLoaded();
    });

    /* ═══════════════════════════════════════════════════════════
     * Section 3 – Create campaign panel & tabs
     * ══════════════════════════════════════════════════════════ */

    it('ACAMP-07  should open create campaign panel', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();
        adminCampaignsPage.assertPanelTitle('Nueva campaña');
    });

    it('ACAMP-08  Campaña tab – should fill name, description, type and status', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.fillName('Campaña Basics Test');
        adminCampaignsPage.fillDescription('Notas internas de prueba');
        adminCampaignsPage.selectType('Flash Sale');
        adminCampaignsPage.selectStatus('Activa');
    });

    it('ACAMP-09  Descuento tab – should fill percentage discount fields', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.goToTab('Descuento');
        adminCampaignsPage.fillDiscountPercentage(25);
        adminCampaignsPage.fillMaxDiscount(100);
        adminCampaignsPage.fillMinOrder(50);
    });

    it('ACAMP-10  Descuento tab – should use quick percentage picks', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.goToTab('Descuento');
        adminCampaignsPage.clickQuickPercentage(30);
    });

    it('ACAMP-11  Descuento tab – bundle type shows buyQty / getQty', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.goToTab('Campaña');
        adminCampaignsPage.selectType('Compra X lleva Y');
        adminCampaignsPage.goToTab('Descuento');
        cy.get('[class*="fixed"][class*="inset-0"][class*="z-50"]').within(() => {
            cy.contains('Compra (cantidad)').should('be.visible');
            cy.contains('Lleva gratis').should('be.visible');
        });
    });

    it('ACAMP-12  Productos tab – should select scope "all"', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.goToTab('Productos');
        adminCampaignsPage.selectScope('Todos los productos');
    });

    it('ACAMP-13  Productos tab – should select categories scope', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.goToTab('Productos');
        adminCampaignsPage.selectScope('Categorías seleccionadas');
        adminCampaignsPage.selectFirstCategory();
    });

    it('ACAMP-14  Productos tab – should select products scope with search', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.goToTab('Productos');
        adminCampaignsPage.selectScope('Productos específicos');
        adminCampaignsPage.selectFirstProduct();
    });

    it('ACAMP-15  Vigencia tab – should fill dates and show duration', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.goToTab('Vigencia');
        adminCampaignsPage.fillStartDate('2026-08-01');
        adminCampaignsPage.fillEndDate('2026-08-15');
        adminCampaignsPage.assertDuration('14');
    });

    it('ACAMP-16  Vigencia tab – should toggle flash countdown', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.goToTab('Vigencia');
        adminCampaignsPage.toggleFlash();
        cy.get('[class*="fixed"][class*="inset-0"][class*="z-50"]').within(() => {
            cy.contains('Mostrar contador de cuenta atrás')
                .closest('button')
                .should('have.class', 'border-yellow-300');
        });
    });

    it('ACAMP-17  Presentación tab – badge text, color, showOnHome, priority', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.goToTab('Presentación');
        adminCampaignsPage.fillBadgeText('SUPER OFERTA');
        adminCampaignsPage.clickBadgeColor(2); // red
        adminCampaignsPage.assertBadgePreview();
        adminCampaignsPage.toggleShowOnHome();
        adminCampaignsPage.fillPriority(1);
    });

    it('ACAMP-18  should close panel with Cancel button', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();
        adminCampaignsPage.cancelPanel();
        adminCampaignsPage.assertModalClosed();
    });

    /* ═══════════════════════════════════════════════════════════
     * Section 4 – Full CRUD: Create → Edit → Delete
     * ══════════════════════════════════════════════════════════ */

    it('ACAMP-19  should create a new percentage campaign (full form)', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        // Campaña tab
        adminCampaignsPage.fillName(UNIQUE);
        adminCampaignsPage.fillDescription('Test description para E2E');
        adminCampaignsPage.selectType('Descuento %');
        adminCampaignsPage.selectStatus('Activa');

        // Descuento tab
        adminCampaignsPage.goToTab('Descuento');
        adminCampaignsPage.fillDiscountPercentage(20);
        adminCampaignsPage.fillMaxDiscount(150);
        adminCampaignsPage.fillMinOrder(30);

        // Vigencia tab
        adminCampaignsPage.goToTab('Vigencia');
        adminCampaignsPage.fillStartDate('2026-09-01');
        adminCampaignsPage.fillEndDate('2026-09-30');

        // Presentación tab
        adminCampaignsPage.goToTab('Presentación');
        adminCampaignsPage.fillBadgeText('E2E Badge');
        adminCampaignsPage.clickBadgeColor(1); // blue
        adminCampaignsPage.toggleShowOnHome();
        adminCampaignsPage.fillPriority(5);

        // Submit
        adminCampaignsPage.submitPanel();
        adminCampaignsPage.assertToastSuccess();
        cy.wait(1000);
        adminCampaignsPage.assertCampaignInTable(UNIQUE);
    });

    it('ACAMP-20  should edit an existing campaign and persist changes', () => {
        // First, search for our campaign
        adminCampaignsPage.searchInTable(UNIQUE);
        cy.wait(800);
        adminCampaignsPage.clickEditRow(0);
        adminCampaignsPage.assertModalVisible();
        adminCampaignsPage.assertPanelTitle('Editar campaña');

        // Verify previously set data loads (not hardcoded)
        cy.get('[class*="fixed"][class*="inset-0"][class*="z-50"]').within(() => {
            cy.get('input[placeholder*="Flash Sale"]').should('have.value', UNIQUE);
            cy.get('textarea[placeholder*="Notas para el equipo"]').should('have.value', 'Test description para E2E');
        });

        // Change name
        adminCampaignsPage.fillName(`${UNIQUE}-edited`);
        adminCampaignsPage.submitPanel();
        adminCampaignsPage.assertToastSuccess();
        cy.wait(1000);
        adminCampaignsPage.clearSearch();
        cy.wait(500);
        adminCampaignsPage.assertCampaignInTable(`${UNIQUE}-edited`);
    });

    it('ACAMP-21  should verify all fields persist after edit reload', () => {
        adminCampaignsPage.searchInTable(`${UNIQUE}-edited`);
        cy.wait(800);
        adminCampaignsPage.clickEditRow(0);
        adminCampaignsPage.assertModalVisible();

        // Check Descuento tab persisted values (minOrder field should not be 0)
        adminCampaignsPage.goToTab('Descuento');
        cy.get('[class*="fixed"][class*="inset-0"][class*="z-50"]').within(() => {
            cy.get('input[placeholder="0"]').invoke('val').then(val => {
                expect(Number(val)).to.be.greaterThan(0);
            });
        });

        // Check Presentación tab persisted values
        adminCampaignsPage.goToTab('Presentación');
        cy.get('[class*="fixed"][class*="inset-0"][class*="z-50"]').within(() => {
            cy.get('input[maxlength="20"]').should('have.value', 'E2E Badge');
            cy.get('input[type="number"][min="1"][max="10"]').invoke('val').then(val => {
                expect(Number(val)).to.be.greaterThan(0);
            });
        });
    });

    it('ACAMP-22  should toggle campaign active/paused', () => {
        adminCampaignsPage.searchInTable(`${UNIQUE}-edited`);
        cy.wait(800);
        adminCampaignsPage.clickToggleRow(0);
        adminCampaignsPage.assertToastSuccess();
    });

    it('ACAMP-23  should cancel deletion via dialog', () => {
        adminCampaignsPage.searchInTable(`${UNIQUE}-edited`);
        cy.wait(800);
        adminCampaignsPage.clickDeleteRow(0);
        cy.contains('¿Eliminar').should('be.visible');
        adminCampaignsPage.cancelDelete();
        adminCampaignsPage.assertCampaignInTable(`${UNIQUE}-edited`);
    });

    /* ═══════════════════════════════════════════════════════════
     * Section 4b – Clone Campaign
     * ══════════════════════════════════════════════════════════ */

    it('ACAMP-24  should clone a campaign and verify pre-filled panel', () => {
        adminCampaignsPage.searchInTable(`${UNIQUE}-edited`);
        cy.wait(800);
        adminCampaignsPage.clickCloneRow(0);
        adminCampaignsPage.assertModalVisible();
        adminCampaignsPage.assertPanelTitle('Nueva campaña');

        // Verify name has "(copia)" suffix
        cy.get('[class*="fixed"][class*="inset-0"][class*="z-50"]').within(() => {
            cy.get('input[placeholder*="Flash Sale"]')
                .should('have.value', `${UNIQUE}-edited (copia)`);
        });

        // Verify Descuento tab retains source data
        adminCampaignsPage.goToTab('Descuento');
        cy.get('[class*="fixed"][class*="inset-0"][class*="z-50"]').within(() => {
            cy.get('input[placeholder="0"]').invoke('val').then(val => {
                expect(Number(val)).to.be.greaterThan(0);
            });
        });

        // Verify Presentación tab retains badge text
        adminCampaignsPage.goToTab('Presentación');
        cy.get('[class*="fixed"][class*="inset-0"][class*="z-50"]').within(() => {
            cy.get('input[maxlength="20"]').should('have.value', 'E2E Badge');
        });

        adminCampaignsPage.cancelPanel();
    });

    it('ACAMP-25  should submit cloned campaign successfully', () => {
        adminCampaignsPage.searchInTable(`${UNIQUE}-edited`);
        cy.wait(800);
        adminCampaignsPage.clickCloneRow(0);
        adminCampaignsPage.assertModalVisible();

        // Rename the clone to a unique name
        adminCampaignsPage.fillName(`Clone-${UNIQUE}`);
        adminCampaignsPage.submitPanel();
        adminCampaignsPage.assertToastSuccess();
        cy.wait(1000);
        adminCampaignsPage.clearSearch();
        cy.wait(500);
        adminCampaignsPage.assertCampaignInTable(`Clone-${UNIQUE}`);
    });

    it('ACAMP-26  should delete campaign via dialog', () => {
        adminCampaignsPage.searchInTable(`${UNIQUE}-edited`);
        cy.wait(800);
        adminCampaignsPage.clickDeleteRow(0);
        cy.contains('¿Eliminar').should('be.visible');
        adminCampaignsPage.confirmDelete();
        adminCampaignsPage.assertToastSuccess();
        cy.wait(1000);
        adminCampaignsPage.clearSearch();
    });

    /* ═══════════════════════════════════════════════════════════
     * Section 5 – Campaign type variants
     * ══════════════════════════════════════════════════════════ */

    it('ACAMP-27  should create a fixed discount campaign', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.fillName(`Fixed-${UNIQUE}`);
        adminCampaignsPage.selectType('Descuento fijo');
        adminCampaignsPage.selectStatus('Activa');

        adminCampaignsPage.goToTab('Descuento');
        adminCampaignsPage.fillFixedDiscount(50);
        adminCampaignsPage.fillMinOrder(100);

        adminCampaignsPage.goToTab('Vigencia');
        adminCampaignsPage.fillStartDate('2026-09-01');
        adminCampaignsPage.fillEndDate('2026-09-30');

        adminCampaignsPage.submitPanel();
        adminCampaignsPage.assertToastSuccess();
    });

    it('ACAMP-28  should create a bundle campaign with buyQty/getQty', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.fillName(`Bundle-${UNIQUE}`);
        adminCampaignsPage.selectType('Compra X lleva Y');
        adminCampaignsPage.selectStatus('Activa');

        adminCampaignsPage.goToTab('Descuento');
        adminCampaignsPage.fillBuyQty(3);
        adminCampaignsPage.fillGetQty(1);
        adminCampaignsPage.fillMinOrder(0);

        adminCampaignsPage.goToTab('Vigencia');
        adminCampaignsPage.fillStartDate('2026-09-01');
        adminCampaignsPage.fillEndDate('2026-09-30');

        adminCampaignsPage.submitPanel();
        adminCampaignsPage.assertToastSuccess();
    });

    it('ACAMP-29  should create a free shipping campaign', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        adminCampaignsPage.fillName(`FreeShip-${UNIQUE}`);
        adminCampaignsPage.selectType('Envío gratis');
        adminCampaignsPage.selectStatus('Activa');

        adminCampaignsPage.goToTab('Descuento');
        adminCampaignsPage.fillMinOrder(75);

        adminCampaignsPage.goToTab('Vigencia');
        adminCampaignsPage.fillStartDate('2026-09-01');
        adminCampaignsPage.fillEndDate('2026-09-30');

        adminCampaignsPage.submitPanel();
        adminCampaignsPage.assertToastSuccess();
    });

    /* ═══════════════════════════════════════════════════════════
     * Section 6 – Validation
     * ══════════════════════════════════════════════════════════ */

    it('ACAMP-30  should show error when name is empty', () => {
        adminCampaignsPage.clickCreate();
        adminCampaignsPage.assertModalVisible();

        // Clear default name and submit
        cy.get('[class*="fixed"][class*="inset-0"][class*="z-50"]')
            .find('input[placeholder*="Flash Sale"]')
            .clear();
        adminCampaignsPage.submitPanel();
        // Toast error
        cy.get('[data-sonner-toast], [role="status"]', { timeout: 5000 }).should('be.visible');
    });

    /* ═══════════════════════════════════════════════════════════
     * Section 7 – Cleanup test campaigns
     * ══════════════════════════════════════════════════════════ */

    after(() => {
        cy.login();
        // Clean up campaigns created during test run  
        const prefixes = [`Clone-${UNIQUE}`, `Fixed-${UNIQUE}`, `Bundle-${UNIQUE}`, `FreeShip-${UNIQUE}`];
        prefixes.forEach(prefix => {
            cy.visit('/admin/campaigns');
            cy.wait(2000);
            cy.get('input[placeholder*="Buscar campa"]').clear().type(prefix);
            cy.wait(800);
            cy.get('body').then($body => {
                const cards = $body.find('[class*="bg-white"][class*="border-gray-100"][class*="rounded-xl"][class*="p-4"]');
                if (cards.length > 0) {
                    cy.get('[class*="bg-white"][class*="border-gray-100"][class*="rounded-xl"][class*="p-4"]')
                        .first()
                        .find('button[title*="Eliminar"]')
                        .click();
                    cy.contains('button', 'Eliminar').click();
                    cy.wait(1000);
                }
            });
        });
    });
});
