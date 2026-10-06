import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import api, { getErrorMessage } from '../api/api.js'
import {
  columnLabel,
  compareValues,
  descargarCSV,
  formatValue,
  rawText
} from '../lib/format.js'
import { useReferencias } from '../hooks/useReferencias.js'
import { etiquetaDeValor, invalidarReferencia } from '../lib/referencias.js'
import EntityForm from './EntityForm.jsx'
import ConfirmDialog from './ui/ConfirmDialog.jsx'
import Pagination, { TAMANOS_PAGINA } from './ui/Pagination.jsx'
import { useToast } from './ui/Toast.jsx'
import {
  IconActualizar,
  IconAlerta,
  IconBuscar,
  IconCerrar,
  IconColumnas,
  IconDescargar,
  IconEditar,
  IconEliminar,
  IconMas,
  IconOjo,
  IconOrden,
  IconVacio
} from './ui/Icons.jsx'

const CLAVE_TAMANO = 'dv:filas-por-pagina'
const claveColumnas = (entidad) => `dv:columnas:${entidad}`
const MAX_COLUMNAS_POR_DEFECTO = 7

// Búsqueda sin distinguir mayúsculas ni tildes ("Bogota" encuentra "Bogotá").
const normalizar = (texto) =>
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036F]/g, '')

// Lee un valor guardado en localStorage sin romper si está corrupto.
function leerJSON(clave, porDefecto) {
  try {
    const bruto = localStorage.getItem(clave)
    return bruto ? JSON.parse(bruto) : porDefecto
  } catch {
    return porDefecto
  }
}

