import { BaseCrudPage } from './base-crud.page';

/**
 * AdminCampaigns uses a card-based grid layout (not HTML tables).
 * Each campaign is rendered as a rounded-xl card with action buttons identified by title attributes.
 */
export class AdminCampaignsPage extends BaseCrudPage {

    constructor() {
        super('/admin/campaigns');
    }

    /* ── Card selector (overrides table selectors) ── */
    private readonly campaignCard = '[class*="bg-white"][class*="border-gray-100"][class*="rounded-xl"][class*="p-4"]';

    /* ── Panel (slide-over) ── */
    private readonly panel = '[class*="fixed"][class*="inset-0"][class*="z-50"]';
    private readonly panelBody = '.relative.w-full.max-w-xl';

    /* ── Overrides ── */

    searchInTable(query: string): void {
        cy.get('input[placeholder*="Buscar campa"]').clear().type(query);
        cy.wait(500);
    }

    clearSearch(): void {
        cy.get('input[placeholder*="Buscar campa"]').clear();
    }

    clickCreate(): void {
        cy.get('button[title="Nueva campaña"]').click();
    }

    clickEditRow(index: number = 0): void {
        cy.get(this.campaignCard).eq(index).within(() => {
            cy.get('button[title*="Editar"]').click();
        });
    }

    clickDeleteRow(index: number = 0): void {
        cy.get(this.campaignCard).eq(index).within(() => {
            cy.get('button[title*="Eliminar"]').click();
        });
    }

    clickCloneRow(index: number = 0): void {
        cy.get(this.campaignCard).eq(index).within(() => {
            cy.get('button[title*="Clonar"]').click();
        });
    }

    clickToggleRow(index: number = 0): void {
        cy.get(this.campaignCard).eq(index).within(() => {
            cy.contains('button', /Pausar|Activar/i).click();
        });
    }

    clickViewRow(index: number = 0): void {
        cy.get(this.campaignCard).eq(index).within(() => {
            cy.get('button[title*="Editar"]').click();
        });
    }

    assertTableLoaded(): void {
        cy.get(this.campaignCard, { timeout: 15000 }).should('have.length.gte', 0);
    }

    assertMinRowCount(min: number): void {
        cy.get(this.campaignCard, { timeout: 15000 }).should('have.length.gte', min);
    }

    assertModalVisible(): void {
        cy.get(this.panel, { timeout: 10000 }).should('be.visible');
    }

    assertModalClosed(): void {
        cy.get(this.panel).should('not.exist');
    }

    /* ── Panel / Tab navigation ── */

    goToTab(tab: 'Campaña' | 'Descuento' | 'Productos' | 'Vigencia' | 'Presentación'): void {
        cy.get(this.panel).within(() => {
            cy.contains('button', tab).click();
        });
    }

    submitPanel(): void {
        cy.get(this.panel).within(() => {
            cy.contains('button', /Crear campaña|Guardar cambios/i).click();
        });
    }

    cancelPanel(): void {
        cy.get(this.panel).within(() => {
            cy.contains('button', 'Cancelar').click();
        });
    }

    /* ── Basics tab (Campaña) ── */

    fillName(name: string): void {
        cy.get(this.panel).find('input[placeholder*="Flash Sale"]').clear().type(name);
    }

    fillDescription(desc: string): void {
        cy.get(this.panel).find('textarea[placeholder*="Notas para el equipo"]').clear().type(desc);
    }

    selectType(label: string): void {
        cy.get(this.panel).within(() => {
            cy.contains('button', label).click();
        });
    }

    selectStatus(label: 'Borrador' | 'Activa'): void {
        cy.get(this.panel).within(() => {
            cy.contains('button', label).click();
        });
    }

    /* ── Discount tab (Descuento) ── */

    fillDiscountPercentage(value: number): void {
        cy.get(this.panel).find('input[type="number"][min="1"][max="99"]').clear().type(String(value));
    }

    fillMaxDiscount(value: number): void {
        cy.get(this.panel).find('input[placeholder="—"]').clear().type(String(value));
    }

    fillFixedDiscount(value: number): void {
        cy.get(this.panel).find('input[type="number"][min="1"]').first().clear().type(String(value));
    }

    fillMinOrder(value: number): void {
        cy.get(this.panel).find('input[placeholder="0"]').focus().clear().type('{selectAll}').type(String(value));
    }

