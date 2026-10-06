import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración usada solo por "npm test": empaqueta la suite de pruebas
// para poder ejecutarla con Node (sin instalar Jest, Vitest ni un navegador).
export default defineConfig({
  plugins: [react()],
  // las pruebas no necesitan copiar public/ (imágenes) al empaquetado
  publicDir: false,
  build: {
    ssr: 'tests/pruebas.jsx',
    outDir: '.test-build',
    minify: false,
    emptyOutDir: true
  }
})
