import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { IconAlerta, IconCerrar, IconInfo, IconOk } from './Icons.jsx'

// Sistema de avisos flotantes (feedback inmediato de cada acción).
const ToastContext = createContext(null)

const ICONOS = {
  success: IconOk,
  error: IconAlerta,
  info: IconInfo
}

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const idRef = useRef(0)

  const quitar = useCallback((id) => {
    setAvisos((lista) => lista.filter((a) => a.id !== id))
  }, [])

  const mostrar = useCallback(
    (mensaje, tipo = 'info', duracion = 4500) => {
      const id = ++idRef.current
      setAvisos((lista) => [...lista, { id, mensaje, tipo }])
      if (duracion) window.setTimeout(() => quitar(id), duracion)
      return id
    },
    [quitar]
  )

  const api = useMemo(
    () => ({
      exito: (m) => mostrar(m, 'success'),
      error: (m) => mostrar(m, 'error', 7000),
      info: (m) => mostrar(m, 'info'),
      quitar
    }),
    [mostrar, quitar]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notificaciones">
        {avisos.map((a) => {
          const Icono = ICONOS[a.tipo] || IconInfo
          return (
            <div
              key={a.id}
              className={`toast toast-${a.tipo}`}
              role={a.tipo === 'error' ? 'alert' : 'status'}
              aria-live={a.tipo === 'error' ? 'assertive' : 'polite'}
            >
              <span className="toast-icon"><Icono /></span>
              <p className="toast-text">{a.mensaje}</p>
              <button
                type="button"
                className="iconbtn toast-close"
                onClick={() => quitar(a.id)}
                aria-label="Cerrar aviso"
              >
                <IconCerrar size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
