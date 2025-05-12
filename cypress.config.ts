import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        setupNodeEvents(on, config) {
            return require('./cypress/plugins/index.js')(on, config);
        },
    },
    viewportWidth: 1280,
    viewportHeight: 720,
});