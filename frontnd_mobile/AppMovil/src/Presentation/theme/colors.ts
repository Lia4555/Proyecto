// Paleta unica de la app. Ninguna pantalla escribe un color a mano:
// asi se cambia la imagen de toda la app desde este archivo.
//
// Son los mismos tokens del frontend web (frontend-transporte/src/index.css),
// para que la app y el panel web se vean de la misma marca.
export const colors = {
  // Marca
  rojo: '#d81e24',
  rojoHover: '#b8171c',
  rojoSuave: '#fdecec',
  vino: '#7a1113',
  vino2: '#611012',
  vino3: '#4d0d0f',
  salmon: '#e9a7a7',

  // Estados
  verde: '#17a34a',
  verdeSuave: '#e8f6ee',
  verdeTexto: '#1d6b41',
  verdeBorde: '#bfe4cd',
  ambar: '#b45309',
  ambarSuave: '#fef4e2',
  azul: '#1d4ed8',
  azulSuave: '#e7effc',
  error: '#c02b22',
  errorTexto: '#8d231d',
  errorBorde: '#f3c2bd',
  errorFondoCampo: '#fffafa',

  // Neutros
  tinta: '#16181d',
  texto: '#33363d',
  muted: '#6b7280',
  muted2: '#9aa3b2',
  linea: '#e4e7ee',
  linea2: '#eef0f5',
  fondoInput: '#f4f5f8',
  papel: '#f5f6f9',
  blanco: '#ffffff',

  // Superficies especiales de la portada
  heroTinte: '#fdf7f7',
  oscuraTexto: '#eed6d6',
  pieTexto: '#d8dae1',

  transparente: 'transparent'
} as const;

export interface Tono {
  fondo: string;
  texto: string;
}

export const TONOS = {
  programado: { fondo: colors.ambarSuave, texto: colors.ambar },
  curso: { fondo: colors.azulSuave, texto: colors.azul },
  hecho: { fondo: colors.verdeSuave, texto: colors.verdeTexto },
  cancelado: { fondo: colors.rojoSuave, texto: colors.error },
  neutro: { fondo: colors.fondoInput, texto: colors.muted }
} satisfies Record<string, Tono>;

// Marcas diacriticas (U+0300..U+036F): quitarlas hace que 'Transito' reconozca 'Tránsito'.
const DIACRITICOS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g');

const sinTildes = (texto: string) =>
  texto.toLowerCase().normalize('NFD').replace(DIACRITICOS, '');

/**
 * Color del distintivo segun el nombre del estado. Como los estados los
 * define el administrador, se reconocen por palabras clave (igual que en
 * el panel web) y cualquier otro cae en el tono neutro.
 */
export const tonoEstado = (nombreEstado: string): Tono => {
  const t = sinTildes(nombreEstado);
  if (t.includes('curso') || t.includes('ruta') || t.includes('transito')) return TONOS.curso;
  if (t.includes('final') || t.includes('complet') || t.includes('termin')) return TONOS.hecho;
  if (t.includes('cancel') || t.includes('anul')) return TONOS.cancelado;
  if (t.includes('program') || t.includes('pendien') || t.includes('asign')) return TONOS.programado;
  return TONOS.neutro;
};
