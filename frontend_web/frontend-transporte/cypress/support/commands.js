// ============================================================
// Comandos propios para las pruebas de sistema.
// El backend se simula con cy.intercept: las pruebas no dependen
// de que Express ni Supabase estén encendidos, y siempre parten
// de los mismos datos.
// ============================================================

export const ADMIN = {
  id_usuario: 'u-admin',
  correo: 'admin@dviaje.com',
  nombre: 'Diego Rojas',
  rol: 'Administrador',
  nivel_permiso: 3
}

// Solo las peticiones al backend (/api/...), no los módulos de Vite como /src/api/api.js.
const API = /^\/api\//

// Respuestas por defecto para todo /api/*. Cada prueba puede definir
// después las suyas: en Cypress gana la última intercepción declarada.
Cypress.Commands.add('simularBackend', ({ sesion = null } = {}) => {
  cy.intercept({ pathname: API }, { statusCode: 200, body: [] })
  cy.intercept({ method: 'GET', pathname: '/api/automatizacion/resumen' }, {
    conteos: {},
    vencimientos: [],
    automatizacion: null
  })
  cy.intercept({ method: 'GET', pathname: '/api/perfil/foto' }, { foto: null })
  cy.intercept({ method: 'POST', pathname: '/api/auth/logout' }, { message: 'Sesión cerrada' }).as('logout')

  cy.intercept(
    { method: 'GET', pathname: '/api/auth/me' },
    sesion ? { user: sesion } : { statusCode: 401, body: { error: 'No autenticado' } }
  ).as('sesion')
})

// Abre la app con la sesión de administrador ya iniciada.
Cypress.Commands.add('entrarComoAdmin', (ruta = 'centro-control') => {
  cy.simularBackend({ sesion: ADMIN })
  cy.visit(`/#/${ruta}`)
  cy.wait('@sesion')
})
