import { useEffect, useState } from 'react'
import {
  IconAvion,
  IconCorreo,
  IconEscudo,
  IconEscuela,
  IconLlave,
  IconMaletin,
  IconMenu,
  IconCerrar,
  IconMontana,
  IconGps,
  IconReloj,
  IconTelefono,
  IconUbicacion,
  IconUsuarios
} from './ui/Icons.jsx'
import { limpiarTelefono } from '../lib/validaciones.js'
import '../landing.css'

// ============================================================
// PÁGINA PRINCIPAL (pública) · presentación de la empresa
// ------------------------------------------------------------
// Todo lo que cambia de una empresa a otra está en EMPRESA:
// nombre, contacto y cifras. Las fotos viven en public/img/.
// ============================================================
export const EMPRESA = {
  nombre: "D' VIAJE",
  eslogan: 'Transporte especial de pasajeros',
  ciudad: 'Bogotá D.C., Colombia',
  direccion: 'Calle 26 # 68-35, Bogotá D.C.',
  telefono: '+57 601 000 0000',
  whatsapp: '+57 300 000 0000',
  correo: 'contacto@dviaje.com',
  horario: 'Lunes a sábado, 6:00 a.m. – 8:00 p.m.',
  anios: 12
}

const CIFRAS = [
  { valor: '12', etiqueta: 'años de experiencia' },
  { valor: '45', etiqueta: 'vehículos en la flota' },
  { valor: '30 mil', etiqueta: 'viajes realizados' },
  { valor: '15', etiqueta: 'ciudades atendidas' }
]

const SERVICIOS = [
  {
    icono: IconMaletin,
    titulo: 'Transporte empresarial',
    texto:
      'Rutas fijas para el personal de tu empresa, con horarios controlados y reportes de cumplimiento por trayecto.'
  },
  {
    icono: IconEscuela,
    titulo: 'Transporte escolar',
    texto:
      'Recorridos puerta a puerta con monitor a bordo, cinturones en todos los asientos y control de asistencia.'
  },
  {
    icono: IconMontana,
    titulo: 'Turismo y excursiones',
    texto:
      'Viajes a destinos nacionales con conductores conocedores de la ruta y vehículos preparados para carretera.'
  },
  {
    icono: IconAvion,
    titulo: 'Traslados al aeropuerto',
    texto:
      'Recogida y entrega puntual, seguimiento del vuelo y espacio suficiente para el equipaje de todo el grupo.'
  },
  {
    icono: IconUsuarios,
    titulo: 'Eventos y convenciones',
    texto:
      'Coordinamos varios vehículos a la vez para mover grupos grandes sin que nadie se quede esperando.'
  },
  {
    icono: IconLlave,
    titulo: 'Servicio por horas',
    texto:
      'Vehículo y conductor a disposición durante la jornada, ideal para agendas con varias paradas.'
  }
]

const GARANTIAS = [
  {
    icono: IconEscudo,
    titulo: 'Documentación siempre vigente',
    texto:
      'SOAT, tecnomecánica, pólizas y tarjetas de operación con alertas automáticas antes de cada vencimiento.'
  },
  {
    icono: IconUsuarios,
    titulo: 'Conductores certificados',
    texto:
      'Licencias al día, exámenes médicos, curso de manejo defensivo y evaluación permanente del servicio.'
  },
  {
    icono: IconGps,
    titulo: 'Monitoreo en ruta',
    texto:
      'Seguimiento satelital de cada servicio: sabemos dónde va el vehículo y a qué hora llegará.'
  },
  {
    icono: IconReloj,
    titulo: 'Mantenimiento preventivo',
    texto:
      'Cada vehículo tiene su hoja de vida con kilometraje, revisiones y próximo mantenimiento programado.'
  }
]

const FLOTA = [
  {
    imagen: '/img/van-frontal.jpg',
    titulo: 'Van ejecutiva',
    capacidad: '12 – 19 pasajeros',
    texto: 'Aire acondicionado, sillas reclinables y espacio para equipaje.'
  },
  {
    imagen: '/img/buseta-escolar.jpg',
    titulo: 'Buseta escolar',
    capacidad: '20 – 30 pasajeros',
    texto: 'Cinturones en cada asiento, monitor a bordo y puerta con sensor.'
  },
  {
    imagen: '/img/interior-bus.jpg',
    titulo: 'Bus de turismo',
    capacidad: '30 – 45 pasajeros',
    texto: 'Sillas amplias, bodega para maletas y equipo de sonido.'
  }
]

