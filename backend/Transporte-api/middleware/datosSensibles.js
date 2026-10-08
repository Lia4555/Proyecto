// ============================================================
// DATOS DELICADOS (minimizacion de datos personales)
// ------------------------------------------------------------
// La API nunca devuelve datos personales que la pantalla no
// necesita, ni siquiera al administrador:
//   ocultar    -> la columna no sale en la respuesta.
//   enmascarar -> solo se ven los ultimos 4 caracteres (••••5678).
// Se pueden seguir enviando al crear o editar: solo no se leen.
// ============================================================

export const MASCARA = '••••';

const POLITICA = {
  conductor: {
    ocultar: ['fecha_nacimiento', 'direccion', 'ultimo_acceso'],
    enmascarar: ['numero_documento', 'licencia_conduccion']
  },
  cliente: {
    ocultar: ['fecha_nacimiento', 'direccion'],
    enmascarar: ['numero_documento']
  },
  // Listado de cuentas de acceso (/api/cuentas)
  usuario: {
    ocultar: ['contrasena'],
    enmascarar: ['numero_documento']
  }
};

export const enmascarar = (valor) => {
  if (valor === null || valor === undefined || valor === '') return valor;
  const texto = String(valor);
  return texto.length > 4 ? `${MASCARA}${texto.slice(-4)}` : MASCARA;
};

function limpiarFila(fila, politica) {
  if (!fila || typeof fila !== 'object') return fila;
  const copia = { ...fila };
  for (const c of politica.ocultar) delete copia[c];
  for (const c of politica.enmascarar) if (c in copia) copia[c] = enmascarar(copia[c]);
  return copia;
}

// Devuelve una copia segura de una fila o de una lista de filas.
export function protegerDatos(tabla, datos) {
  const politica = POLITICA[tabla];
  if (!politica) return datos;
  return Array.isArray(datos) ? datos.map((f) => limpiarFila(f, politica)) : limpiarFila(datos, politica);
}

// Al editar, un formulario puede reenviar el valor enmascarado que leyo
// ("••••5678"). Ese valor no es un cambio: se descarta para no pisar el real.
export function descartarEnmascarados(tabla, cuerpo) {
  const politica = POLITICA[tabla];
  if (!politica || !cuerpo || typeof cuerpo !== 'object') return cuerpo;
  for (const c of politica.enmascarar) {
    if (typeof cuerpo[c] === 'string' && cuerpo[c].includes(MASCARA)) delete cuerpo[c];
  }
  return cuerpo;
}
