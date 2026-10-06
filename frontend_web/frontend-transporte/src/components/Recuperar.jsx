import { useState } from 'react'
import api, { getErrorMessage, getFieldErrors } from '../api/api.js'
import { errorTelefono, limpiarTelefono } from '../lib/validaciones.js'
import AuthLayout from './AuthLayout.jsx'
import { IconAlerta, IconOjo, IconOjoCerrado, IconOk } from './ui/Icons.jsx'

// ============================================================
// RECUPERAR CONTRASEÑA
// ------------------------------------------------------------
// Sin correos ni enlaces: quien conoce el correo Y el teléfono
// con el que se registró la cuenta puede poner una contraseña
// nueva. El servidor limita los intentos y responde lo mismo
// exista o no la cuenta (no revela qué correos están registrados).
// ============================================================

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Pistas de fortaleza: se muestran mientras se escribe, sin bloquear.
function fortaleza(clave) {
  if (!clave) return null
  let puntos = 0
  if (clave.length >= 8) puntos++
  if (clave.length >= 12) puntos++
  if (/[a-z]/.test(clave) && /[A-Z]/.test(clave)) puntos++
  if (/\d/.test(clave)) puntos++
  if (/[^A-Za-z0-9]/.test(clave)) puntos++
  if (clave.length < 8) return { nivel: 'debil', texto: 'Muy corta: mínimo 8 caracteres' }
  if (puntos <= 2) return { nivel: 'debil', texto: 'Débil: combina mayúsculas, números o símbolos' }
  if (puntos === 3) return { nivel: 'media', texto: 'Aceptable' }
  return { nivel: 'fuerte', texto: 'Fuerte' }
}

