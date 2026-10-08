import { useState } from 'react'
import api, { getErrorMessage } from '../api/api.js'
import AuthLayout from './AuthLayout.jsx'
import { IconAlerta, IconOjo, IconOjoCerrado } from './ui/Icons.jsx'

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function Login({ onLogin, onVolver, onCrearCuenta, correoInicial = '' }) {
  const [correo, setCorreo] = useState(correoInicial)
  const [contrasena, setContrasena] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const validar = () => {
    const problemas = {}
    if (!correo.trim()) problemas.correo = 'Escribe tu correo.'
    else if (!RE_EMAIL.test(correo.trim())) problemas.correo = 'El correo no tiene un formato válido.'
    if (!contrasena) problemas.contrasena = 'Escribe tu contraseña.'
    return problemas
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const problemas = validar()
    setErrores(problemas)
    if (Object.keys(problemas).length > 0) return

    setCargando(true)
    try {
      // El backend responde { message, user } y deja el token en una cookie
      // httpOnly: aquí no se recibe ni se guarda ningún token.
      const { data } = await api.post('/auth/login', {
        correo: correo.trim(),
        contrasena
      })
      onLogin(data.user)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCargando(false)
    }
  }

  return (
    <AuthLayout
      onVolver={onVolver}
      titulo="Iniciar sesión"
      subtitulo="Entra con la cuenta de trabajo que te entregó la empresa."
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className={`field ${errores.correo ? 'has-error' : ''}`}>
          <label className="field-label" htmlFor="login-correo">Correo</label>
          <input
            id="login-correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tucorreo@empresa.com"
            autoComplete="email"
            autoFocus={!correoInicial}
            aria-invalid={!!errores.correo}
            aria-describedby={errores.correo ? 'login-correo-error' : undefined}
          />
          {errores.correo && (
            <p className="field-error" id="login-correo-error">{errores.correo}</p>
          )}
        </div>

        <div className={`field ${errores.contrasena ? 'has-error' : ''}`}>
          <label className="field-label" htmlFor="login-clave">Contraseña</label>
          <div className="input-con-boton">
            <input
              id="login-clave"
              type={verClave ? 'text' : 'password'}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus={!!correoInicial}
              aria-invalid={!!errores.contrasena}
              aria-describedby={errores.contrasena ? 'login-clave-error' : undefined}
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
          {errores.contrasena && (
            <p className="field-error" id="login-clave-error">{errores.contrasena}</p>
          )}
        </div>

        {error && (
          <div className="alert error" role="alert">
            <IconAlerta size={18} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn primary block" disabled={cargando}>
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>

        {/* Ya no hay recuperación con correo y teléfono (se retiró por
            seguridad): la contraseña la restablece un administrador. */}
        <p className="login-recuperar">
          ¿Olvidaste tu contraseña? Pide a un administrador que la restablezca.
        </p>
      </form>

      {/* El registro crea una cuenta de conductor apagada: no entra hasta que
          un administrador la apruebe. */}
      {onCrearCuenta && (
        <p className="auth-foot">
          ¿No tienes cuenta?{' '}
          <button type="button" className="linkbtn" onClick={onCrearCuenta}>
            Crear una cuenta
          </button>
        </p>
      )}
    </AuthLayout>
  )
}
