// Configuración de Jest para las pruebas unitarias del frontend (npm test).
module.exports = {
  testEnvironment: 'jsdom',
  // Lista cada prueba con su nombre (√ / ×) en vez de solo el resumen.
  verbose: true,
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/tests/**/*.test.{js,jsx}'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.js'],
  moduleNameMapper: {
    // Los estilos no importan en una prueba unitaria.
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(png|jpe?g|gif|svg|webp)$': '<rootDir>/src/tests/__mocks__/archivo.js',
    // axios publica su versión de navegador como módulo ES; Jest usa la de Node (CommonJS).
    '^axios$': 'axios/dist/node/axios.cjs'
  }
}
