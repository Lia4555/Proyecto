import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { SESSION_EXPIRED_EVENT } from './api/api.js'
import { olvidarFoto } from './lib/fotoPerfil.js'
import {
  esAdmin,
  guardarUsuario,
  leerUsuario,
  limpiarUsuario,
  nombreVisible
} from './lib/session.js'
import { useNavegacion } from './hooks/useNavegacion.js'
import Landing from './components/Landing.jsx'
import Login from './components/Login.jsx'
import Registro from './components/Registro.jsx'
import Dashboard, { SECCIONES_ADMIN } from './components/Dashboard.jsx'
import PanelConductor, { SECCIONES_CONDUCTOR } from './components/conductor/PanelConductor.jsx'
import { useToast } from './components/ui/Toast.jsx'
import './navegacion.css'

// Las dos pantallas públicas. INICIO es la página principal y, además, el
// suelo del historial: la flecha «atrás» del navegador siempre acaba aquí
// en vez de sacarte de la aplicación.
export const INICIO = 'inicio'
export const ENTRAR = 'entrar'
export const REGISTRO = 'registro'

export default function App() {
  // undefined = todavía preguntando al servidor · null = sin sesión
  const [usuario, setUsuario] = useState(undefined)
  const toast = useToast()

  // El token está en una cookie httpOnly que el navegador no deja leer, así que
  // la única forma de saber si hay sesión es preguntárselo al backend.
  useEffect(() => {
    let vigente = true

    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!vigente) return
        setUsuario(guardarUsuario(data.user))
      })
      .catch(() => {
        if (!vigente) return
        limpiarUsuario()
        setUsuario(null)
      })

    return () => {
      vigente = false
    }
  }, [])

  // El backend avisó que la sesión ya no sirve.
  useEffect(() => {
    const alExpirar = (e) => {
      limpiarUsuario()
      olvidarFoto()
      setUsuario(null)
      toast.error(e.detail?.message || 'Tu sesión expiró. Inicia sesión de nuevo.')
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, alExpirar)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, alExpirar)
  }, [toast])

  // Mientras se comprueba la sesión no se monta la navegación: así el
  // historial se ancla ya sabiendo qué pantallas existen para este usuario.
  if (usuario === undefined) {
    const conocido = leerUsuario()
    return (
      <div className="arranque" role="status" aria-live="polite">
        <span className="brand-mark grande">DV</span>
        <p className="arranque-texto">
          {conocido ? `Recuperando tu sesión, ${nombreVisible(conocido)}…` : 'Comprobando tu sesión…'}
        </p>
        <span className="arranque-barra" aria-hidden="true" />
      </div>
    )
  }

  return <Rutas usuario={usuario} onUsuario={setUsuario} toast={toast} />
}

/**
 * Enruta TODA la aplicación con un único historial: portada, inicio de sesión
 * y las secciones del panel comparten la misma pila. Por eso las flechas del
 * navegador te mueven dentro de la aplicación en vez de sacarte de ella.
 */
function Rutas({ usuario, onUsuario, toast }) {
  const secciones = usuario
    ? esAdmin(usuario)
      ? SECCIONES_ADMIN
      : SECCIONES_CONDUCTOR.map((s) => s.key)
    : []

  // Sin sesión: portada, login y registro. Con sesión: portada y las secciones del panel.
  const rutas = useMemo(
    () => (usuario ? [INICIO, ...secciones] : [INICIO, ENTRAR, REGISTRO]),
    // `secciones` se deriva de `usuario`: basta con vigilar la lista ya montada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usuario, secciones.join('|')]
  )

  // Al entrar se cae en la primera sección del panel; al salir, en la portada.
  const rutaInicial = usuario ? secciones[0] : INICIO

  const nav = useNavegacion(rutas, rutaInicial, INICIO)
  const { ruta, ir } = nav

  const iniciarSesion = (user) => {
    onUsuario(guardarUsuario(user))
    toast.exito(`Bienvenido, ${nombreVisible(user)}.`)
    // No hace falta navegar: «entrar» deja de ser una ruta válida y el propio
    // historial la sustituye por la primera sección del panel. Al sustituirla
    // (y no apilarla) la flecha «atrás» lleva a la portada, no de vuelta al login.
  }

  const cerrarSesion = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Si el servidor no responde igualmente salimos: la cookie caduca sola.
    }
    limpiarUsuario()
    olvidarFoto()
    onUsuario(null)
    toast.info('Cerraste sesión.')
  }, [onUsuario, toast])

  // ---- Página principal --------------------------------------------------
  if (ruta === INICIO) {
    // Con la sesión abierta, el botón de la portada devuelve al panel;
    // sin ella, lleva al inicio de sesión.
    return <Landing onIngresar={() => ir(usuario ? rutaInicial : ENTRAR)} />
  }

  // ---- Registro (la cuenta queda pendiente de aprobación) ----------------
  if (!usuario && ruta === REGISTRO) {
    return <Registro onIrALogin={() => ir(ENTRAR)} onVolver={() => ir(INICIO)} />
  }

  // ---- Inicio de sesión --------------------------------------------------
  if (!usuario) {
    return (
      <Login
        onLogin={iniciarSesion}
        onVolver={() => ir(INICIO)}
        onCrearCuenta={() => ir(REGISTRO)}
      />
    )
  }

  // ---- Paneles -----------------------------------------------------------
  return esAdmin(usuario) ? (
    <Dashboard usuario={usuario} nav={nav} onLogout={cerrarSesion} />
  ) : (
    <PanelConductor usuario={usuario} nav={nav} onLogout={cerrarSesion} />
  )
}
