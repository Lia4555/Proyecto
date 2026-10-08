import { useState } from 'react'
import api, { getErrorMessage, getFieldErrors } from '../../api/api.js'
import { useDialog } from '../../hooks/useDialog.js'
import { CLAVE_MAX, errorContrasena, fortaleza } from '../../lib/validaciones.js'
import { useToast } from '../ui/Toast.jsx'
import { IconAlerta, IconCerrar, IconOjo, IconOjoCerrado } from '../ui/Icons.jsx'

// ============================================================
// CONTRASEÑAS
// ------------------------------------------------------------
//   CambiarContrasenaDialog     -> cualquier usuario, sobre su
//                                  propia cuenta (PUT /perfil/contrasena)
//   RestablecerContrasenaDialog -> el administrador pone una clave
//                                  temporal (PATCH /cuentas/:id/contrasena)
// Ya no existe "recuperar con correo y teléfono": quien la olvide
// pide a un administrador que la restablezca.
// ============================================================

// Validación local de los dos diálogos: { actual?, nueva, confirmar }.
export function validarCambioClave(valores, { pedirActual = false } = {}) {
  const e = {}
  if (pedirActual && !valores.actual) e.actual = 'Escribe tu contraseña actual.'
  const errorNueva = errorContrasena(valores.nueva)
  if (errorNueva) e.nueva = valores.nueva ? errorNueva : 'Escribe la nueva contraseña.'
  else if (pedirActual && valores.nueva === valores.actual) {
    e.nueva = 'Debe ser distinta de la actual.'
  }
  if (!valores.confirmar) e.confirmar = 'Repite la nueva contraseña.'
  else if (valores.confirmar !== valores.nueva) e.confirmar = 'Las contraseñas no coinciden.'
  return e
}

// Errores del servidor por campo. Un detalle sin campo ('') se refiere a la
// contraseña nueva: se pinta bajo esa casilla en vez de perderse.
function erroresDelServidor(err, campoNueva) {
  const porCampo = getFieldErrors(err)
  const sinCampo = err?.response?.data?.detalles?.find?.((d) => d && !d.campo)
  if (sinCampo && !porCampo.nueva) porCampo.nueva = sinCampo.mensaje
  if (campoNueva !== 'nueva' && porCampo[campoNueva]) {
    porCampo.nueva = porCampo[campoNueva]
    delete porCampo[campoNueva]
  }
  return porCampo
}