const ENLACES = [
  ['#empresa', 'La empresa'],
  ['#servicios', 'Servicios'],
  ['#flota', 'Flota'],
  ['#contacto', 'Contacto']
]

export default function Landing({ onIngresar }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [conSombra, setConSombra] = useState(false)

  // La barra superior se separa del fondo al bajar (referencia visual de scroll)
  useEffect(() => {
    const alDesplazar = () => setConSombra(window.scrollY > 12)
    alDesplazar()
    window.addEventListener('scroll', alDesplazar, { passive: true })
    return () => window.removeEventListener('scroll', alDesplazar)
  }, [])

  const irA = (ancla) => (e) => {
    e.preventDefault()
    setMenuAbierto(false)
    document.querySelector(ancla)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // El formulario abre el correo del visitante con el mensaje ya escrito:
  // así funciona de verdad sin necesitar un servidor de correo.
  const enviarCorreo = (e) => {
    e.preventDefault()
    const datos = new FormData(e.target)
    const asunto = `Cotización de transporte especial · ${datos.get('nombre')}`
    const cuerpo = [
      `Nombre: ${datos.get('nombre')}`,
      `Teléfono: ${datos.get('telefono')}`,
      `Servicio: ${datos.get('servicio')}`,
      `Fecha del viaje: ${datos.get('fecha') || 'por definir'}`,
      `Pasajeros: ${datos.get('pasajeros') || 'por definir'}`,
      '',
      datos.get('mensaje') || ''
    ].join('\n')
    window.location.href =
      `mailto:${EMPRESA.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
  }

  return (
    <div className="lp">
      <a className="skip-link" href="#lp-inicio">Ir al contenido</a>

      {/* ---------------------------- BARRA SUPERIOR --------------------------- */}
      <header className={`lp-nav ${conSombra ? 'con-sombra' : ''}`}>
        <div className="lp-contenedor lp-nav-inner">
          <a className="lp-marca" href="#lp-inicio" onClick={irA('#lp-inicio')}>
            <span className="brand-mark">DV</span>
            <span className="brand-name">
              {EMPRESA.nombre}
              <small>{EMPRESA.eslogan}</small>
            </span>
          </a>

          <nav className={`lp-enlaces ${menuAbierto ? 'abierto' : ''}`} aria-label="Secciones">
            {ENLACES.map(([ancla, texto]) => (
              <a key={ancla} href={ancla} onClick={irA(ancla)}>{texto}</a>
            ))}
            <button type="button" className="btn ghost small lp-solo-movil" onClick={onIngresar}>
              Ingresar al panel
            </button>
          </nav>

          <div className="lp-nav-acciones">
            <button type="button" className="btn primary small" onClick={onIngresar}>
              Ingresar al panel
            </button>
            <button
              type="button"
              className="iconbtn lp-menu"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-expanded={menuAbierto}
              aria-label="Abrir menú"
            >
              {menuAbierto ? <IconCerrar /> : <IconMenu />}
            </button>
          </div>
        </div>
      </header>

      <main id="lp-inicio">
        {/* -------------------------------- HERO ------------------------------- */}
        <section className="lp-hero">
          <div className="lp-contenedor lp-hero-inner">
            <div className="lp-hero-texto">
              <p className="lp-eyebrow">Transporte especial de pasajeros · {EMPRESA.ciudad}</p>
              <h1>
                Movemos personas con <span>seguridad, puntualidad</span> y control.
              </h1>
              <p className="lp-lead">
                En {EMPRESA.nombre} llevamos {EMPRESA.anios} años transportando empleados,
                estudiantes y viajeros. Cada servicio queda registrado en nuestro sistema:
                vehículo, conductor, ruta y estado del viaje.
              </p>

              <div className="lp-hero-botones">
                <a className="btn primary" href="#contacto" onClick={irA('#contacto')}>
                  Solicitar una cotización
                </a>
                <a className="btn ghost" href="#servicios" onClick={irA('#servicios')}>
                  Ver servicios
                </a>
              </div>

              <ul className="lp-hero-chips">
                <li><IconEscudo size={16} /> Vehículos con documentos al día</li>
                <li><IconGps size={16} /> Monitoreo satelital</li>
                <li><IconReloj size={16} /> Disponibilidad 24/7</li>
              </ul>
            </div>

            <div className="lp-hero-media">
              <img
                src="/img/hero-van.jpg"
                alt="Van ejecutiva negra de transporte especial estacionada en la vía"
                width="1400"
                height="1050"
              />
              <div className="lp-hero-tarjeta">
                <strong>98,6 %</strong>
                <span>de los servicios salieron a tiempo el último trimestre</span>
              </div>
            </div>
          </div>

          <div className="lp-cifras">
            <div className="lp-contenedor lp-cifras-inner">
              {CIFRAS.map((c) => (
                <div className="lp-cifra" key={c.etiqueta}>
                  <strong>{c.valor}</strong>
                  <span>{c.etiqueta}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ LA EMPRESA --------------------------- */}
        <section className="lp-seccion" id="empresa">
          <div className="lp-contenedor lp-dos-columnas">
            <div className="lp-media-marco">
              <img
                src="/img/van-blanca.jpg"
                alt="Van blanca de pasajeros lista para prestar el servicio"
                loading="lazy"
                width="1400"
                height="1050"
              />
            </div>

            <div>
              <p className="lp-eyebrow">Quiénes somos</p>
              <h2>Una empresa de transporte especial, no un intermediario</h2>
              <p>
                {EMPRESA.nombre} es una empresa colombiana dedicada al transporte terrestre
                automotor especial. Operamos con flota propia, conductores vinculados y un
                sistema de gestión donde cada vehículo tiene su hoja de vida, sus documentos
                y su historial de mantenimientos.
              </p>
              <p>
                Trabajamos con colegios, empresas, operadores turísticos y familias que
                necesitan mover grupos con la tranquilidad de saber quién conduce, en qué
                vehículo viajan y a qué hora llegan.
              </p>

              <div className="lp-mision">
                <article>
                  <h3>Misión</h3>
                  <p>
                    Prestar un servicio de transporte especial seguro y puntual, apoyado en
                    tecnología que permita controlar cada viaje de principio a fin.
                  </p>
                </article>
                <article>
                  <h3>Visión</h3>
                  <p>
                    Ser en {new Date().getFullYear() + 5} la empresa de transporte especial
                    de referencia en la región por su cumplimiento y su cultura de seguridad vial.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ SERVICIOS ---------------------------- */}
        <section className="lp-seccion lp-fondo-suave" id="servicios">
          <div className="lp-contenedor">
            <header className="lp-encabezado">
              <p className="lp-eyebrow">Qué hacemos</p>
              <h2>Servicios para cada tipo de viaje</h2>
              <p className="lp-lead">
                Todos incluyen conductor profesional, seguro de pasajeros y seguimiento del
                recorrido desde nuestra central.
              </p>
            </header>

            <div className="lp-grid-servicios">
              {SERVICIOS.map(({ icono: Icono, titulo, texto }) => (
                <article className="lp-tarjeta" key={titulo}>
                  <span className="lp-tarjeta-icono"><Icono size={22} /></span>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------- FLOTA ------------------------------ */}
        <section className="lp-seccion" id="flota">
          <div className="lp-contenedor">
            <header className="lp-encabezado">
              <p className="lp-eyebrow">Nuestra flota</p>
              <h2>Vehículos para grupos de 4 a 45 pasajeros</h2>
              <p className="lp-lead">
                Modelos recientes, revisión antes de cada salida y capacidad suficiente para
                equipaje. Si necesitas más vehículos, coordinamos varios en el mismo servicio.
              </p>
            </header>

            <div className="lp-grid-flota">
              {FLOTA.map((v) => (
                <article className="lp-vehiculo" key={v.titulo}>
                  <img src={v.imagen} alt={`${v.titulo}: ${v.texto}`} loading="lazy" />
                  <div className="lp-vehiculo-texto">
                    <span className="chip">{v.capacidad}</span>
                    <h3>{v.titulo}</h3>
                    <p>{v.texto}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ GARANTÍAS ---------------------------- */}
        <section className="lp-seccion lp-oscura">
          <div className="lp-contenedor">
            <header className="lp-encabezado">
              <p className="lp-eyebrow">Por qué confiar en nosotros</p>
              <h2>La seguridad se controla, no se promete</h2>
            </header>

            <div className="lp-grid-garantias">
              {GARANTIAS.map(({ icono: Icono, titulo, texto }) => (
                <article key={titulo}>
                  <span className="lp-garantia-icono"><Icono size={20} /></span>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------- CONTACTO ---------------------------- */}
        <section className="lp-seccion" id="contacto">
          <div className="lp-contenedor lp-dos-columnas">
            <div>
              <p className="lp-eyebrow">Hablemos</p>
              <h2>Cuéntanos tu viaje y te cotizamos</h2>
              <p>
                Respondemos el mismo día hábil. Si prefieres, escríbenos directamente por
                teléfono o correo.
              </p>

              <ul className="lp-datos">
                <li>
                  <IconUbicacion size={18} />
                  <span><strong>Dirección</strong>{EMPRESA.direccion}</span>
                </li>
                <li>
                  <IconTelefono size={18} />
                  <span>
                    <strong>Teléfono</strong>
                    <a href={`tel:${EMPRESA.telefono.replace(/\s/g, '')}`}>{EMPRESA.telefono}</a>
                    {' · '}
                    <a href={`tel:${EMPRESA.whatsapp.replace(/\s/g, '')}`}>{EMPRESA.whatsapp}</a>
                  </span>
                </li>
                <li>
                  <IconCorreo size={18} />
                  <span>
                    <strong>Correo</strong>
                    <a href={`mailto:${EMPRESA.correo}`}>{EMPRESA.correo}</a>
                  </span>
                </li>
                <li>
                  <IconReloj size={18} />
                  <span><strong>Horario</strong>{EMPRESA.horario}</span>
                </li>
              </ul>
            </div>

            <form className="lp-formulario" onSubmit={enviarCorreo}>
              <div className="grid-2">
                <div className="field">
                  <label className="field-label" htmlFor="c-nombre">Nombre o empresa</label>
                  <input id="c-nombre" name="nombre" required autoComplete="name" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="c-telefono">Teléfono</label>
                  <input
                    id="c-telefono"
                    name="telefono"
                    type="tel"
                    inputMode="tel"
                    required
                    autoComplete="tel"
                    placeholder="300 000 0000"
                    pattern="\+?[0-9][0-9 ]{6,19}"
                    title="Solo números y espacios (puede empezar con +), mínimo 7 dígitos."
                    onChange={(e) => { e.target.value = limpiarTelefono(e.target.value) }}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="c-servicio">Servicio que necesitas</label>
                <select id="c-servicio" name="servicio" defaultValue={SERVICIOS[0].titulo}>
                  {SERVICIOS.map((s) => (
                    <option key={s.titulo} value={s.titulo}>{s.titulo}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label className="field-label" htmlFor="c-fecha">Fecha del viaje</label>
                  <input id="c-fecha" name="fecha" type="date" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="c-pasajeros">N.º de pasajeros</label>
                  <input id="c-pasajeros" name="pasajeros" type="number" min="1" />
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="c-mensaje">Cuéntanos el recorrido</label>
                <textarea id="c-mensaje" name="mensaje" rows={3} placeholder="Origen, destino y horario aproximado" />
              </div>

              <button type="submit" className="btn primary block">Enviar solicitud</button>
              <p className="field-hint">
                Al enviar se abrirá tu programa de correo con el mensaje listo para {EMPRESA.correo}.
              </p>
            </form>
          </div>
        </section>

        {/* ------------------------------- CIERRE ------------------------------ */}
        <section className="lp-cta">
          <div className="lp-contenedor lp-cta-inner">
            <div>
              <h2>¿Eres cliente o parte del equipo?</h2>
              <p>
                Ingresa al panel para consultar servicios, vehículos, conductores y alertas
                en tiempo real.
              </p>
            </div>
            <div className="lp-cta-botones">
              <button type="button" className="btn primary" onClick={onIngresar}>
                Ingresar al panel
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------- PIE -------------------------------- */}
      <footer className="lp-pie">
        <div className="lp-contenedor lp-pie-inner">
          <div>
            <div className="lp-marca">
              <span className="brand-mark">DV</span>
              <span className="brand-name">
                {EMPRESA.nombre}
                <small>{EMPRESA.eslogan}</small>
              </span>
            </div>
            <p className="lp-pie-texto">
              {EMPRESA.direccion} · {EMPRESA.telefono} · {EMPRESA.correo}
            </p>
          </div>

          <nav className="lp-pie-enlaces" aria-label="Secciones del pie">
            {ENLACES.map(([ancla, texto]) => (
              <a key={ancla} href={ancla} onClick={irA(ancla)}>{texto}</a>
            ))}
            <button type="button" className="linkbtn" onClick={onIngresar}>
              Ingresar al panel
            </button>
          </nav>
        </div>

        <div className="lp-contenedor lp-pie-legal">
          <p>© {new Date().getFullYear()} {EMPRESA.nombre}. Proyecto académico.</p>
          <p>
            Fotografías de Wikimedia Commons (CC BY-SA): Damian B Oh, Ethan Llamas,
            Felipe Restrepo Acosta y Atomic Taco.
          </p>
        </div>
      </footer>
    </div>
  )
}
