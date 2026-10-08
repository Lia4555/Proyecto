import jwt from 'jsonwebtoken';
import { COOKIE_NAME, clearCookieOptions } from '../config/cookies.js';
import { supabase } from '../config/supabase.js';
import { ROL } from './permisos.js';

// ------------------------------------------------------------------
// La firma del token NO basta: en cada peticion se comprueba en la base
// de datos que la cuenta siga existiendo y activa, y el rol se toma de
// la base de datos, no del token. Asi:
//   · desactivar una cuenta la saca del sistema al momento,
//   · un cambio de rol se aplica sin esperar a que caduque el token,
//   · un token firmado con un secreto filtrado no sirve para inventar
//     usuarios ni para subirse el rol.
// Se guarda unos segundos en memoria para no consultar en cada peticion;
// aprobar, desactivar o cambiar la contraseña limpia esa memoria.
// ------------------------------------------------------------------
const CACHE_MS = 30000;
const sesiones = new Map();

export const limpiarSesion = (idUsuario) => sesiones.delete(idUsuario);
export const limpiarSesiones = () => sesiones.clear();

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function usuarioVigente(idUsuario) {
  const guardado = sesiones.get(idUsuario);
  if (guardado && guardado.hasta > Date.now()) return guardado.usuario;

  const { data: cuenta, error } = await supabase
    .from('usuario')
    .select('id_usuario, nombre, correo, activo, id_rol')
    .eq('id_usuario', idUsuario)
    .maybeSingle();
  if (error) throw error;

  let usuario = null;
  if (cuenta && cuenta.activo !== false) {
    const { data: rol, error: errorRol } = await supabase
      .from('roles')
      .select('nombre_rol, nivel_permiso')
      .eq('id_rol', cuenta.id_rol)
      .maybeSingle();
    if (errorRol) throw errorRol;

    if (rol && (rol.nombre_rol === ROL.ADMIN || rol.nombre_rol === ROL.CONDUCTOR)) {
      let idConductor = null;
      if (rol.nombre_rol === ROL.CONDUCTOR) {
        const { data: fichas, error: errorFicha } = await supabase
          .from('conductor')
          .select('id_conductor')
          .eq('email', cuenta.correo)
          .limit(1);
        if (errorFicha) throw errorFicha;
        idConductor = fichas?.[0]?.id_conductor ?? null;
      }
      usuario = {
        id_usuario: cuenta.id_usuario,
        nombre: cuenta.nombre,
        correo: cuenta.correo,
        id_rol: cuenta.id_rol,
        rol: rol.nombre_rol,
        nivel_permiso: rol.nivel_permiso,
        id_conductor: idConductor
      };
    }
  }

  sesiones.set(idUsuario, { usuario, hasta: Date.now() + CACHE_MS });
  return usuario;
}

const sesionInvalida = (res, mensaje = 'Sesion invalida, inicia sesion de nuevo') => {
  // La cookie ya no sirve: la borramos para que el navegador deje de mandarla
  // en cada peticion (si no, el usuario queda atrapado en un bucle de 401).
  res.clearCookie(COOKIE_NAME, clearCookieOptions);
  return res.status(401).json({ error: mensaje });
};

const authMiddleware = async (req, res, next) => {
  // 1) Via principal: la cookie httpOnly que puso el login.
  let token = req.cookies?.[COOKIE_NAME] || null;

  // 2) Alternativa: header Authorization (util para probar con Postman/curl).
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'No hay sesion activa. Inicia sesion.' });
  }

  let datos;
  try {
    // Solo se acepta el algoritmo con el que firma el login.
    datos = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    if (error.name === 'TokenExpiredError') return sesionInvalida(res, 'La sesion expiro, inicia sesion de nuevo');
    return sesionInvalida(res);
  }

  // Un token sin caducidad no lo emite el login: se rechaza.
  if (typeof datos.exp !== 'number' || !RE_UUID.test(String(datos.id_usuario ?? ''))) {
    return sesionInvalida(res);
  }

  try {
    const usuario = await usuarioVigente(datos.id_usuario);
    if (!usuario) {
      return sesionInvalida(res, 'Tu cuenta ya no está activa. Inicia sesión de nuevo o habla con un administrador.');
    }
    req.user = usuario;
    return next();
  } catch (error) {
    return next(error);
  }
};

export default authMiddleware;