function CampoClave({ id, nombre, etiqueta, valor, error, ayuda, ver, onVer, onChange, autoComplete, medidor }) {
  const idCampo = `${id}-${nombre}`
  const f = medidor ? fortaleza(valor) : null
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label className="field-label" htmlFor={idCampo}>{etiqueta}</label>
      <div className="input-con-boton">
        <input
          id={idCampo}
          name={nombre}
          type={ver ? 'text' : 'password'}
          value={valor}
          onChange={(e) => onChange(nombre, e.target.value)}
          autoComplete={autoComplete}
          maxLength={CLAVE_MAX}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
        />
        {onVer && (
          <button
            type="button"
            className="iconbtn"
            onClick={onVer}
            aria-label={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
            title={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
          >
            {ver ? <IconOjoCerrado size={17} /> : <IconOjo size={17} />}
          </button>
        )}
      </div>
      {f && !error && (
        <div className={`fortaleza ${f.nivel}`} aria-live="polite">
          <span className="fortaleza-barra" aria-hidden="true"><span /></span>
          <span className="fortaleza-texto">{f.texto}</span>
        </div>
      )}
      {error ? (
        <p className="field-error" id={`${idCampo}-error`}>{error}</p>
      ) : ayuda ? (
        <p className="field-hint" id={`${idCampo}-ayuda`}>{ayuda}</p>
      ) : null}
    </div>
  )
}

// Marco común: título, formulario, error general y botones.
function DialogoClave({ id, titulo, descripcion, pedirActual, textoBoton, enviar, onClose, ayudaNueva }) {
  const [valores, setValores] = useState({ actual: '', nueva: '', confirmar: '' })
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [ver, setVer] = useState(false)
  const [enviando, setEnviando] = useState(false)
  // Escape no cierra mientras se guarda.
  const ref = useDialog(() => !enviando && onClose())

  const fijar = (campo, valor) => {
    setValores((v) => ({ ...v, [campo]: valor }))
    setErrores((e) => {
      if (!e[campo]) return e
      const copia = { ...e }
      delete copia[campo]
      return copia
    })
  }

  const alEnviar = async (e) => {
    e.preventDefault()
    setError('')
    const problemas = validarCambioClave(valores, { pedirActual })
    setErrores(problemas)
    if (Object.keys(problemas).length) {
      const primero = ['actual', 'nueva', 'confirmar'].find((c) => problemas[c])
      document.getElementById(`${id}-${primero}`)?.focus()
      return
    }

    setEnviando(true)
    try {
      await enviar(valores)
    } catch (err) {
      const porCampo = err.erroresPorCampo || {}
      setErrores(porCampo)
      // Con errores de campo basta señalarlos; si no (429, 403, red…), el texto del servidor.
      setError(
        Object.keys(porCampo).length ? 'Revisa los campos marcados en rojo.' : getErrorMessage(err)
      )
      const primero = ['actual', 'nueva', 'confirmar'].find((c) => porCampo[c])
      if (primero) document.getElementById(`${id}-${primero}`)?.focus()
      setEnviando(false)
    }
  }

  const comunes = { id, ver, onChange: fijar }

  return (
    <div className="modal-backdrop" onMouseDown={enviando ? undefined : onClose}>
      <div
        className="modal clave-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-titulo`}
        aria-describedby={`${id}-desc`}
        ref={ref}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="clave-cabecera">
          <h2 className="modal-title" id={`${id}-titulo`}>{titulo}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Cerrar" disabled={enviando}>
            <IconCerrar size={18} />
          </button>
        </header>
        <p className="modal-text" id={`${id}-desc`}>{descripcion}</p>

        <form className="auth-form clave-form" onSubmit={alEnviar} noValidate>
          {pedirActual && (
            <CampoClave
              {...comunes}
              nombre="actual"
              etiqueta="Contraseña actual"
              valor={valores.actual}
              error={errores.actual}
              autoComplete="current-password"
              onVer={() => setVer((v) => !v)}
            />
          )}
          <CampoClave
            {...comunes}
            nombre="nueva"
            etiqueta={pedirActual ? 'Nueva contraseña' : 'Contraseña temporal'}
            valor={valores.nueva}
            error={errores.nueva}
            ayuda={ayudaNueva}
            autoComplete="new-password"
            onVer={pedirActual ? undefined : () => setVer((v) => !v)}
            medidor
          />
          <CampoClave
            {...comunes}
            nombre="confirmar"
            etiqueta={pedirActual ? 'Repite la nueva contraseña' : 'Repite la contraseña temporal'}
            valor={valores.confirmar}
            error={errores.confirmar}
            autoComplete="new-password"
          />

          {error && (
            <div className="alert error" role="alert">
              <IconAlerta size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={enviando}>
              {enviando ? 'Guardando…' : textoBoton}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Cualquier usuario cambia la suya. La sesión actual sigue abierta.
export function CambiarContrasenaDialog({ onClose }) {
  const toast = useToast()

  const enviar = async ({ actual, nueva }) => {
    try {
      const { data } = await api.put('/perfil/contrasena', { actual, nueva })
      toast.exito(data?.message || 'Tu contraseña se cambió.')
      onClose()
    } catch (err) {
      err.erroresPorCampo = erroresDelServidor(err, 'nueva')
      throw err
    }
  }

  return (
    <DialogoClave
      id="mi-clave"
      titulo="Cambiar mi contraseña"
      descripcion="Escribe la que usas ahora y elige una nueva. Tu sesión seguirá abierta."
      pedirActual
      textoBoton="Cambiar contraseña"
      ayudaNueva="Entre 8 y 72 caracteres."
      enviar={enviar}
      onClose={onClose}
    />
  )
}

// El administrador pone una contraseña temporal a otra cuenta. El servidor
// cierra las sesiones abiertas de esa cuenta.
export function RestablecerContrasenaDialog({ cuenta, nombre, onClose }) {
  const toast = useToast()

  const enviar = async ({ nueva }) => {
    try {
      const { data } = await api.patch(`/cuentas/${cuenta.id_usuario}/contrasena`, { contrasena: nueva })
      toast.exito(data?.message || 'Contraseña restablecida.')
      onClose()
    } catch (err) {
      err.erroresPorCampo = erroresDelServidor(err, 'contrasena')
      throw err
    }
  }

  return (
    <DialogoClave
      id="restablecer-clave"
      titulo="Restablecer contraseña"
      descripcion={`Escribe una contraseña temporal para ${nombre} (${cuenta.correo}). Se cerrarán sus sesiones abiertas.`}
      textoBoton="Restablecer"
      ayudaNueva="Entre 8 y 72 caracteres. Entrégasela por un canal seguro y pídele que la cambie al entrar."
      enviar={enviar}
      onClose={onClose}
    />
  )
}
