import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carga las variables del archivo .env en process.env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Validación: avisa si falta configurar el .env y detiene el arranque
if (!supabaseUrl || !supabaseKey) {
  console.error(' Error: SUPABASE_URL o SUPABASE_KEY no están definidas en el archivo .env');
  process.exit(1);
}


const ESTADOS_PASAJEROS = new Set([502, 503, 504]);
const ESPERAS_MS = [300, 900];
const TIEMPO_MAXIMO_MS = 12000;

const espera = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchConReintentos(url, opciones = {}) {
  const metodo = (opciones.method || 'GET').toUpperCase();
  const esLectura = metodo === 'GET' || metodo === 'HEAD';
  const intentos = esLectura ? ESPERAS_MS.length + 1 : 1;

  for (let intento = 1; ; intento++) {
    // Cada intento tiene su propio limite de tiempo
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);
    const cancelarDesdeFuera = () => control.abort();
    opciones.signal?.addEventListener('abort', cancelarDesdeFuera, { once: true });

    try {
      const respuesta = await fetch(url, { ...opciones, signal: control.signal });
      if (!ESTADOS_PASAJEROS.has(respuesta.status) || intento >= intentos) return respuesta;
      console.warn(` Supabase respondió ${respuesta.status} en una lectura; reintento ${intento}/${intentos - 1}`);
    } catch (error) {
      if (opciones.signal?.aborted || intento >= intentos) throw error;
      console.warn(` Supabase no respondió (${error.name}); reintento ${intento}/${intentos - 1}`);
    } finally {
      clearTimeout(temporizador);
      opciones.signal?.removeEventListener('abort', cancelarDesdeFuera);
    }

    await espera(ESPERAS_MS[intento - 1]);
  }
}

// Cliente para uso en el SERVIDOR: no necesita guardar sesión ni refrescar tokens.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    fetch: fetchConReintentos
  }
});
