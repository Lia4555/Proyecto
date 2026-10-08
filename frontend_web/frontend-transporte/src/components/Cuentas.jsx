import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { getErrorMessage } from '../api/api.js'
import { fechaCorta } from '../lib/format.js'
import { ROL } from '../lib/session.js'
import { RestablecerContrasenaDialog } from './perfil/ContrasenaDialog.jsx'
import ConfirmDialog from './ui/ConfirmDialog.jsx'
import { useToast } from './ui/Toast.jsx'
import { IconActualizar, IconAlerta, IconOk, IconVacio } from './ui/Icons.jsx'

// ============================================================
// CUENTAS DE ACCESO (solo administrador)
// ------------------------------------------------------------
// Aquí llegan las solicitudes del registro público. Una cuenta nueva
// no puede entrar hasta que se aprueba. No usa la tabla genérica porque
// la tabla "usuario" guarda contraseñas: el backend expone solo
// /api/cuentas, sin esa columna.
// ============================================================

const FILTROS = [
  ['pendientes', 'Pendientes'],
  ['activas', 'Activas'],
  ['desactivadas', 'Desactivadas'],
  ['todas', 'Todas']
]

// pendiente   -> solicitud sin revisar (Aprobar / Rechazar)
// activa      -> puede entrar (Desactivar)
// desactivada -> ya estuvo aprobada y se apagó (Reactivar)
const ESTADOS = {
  pendiente: { texto: 'Pendiente', clase: 'warn' },
  activa: { texto: 'Activa', clase: 'ok' },
  desactivada: { texto: 'Desactivada', clase: 'bad' }
}

const DE_FILTRO = { pendientes: 'pendiente', activas: 'activa', desactivadas: 'desactivada' }

const nombreCompleto = (c) => [c.nombre, c.apellido].filter(Boolean).join(' ') || c.correo

