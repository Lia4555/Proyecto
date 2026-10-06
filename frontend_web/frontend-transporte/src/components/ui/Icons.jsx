// Iconos SVG en línea (sin librerías externas: menos peso y cero dependencias).
// Todos heredan el color del texto (stroke="currentColor").
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false
}

const Svg = ({ size, children, ...rest }) => (
  <svg {...base} {...rest} width={size || base.width} height={size || base.height}>
    {children}
  </svg>
)

export const IconBuscar = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></Svg>
)
export const IconMas = (p) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
)
export const IconActualizar = (p) => (
  <Svg {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></Svg>
)
export const IconEditar = (p) => (
  <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>
)
export const IconEliminar = (p) => (
  <Svg {...p}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></Svg>
)
export const IconCerrar = (p) => (
  <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>
)
export const IconMenu = (p) => (
  <Svg {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Svg>
)
export const IconSalir = (p) => (
  <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></Svg>
)
export const IconIzquierda = (p) => (
  <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>
)
export const IconDerecha = (p) => (
  <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>
)
export const IconPrimera = (p) => (
  <Svg {...p}><path d="m17 18-6-6 6-6" /><path d="M7 6v12" /></Svg>
)
export const IconUltima = (p) => (
  <Svg {...p}><path d="m7 18 6-6-6-6" /><path d="M17 6v12" /></Svg>
)
export const IconDescargar = (p) => (
  <Svg {...p}><path d="M12 3v12" /><path d="m7 12 5 5 5-5" /><path d="M4 21h16" /></Svg>
)
export const IconColumnas = (p) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></Svg>
)
export const IconOrden = ({ dir, ...p }) => (
  <Svg {...p} size={14}>
    <path d="m7 15 5 5 5-5" opacity={dir === 'asc' ? 0.25 : 1} />
    <path d="m7 9 5-5 5 5" opacity={dir === 'desc' ? 0.25 : 1} />
  </Svg>
)
export const IconAlerta = (p) => (
  <Svg {...p}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 9v5M12 17.5v.5" /></Svg>
)
export const IconOk = (p) => (
  <Svg {...p}><path d="m4 12 5 5L20 6" /></Svg>
)
export const IconInfo = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.5" /></Svg>
)
export const IconVacio = (p) => (
  <Svg {...p} size={40} strokeWidth={1.4}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M9 10v9" />
  </Svg>
)
export const IconOjo = (p) => (
  <Svg {...p}><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></Svg>
)
export const IconOjoCerrado = (p) => (
  <Svg {...p}><path d="M3 3l18 18" /><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.3 3.8" /><path d="M6.3 7.9A16.7 16.7 0 0 0 2 12s3.6 6 10 6a9.7 9.7 0 0 0 3.7-.7" /></Svg>
)

/* --- Iconos de la página principal --- */
export const IconMaletin = (p) => (
  <Svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></Svg>
)
export const IconEscuela = (p) => (
  <Svg {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /></Svg>
)
export const IconAvion = (p) => (
  <Svg {...p}><path d="M10 3h2l1.5 7H21a1.5 1.5 0 0 1 0 3h-7.5L12 21h-2l1-8H6l-1.5 2H3l1-3.5L3 8h1.5L6 10h5l-1-7Z" /></Svg>
)
export const IconMontana = (p) => (
  <Svg {...p}><path d="m3 20 6-9 4 5 2-3 6 7H3Z" /><circle cx="7" cy="6" r="2" /></Svg>
)
export const IconEscudo = (p) => (
  <Svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" /><path d="m9 12 2 2 4-4" /></Svg>
)
export const IconUbicacion = (p) => (
  <Svg {...p}><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></Svg>
)
export const IconTelefono = (p) => (
  <Svg {...p}><path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3Z" /></Svg>
)
export const IconCorreo = (p) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>
)
export const IconReloj = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
)
export const IconLlave = (p) => (
  <Svg {...p}><path d="M14 7a4 4 0 1 1-3.5 5.9L4 19v2H2v-3l7.1-7.1A4 4 0 0 1 14 7Z" /></Svg>
)
export const IconGps = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><path d="M12 1v3M12 20v3M1 12h3M20 12h3" /></Svg>
)
export const IconUsuarios = (p) => (
  <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 5.6M17.5 14.4A6.5 6.5 0 0 1 21.5 20" /></Svg>
)

/* --- Iconos del panel del conductor --- */
export const IconBus = (p) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M3 10h18" /><circle cx="7.5" cy="19" r="1.6" /><circle cx="16.5" cy="19" r="1.6" /><path d="M6 16v1.5M18 16v1.5" /></Svg>
)
export const IconRuta = (p) => (
  <Svg {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6H14a3.5 3.5 0 0 1 0 7h-4a3.5 3.5 0 0 0 0 7h5.5" /></Svg>
)
export const IconCampana = (p) => (
  <Svg {...p}><path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></Svg>
)
export const IconCamara = (p) => (
  <Svg {...p}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13.5" r="3.5" /></Svg>
)
export const IconImagen = (p) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9.5" r="1.6" /><path d="m21 16-5-5-9 9" /></Svg>
)
export const IconCalendario = (p) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>
)
export const IconDocumento = (p) => (
  <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5" /></Svg>
)
export const IconHerramienta = (p) => (
  <Svg {...p}><path d="M15 3a5 5 0 0 0-4.4 7.3L3 18v3h3l7.7-7.6A5 5 0 1 0 15 3Z" /></Svg>
)
export const IconInicio = (p) => (
  <Svg {...p}><path d="m3 11 9-8 9 8" /><path d="M6 10v10h12V10" /></Svg>
)
export const IconFlechaLarga = (p) => (
  <Svg {...p}><path d="M4 12h15" /><path d="m14 7 5 5-5 5" /></Svg>
)
export const IconTabla = (p) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 9v11" /></Svg>
)
