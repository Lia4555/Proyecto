import { useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../../api/api.js'
import { useDialog } from '../../hooks/useDialog.js'
import { guardarFoto, quitarFoto } from '../../lib/fotoPerfil.js'
import { ILUSTRACIONES } from '../../lib/ilustraciones.js'
import { desdeArchivo, desdeSvg, desdeVideo, svgComoUrl } from '../../lib/imagen.js'
import { iniciales } from '../../lib/session.js'
import { useToast } from '../ui/Toast.jsx'
import { IconCamara, IconCerrar, IconEliminar, IconImagen, IconIzquierda } from '../ui/Icons.jsx'

// ============================================================
// Cambiar la foto de perfil
// ------------------------------------------------------------
//   inicio        -> vista previa grande y las opciones
//   ilustraciones -> galería de dibujos propios
//   camara        -> webcam o cámara frontal del móvil
// Cualquier opción deja una imagen "pendiente" que se ve en el
// círculo grande; solo se guarda al pulsar «Guardar».
// ============================================================

const TITULOS = {
  inicio: 'Foto de perfil',
  ilustraciones: 'Elige una ilustración',
  camara: 'Toma una foto'
}

const hayCamara = () =>
  typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

function Camara({ onCapturar, onError }) {
  const videoRef = useRef(null)
  const [lista, setLista] = useState(false)

  useEffect(() => {
    let flujo = null
    let vigente = true

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }, audio: false })
      .then((f) => {
        if (!vigente) {
          f.getTracks().forEach((t) => t.stop())
          return
        }
        flujo = f
        videoRef.current.srcObject = f
      })
      .catch((error) => {
        if (!vigente) return
        onError(
          error?.name === 'NotAllowedError'
            ? 'No diste permiso para usar la cámara. Puedes activarlo en el candado de la barra de direcciones.'
            : 'No se encontró ninguna cámara disponible.'
        )
      })

    // Al salir de esta vista la cámara se apaga (y se apaga su luz).
    return () => {
      vigente = false
      flujo?.getTracks().forEach((t) => t.stop())
    }
    // onError viene del padre y solo se usa si falla el arranque.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="foto-camara">
      <div className="foto-camara-marco">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedData={() => setLista(true)}
          aria-label="Vista previa de la cámara"
        />
        {!lista && <span className="foto-camara-espera">Encendiendo la cámara…</span>}
      </div>
      <button
        type="button"
        className="btn primary block"
        disabled={!lista}
        onClick={() => onCapturar(videoRef.current)}
      >
        <IconCamara size={16} />
        Capturar
      </button>
    </div>
  )
}

