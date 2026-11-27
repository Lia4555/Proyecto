// Configuración de Jest para las pruebas del backend (npm test).
export default {
  testEnvironment: 'node',
  transform: {},
  verbose: true,
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/silenciarConsola.js'],
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'app.js',
    'config/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    'routers/**/*.js',
    'schemas/**/*.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'text', 'html']
};
