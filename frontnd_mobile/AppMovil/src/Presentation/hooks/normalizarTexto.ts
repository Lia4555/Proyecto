// Busqueda sin distinguir mayusculas ni tildes ("Bogota" encuentra "Bogotá").
// El rango ̀-ͯ son las marcas diacriticas que deja normalize('NFD').
const DIACRITICOS = new RegExp(
  `[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`,
  'g'
);

export const normalizarTexto = (texto: string): string =>
  texto.toLowerCase().normalize('NFD').replace(DIACRITICOS, '');
