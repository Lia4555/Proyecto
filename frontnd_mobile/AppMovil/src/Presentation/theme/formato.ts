// Como se muestran fechas y dinero en la app. Vive en theme porque es
// parte de la presentacion: el dominio guarda los datos en crudo.

const RELLENO = (n: number) => String(n).padStart(2, '0');

// "2026-10-04" (fecha sin hora) se interpreta en hora LOCAL. new Date() la
// tomaria como medianoche UTC, y en Colombia (UTC-5) se veria un dia antes.
const aFecha = (iso: string): Date => {
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (soloFecha) return new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
  return new Date(iso);
};

// ---------------------------------------------------------------------------
// Entrada de fechas en formularios (sin selector nativo): se escribe
// "DD/MM/AAAA" y "HH:MM" y la mascara pone las barras y los dos puntos.
// ---------------------------------------------------------------------------

/** "12032026" -> "12/03/2026" mientras se escribe. */
export const mascaraFecha = (texto: string): string => {
  const d = texto.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

/** "0830" -> "08:30" mientras se escribe. */
export const mascaraHora = (texto: string): string => {
  const d = texto.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
};

/** Date -> "DD/MM/AAAA" (para rellenar un campo). */
export const aTextoFecha = (fecha: Date): string =>
  `${RELLENO(fecha.getDate())}/${RELLENO(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;

/** "DD/MM/AAAA" -> Date local a medianoche, o null si no es una fecha real. */
export const leerFecha = (texto: string): Date | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const fecha = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  // Rechaza 31/02/2026 y similares (Date lo convertiria en otro dia).
  return fecha.getDate() === Number(m[1]) && fecha.getMonth() === Number(m[2]) - 1 ? fecha : null;
};

/** "DD/MM/AAAA" + "HH:MM" -> Date local, o null. */
export const leerFechaHora = (fecha: string, hora: string): Date | null => {
  const dia = leerFecha(fecha);
  const h = /^(\d{2}):(\d{2})$/.exec(hora.trim());
  if (!dia || !h || Number(h[1]) > 23 || Number(h[2]) > 59) return null;
  dia.setHours(Number(h[1]), Number(h[2]), 0, 0);
  return dia;
};

/** Date -> "AAAA-MM-DD" (formato de las columnas date de la base). */
export const aFechaISO = (fecha: Date): string =>
  `${fecha.getFullYear()}-${RELLENO(fecha.getMonth() + 1)}-${RELLENO(fecha.getDate())}`;

/** 2026-03-14T08:30:00Z -> "14/03/2026 08:30" */
export const formatearFechaHora = (iso: string | null): string => {
  if (!iso) return 'Sin registrar';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return 'Sin registrar';
  return `${RELLENO(fecha.getDate())}/${RELLENO(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${RELLENO(fecha.getHours())}:${RELLENO(fecha.getMinutes())}`;
};

/** Solo la fecha, sin hora. */
export const formatearFecha = (iso: string | null): string => {
  if (!iso) return 'Sin registrar';
  const fecha = aFecha(iso);
  if (Number.isNaN(fecha.getTime())) return 'Sin registrar';
  return aTextoFecha(fecha);
};

/** 125000 -> "$ 125.000" */
export const formatearPesos = (valor: number | null): string => {
  if (valor === null || Number.isNaN(valor)) return '-';
  return `$ ${Math.round(valor).toLocaleString('es-CO')}`;
};

/** Dias que faltan (negativo si ya paso). */
export const diasRestantes = (iso: string | null): number | null => {
  if (!iso) return null;
  const objetivo = aFecha(iso).getTime();
  if (Number.isNaN(objetivo)) return null;
  return Math.ceil((objetivo - Date.now()) / (1000 * 60 * 60 * 24));
};
