import { IconDerecha, IconIzquierda, IconPrimera, IconUltima } from './Icons.jsx'

export const TAMANOS_PAGINA = [10, 25, 50, 100]

// Calcula qué números mostrar: siempre la primera, la última, la actual
// y sus vecinas. Los huecos se rellenan con "…".
function construirPaginas(pagina, totalPaginas) {
  const visibles = []
  for (let i = 1; i <= totalPaginas; i++) {
    const esBorde = i === 1 || i === totalPaginas
    const esVecina = Math.abs(i - pagina) <= 1
    const inicioFijo = pagina <= 3 && i <= 4
    const finFijo = pagina >= totalPaginas - 2 && i >= totalPaginas - 3
    if (esBorde || esVecina || inicioFijo || finFijo) visibles.push(i)
  }

  const conHuecos = []
  let anterior = 0
  for (const p of visibles) {
    if (anterior && p - anterior > 1) conHuecos.push({ tipo: 'hueco', clave: `h-${p}` })
    conHuecos.push({ tipo: 'pagina', valor: p, clave: `p-${p}` })
    anterior = p
  }
  return conHuecos
}

/**
 * Paginación completa y accesible.
 * @param {number} pagina        página actual (empieza en 1)
 * @param {number} tamano       registros por página
 * @param {number} total         total de registros filtrados
 * @param {string} etiqueta      nombre de lo que se lista ("registros", "vehículos"…)
 */
export default function Pagination({
  pagina,
  tamano,
  total,
  etiqueta = 'registros',
  onPagina,
  onTamano
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / tamano))
  const desde = total === 0 ? 0 : (pagina - 1) * tamano + 1
  const hasta = Math.min(pagina * tamano, total)
  const paginas = construirPaginas(pagina, totalPaginas)

  const ir = (n) => {
    const destino = Math.min(Math.max(1, n), totalPaginas)
    if (destino !== pagina) onPagina(destino)
  }

  return (
    <div className="pagination">
      <p className="pagination-info" aria-live="polite">
        {total === 0 ? (
          <>Sin {etiqueta} para mostrar</>
        ) : (
          <>
            Mostrando <strong>{desde}–{hasta}</strong> de <strong>{total}</strong> {etiqueta}
          </>
        )}
      </p>

      <div className="pagination-controls">
        <label className="pagination-size">
          <span>Filas por página</span>
          <select
            value={tamano}
            onChange={(e) => onTamano(Number(e.target.value))}
            aria-label="Registros por página"
          >
            {TAMANOS_PAGINA.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <nav className="pagination-nav" aria-label="Paginación">
          <button
            type="button"
            className="pagebtn"
            onClick={() => ir(1)}
            disabled={pagina === 1}
            aria-label="Primera página"
            title="Primera página"
          >
            <IconPrimera size={16} />
          </button>
          <button
            type="button"
            className="pagebtn"
            onClick={() => ir(pagina - 1)}
            disabled={pagina === 1}
            aria-label="Página anterior"
            title="Página anterior"
          >
            <IconIzquierda size={16} />
          </button>

          <ul className="pagination-pages">
            {paginas.map((item) =>
              item.tipo === 'hueco' ? (
                <li key={item.clave} className="pagination-gap" aria-hidden="true">…</li>
              ) : (
                <li key={item.clave}>
                  <button
                    type="button"
                    className={`pagebtn number ${item.valor === pagina ? 'active' : ''}`}
                    onClick={() => ir(item.valor)}
                    aria-label={`Página ${item.valor}`}
                    aria-current={item.valor === pagina ? 'page' : undefined}
                  >
                    {item.valor}
                  </button>
                </li>
              )
            )}
          </ul>

          <span className="pagination-compact">
            Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
          </span>

          <button
            type="button"
            className="pagebtn"
            onClick={() => ir(pagina + 1)}
            disabled={pagina >= totalPaginas}
            aria-label="Página siguiente"
            title="Página siguiente"
          >
            <IconDerecha size={16} />
          </button>
          <button
            type="button"
            className="pagebtn"
            onClick={() => ir(totalPaginas)}
            disabled={pagina >= totalPaginas}
            aria-label="Última página"
            title="Última página"
          >
            <IconUltima size={16} />
          </button>
        </nav>
      </div>
    </div>
  )
}