    fillBuyQty(value: number): void {
        cy.get(this.panel).find('input[type="number"]').first().focus().clear().type('{selectAll}').type(String(value));
    }

    fillGetQty(value: number): void {
        cy.get(this.panel).find('input[type="number"]').last().focus().clear().type('{selectAll}').type(String(value));
    }

    clickQuickPercentage(value: number): void {
        cy.get(this.panel).within(() => {
            cy.contains('button', `${value}%`).click();
        });
    }

    /* ── Scope tab (Productos) ── */

    selectScope(label: 'Todos los productos' | 'Categorías seleccionadas' | 'Productos específicos'): void {
        cy.get(this.panel).within(() => {
            cy.contains('button', label).click();
        });
    }

    selectFirstCategory(): void {
        cy.get(this.panel).find('[class*="max-h-56"] button').first().click();
    }

    searchProduct(query: string): void {
        cy.get(this.panel).find('input[placeholder*="Buscar por nombre o SKU"]').clear().type(query);
    }

    selectFirstProduct(): void {
        cy.get(this.panel).find('[class*="max-h-56"] button').first().click();
    }

    /* ── Dates tab (Vigencia) ── */

    fillStartDate(date: string): void {
        cy.get(this.panel).find('input[type="date"]').first().clear().type(date);
    }

    fillEndDate(date: string): void {
        cy.get(this.panel).find('input[type="date"]').last().clear().type(date);
    }

    toggleFlash(): void {
        cy.get(this.panel).within(() => {
            cy.contains('button', /Mostrar contador/i).click();
        });
    }

    assertDuration(days: string): void {
        cy.get(this.panel).within(() => {
            cy.contains(`Duración: ${days} días`).should('be.visible');
        });
    }

    /* ── Display tab (Presentación) ── */

    fillBadgeText(text: string): void {
        cy.get(this.panel).find('input[maxlength="20"]').clear().type(text);
    }

    clickBadgeColor(index: number): void {
        cy.get(this.panel).find('button[class*="rounded-full"][class*="border-2"]').eq(index).click();
    }

    toggleShowOnHome(): void {
        cy.get(this.panel).within(() => {
            cy.contains('button', /Destacar en portada/i).click();
        });
    }

    fillPriority(value: number): void {
        cy.get(this.panel).find('input[type="number"][min="1"][max="10"]').focus().clear().type('{selectAll}').type(String(value));
    }

    /* ── Filter helpers ── */

    filterByStatus(status: string): void {
        cy.contains('button', status).click();
    }

    filterByType(type: string): void {
        cy.get('select').select(type);
    }

    /* ── Delete dialog ── */

    confirmDelete(): void {
        cy.contains('button', 'Eliminar').click();
    }

    cancelDelete(): void {
        cy.contains('button', 'Cancelar').click();
    }

    /* ── Assertions ── */

    assertCampaignInTable(name: string): void {
        cy.get(this.campaignCard).should('contain.text', name);
    }

    assertCampaignNotInTable(name: string): void {
        cy.get(this.campaignCard).should('not.contain.text', name);
    }

    assertPanelTitle(title: 'Nueva campaña' | 'Editar campaña'): void {
        cy.get(this.panel).should('contain.text', title);
    }

    assertBadgePreview(): void {
        cy.get(this.panel).within(() => {
            cy.contains('Vista previa del badge').should('be.visible');
        });
    }

    assertStatsVisible(): void {
        cy.contains('Campañas totales').should('be.visible');
        cy.contains('Activas ahora').should('be.visible');
    }

    assertToastSuccess(): void {
        cy.get('[data-sonner-toast], [role="status"]', { timeout: 10000 })
            .should('be.visible');
    }

    assertEmptyState(): void {
        cy.contains(/No hay campañas/i).should('be.visible');
    }

    /* ── Campaign-specific full form fill ── */

    fillCampaignForm(data: {
        name: string;
        type?: string;
        value?: number;
        startDate?: string;
        endDate?: string;
    }): void {
        this.goToTab('Campaña');
        this.fillName(data.name);
        if (data.type) this.selectType(data.type);

        if (data.value) {
            this.goToTab('Descuento');
            this.fillDiscountPercentage(data.value);
        }

        if (data.startDate || data.endDate) {
            this.goToTab('Vigencia');
            if (data.startDate) this.fillStartDate(data.startDate);
            if (data.endDate) this.fillEndDate(data.endDate);
        }
    }
}

export const adminCampaignsPage = new AdminCampaignsPage();
