import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración mínima de Vite con soporte para React
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    // El backend solo acepta este origen (FRONTEND_URL). Si el puerto está
    // ocupado, mejor fallar con un aviso que abrir en otro y que el login
    // diga "No se pudo conectar con el servidor".
    strictPort: true,
    // Abre el navegador al arrancar, salvo cuando lo reinicia iniciar.bat
    // tras una caída: así no se abre una pestaña nueva en cada reinicio.
    // Tampoco en modo e2e (npm run cy:run:system): ahí el navegador es el de Cypress.
    open: mode !== 'e2e' && !process.env.DVIAJE_SIN_ABRIR
  }
}))