export default function Cuentas() {
  const toast = useToast()
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('pendientes')
  const [procesando, setProcesando] = useState(null) // id_usuario en curso
  const [confirmar, setConfirmar] = useState(null) // { accion, cuenta }
  const [restablecer, setRestablecer] = useState(null) // cuenta a la que se le pone clave temporal

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get('/cuentas')
      setCuentas(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const pendientes = cuentas.filter((c) => c.estado === 'pendiente')

  const cantidadDe = (clave) =>
    clave === 'todas' ? cuentas.length : cuentas.filter((c) => c.estado === DE_FILTRO[clave]).length

  const visibles = useMemo(
    () => (filtro === 'todas' ? cuentas : cuentas.filter((c) => c.estado === DE_FILTRO[filtro])),
    [cuentas, filtro]
  )

  // Al aprobar se manda el rol elegido: es el momento en que el
  // administrador delega el permiso. Sin rol (reactivar) se conserva el que
  // la cuenta ya tenía.
  const ejecutar = async (accion, cuenta, rol) => {
    setProcesando(cuenta.id_usuario)
    try {
      const { data } =
        accion === 'rechazar'
          ? await api.delete(`/cuentas/${cuenta.id_usuario}`)
          : await api.patch(
              `/cuentas/${cuenta.id_usuario}/${accion}`,
              rol ? { rol } : {}
            )
      toast.exito(data?.message || 'Cambio guardado.')
      // El servidor avisa si un conductor se quedó sin ficha: sin ella no puede entrar.
      if (data?.advertencia) toast.info(data.advertencia)
      setConfirmar(null)
      await cargar()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setProcesando(null)
    }
  }

  return (
    <section className="panel" aria-labelledby="titulo-cuentas">
      <header className="panel-head">
        <div className="panel-head-text">
          <h1 className="panel-title" id="titulo-cuentas">Cuentas de acceso</h1>
          <p className="panel-sub">
            Al aprobar eliges con qué permiso entra: <strong>Conductor</strong> (solo sus
            servicios y su vehículo) o <strong>Administrador</strong> (acceso total).
            {!cargando && (
              <>
                {' · '}
                <strong>{pendientes.length}</strong> pendiente{pendientes.length === 1 ? '' : 's'}
              </>
            )}
          </p>
        </div>
        <div className="panel-actions">
          <button type="button" className="btn ghost" onClick={cargar} disabled={cargando}>
            <IconActualizar size={16} />
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </header>

      <div className="card">
        <div className="toolbar">
          <div className="segmentos" role="group" aria-label="Filtrar cuentas">
            {FILTROS.map(([clave, texto]) => {
              const cantidad = cantidadDe(clave)
              return (
                <button
                  key={clave}
                  type="button"
                  className={`segmento ${filtro === clave ? 'activo' : ''}`}
                  onClick={() => setFiltro(clave)}
                  aria-pressed={filtro === clave}
                >
                  {texto}
                  {!cargando && <span className="chip">{cantidad}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="alert error" role="alert">
            <IconAlerta size={18} />
            <span>{error}</span>
            <button type="button" className="linkbtn" onClick={cargar}>Reintentar</button>
          </div>
        )}

        <div className="table-wrap">
          {cargando ? (
            <table className="table" aria-busy="true">
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}><span className="skeleton" /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : visibles.length === 0 ? (
            <div className="empty">
              {filtro === 'pendientes' ? <IconOk size={40} /> : <IconVacio />}
              <p className="empty-title">
                {filtro === 'pendientes' ? 'No hay solicitudes pendientes' : 'No hay cuentas en esta vista'}
              </p>
              <p className="empty-text">
                {filtro === 'pendientes'
                  ? 'Cuando alguien se registre desde la web o la app, aparecerá aquí para que lo apruebes.'
                  : 'Prueba con otro filtro.'}
              </p>
            </div>
          ) : (
            <table className="table">
              <caption className="sr-only">Cuentas de acceso: {visibles.length}</caption>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Documento</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col">Registro</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((c) => {
                  const ocupada = procesando === c.id_usuario
                  return (
                    <tr key={c.id_usuario}>
                      <td>
                        {nombreCompleto(c)}
                        {c.es_tu_cuenta && <span className="chip cuenta-tuya">Tú</span>}
                      </td>
                      <td>{c.correo}</td>
                      <td>{c.rol || '—'}</td>
                      <td>
                        {c.numero_documento ? `${c.tipo_documento} ${c.numero_documento}` : '—'}
                        {c.rol === 'Conductor' && !c.tiene_ficha && (
                          <span className="chip chip-warn cuenta-tuya" title="No podrá entrar hasta que exista una ficha de conductor con este correo">
                            Sin ficha
                          </span>
                        )}
                      </td>
                      <td>{c.telefono || '—'}</td>
                      <td>{fechaCorta(c.fecha_registro)}</td>
                      <td>
                        <span className={`badge ${ESTADOS[c.estado]?.clase ?? 'bad'}`}>
                          {ESTADOS[c.estado]?.texto ?? c.estado}
                        </span>
                      </td>
                      <td className="col-actions">
                        {c.estado === 'desactivada' ? (
                          <button
                            type="button"
                            className="btn ghost small"
                            onClick={() => ejecutar('aprobar', c)}
                            disabled={ocupada}
                          >
                            {ocupada ? 'Reactivando…' : 'Reactivar'}
                          </button>
                        ) : c.estado === 'pendiente' ? (
                          // Aprobar exige elegir con qué permiso entra: son dos
                          // botones distintos, no un "Aprobar" a secas. Así la
                          // decisión es explícita y queda a la vista.
                          <div className="acciones-cuenta">
                            <button
                              type="button"
                              className="btn primary small"
                              onClick={() => ejecutar('aprobar', c, ROL.CONDUCTOR)}
                              disabled={ocupada}
                              title="Solo verá sus servicios y su vehículo"
                            >
                              {ocupada ? 'Aprobando…' : 'Conductor'}
                            </button>
                            <button
                              type="button"
                              className="btn ghost small"
                              onClick={() => setConfirmar({ accion: 'aprobar-admin', cuenta: c })}
                              disabled={ocupada}
                              title="Acceso total, incluidas las cuentas de acceso"
                            >
                              Administrador
                            </button>
                            <button
                              type="button"
                              className="btn ghost small"
                              onClick={() => setConfirmar({ accion: 'rechazar', cuenta: c })}
                              disabled={ocupada}
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : c.es_tu_cuenta ? (
                          // La propia contraseña se cambia desde la llave de la cabecera.
                          <span className="field-hint">—</span>
                        ) : (
                          <div className="acciones-cuenta">
                            <button
                              type="button"
                              className="btn ghost small"
                              onClick={() => setRestablecer(c)}
                              disabled={ocupada}
                              title="Ponerle una contraseña temporal si olvidó la suya"
                            >
                              Restablecer contraseña
                            </button>
                            <button
                              type="button"
                              className="btn ghost small"
                              onClick={() => setConfirmar({ accion: 'desactivar', cuenta: c })}
                              disabled={ocupada}
                            >
                              Desactivar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {confirmar && (
        <ConfirmDialog
          peligro
          titulo={
            confirmar.accion === 'rechazar'
              ? '¿Rechazar la solicitud?'
              : confirmar.accion === 'aprobar-admin'
                ? '¿Dar permiso de administrador?'
                : '¿Desactivar la cuenta?'
          }
          mensaje={
            confirmar.accion === 'rechazar'
              ? `Se eliminará la cuenta de ${nombreCompleto(confirmar.cuenta)} (${confirmar.cuenta.correo}).`
              : confirmar.accion === 'aprobar-admin'
                ? `${nombreCompleto(confirmar.cuenta)} tendrá acceso total: podrá ver y editar todas las tablas, y aprobar o desactivar otras cuentas, incluida la tuya.`
                : `${nombreCompleto(confirmar.cuenta)} no podrá volver a iniciar sesión hasta que la reactives.`
          }
          detalle={
            confirmar.accion === 'rechazar'
              ? 'Su ficha de conductor también se borra si no tiene servicios ni vehículos asignados.'
              : confirmar.accion === 'aprobar-admin'
                ? 'Si querías darle acceso solo a sus servicios y su vehículo, cancela y usa el botón «Conductor».'
                : 'Si tiene una sesión abierta, se cerrará en cuanto haga su siguiente acción.'
          }
          textoConfirmar={
            confirmar.accion === 'rechazar'
              ? 'Rechazar'
              : confirmar.accion === 'aprobar-admin'
                ? 'Sí, hacer administrador'
                : 'Desactivar'
          }
          cargando={procesando === confirmar.cuenta.id_usuario}
          onConfirm={() =>
            confirmar.accion === 'aprobar-admin'
              ? ejecutar('aprobar', confirmar.cuenta, ROL.ADMIN)
              : ejecutar(confirmar.accion, confirmar.cuenta)
          }
          onCancel={() => setConfirmar(null)}
        />
      )}

      {restablecer && (
        <RestablecerContrasenaDialog
          cuenta={restablecer}
          nombre={nombreCompleto(restablecer)}
          onClose={() => setRestablecer(null)}
        />
      )}
    </section>
  )
}
