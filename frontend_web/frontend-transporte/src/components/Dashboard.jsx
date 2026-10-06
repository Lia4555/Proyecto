import { useEffect, useMemo, useState } from 'react'
import { groups, entidadesVisibles } from '../entities.js'
import { nombreVisible, puedeEscribir as tienePermisoDeEscritura } from '../lib/session.js'
import Cuentas from './Cuentas.jsx'
import DataTable from './DataTable.jsx'
import ReporteSemanal from './ReporteSemanal.jsx'
import BotonAvatar from './perfil/BotonAvatar.jsx'
import { FlechasHistorial, PasoSecciones } from './ui/Navegador.jsx'
import { IconBuscar, IconCerrar, IconMenu, IconSalir } from './ui/Icons.jsx'

// Sección propia (no es una tabla genérica): las solicitudes de cuenta.
// Va la primera del grupo «Personas».
export const SECCION_CUENTAS = {
  key: 'cuentas',
  label: 'Cuentas de acceso',
  group: 'Personas'
}

// Orden en el que se recorren las secciones con las flechas «Anterior / Siguiente»:
// el mismo que se ve en el menú lateral.
const ORDEN = groups.flatMap((grupo) => [
  ...(grupo === SECCION_CUENTAS.group ? [SECCION_CUENTAS] : []),
  ...entidadesVisibles.filter((e) => e.group === grupo)
])
const CLAVES = ORDEN.map((e) => e.key)

// App.jsx usa esta lista para saber qué rutas existen para el administrador.
export const SECCIONES_ADMIN = CLAVES

// La navegación llega desde App.jsx: portada, login y panel comparten un
// único historial, y por eso las flechas del navegador se mueven dentro de
// la aplicación en vez de sacarte de ella.
export default function Dashboard({ usuario, nav, onLogout }) {
  const { ruta, ir, atras, adelante, puedeVolver, puedeAvanzar } = nav

  const [menuAbierto, setMenuAbierto] = useState(false)
  const [filtro, setFiltro] = useState('')

  const entidadActiva = useMemo(
    () => ORDEN.find((e) => e.key === ruta) || ORDEN[0],
    [ruta]
  )
  const puedeEscribir = tienePermisoDeEscritura(usuario)

  const posicion = CLAVES.indexOf(entidadActiva.key)
  const anterior = posicion > 0 ? ORDEN[posicion - 1] : null
  const siguiente = posicion < ORDEN.length - 1 ? ORDEN[posicion + 1] : null

  // El menú móvil se cierra con Escape.
  useEffect(() => {
    if (!menuAbierto) return
    const alPresionar = (e) => e.key === 'Escape' && setMenuAbierto(false)
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [menuAbierto])

  const gruposFiltrados = useMemo(() => {
    const termino = filtro.trim().toLowerCase()
    return groups
      .map((grupo) => ({
        grupo,
        items: ORDEN.filter(
          (e) => e.group === grupo && (!termino || e.label.toLowerCase().includes(termino))
        )
      }))
      .filter((g) => g.items.length > 0)
  }, [filtro])

  const seleccionar = (key) => {
    ir(key)
    setMenuAbierto(false)
  }

  return (
    <div className="layout">
      <a className="skip-link" href="#contenido">Ir al contenido</a>

      {menuAbierto && (
        <div className="sidebar-overlay" onClick={() => setMenuAbierto(false)} aria-hidden="true" />
      )}

      <aside className={`sidebar ${menuAbierto ? 'open' : ''}`} aria-label="Menú de tablas">
        <div className="sidebar-brand">
          <span className="brand-mark">DV</span>
          <span className="brand-name">
            D&apos; VIAJE
            <small>Panel de administración</small>
          </span>
          <button
            type="button"
            className="iconbtn sidebar-close"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <IconCerrar />
          </button>
        </div>

        <div className="sidebar-search">
          <span className="search-icon" aria-hidden="true"><IconBuscar size={15} /></span>
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar sección…"
            aria-label="Buscar sección en el menú"
          />
        </div>

        <nav className="nav">
          {gruposFiltrados.map(({ grupo, items }) => (
            <div className="nav-group" key={grupo}>
              <p className="nav-group-title">{grupo}</p>
              {items.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  className={`nav-item ${e.key === entidadActiva.key ? 'active' : ''}`}
                  onClick={() => seleccionar(e.key)}
                  aria-current={e.key === entidadActiva.key ? 'page' : undefined}
                >
                  {e.label}
                </button>
              ))}
            </div>
          ))}

          {gruposFiltrados.length === 0 && (
            <p className="nav-empty">No hay secciones que coincidan con «{filtro}».</p>
          )}
        </nav>

        <footer className="sidebar-foot">
          <span className="sidebar-role">Administrador</span>
          <span className="sidebar-hint">Acceso total al sistema</span>
        </footer>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="iconbtn menu-toggle"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label="Abrir menú de secciones"
              aria-expanded={menuAbierto}
            >
              <IconMenu />
            </button>

            <FlechasHistorial
              atras={atras}
              adelante={adelante}
              puedeVolver={puedeVolver}
              puedeAvanzar={puedeAvanzar}
            />

            <nav className="breadcrumb" aria-label="Ubicación">
              <span>{entidadActiva.group}</span>
              <span aria-hidden="true">/</span>
              <strong>{entidadActiva.label}</strong>
            </nav>
          </div>

          <div className="topbar-user">
            <div className="user-chip">
              <BotonAvatar usuario={usuario} />
              <span className="user-data">
                <strong>{nombreVisible(usuario)}</strong>
                <small>Administrador</small>
              </span>
            </div>
            <button type="button" className="btn ghost small" onClick={onLogout}>
              <IconSalir size={16} />
              Salir
            </button>
          </div>
        </header>

        <main className="content" id="contenido">
          {entidadActiva.key === SECCION_CUENTAS.key ? (
            <Cuentas />
          ) : (
            <DataTable
              key={entidadActiva.key}
              entity={entidadActiva}
              puedeEscribir={puedeEscribir}
              acciones={entidadActiva.key === 'servicios' ? <ReporteSemanal /> : null}
            />
          )}

          <div className="panel">
            <PasoSecciones anterior={anterior} siguiente={siguiente} onIr={ir} />
          </div>
        </main>
      </div>
    </div>
  )
}
