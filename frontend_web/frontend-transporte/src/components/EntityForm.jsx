import { useMemo, useRef, useState } from 'react'
import api, { getErrorMessage, getFieldErrors } from '../api/api.js'
import { ayudaDe, buildInitialValues, buildPayload, esAutomatico, hayCambios, validateValues } from '../lib/form.js'
import {
  TIPOS_DOC_ALFANUMERICOS,
  esEnmascarado,
  limpiarDocumento,
  limpiarSegunFormato,
  quitarMascara
} from '../lib/validaciones.js'
import { useDialog } from '../hooks/useDialog.js'
import ConfirmDialog from './ui/ConfirmDialog.jsx'
import { IconAlerta, IconCerrar } from './ui/Icons.jsx'

// Los campos largos ocupan todo el ancho del panel; los cortos van en 2 columnas.
const ANCHO_COMPLETO = ['textarea']

function tipoDeInput(tipo) {
  switch (tipo) {
    case 'datetime':
      return 'datetime-local'
    // Los números van en un campo de texto con teclado numérico: el
    // <input type="number"> deja escribir "e", "+" y "-".
    case 'number':
      return 'text'
    case 'date':
      return 'date'
    case 'email':
      return 'email'
    default:
      return 'text'
  }
}

// Formato con el que se filtra lo que se escribe. Los números no necesitan
// declararlo en entities.js: se deduce del tipo.
function formatoDe(f) {
  if (f.format) return f.format
  if (f.type === 'number') return f.integer ? 'entero' : 'decimal'
  return undefined
}

// Teclado que abre el móvil para cada campo.
function tecladoDe(f, valores) {
  const formato = formatoDe(f)
  if (formato === 'entero') return 'numeric'
  if (formato === 'decimal') return 'decimal'
  if (formato === 'telefono') return 'tel'
  if (formato === 'documento') {
    return TIPOS_DOC_ALFANUMERICOS.includes(valores.tipo_documento) ? 'text' : 'numeric'
  }
  return undefined
}

/**
 * Panel lateral que sirve para CREAR, EDITAR y VER el detalle de cualquier tabla.
 * @param entity      configuración de la tabla (entities.js)
 * @param row         fila a editar / ver (null si es creación)
 * @param soloLectura muestra el detalle sin permitir cambios
 * @param onSaved     recibe el mensaje de éxito para el aviso
 * @param filas       filas ya cargadas: sirven para avisar de valores repetidos
 */