export default function Recuperar({ onIrALogin, onVolver }) {
  const [valores, setValores] = useState({ correo: '', telefono: '', contrasena: '', confirmar: '' })
  const [verClave, setVerClave] = useState(false)
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)

  const fijar = (campo, valor) => {
    setValores((v) => ({ ...v, [campo]: valor }))
    setErrores((e) => {
      if (!e[campo]) return e
      const copia = { ...e }
      delete copia[campo]
      return copia
    })
  }

  const validar = () => {
    const p = {}
    if (!valores.correo.trim()) p.correo = 'Escribe el correo de tu cuenta.'
    else if (!RE_EMAIL.test(valores.correo.trim())) p.correo = 'El correo no tiene un formato válido.'

    if (!valores.telefono.trim()) p.telefono = 'Escribe el teléfono con el que te registraste.'
    else {
      const e = errorTelefono(valores.telefono)
      if (e) p.telefono = e
    }

    if (!valores.contrasena) p.contrasena = 'Escribe la nueva contraseña.'
    else if (valores.contrasena.length < 8) p.contrasena = 'Debe tener al menos 8 caracteres.'
    else if (valores.contrasena.length > 72) p.contrasena = 'Admite como máximo 72 caracteres.'

    if (!valores.confirmar) p.confirmar = 'Repite la nueva contraseña.'
    else if (valores.confirmar !== valores.contrasena) p.confirmar = 'Las contraseñas no coinciden.'
    return p
  }

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    const problemas = validar()
    setErrores(problemas)
    if (Object.keys(problemas).length) {
      // El foco va al primer campo con error: imprescindible con lector de pantalla.
      const primero = ['correo', 'telefono', 'contrasena', 'confirmar'].find((c) => problemas[c])
      document.getElementById(`rec-${primero}`)?.focus()
      return
    }

    setEnviando(true)
    try {
      await api.post('/auth/recuperar', {
        correo: valores.correo.trim(),
        telefono: valores.telefono.trim(),
        contrasena: valores.contrasena
      })
      setListo(true)
    } catch (err) {
      setErrores(getFieldErrors(err))
      setError(getErrorMessage(err))
    } finally {
      setEnviando(false)
    }
  }

  // ---- Hecho -----------------------------------------------------------
  if (listo) {
    return (
      <AuthLayout onVolver={onVolver} titulo="Contraseña actualizada" subtitulo="Ya puedes entrar con tu nueva contraseña.">
        <div className="alert success" role="status">
          <IconOk size={18} />
          <span>Tu contraseña se cambió correctamente.</span>
        </div>
        <button type="button" className="btn primary block" onClick={() => onIrALogin(valores.correo.trim())} autoFocus>
          Iniciar sesión
        </button>
      </AuthLayout>
    )
  }

  const f = fortaleza(valores.contrasena)
  const campo = (nombre) => ({
    id: `rec-${nombre}`,
    'aria-invalid': !!errores[nombre] || undefined,
    'aria-describedby': errores[nombre] ? `rec-${nombre}-error` : `rec-${nombre}-ayuda`
  })
  const mensaje = (nombre, ayuda) =>
    errores[nombre] ? (
      <p className="field-error" id={`rec-${nombre}-error`}>{errores[nombre]}</p>
    ) : ayuda ? (
      <p className="field-hint" id={`rec-${nombre}-ayuda`}>{ayuda}</p>
    ) : null

  return (
    <AuthLayout
      onVolver={onVolver}
      titulo="Recuperar contraseña"
      subtitulo="Confirma tu correo y el teléfono con el que te registraste, y elige una contraseña nueva."
    >
      <form onSubmit={enviar} className="auth-form" noValidate>
        <div className={`field ${errores.correo ? 'has-error' : ''}`}>
          <label className="field-label" htmlFor="rec-correo">Correo de la cuenta</label>
          <input
            {...campo('correo')}
            type="email"
            value={valores.correo}
            onChange={(e) => fijar('correo', e.target.value)}
            placeholder="tucorreo@empresa.com"
            autoComplete="email"
            autoFocus
          />
          {mensaje('correo')}
        </div>

        <div className={`field ${errores.telefono ? 'has-error' : ''}`}>
          <label className="field-label" htmlFor="rec-telefono">Teléfono registrado</label>
          <input
            {...campo('telefono')}
            type="tel"
            inputMode="tel"
            value={valores.telefono}
            onChange={(e) => fijar('telefono', limpiarTelefono(e.target.value))}
            placeholder="300 123 4567"
            autoComplete="tel"
          />
          {mensaje('telefono', 'El mismo que diste al crear la cuenta. Da igual si pones el +57 o no.')}
        </div>

        <div className={`field ${errores.contrasena ? 'has-error' : ''}`}>
          <label className="field-label" htmlFor="rec-contrasena">Nueva contraseña</label>
          <div className="input-con-boton">
            <input
              {...campo('contrasena')}
              type={verClave ? 'text' : 'password'}
              value={valores.contrasena}
              onChange={(e) => fijar('contrasena', e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              maxLength={72}
            />
            <button
              type="button"
              className="iconbtn"
              onClick={() => setVerClave((v) => !v)}
              aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {verClave ? <IconOjoCerrado size={17} /> : <IconOjo size={17} />}
            </button>
          </div>
          {f && !errores.contrasena && (
            <div className={`fortaleza ${f.nivel}`} aria-live="polite">
              <span className="fortaleza-barra" aria-hidden="true"><span /></span>
              <span className="fortaleza-texto">{f.texto}</span>
            </div>
          )}
          {mensaje('contrasena')}
        </div>

        <div className={`field ${errores.confirmar ? 'has-error' : ''}`}>
          <label className="field-label" htmlFor="rec-confirmar">Repite la nueva contraseña</label>
          <input
            {...campo('confirmar')}
            type={verClave ? 'text' : 'password'}
            value={valores.confirmar}
            onChange={(e) => fijar('confirmar', e.target.value)}
            autoComplete="new-password"
            maxLength={72}
          />
          {mensaje('confirmar')}
        </div>

        {error && (
          <div className="alert error" role="alert">
            <IconAlerta size={18} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn primary block" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </form>

      <p className="auth-foot">
        ¿La recordaste?{' '}
        <button type="button" className="linkbtn" onClick={() => onIrALogin(valores.correo.trim())}>
          Volver a iniciar sesión
        </button>
      </p>
    </AuthLayout>
  )
}
