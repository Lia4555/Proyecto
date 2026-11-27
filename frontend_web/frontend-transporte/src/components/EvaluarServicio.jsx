import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../api/api.js'
import { IconAlerta, IconOk } from './ui/Icons.jsx'
import '../control.css'

// ============================================================
// PÁGINA PÚBLICA: EL CLIENTE EVALÚA SU VIAJE
// Se abre con el enlace que genera el sistema al finalizar el
// servicio:  https://web/?evaluar=<token>
// No necesita cuenta ni sesión. Se responde una sola vez.
// ============================================================

const fechaHora = (iso) =>
  iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }) : '—'

const TEXTO_NOTA = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

function SelectorEstrellas({ valor, onCambio, etiqueta, chico }) {
  const [sobre, setSobre] = useState(0)
  const mostrado = sobre || valor
  return (
    <div
      className={`selector-estrellas ${chico ? 'chico' : ''}`}
      role="radiogroup"
      aria-label={etiqueta}
      onMouseLeave={() => setSobre(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} estrella${n === 1 ? '' : 's'}: ${TEXTO_NOTA[n]}`}
          className={n <= mostrado ? 'encendida' : ''}
          onMouseEnter={() => setSobre(n)}
          onClick={() => onCambio(n)}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function EvaluarServicio({ token }) {
  const [info, setInfo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviada, setEnviada] = useState(false)
  const [form, setForm] = useState({
    calificacion: 0,
    puntualidad: 0,
    trato_conductor: 0,
    estado_vehiculo: 0,
    recomendaria: null,
    comentario: ''
  })

  useEffect(() => {
    let vigente = true
    api
      .get(`/evaluaciones/publica/${encodeURIComponent(token)}`)
      .then(({ data }) => vigente && setInfo(data))
      .catch((err) => vigente && setError(getErrorMessage(err)))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [token])

  const poner = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const enviar = async (e) => {
    e.preventDefault()
    if (!form.calificacion) {
      setError('Elige de 1 a 5 estrellas para calificar el servicio.')
      return
    }
    setEnviando(true)
    setError('')
    const cuerpo = { calificacion: form.calificacion }
    for (const c of ['puntualidad', 'trato_conductor', 'estado_vehiculo']) if (form[c]) cuerpo[c] = form[c]
    if (form.recomendaria !== null) cuerpo.recomendaria = form.recomendaria
    if (form.comentario.trim()) cuerpo.comentario = form.comentario.trim()
    try {
      await api.post(`/evaluaciones/publica/${encodeURIComponent(token)}`, cuerpo)
      setEnviada(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setEnviando(false)
    }
  }

  const s = info?.servicio

  return (
    <main className="evaluar-screen">
      <div className="evaluar-card">
        <div className="evaluar-marca">
          <span className="brand-mark">DV</span>
          <span className="brand-name">D&apos; VIAJE</span>
        </div>

        {cargando ? (
          <p className="evaluar-sub" role="status">Cargando tu viaje…</p>
        ) : enviada || info?.respondida ? (
          <div className="evaluar-final" role="status">
            <span className="icono-grande"><IconOk size={48} /></span>
            <h1 className="evaluar-titulo">¡Gracias por tu opinión!</h1>
            <p className="evaluar-sub">
              {enviada
                ? 'Tu evaluación quedó registrada. Nos ayuda a mejorar cada viaje.'
                : 'Este servicio ya fue evaluado. No es necesario volver a hacerlo.'}
            </p>
          </div>
        ) : !info ? (
          <div className="alert error" role="alert">
            <IconAlerta size={18} />
            <span>{error || 'No se pudo abrir la evaluación.'}</span>
          </div>
        ) : info.vencida ? (
          <div className="evaluar-final">
            <h1 className="evaluar-titulo">El plazo para evaluar terminó</h1>
            <p className="evaluar-sub">Gracias por viajar con nosotros. Si quieres contarnos algo, comunícate con la empresa.</p>
          </div>
        ) : (
          <>
            <h1 className="evaluar-titulo">¿Cómo estuvo tu viaje?</h1>
            <p className="evaluar-sub">Tu opinión es anónima para el conductor y toma menos de un minuto.</p>

            <dl className="viaje-resumen">
              <div className="ancho">
                <dt>Recorrido</dt>
                <dd>{[s.origen, s.destino].filter(Boolean).join(' → ') || '—'}</dd>
              </div>
              <div>
                <dt>Servicio</dt>
                <dd>{s.codigo_servicio || '—'}</dd>
              </div>
              <div>
                <dt>Salida</dt>
                <dd>{fechaHora(s.fecha_salida)}</dd>
              </div>
              <div>
                <dt>Conductor</dt>
                <dd>{s.conductor || '—'}</dd>
              </div>
              <div>
                <dt>Vehículo</dt>
                <dd>{s.vehiculo || '—'}</dd>
              </div>
            </dl>

            <form className="evaluar-form" onSubmit={enviar} noValidate>
              <div className="field">
                <span className="field-label" id="lbl-general">Calificación general *</span>
                <SelectorEstrellas
                  etiqueta="Calificación general"
                  valor={form.calificacion}
                  onCambio={(n) => poner('calificacion', n)}
                />
                <p className="field-hint" aria-live="polite">{TEXTO_NOTA[form.calificacion] || 'Toca una estrella'}</p>
              </div>

              <div className="criterios">
                {[
                  ['puntualidad', 'Puntualidad'],
                  ['trato_conductor', 'Amabilidad del conductor'],
                  ['estado_vehiculo', 'Limpieza y estado del vehículo']
                ].map(([campo, texto]) => (
                  <div className="criterio" key={campo}>
                    <span>{texto}</span>
                    <SelectorEstrellas chico etiqueta={texto} valor={form[campo]} onCambio={(n) => poner(campo, n)} />
                  </div>
                ))}
                <div className="criterio">
                  <span>¿Nos recomendarías?</span>
                  <div className="si-no" role="group" aria-label="¿Nos recomendarías?">
                    {[[true, 'Sí'], [false, 'No']].map(([v, t]) => (
                      <button
                        key={t}
                        type="button"
                        className={`btn small ${form.recomendaria === v ? 'primary' : 'ghost'}`}
                        aria-pressed={form.recomendaria === v}
                        onClick={() => poner('recomendaria', form.recomendaria === v ? null : v)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="comentario">Comentario (opcional)</label>
                <textarea
                  id="comentario"
                  maxLength={1000}
                  value={form.comentario}
                  onChange={(e) => poner('comentario', e.target.value)}
                  placeholder="¿Qué hicimos bien? ¿Qué podemos mejorar?"
                />
                <span className="contador">{form.comentario.length}/1000</span>
              </div>

              {error && (
                <div className="alert error" role="alert">
                  <IconAlerta size={18} />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn primary block" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar evaluación'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
