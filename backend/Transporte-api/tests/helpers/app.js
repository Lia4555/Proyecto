// ============================================================
// Carga la app de Express con el Supabase FALSO en lugar del real.
// ------------------------------------------------------------
// jest.unstable_mockModule reemplaza config/supabase.js antes de
// importar la app: todo el codigo (controladores, middlewares) usa
// sin saberlo la base en memoria de fakeSupabase.js.
//
// Uso en cada archivo de prueba:
//   const ctx = await cargarApp();
//   beforeEach(() => ctx.reiniciar());
// ============================================================
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'node:url';
import { crearSupabaseFalso } from './fakeSupabase.js';
import { datosIniciales, IDS } from './datos.js';

export async function cargarApp() {
  const { supabase, bd } = crearSupabaseFalso();

  // Ruta absoluta: Jest resolveria una relativa desde otro archivo.
  const rutaSupabase = fileURLToPath(new URL('../../config/supabase.js', import.meta.url));
  jest.unstable_mockModule(rutaSupabase, () => ({
    supabase,
    fetchConReintentos: fetch
  }));

  const { crearApp } = await import('../../app.js');
  const { limpiarSesiones } = await import('../../middleware/authMiddleware.js');
  const { limpiarCacheVehiculos } = await import('../../middleware/permisos.js');

  const app = crearApp();

  return {
    app,
    bd,
    // Datos limpios y caches vacias: cada prueba es independiente.
    reiniciar() {
      bd.cargar(datosIniciales());
      limpiarSesiones();
      limpiarCacheVehiculos();
    }
  };
}

// Token firmado igual que lo hace el login (evita gastar intentos del
// limitador de login en cada prueba).
export const tokenDe = (idUsuario, opciones = { expiresIn: '1h' }) =>
  jwt.sign({ id_usuario: idUsuario }, process.env.JWT_SECRET, opciones);

export const bearer = (idUsuario) => `Bearer ${tokenDe(idUsuario)}`;

export const AUTH = {
  admin: () => bearer(IDS.admin),
  conductor1: () => bearer(IDS.conductor1),
  conductor2: () => bearer(IDS.conductor2)
};
