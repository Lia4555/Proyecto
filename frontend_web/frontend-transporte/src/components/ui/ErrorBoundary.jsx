import { Component } from 'react'

// Si un componente falla, mostramos una pantalla clara en vez de una app en blanco.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error no controlado en la interfaz:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="crash">
        <div className="crash-card">
          <h1>Algo salió mal</h1>
          <p>
            La interfaz encontró un error inesperado. Puedes recargar la página para
            volver a intentarlo.
          </p>
          <pre className="crash-detail">{String(this.state.error?.message || this.state.error)}</pre>
          <button className="btn primary" onClick={() => window.location.reload()}>
            Recargar la página
          </button>
        </div>
      </div>
    )
  }
}