// `acciones`: botones propios de una sección, junto a «Actualizar».
export default function DataTable({ entity, puedeEscribir, acciones = null }) {
  const toast = useToast()

  const { referencias, cargandoRefs, recargarRefs } = useReferencias(entity)

  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const busquedaDiferida = useDeferredValue(busqueda)
  const [orden, setOrden] = useState({ campo: null, dir: 'asc' })
  const [pagina, setPagina] = useState(1)
  const [tamano, setTamano] = useState(
    () => leerJSON(CLAVE_TAMANO, TAMANOS_PAGINA[0]) || TAMANOS_PAGINA[0]
  )

  const [formulario, setFormulario] = useState(null) // { row, soloLectura } | null
  const [porEliminar, setPorEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [menuColumnas, setMenuColumnas] = useState(false)
  const menuRef = useRef(null)

  // ---------------------------------------------------------------- datos
  const cargar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!silencioso) setCargando(true)
      setError('')
      try {
        const { data } = await api.get(`/${entity.endpoint}`)
        setFilas(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(getErrorMessage(err))
        setFilas([])
      } finally {
        setCargando(false)
      }
    },
    [entity.endpoint]
  )

  useEffect(() => {
    cargar()
  }, [cargar])

  // ------------------------------------------------------------- columnas
  // Los códigos internos NUNCA se muestran: ni la llave primaria ni las
  // columnas "id_algo" que no tengan una tabla asociada. Las que sí la
  // tienen se quedan, porque en la celda se pinta el nombre (o la placa),
  // no el número.
  const esColumnaDeId = useCallback(
    (clave) => {
      if (clave === entity.pk) return true
      const campo = entity.fields.find((f) => f.name === clave)
      if (campo?.ref) return false
      return /^id_/.test(clave) || /_id$/.test(clave)
    },
    [entity]
  )

  // Todas las columnas mostrables: los campos configurados y cualquier
  // columna extra que devuelva la base de datos.
  const todasLasColumnas = useMemo(() => {
    const lista = entity.fields.map((f) => f.name)
    for (const fila of filas) {
      for (const clave of Object.keys(fila)) {
        if (!lista.includes(clave)) lista.push(clave)
      }
    }
    return lista.filter((c) => !esColumnaDeId(c))
  }, [entity, filas, esColumnaDeId])

  const columnasPorDefecto = useMemo(() => {
    if (entity.columnas?.length) return entity.columnas.filter((c) => !esColumnaDeId(c))
    return entity.fields
      .map((f) => f.name)
      .filter((c) => !esColumnaDeId(c))
      .slice(0, MAX_COLUMNAS_POR_DEFECTO)
  }, [entity, esColumnaDeId])

  const [columnasVisibles, setColumnasVisibles] = useState(() =>
    leerJSON(claveColumnas(entity.key), null)
  )

  // Al cambiar de entidad se recuperan sus columnas guardadas (o las de fábrica).
  useEffect(() => {
    setColumnasVisibles(leerJSON(claveColumnas(entity.key), null))
    setBusqueda('')
    setOrden({ campo: null, dir: 'asc' })
    setPagina(1)
  }, [entity.key])

  const columnas = useMemo(() => {
    const guardadas = columnasVisibles?.filter((c) => todasLasColumnas.includes(c))
    const elegidas = guardadas?.length ? guardadas : columnasPorDefecto
    return todasLasColumnas.filter((c) => elegidas.includes(c))
  }, [columnasVisibles, columnasPorDefecto, todasLasColumnas])

  const alternarColumna = (clave) => {
    const actuales = columnas.includes(clave)
      ? columnas.filter((c) => c !== clave)
      : [...columnas, clave]
    if (actuales.length === 0) return // siempre debe quedar al menos una
    setColumnasVisibles(actuales)
    localStorage.setItem(claveColumnas(entity.key), JSON.stringify(actuales))
  }

  const restaurarColumnas = () => {
    setColumnasVisibles(null)
    localStorage.removeItem(claveColumnas(entity.key))
  }

  // Cierra el menú de columnas al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!menuColumnas) return
    const fuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuColumnas(false)
    }
    const escape = (e) => {
      if (e.key === 'Escape') setMenuColumnas(false)
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', escape)
    }
  }, [menuColumnas])

  // ------------------------------------------------ texto de cada celda
  // En las columnas que apuntan a otra tabla (id_vehiculo, id_conductor…)
  // el texto visible es el NOMBRE, no el id.
  const campoDe = useCallback(
    (clave) => entity.fields.find((f) => f.name === clave),
    [entity]
  )

  const textoDeCelda = useCallback(
    (fila, clave) =>
      etiquetaDeValor(referencias, campoDe(clave), fila[clave]) ?? rawText(fila[clave]),
    [referencias, campoDe]
  )

  // -------------------------------------------------- filtrar + ordenar
  const filtradas = useMemo(() => {
    const termino = normalizar(busquedaDiferida.trim())
    if (!termino) return filas
    // Se busca por el nombre visible y también por el id original.
    return filas.filter((fila) =>
      columnas.some((c) =>
        normalizar(`${textoDeCelda(fila, c)} ${rawText(fila[c])}`).includes(termino)
      )
    )
  }, [filas, busquedaDiferida, columnas, textoDeCelda])

  const ordenadas = useMemo(() => {
    if (!orden.campo) return filtradas
    const esReferencia = !!campoDe(orden.campo)?.ref
    const copia = [...filtradas]
    copia.sort((a, b) => {
      const valorA = esReferencia ? textoDeCelda(a, orden.campo) : a[orden.campo]
      const valorB = esReferencia ? textoDeCelda(b, orden.campo) : b[orden.campo]
      const resultado = compareValues(valorA, valorB)
      return orden.dir === 'asc' ? resultado : -resultado
    })
    return copia
  }, [filtradas, orden, campoDe, textoDeCelda])

  // ------------------------------------------------------------ paginar
  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / tamano))

  // Si el filtro reduce los resultados, nunca dejamos al usuario en una
  // página que ya no existe.
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas)
  }, [pagina, totalPaginas])

  const visibles = useMemo(() => {
    const inicio = (pagina - 1) * tamano
    return ordenadas.slice(inicio, inicio + tamano)
  }, [ordenadas, pagina, tamano])

  const cambiarTamano = (nuevo) => {
    setTamano(nuevo)
    setPagina(1)
    localStorage.setItem(CLAVE_TAMANO, JSON.stringify(nuevo))
  }

  const buscar = (valor) => {
    setBusqueda(valor)
    setPagina(1)
  }

  const ordenarPor = (clave) => {
    setOrden((prev) =>
      prev.campo === clave
        ? { campo: clave, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { campo: clave, dir: 'asc' }
    )
    setPagina(1)
  }

  // ------------------------------------------------------------ acciones
  const confirmarEliminacion = async () => {
    if (!porEliminar) return
    setEliminando(true)
    try {
      await api.delete(`/${entity.endpoint}/${porEliminar[entity.pk]}`)
      toast.exito('Registro eliminado correctamente.')
      invalidarReferencia(entity.key)
      setPorEliminar(null)
      await cargar({ silencioso: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setEliminando(false)
    }
  }

  const alGuardar = async (mensaje) => {
    setFormulario(null)
    toast.exito(mensaje)
    invalidarReferencia(entity.key)
    await cargar({ silencioso: true })
  }

  const exportar = () => {
    if (ordenadas.length === 0) {
      toast.info('No hay registros para exportar.')
      return
    }
    // En el CSV también se exportan los nombres, no los ids.
    const filasConNombres = ordenadas.map((fila) => {
      const copia = { ...fila }
      for (const c of columnas) {
        const etiqueta = etiquetaDeValor(referencias, campoDe(c), fila[c])
        if (etiqueta) copia[c] = etiqueta
      }
      return copia
    })

    descargarCSV(
      entity.key,
      columnas,
      columnas.map((c) => columnLabel(entity, c)),
      filasConNombres
    )
    toast.exito(`Se exportaron ${ordenadas.length} registro(s) a CSV.`)
  }

  // Texto con el que se nombra una fila en los botones y en el aviso de
  // borrado. Si no hay ningún campo de texto se usa una frase genérica:
  // enseñar el código interno no le dice nada a quien lo lee.
  const describirFila = (fila) => {
    const campoTexto = entity.fields.find((f) => f.type === 'text' || f.type === 'textarea')
    return rawText(fila[campoTexto?.name]) || 'este registro'
  }

  const hayBusqueda = busqueda.trim().length > 0

  return (
    <section className="panel" aria-labelledby="titulo-entidad">
      <header className="panel-head">
        <div className="panel-head-text">
          <h1 className="panel-title" id="titulo-entidad">{entity.label}</h1>
          <p className="panel-sub">
            {entity.descripcion}
            {!cargando && (
              <>
                {' · '}
                <strong>{filas.length}</strong> registro{filas.length === 1 ? '' : 's'} en total
              </>
            )}
          </p>
        </div>

        <div className="panel-actions">
          {acciones}
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              invalidarReferencia(entity.key)
              recargarRefs()
              cargar()
            }}
            disabled={cargando}
          >
            <IconActualizar size={16} />
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
          {puedeEscribir && (
            <button
              type="button"
              className="btn primary"
              onClick={() => setFormulario({ row: null, soloLectura: false })}
            >
              <IconMas size={16} />
              Nuevo registro
            </button>
          )}
        </div>
      </header>

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <span className="search-icon" aria-hidden="true"><IconBuscar size={16} /></span>
            <input
              type="search"
              className="search-input"
              value={busqueda}
              onChange={(e) => buscar(e.target.value)}
              placeholder={`Buscar en ${entity.label.toLowerCase()}…`}
              aria-label={`Buscar en ${entity.label}`}
            />
            {hayBusqueda && (
              <button
                type="button"
                className="iconbtn search-clear"
                onClick={() => buscar('')}
                aria-label="Limpiar búsqueda"
              >
                <IconCerrar size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-right">
            <div className="menu-wrap" ref={menuRef}>
              <button
                type="button"
                className="btn ghost small"
                onClick={() => setMenuColumnas((v) => !v)}
                aria-expanded={menuColumnas}
                aria-haspopup="true"
              >
                <IconColumnas size={16} />
                Columnas
                <span className="chip">{columnas.length}/{todasLasColumnas.length}</span>
              </button>

              {menuColumnas && (
                <div className="menu" role="group" aria-label="Columnas visibles">
                  <p className="menu-title">Mostrar columnas</p>
                  <ul className="menu-list">
                    {todasLasColumnas.map((c) => (
                      <li key={c}>
                        <label className="menu-item">
                          <input
                            type="checkbox"
                            checked={columnas.includes(c)}
                            onChange={() => alternarColumna(c)}
                          />
                          <span>{columnLabel(entity, c)}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="linkbtn menu-reset" onClick={restaurarColumnas}>
                    Restaurar vista por defecto
                  </button>
                </div>
              )}
            </div>

            <button type="button" className="btn ghost small" onClick={exportar}>
              <IconDescargar size={16} />
              Exportar CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="alert error" role="alert">
            <IconAlerta size={18} />
            <span>{error}</span>
            <button type="button" className="linkbtn" onClick={() => cargar()}>
              Reintentar
            </button>
          </div>
        )}

        <div className="table-wrap">
          {cargando ? (
            <table className="table" aria-busy="true">
              <thead>
                <tr>
                  {columnas.map((c) => (
                    <th key={c} scope="col">{columnLabel(entity, c)}</th>
                  ))}
                  <th scope="col" className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {columnas.map((c) => (
                      <td key={c}><span className="skeleton" /></td>
                    ))}
                    <td className="col-actions"><span className="skeleton" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : visibles.length === 0 ? (
            <div className="empty">
              <IconVacio />
              {hayBusqueda ? (
                <>
                  <p className="empty-title">Sin resultados para «{busqueda}»</p>
                  <p className="empty-text">
                    Prueba con otro término o revisa las columnas visibles.
                  </p>
                  <button type="button" className="btn ghost small" onClick={() => buscar('')}>
                    Limpiar búsqueda
                  </button>
                </>
              ) : (
                <>
                  <p className="empty-title">Aún no hay registros</p>
                  <p className="empty-text">
                    {puedeEscribir
                      ? 'Crea el primero con el botón «Nuevo registro».'
                      : 'Cuando un administrador cargue datos, aparecerán aquí.'}
                  </p>
                  {puedeEscribir && (
                    <button
                      type="button"
                      className="btn primary small"
                      onClick={() => setFormulario({ row: null, soloLectura: false })}
                    >
                      <IconMas size={16} />
                      Nuevo registro
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <table className="table">
              <caption className="sr-only">
                {entity.label}: {ordenadas.length} registros, página {pagina} de {totalPaginas}
              </caption>
              <thead>
                <tr>
                  {columnas.map((c) => {
                    const activa = orden.campo === c
                    return (
                      <th
                        key={c}
                        scope="col"
                        aria-sort={activa ? (orden.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <button
                          type="button"
                          className={`th-sort ${activa ? 'active' : ''}`}
                          onClick={() => ordenarPor(c)}
                          title={`Ordenar por ${columnLabel(entity, c)}`}
                        >
                          {columnLabel(entity, c)}
                          <IconOrden dir={activa ? orden.dir : null} />
                        </button>
                      </th>
                    )
                  })}
                  <th scope="col" className="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((fila, i) => (
                  <tr key={fila[entity.pk] ?? i}>
                    {columnas.map((c) => {
                      const valor = fila[c]
                      const campo = campoDe(c)
                      // Si la columna apunta a otra tabla, en la celda va el
                      // NOMBRE (o la placa). El código nunca se enseña, ni
                      // siquiera en el texto emergente.
                      const esReferencia = !!campo?.ref
                      const etiqueta = etiquetaDeValor(referencias, campo, valor)
                      const vacio = valor === null || valor === undefined || valor === ''

                      return (
                        <td key={c} title={esReferencia ? etiqueta || '' : rawText(valor)}>
                          {typeof valor === 'boolean' ? (
                            <span className={`badge ${valor ? 'ok' : 'bad'}`}>
                              {valor ? 'Sí' : 'No'}
                            </span>
                          ) : esReferencia ? (
                            <span className="celda-ref">
                              {etiqueta || (vacio ? '—' : 'Sin nombre')}
                            </span>
                          ) : (
                            formatValue(valor, campo)
                          )}
                        </td>
                      )
                    })}
                    <td className="col-actions">
                      {puedeEscribir ? (
                        <>
                          <button
                            type="button"
                            className="iconbtn action"
                            onClick={() => setFormulario({ row: fila, soloLectura: false })}
                            aria-label={`Editar ${describirFila(fila)}`}
                            title="Editar"
                          >
                            <IconEditar size={16} />
                          </button>
                          <button
                            type="button"
                            className="iconbtn action peligro"
                            onClick={() => setPorEliminar(fila)}
                            aria-label={`Eliminar ${describirFila(fila)}`}
                            title="Eliminar"
                          >
                            <IconEliminar size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="iconbtn action"
                          onClick={() => setFormulario({ row: fila, soloLectura: true })}
                          aria-label={`Ver detalle de ${describirFila(fila)}`}
                          title="Ver detalle"
                        >
                          <IconOjo size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!cargando && (
          <Pagination
            pagina={pagina}
            tamano={tamano}
            total={ordenadas.length}
            etiqueta="registros"
            onPagina={setPagina}
            onTamano={cambiarTamano}
          />
        )}
      </div>

      {formulario && (
        <EntityForm
          entity={entity}
          row={formulario.row}
          soloLectura={formulario.soloLectura}
          referencias={referencias}
          cargandoRefs={cargandoRefs}
          filas={filas}
          onClose={() => setFormulario(null)}
          onSaved={alGuardar}
        />
      )}

      {porEliminar && (
        <ConfirmDialog
          peligro
          titulo="Eliminar registro"
          mensaje={`Se eliminará «${describirFila(porEliminar)}» de ${entity.label}.`}
          detalle="Esta acción no se puede deshacer."
          textoConfirmar="Sí, eliminar"
          cargando={eliminando}
          onConfirm={confirmarEliminacion}
          onCancel={() => (eliminando ? null : setPorEliminar(null))}
        />
      )}
    </section>
  )
}
