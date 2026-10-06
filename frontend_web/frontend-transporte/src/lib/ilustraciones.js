// ============================================================
// Ilustraciones para usar como foto de perfil
// ------------------------------------------------------------
// SVG propios (sin imágenes externas). Al elegir una se convierte
// en JPEG de 256 px (lib/imagen.js), igual que una foto subida:
// el backend solo guarda y recibe un tipo de imagen.
// Se dibujan en una cuadrícula de 100 x 100.
// ============================================================

const svg = (fondo, contenido) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 100 100">` +
  `<defs>${fondo.defs ?? ''}</defs>` +
  `<rect width="100" height="100" fill="${fondo.fill}"/>${contenido}</svg>`

const degradado = (id, arriba, abajo) => ({
  defs: `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${arriba}"/><stop offset="1" stop-color="${abajo}"/></linearGradient>`,
  fill: `url(#${id})`
})

const estrellas = (puntos, color = '#fff') =>
  puntos.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`).join('')

export const ILUSTRACIONES = [
  {
    clave: 'estrellas-fugaces',
    nombre: 'Estrellas fugaces',
    svg: svg(degradado('g', '#0b1a33', '#1d3a66'),
      estrellas([[12, 18, 0.7], [30, 62, 0.6], [55, 12, 0.8], [80, 30, 0.6], [88, 70, 0.7], [20, 84, 0.6], [66, 88, 0.5], [44, 40, 0.5]]) +
      '<g stroke-linecap="round">' +
      '<path d="M28 20 L60 52" stroke="#9cc9ff" stroke-width="1.6" opacity="0.8"/><circle cx="60" cy="52" r="2.4" fill="#fff"/>' +
      '<path d="M52 8 L78 34" stroke="#9cc9ff" stroke-width="1.2" opacity="0.7"/><circle cx="78" cy="34" r="1.8" fill="#fff"/>' +
      '<path d="M16 46 L40 70" stroke="#9cc9ff" stroke-width="1" opacity="0.6"/><circle cx="40" cy="70" r="1.5" fill="#fff"/>' +
      '</g>')
  },
  {
    clave: 'atardecer-via',
    nombre: 'Atardecer en la vía',
    svg: svg(degradado('g', '#ffb45a', '#e8475f'),
      '<circle cx="50" cy="52" r="18" fill="#ffe29a"/>' +
      '<path d="M0 60 H100 V100 H0 Z" fill="#3b1f35"/>' +
      '<path d="M44 60 H56 L78 100 H22 Z" fill="#5a3350"/>' +
      '<path d="M50 64 V70 M50 76 V84 M50 90 V100" stroke="#ffe29a" stroke-width="2.4"/>')
  },
  {
    clave: 'montanas',
    nombre: 'Montañas',
    svg: svg(degradado('g', '#8fd3ff', '#d9f1ff'),
      '<circle cx="76" cy="24" r="9" fill="#fff6c9"/>' +
      '<path d="M-5 100 L34 38 L73 100 Z" fill="#3e6d8e"/>' +
      '<path d="M34 38 L43 52 L37 50 L32 56 L26 51 Z" fill="#fff"/>' +
      '<path d="M30 100 L68 50 L106 100 Z" fill="#2b5470"/>' +
      '<path d="M68 50 L76 61 L70 59 L66 64 L61 60 Z" fill="#fff"/>')
  },
  {
    clave: 'bus',
    nombre: 'Bus de viaje',
    svg: svg(degradado('g', '#d81e24', '#7a1113'),
      '<rect x="16" y="30" width="68" height="38" rx="7" fill="#fff"/>' +
      '<rect x="22" y="36" width="12" height="12" rx="2" fill="#7a1113"/>' +
      '<rect x="38" y="36" width="12" height="12" rx="2" fill="#7a1113"/>' +
      '<rect x="54" y="36" width="12" height="12" rx="2" fill="#7a1113"/>' +
      '<rect x="70" y="36" width="9" height="20" rx="2" fill="#7a1113"/>' +
      '<rect x="16" y="54" width="68" height="4" fill="#e9a7a7"/>' +
      '<circle cx="31" cy="69" r="7" fill="#16181d"/><circle cx="31" cy="69" r="3" fill="#ccc"/>' +
      '<circle cx="69" cy="69" r="7" fill="#16181d"/><circle cx="69" cy="69" r="3" fill="#ccc"/>' +
      '<path d="M8 82 H92" stroke="#fff" stroke-width="2" stroke-dasharray="7 5" opacity="0.6"/>')
  },
  {
    clave: 'brujula',
    nombre: 'Brújula',
    svg: svg(degradado('g', '#1aa39a', '#0c5f5a'),
      '<circle cx="50" cy="50" r="30" fill="#fdf6e3" stroke="#e7c873" stroke-width="4"/>' +
      '<path d="M50 24 V30 M50 70 V76 M24 50 H30 M70 50 H76" stroke="#8a6d2a" stroke-width="2"/>' +
      '<path d="M50 50 L58 42 L50 26 L42 42 Z" fill="#d81e24"/>' +
      '<path d="M50 50 L58 58 L50 74 L42 58 Z" fill="#3b4252"/>' +
      '<circle cx="50" cy="50" r="3" fill="#e7c873"/>')
  },
  {
    clave: 'destino',
    nombre: 'Destino',
    svg: svg(degradado('g', '#6fcf97', '#23875a'),
      '<ellipse cx="50" cy="80" rx="18" ry="4" fill="#000" opacity="0.18"/>' +
      '<path d="M50 80 C38 62 30 52 30 42 A20 20 0 0 1 70 42 C70 52 62 62 50 80 Z" fill="#d81e24"/>' +
      '<circle cx="50" cy="42" r="8" fill="#fff"/>')
  },
  {
    clave: 'luna',
    nombre: 'Luna',
    svg: svg(degradado('g', '#2a1b4d', '#5b3a8f'),
      estrellas([[18, 20, 0.8], [80, 16, 0.7], [84, 66, 0.9], [26, 78, 0.6], [62, 86, 0.7], [14, 50, 0.5]]) +
      '<path d="M58 22 A30 30 0 1 0 74 72 A24 24 0 1 1 58 22 Z" fill="#ffe8a3"/>' +
      '<circle cx="46" cy="44" r="3" fill="#f1cf6e"/><circle cx="40" cy="60" r="2" fill="#f1cf6e"/>')
  },
  {
    clave: 'ciudad',
    nombre: 'Ciudad de noche',
    svg: svg(degradado('g', '#1c2541', '#5a4a78'),
      estrellas([[14, 14, 0.6], [40, 10, 0.5], [70, 18, 0.7], [90, 8, 0.5]]) +
      '<rect x="6" y="46" width="18" height="54" fill="#0f172a"/>' +
      '<rect x="26" y="30" width="22" height="70" fill="#141d33"/>' +
      '<rect x="50" y="52" width="16" height="48" fill="#0f172a"/>' +
      '<rect x="68" y="38" width="26" height="62" fill="#141d33"/>' +
      '<g fill="#ffd166">' +
      '<rect x="10" y="52" width="4" height="4"/><rect x="16" y="62" width="4" height="4"/>' +
      '<rect x="30" y="36" width="4" height="4"/><rect x="40" y="46" width="4" height="4"/><rect x="30" y="58" width="4" height="4"/>' +
      '<rect x="54" y="60" width="4" height="4"/><rect x="72" y="44" width="4" height="4"/><rect x="84" y="54" width="4" height="4"/>' +
      '<rect x="72" y="66" width="4" height="4"/></g>')
  },
  {
    clave: 'mar',
    nombre: 'Mar',
    svg: svg(degradado('g', '#ffd9a0', '#8fd3ff'),
      '<circle cx="50" cy="48" r="14" fill="#fff3c4"/>' +
      '<path d="M0 56 Q12 50 25 56 T50 56 T75 56 T100 56 V100 H0 Z" fill="#2f80c4"/>' +
      '<path d="M0 68 Q12 62 25 68 T50 68 T75 68 T100 68 V100 H0 Z" fill="#1f5f9a"/>' +
      '<path d="M0 82 Q12 76 25 82 T50 82 T75 82 T100 82 V100 H0 Z" fill="#164a7a"/>')
  },
  {
    clave: 'volante',
    nombre: 'Volante',
    svg: svg(degradado('g', '#4b5563', '#1f2937'),
      '<circle cx="50" cy="50" r="28" fill="none" stroke="#e5e7eb" stroke-width="7"/>' +
      '<circle cx="50" cy="50" r="8" fill="#d81e24"/>' +
      '<path d="M22 46 Q50 40 78 46" stroke="#e5e7eb" stroke-width="6" fill="none"/>' +
      '<path d="M50 58 V78" stroke="#e5e7eb" stroke-width="6"/>')
  },
  {
    clave: 'bosque',
    nombre: 'Bosque',
    svg: svg(degradado('g', '#c8f0d0', '#7cc995'),
      '<path d="M0 84 H100 V100 H0 Z" fill="#3d7a4f"/>' +
      '<path d="M24 18 L40 50 H32 L44 74 H4 L16 50 H8 Z" fill="#1f6b3b"/>' +
      '<rect x="21" y="74" width="6" height="12" fill="#6b4226"/>' +
      '<path d="M66 8 L86 46 H76 L92 76 H40 L56 46 H46 Z" fill="#17552f"/>' +
      '<rect x="63" y="76" width="7" height="10" fill="#6b4226"/>')
  },
  {
    clave: 'globo',
    nombre: 'Globo aerostático',
    svg: svg(degradado('g', '#9ad0ff', '#ffe0ec'),
      '<ellipse cx="20" cy="76" rx="12" ry="4" fill="#fff" opacity="0.8"/>' +
      '<ellipse cx="80" cy="22" rx="10" ry="3.5" fill="#fff" opacity="0.8"/>' +
      '<path d="M50 14 C30 14 24 30 28 44 C31 54 40 60 44 66 H56 C60 60 69 54 72 44 C76 30 70 14 50 14 Z" fill="#d81e24"/>' +
      '<path d="M50 14 C42 18 40 34 44 66 H56 C60 34 58 18 50 14 Z" fill="#ffd166"/>' +
      '<path d="M44 66 L45 74 M56 66 L55 74" stroke="#6b4226" stroke-width="1.2"/>' +
      '<rect x="44" y="74" width="12" height="9" rx="1.5" fill="#8b5a2b"/>')
  }
]
