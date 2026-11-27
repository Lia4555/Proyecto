import { ADMIN } from '../../support/commands.js'

// Cliente que se usa para crear y eliminar desde la interfaz.
const NUEVO_CLIENTE = {
  nombre: 'Ana',
  apellido: 'Ruiz',
  tipo_documento: 'CC',
  numero_documento: '1020304050',
  email: 'ana.ruiz@correo.com',
  telefono: '300 123 4567'
}

// Simula la tabla de clientes: GET devuelve lo que haya en `clientes` en ese momento.
const simularClientes = (clientes) => {
  cy.intercept({ method: 'GET', pathname: '/api/clientes' }, (req) => req.reply(clientes)).as('listarClientes')
}

describe('Nivel 4: Pruebas de Sistema (E2E) - Flujos Completos', () => {
  it('ST-01: Debe permitir el login y redirigir al panel de administración', () => {
    cy.simularBackend()
    cy.intercept({ method: 'POST', pathname: '/api/auth/login' }, { message: 'ok', user: ADMIN }).as('login')

    cy.visit('/')
    cy.contains('.lp-nav-acciones button', 'Ingresar al panel').click()

    cy.get('#login-correo').type('admin@dviaje.com')
    cy.get('#login-clave').type('claveSegura1')
    cy.contains('button', 'Entrar').click()

    cy.wait('@login').its('request.body').should('deep.equal', {
      correo: 'admin@dviaje.com',
      contrasena: 'claveSegura1'
    })
    cy.contains('Bienvenido, Diego Rojas.').should('be.visible')
    cy.contains('Panel de administración').should('be.visible')
    cy.contains('h1', 'Centro de control').should('be.visible')
    cy.location('hash').should('eq', '#/centro-control')
  })

  it('ST-02: Debe redirigir a la portada si se intenta acceder al panel sin estar autenticado', () => {
    cy.simularBackend()
    cy.visit('/#/clientes')
    cy.wait('@sesion')

    cy.location('hash').should('eq', '#/inicio')
    cy.contains('Panel de administración').should('not.exist')

    cy.contains('.lp-nav-acciones button', 'Ingresar al panel').click()
    cy.contains('h1, h2', 'Iniciar sesión').should('be.visible')
  })

  it('ST-03: Debe crear un cliente desde la interfaz gráfica', () => {
    const clientes = []
    cy.entrarComoAdmin('clientes')
    simularClientes(clientes)
    cy.intercept({ method: 'POST', pathname: '/api/clientes' }, (req) => {
      clientes.push({ id_cliente: 1, ...req.body })
      req.reply({ statusCode: 201, body: clientes[0] })
    }).as('crearCliente')

    cy.contains('h1', 'Clientes').should('be.visible')
    cy.contains('Aún no hay registros').should('be.visible')
    cy.contains('.panel-actions button', 'Nuevo registro').click()

    cy.get('[role="dialog"]').within(() => {
      cy.get('[name="nombre"]').type(NUEVO_CLIENTE.nombre)
      cy.get('[name="apellido"]').type(NUEVO_CLIENTE.apellido)
      cy.get('[name="tipo_documento"]').select(NUEVO_CLIENTE.tipo_documento)
      cy.get('[name="numero_documento"]').type(NUEVO_CLIENTE.numero_documento)
      cy.get('[name="email"]').type(NUEVO_CLIENTE.email)
      cy.get('[name="telefono"]').type(NUEVO_CLIENTE.telefono)
      cy.contains('button', 'Crear registro').click()
    })

    cy.wait('@crearCliente').its('request.body').should('include', {
      nombre: 'Ana',
      apellido: 'Ruiz',
      email: 'ana.ruiz@correo.com'
    })
    cy.contains('Se creó el registro en Clientes.').should('be.visible')
    cy.get('[role="dialog"]').should('not.exist')
    cy.contains('table td', 'ana.ruiz@correo.com').should('be.visible')
  })

  it('ST-04: Debe eliminar un cliente desde la interfaz gráfica', () => {
    const clientes = [{ id_cliente: 7, ...NUEVO_CLIENTE }]
    cy.entrarComoAdmin('clientes')
    simularClientes(clientes)
    cy.intercept({ method: 'DELETE', pathname: '/api/clientes/7' }, (req) => {
      clientes.length = 0
      req.reply({ message: 'Registro eliminado' })
    }).as('eliminarCliente')

    cy.contains('table td', 'ana.ruiz@correo.com').should('be.visible')
    cy.get('[aria-label="Eliminar Ana"]').click()

    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('Se eliminará «Ana» de Clientes.').should('be.visible')
      cy.contains('button', 'Sí, eliminar').click()
    })

    cy.wait('@eliminarCliente')
    cy.contains('Registro eliminado correctamente.').should('be.visible')
    cy.contains('table td', 'ana.ruiz@correo.com').should('not.exist')
    cy.contains('Aún no hay registros').should('be.visible')
  })

  it('ST-05: Debe mostrar un error si se intenta iniciar sesión con campos vacíos', () => {
    cy.simularBackend()
    cy.intercept({ method: 'POST', pathname: '/api/auth/login' }, cy.spy().as('login'))

    cy.visit('/#/entrar')
    cy.contains('button', 'Entrar').click()

    cy.contains('Escribe tu correo.').should('be.visible')
    cy.contains('Escribe tu contraseña.').should('be.visible')
    cy.get('@login').should('not.have.been.called')
  })

  it('ST-06: Debe mostrar el error del servidor si las credenciales son incorrectas', () => {
    cy.simularBackend()
    cy.intercept(
      { method: 'POST', pathname: '/api/auth/login' },
      { statusCode: 401, body: { error: 'Correo o contraseña incorrectos.' } }
    ).as('login')

    cy.visit('/#/entrar')
    cy.get('#login-correo').type('admin@dviaje.com')
    cy.get('#login-clave').type('equivocada')
    cy.contains('button', 'Entrar').click()

    cy.wait('@login')
    cy.get('.auth-form [role="alert"]').should('contain', 'Correo o contraseña incorrectos.')
    cy.contains('Panel de administración').should('not.exist')
  })

  it('ST-07: Debe cerrar sesión y volver a la portada', () => {
    cy.entrarComoAdmin()
    cy.contains('button', 'Salir').click()

    cy.wait('@logout')
    cy.contains('Cerraste sesión.').should('be.visible')
    cy.location('hash').should('eq', '#/inicio')
    cy.contains('button', 'Ingresar al panel').should('exist')
  })
})