export default function EntityForm({
  entity,
  row,
  soloLectura = false,
  referencias = {},
  cargandoRefs = false,
  filas = [],
  onClose,
  onSaved
}) {
  const esEdicion = !!row
  const valoresIniciales = useMemo(
    () => buildInitialValues(entity.fields, row),
    [entity, row]
  )

  const [values, setValues] = useState(valoresIniciales)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmarCierre, setConfirmarCierre] = useState(false)
  const formRef = useRef(null)

  const intentarCerrar = () => {
    if (guardando) return
    if (!soloLectura && hayCambios(valoresIniciales, values)) {
      setConfirmarCierre(true)
      return
    }
    onClose()
  }

  const ref = useDialog(intentarCerrar)

  // Al crear no se muestran los campos que solo tienen sentido después
  // (la llegada real de un servicio que aún no ha salido, por ejemplo).
  // En el detalle se omiten los datos que la API nunca devuelve: siempre
  // saldrían vacíos.
  const campos = useMemo(
    () =>
      entity.fields.filter(
        (f) => (esEdicion || !f.soloEdicion) && !(soloLectura && f.privado)
      ),
    [entity, esEdicion, soloLectura]
  )

  const setField = (name, value) => {
    setValues((prev) => {
      const siguiente = { ...prev, [name]: value }
      // Si cambia el tipo de documento, el número se vuelve a filtrar:
      // al pasar de pasaporte a cédula desaparecen las letras.
      // (Un número enmascarado "••••6589" no se toca: no es el valor real.)
      if (name === 'tipo_documento' && 'numero_documento' in prev && !esEnmascarado(prev.numero_documento)) {
        siguiente.numero_documento = limpiarDocumento(prev.numero_documento, value)
      }
      return siguiente
    })
    setErrores((prev) => {
      if (!prev[name]) return prev
      const copia = { ...prev }
      delete copia[name]
      return copia
    })
  }

  const contexto = { filas, pk: entity.pk, fila: row }

  // Validación al salir del campo: el error aparece en cuanto se termina de
  // escribir, no solo al pulsar «Guardar». Un campo vacío no se marca hasta
  // intentar guardar, para no regañar a quien todavía no ha empezado.
  const validarAlSalir = (f) => {
    const valor = values[f.name]
    if (valor === '' || valor === null || valor === undefined) return
    const mensaje = validateValues(entity.fields, values, contexto)[f.name]
    if (mensaje) setErrores((prev) => ({ ...prev, [f.name]: mensaje }))
  }

  const enfocarPrimerError = (mapa) => {
    const primero = entity.fields.find((f) => mapa[f.name])
    if (!primero) return
    const elemento = formRef.current?.querySelector(`[name="${primero.name}"]`)
    if (elemento) elemento.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (soloLectura) return

    setErrorGeneral('')
    const problemas = validateValues(campos, values, contexto)
    if (Object.keys(problemas).length > 0) {
      setErrores(problemas)
      setErrorGeneral('Revisa los campos marcados en rojo antes de guardar.')
      enfocarPrimerError(problemas)
      return
    }

    setGuardando(true)
    try {
      const payload = buildPayload(campos, values)
      if (esEdicion) {
        await api.put(`/${entity.endpoint}/${row[entity.pk]}`, payload)
      } else {
        await api.post(`/${entity.endpoint}`, payload)
      }
      onSaved(
        esEdicion
          ? 'Los cambios se guardaron correctamente.'
          : `Se creó el registro en ${entity.label}.`
      )
    } catch (err) {
      // Errores de validación de Zod -> se pintan junto a cada campo
      const porCampo = getFieldErrors(err)
      setErrores(porCampo)
      setErrorGeneral(getErrorMessage(err))
      if (Object.keys(porCampo).length > 0) enfocarPrimerError(porCampo)
    } finally {
      setGuardando(false)
    }
  }

  // ¿La lista de la tabla relacionada está disponible (o cargando)?
  const hayLista = (f) => !!referencias[f.ref] || cargandoRefs

  // Opciones de una lista desplegable: SIEMPRE con el nombre (o la placa),
  // nunca con el código. Si el registro guardado apunta a algo que ya no
  // existe, se deja una opción marcada para no borrarlo sin querer al guardar.
  const opcionesDe = (f) => {
    const lista = referencias[f.ref]?.opciones || []
    const actual = values[f.name]
    const vacio = actual === '' || actual === null || actual === undefined
    if (vacio || lista.some((o) => o.valor === String(actual))) return lista
    return [...lista, { valor: String(actual), etiqueta: 'Valor actual (ya no está en la lista)' }]
  }

  const titulo = soloLectura ? 'Detalle' : esEdicion ? 'Editar' : 'Nuevo registro'

  return (
    <>
      <div className="drawer-backdrop" onMouseDown={intentarCerrar}>
        <aside
          className="drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          ref={ref}
          tabIndex={-1}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <header className="drawer-head">
            <div>
              <p className="drawer-eyebrow">{entity.label}</p>
              {/* Sin el código del registro: no le sirve a nadie y ensucia
                  la cabecera. Para saber cuál es, está el propio formulario. */}
              <h2 id="drawer-title">{titulo}</h2>
            </div>
            <button type="button" className="iconbtn" onClick={intentarCerrar} aria-label="Cerrar panel">
              <IconCerrar />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="drawer-form" ref={formRef} noValidate>
            <div className="drawer-body">
              {!soloLectura && (
                <p className="form-note">
                  Los campos marcados con <em className="req">*</em> son obligatorios.
                </p>
              )}

              <div className="form-grid">
                {campos.map((f) => {
                  const idCampo = `campo-${f.name}`
                  const idError = `${idCampo}-error`
                  const idAyuda = `${idCampo}-ayuda`
                  const tieneError = !!errores[f.name]
                  const ancho = ANCHO_COMPLETO.includes(f.type) ? 'span-2' : ''

                  // Consecutivo que asigna el servidor: se enseña, no se pregunta.
                  if (esAutomatico(f)) {
                    const valor = values[f.name]
                    return (
                      <div className="field" key={f.name}>
                        <span className="field-label" id={idCampo}>{f.label}</span>
                        <p
                          className={`field-auto ${valor ? '' : 'pendiente'}`}
                          aria-labelledby={idCampo}
                          aria-describedby={f.hint ? idAyuda : undefined}
                        >
                          {valor || 'Se asignará al guardar'}
                        </p>
                        {f.hint && <p className="field-hint" id={idAyuda}>{f.hint}</p>}
                      </div>
                    )
                  }

                  if (f.type === 'checkbox') {
                    return (
                      <div className="field span-2" key={f.name}>
                        <label className="check">
                          <input
                            id={idCampo}
                            name={f.name}
                            type="checkbox"
                            checked={!!values[f.name]}
                            disabled={soloLectura}
                            onChange={(e) => setField(f.name, e.target.checked)}
                          />
                          <span>{f.label}</span>
                        </label>
                        {f.hint && <p className="field-hint" id={idAyuda}>{f.hint}</p>}
                      </div>
                    )
                  }

                  const ayuda = soloLectura ? f.hint : ayudaDe(f, values[f.name], esEdicion)
                  const enmascarado = esEnmascarado(values[f.name])

                  const comunes = {
                    id: idCampo,
                    name: f.name,
                    value: values[f.name] ?? '',
                    disabled: soloLectura,
                    'aria-invalid': tieneError || undefined,
                    'aria-describedby':
                      [tieneError ? idError : null, ayuda ? idAyuda : null]
                        .filter(Boolean)
                        .join(' ') || undefined,
                    // Nombres sin números, teléfonos y cantidades sin letras:
                    // lo no permitido ni siquiera llega a aparecer en el campo.
                    // Sobre un valor enmascarado, lo escrito reemplaza a la máscara.
                    onChange: (e) =>
                      setField(
                        f.name,
                        limpiarSegunFormato(formatoDe(f), quitarMascara(e.target.value, values[f.name]), values)
                      ),
                    // Al entrar en un campo enmascarado se selecciona todo: lo
                    // primero que se escriba sustituye a "••••6589".
                    onFocus: enmascarado ? (e) => e.target.select?.() : undefined,
                    onBlur: () => validarAlSalir(f)
                  }

                  return (
                    <div className={`field ${ancho} ${tieneError ? 'has-error' : ''}`} key={f.name}>
                      <label className="field-label" htmlFor={idCampo}>
                        {f.label}
                        {f.required && !soloLectura && <em className="req"> *</em>}
                      </label>

                      {f.type === 'textarea' ? (
                        <textarea rows={3} {...comunes} />
                      ) : f.ref && hayLista(f) ? (
                        // Llave foránea: se elige por nombre, se guarda el id
                        <select {...comunes} disabled={soloLectura || cargandoRefs}>
                          <option value="">
                            {cargandoRefs ? 'Cargando opciones…' : '— Selecciona —'}
                          </option>
                          {opcionesDe(f).map((o) => (
                            <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
                          ))}
                        </select>
                      ) : f.type === 'select' ? (
                        <select {...comunes}>
                          <option value="">— Selecciona —</option>
                          {f.options.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={tipoDeInput(f.type)}
                          inputMode={tecladoDe(f, values)}
                          autoComplete="off"
                          placeholder={esEdicion && f.privado && !soloLectura ? 'Oculto por seguridad' : undefined}
                          {...comunes}
                        />
                      )}

                      {tieneError ? (
                        <p className="field-error" id={idError}>{errores[f.name]}</p>
                      ) : f.ref && !hayLista(f) ? (
                        <p className="field-hint">
                          No se pudo cargar la lista de «{f.label}». Vuelve a cargar la página
                          para elegirlo por su nombre.
                        </p>
                      ) : (
                        ayuda && <p className="field-hint" id={idAyuda}>{ayuda}</p>
                      )}
                    </div>
                  )
                })}
              </div>

              {errorGeneral && (
                <div className="alert error" role="alert">
                  <IconAlerta size={18} />
                  <span>{errorGeneral}</span>
                </div>
              )}
            </div>

            <footer className="drawer-actions">
              <button type="button" className="btn ghost" onClick={intentarCerrar} disabled={guardando}>
                {soloLectura ? 'Cerrar' : 'Cancelar'}
              </button>
              {!soloLectura && (
                <button type="submit" className="btn primary" disabled={guardando}>
                  {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear registro'}
                </button>
              )}
            </footer>
          </form>
        </aside>
      </div>

      {confirmarCierre && (
        <ConfirmDialog
          titulo="Descartar cambios"
          mensaje="Hiciste cambios que todavía no se han guardado."
          detalle="Si sales ahora, se perderán."
          textoConfirmar="Descartar"
          textoCancelar="Seguir editando"
          peligro
          onConfirm={onClose}
          onCancel={() => setConfirmarCierre(false)}
        />
      )}
    </>
  )
}
