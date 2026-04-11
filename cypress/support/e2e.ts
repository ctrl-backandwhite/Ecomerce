import './commands';
import '@testing-library/cypress/add-commands';

/**
 * ── Video legibility ──
 * Slow down typing so form filling is visible in recordings.
 */
const TYPE_DELAY = 40;   // ms between keystrokes

Cypress.Commands.overwrite('type', (originalFn, element, text, options = {}) => {
    return originalFn(element, text, { delay: TYPE_DELAY, ...options });
});

/**
 * Dismiss the newsletter popup globally for every page load
 * by injecting the localStorage key before the window loads.
 */
Cypress.on('window:before:load', (win) => {
    win.localStorage.setItem('nexa_newsletter_dismissed', '1');
});

/* Suppress noisy ResizeObserver errors from Radix / MUI */
Cypress.on('uncaught:exception', (error) => {
    if (
        error.message.includes('ResizeObserver loop') ||
        error.message.includes('ResizeObserver loop limit exceeded')
    ) {
        return false;
    }
    return true;
});

/**
 * Captura screenshot al final de CADA test (pass y fail).
 * - Fallos: Cypress ya captura automáticamente (screenshotOnRunFailure: true)
 * - Éxitos: este afterEach captura con prefijo [PASSED]
 */
afterEach(function () {
    const testState = this.currentTest?.state;
    const testTitle = this.currentTest?.title?.replace(/[^a-zA-Z0-9-_]/g, '_') ?? 'unknown';
    const specName = Cypress.spec.name.replace('.cy.ts', '');

    if (testState === 'passed') {
        cy.screenshot(`${specName}/[PASSED] ${testTitle}`, { capture: 'viewport' });
    }
    // Failed screenshots are auto-captured by Cypress with [FAILED] prefix
});
