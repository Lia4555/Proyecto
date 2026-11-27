import { render, screen } from '@testing-library/react'

// Pruebas de humo: confirman que Jest y React Testing Library están bien configurados.
describe('Configuración de Jest en Frontend', () => {
  test('Jest funciona con JSX', () => {
    const elemento = <span>D&apos; VIAJE</span>
    expect(elemento.props.children).toBe("D' VIAJE")
  })

  test('React Testing Library renderiza componentes', () => {
    render(<h1>Panel de transporte</h1>)
    expect(screen.getByRole('heading', { name: 'Panel de transporte' })).toBeInTheDocument()
  })
})
