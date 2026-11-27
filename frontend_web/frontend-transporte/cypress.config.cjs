const { defineConfig } = require('cypress')

// Pruebas de sistema (E2E). `npm run cy:run:system` levanta Vite en modo e2e
// en el puerto 5174 y ejecuta las pruebas contra él.
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:5174',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1366,
    viewportHeight: 800,
    // Graba un video de cada archivo de pruebas en cypress/videos/.
    video: true
  }
})
