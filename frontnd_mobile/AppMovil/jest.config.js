// Configuración de Jest para las pruebas de la app móvil (npm test).
//
// Se prueba la capa Domain (entidades y casos de uso): es TypeScript puro,
// sin React Native, así que corre en Node sin emulador.
//
// Babel se configura AQUÍ y no en un babel.config.js: ese archivo lo leería
// también Expo/Metro al compilar la app y cambiaría cómo se construye.
// La comprobación de tipos la hace `npm run tipos` (tsc).
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'babel-jest',
      {
        configFile: false,
        babelrc: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript'
        ]
      }
    ]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverageFrom: ['src/Domain/**/*.ts', '!src/Domain/**/index.ts', '!src/Domain/repositories/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'text', 'html']
};
