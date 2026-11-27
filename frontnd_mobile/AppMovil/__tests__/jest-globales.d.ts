// TypeScript 6 ya no carga solo los paquetes @types/*: esta linea le
// indica que en las pruebas existen describe, test, expect y jest.
// Asi `npm run tipos` tambien comprueba los archivos de prueba.
/// <reference types="jest" />