export default function FotoPerfilDialog({ usuario, foto, onClose }) {
  const toast = useToast()
  const ref = useDialog(onClose)
  const archivoRef = useRef(null)
  const camaraNativaRef = useRef(null)

  const [vista, setVista] = useState('inicio')
  const [pendiente, setPendiente] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const visible = pendiente || foto
  const ocupado = procesando || guardando

  const elegir = (url) => {
    setPendiente(url)
    setError('')
    setVista('inicio')
  }

  const conImagen = async (obtener) => {
    setProcesando(true)
    setError('')
    try {
      elegir(await obtener())
    } catch (e) {
      setError(e.message || 'No se pudo usar esa imagen.')
    } finally {
      setProcesando(false)
    }
  }

  const alElegirArchivo = (e) => {
    const archivo = e.target.files?.[0]
    // Se limpia para poder volver a elegir el mismo archivo.
    e.target.value = ''
    if (archivo) conImagen(() => desdeArchivo(archivo))
  }

  // En el móvil (o si el navegador no da acceso a la cámara) se abre la
  // cámara del sistema con un input de archivo.
  const abrirCamara = () => {
    setError('')
    if (hayCamara()) setVista('camara')
    else camaraNativaRef.current?.click()
  }

  const guardar = async () => {
    setGuardando(true)
    setError('')
    try {
      await guardarFoto(pendiente)
      toast.exito('Foto de perfil actualizada.')
      onClose()
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setGuardando(false)
    }
  }

  const quitar = async () => {
    setGuardando(true)
    setError('')
    try {
      await quitarFoto()
      toast.info('Quitaste tu foto de perfil.')
      onClose()
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={ocupado ? undefined : onClose}>
      <div
        className="modal foto-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="foto-titulo"
        ref={ref}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="foto-cabecera">
          {vista !== 'inicio' ? (
            <button
              type="button"
              className="iconbtn"
              onClick={() => { setVista('inicio'); setError('') }}
              aria-label="Volver"
            >
              <IconIzquierda size={18} />
            </button>
          ) : (
            <span className="foto-cabecera-hueco" />
          )}
          <h2 className="modal-title" id="foto-titulo">{TITULOS[vista]}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Cerrar" disabled={guardando}>
            <IconCerrar size={18} />
          </button>
        </header>

        {vista === 'inicio' && (
          <>
            <div className={`foto-grande ${pendiente ? 'nueva' : ''}`}>
              {visible ? (
                <img src={visible} alt={pendiente ? 'Vista previa de la nueva foto' : 'Tu foto de perfil'} />
              ) : (
                <span aria-label="Sin foto de perfil">{iniciales(usuario)}</span>
              )}
              {procesando && <span className="foto-grande-carga">Preparando…</span>}
            </div>

            {pendiente ? (
              <div className="foto-confirmar">
                <p className="modal-text">Así se verá tu nueva foto de perfil.</p>
                <button type="button" className="btn primary block" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando…' : 'Guardar foto de perfil'}
                </button>
                <button
                  type="button"
                  className="btn ghost block"
                  onClick={() => { setPendiente(null); setError('') }}
                  disabled={guardando}
                >
                  Elegir otra
                </button>
              </div>
            ) : (
              <ul className="foto-opciones">
                <li>
                  <button type="button" onClick={() => setVista('ilustraciones')} disabled={ocupado}>
                    <img className="foto-opcion-mini" src={svgComoUrl(ILUSTRACIONES[1].svg)} alt="" />
                    Explorar ilustraciones
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => archivoRef.current?.click()} disabled={ocupado}>
                    <IconImagen size={20} />
                    Subir desde el dispositivo
                  </button>
                </li>
                <li>
                  <button type="button" onClick={abrirCamara} disabled={ocupado}>
                    <IconCamara size={20} />
                    Toma una foto
                  </button>
                </li>
                {foto && (
                  <li>
                    <button type="button" className="peligro" onClick={quitar} disabled={ocupado}>
                      <IconEliminar size={20} />
                      {guardando ? 'Quitando…' : 'Quitar foto'}
                    </button>
                  </li>
                )}
              </ul>
            )}

            <p className="field-hint foto-nota">
              JPG, PNG o WebP. Se recorta al centro en forma cuadrada.
            </p>
          </>
        )}

        {vista === 'ilustraciones' && (
          <ul className="foto-galeria">
            {ILUSTRACIONES.map((ilustracion) => (
              <li key={ilustracion.clave}>
                <button
                  type="button"
                  onClick={() => conImagen(() => desdeSvg(ilustracion.svg))}
                  disabled={procesando}
                  title={ilustracion.nombre}
                >
                  <img src={svgComoUrl(ilustracion.svg)} alt={ilustracion.nombre} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {vista === 'camara' && (
          <Camara
            onCapturar={(video) => conImagen(async () => desdeVideo(video))}
            onError={(m) => { setError(m); setVista('inicio') }} />
        )}

        {error && (
          <p className="alert error foto-error" role="alert">{error}</p>
        )}

        <input ref={archivoRef} type="file" accept="image/*" hidden onChange={alElegirArchivo} />
        <input
          ref={camaraNativaRef}
          type="file"
          accept="image/*"
          capture="user"
          hidden
          onChange={alElegirArchivo}
        />
      </div>
    </div>
  )
}
