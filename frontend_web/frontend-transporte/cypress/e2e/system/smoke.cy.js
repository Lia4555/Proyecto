describe('Configuración de Cypress', () => {
  it('Cypress está funcionando correctamente', () => {
    cy.simularBackend()
    cy.visit('/')
    cy.contains('button', 'Ingresar al panel').should('exist')
  })
})
