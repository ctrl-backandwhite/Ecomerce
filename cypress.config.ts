import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5174',
        supportFile: 'cypress/support/e2e.ts',
        specPattern: 'cypress/e2e/**/*.cy.{ts,tsx}',

        /* ── Video: graba TODOS los tests ── */
        video: true,
        videoCompression: false,
        videosFolder: 'cypress/results/videos',

        /* ── Screenshots: captura en fallos Y en éxitos ── */
        screenshotOnRunFailure: true,
        screenshotsFolder: 'cypress/results/screenshots',

        defaultCommandTimeout: 10000,
        pageLoadTimeout: 120000,
        chromeWebSecurity: false,
        viewportWidth: 1280,
        viewportHeight: 800,
        experimentalMemoryManagement: true,
        numTestsKeptInMemory: 0,

        setupNodeEvents(on, _config) {
            on('task', {
                log(message: string) {
                    console.log(message);
                    return null;
                },
            });
            on('before:browser:launch', (browser, launchOptions) => {
                if (browser.family === 'chromium') {
                    launchOptions.args.push('--disable-dev-shm-usage');
                    launchOptions.args.push('--no-sandbox');
                    launchOptions.args.push('--disable-setuid-sandbox');
                    launchOptions.args.push('--force-device-scale-factor=1');
                    launchOptions.args.push('--window-size=1280,800');
                    launchOptions.args.push('--force-color-profile=srgb');
                }
                return launchOptions;
            });

            /* Captura screenshot al final de CADA test (pass o fail) */
            on('after:spec', (_spec, results) => {
                if (results && results.video) {
                    // Video se conserva siempre (pass + fail)
                    // Cypress por defecto borra videos de specs exitosos; esto lo evita
                }
            });
        },
    },
});
