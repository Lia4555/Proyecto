import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { COOKIE_NAME, cookieOptions, clearCookieOptions } from '../config/cookies.js';
import { ROL } from '../middleware/permisos.js';

if (!process.env.JWT_SECRET) {
  console.error(' Falta JWT_SECRET en el archivo .env. Definelo antes de usar auth.');
}

// Solo hay dos roles y el registro publico
// (controllers/cuentasController.js) crea cuentas de Conductor APAGADAS:
// aqui se rechazan hasta que un administrador las apruebe.

// 1. LOGIN -> guarda el token en una COOKIE httpOnly
export const login = async (req, res, next) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Correo y contrasena son obligatorios' });
    }

    const { data: usuario, error } = await supabase
      .from('usuario').select('*').eq('correo', correo).single();

    if (error || !usuario) {
      return res.status(401).json({ error: 'El correo o la contrasena son incorrectos.' });
    }

    const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esValida) {
      return res.status(401).json({ error: 'El correo o la contrasena son incorrectos.' });
    }

    // Se comprueba DESPUES de la contraseña: asi nadie puede averiguar si un
    // correo tiene una solicitud pendiente sin conocer su clave.
    if (usuario.activo === false) {
      return res.status(403).json({
        error: 'Tu cuenta todavía no está activa. Un administrador debe aprobarla antes de que puedas entrar.'
      });
    }

    const { data: rol } = await supabase
      .from('roles').select('nombre_rol, nivel_permiso').eq('id_rol', usuario.id_rol).maybeSingle();

    const nombreRol = rol?.nombre_rol ?? null;
    const nivelPermiso = rol?.nivel_permiso ?? 0;

    // si el administrador no le da permiso aparece este mensaje
    if (nombreRol !== ROL.ADMIN && nombreRol !== ROL.CONDUCTOR) {
      return res.status(403).json({
        error: 'Tu cuenta no tiene un rol valido asignado. Pide al administrador que te asigne Administrador o Conductor.'
      });
    }

    // El conductor se identifica con su ficha de la tabla "conductor", que es
    // la que usan los servicios. Las dos se unen por correo.
    let idConductor = null;
    if (nombreRol === ROL.CONDUCTOR) {
      const { data: fichas, error: errorFicha } = await supabase
        .from('conductor')
        .select('id_conductor')
        .eq('email', usuario.correo)
        .limit(1);

      if (errorFicha) throw errorFicha;
      idConductor = fichas?.[0]?.id_conductor ?? null;

      // cuando no tiene numero de ficha le aprece este mensaje.
      if (!idConductor) {
        return res.status(403).json({
          error: `Tu cuenta de conductor todavia no tiene ficha en el sistema. Pide al administrador que cree el conductor con el correo ${usuario.correo}.`
        });
      }
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo,
        nombre: usuario.nombre,
        id_rol: usuario.id_rol,
        rol: nombreRol,
        nivel_permiso: nivelPermiso,
        id_conductor: idConductor
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie(COOKIE_NAME, token, cookieOptions);

      const esClienteMovil = req.get('X-Client') === 'mobile';

    return res.json({
      message: 'Login exitoso',
      ...(esClienteMovil ? { token } : {}),
      user: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        id_rol: usuario.id_rol,
        rol: nombreRol,
        nivel_permiso: nivelPermiso,
        id_conductor: idConductor
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. LOGOUT -> borra la cookie
export const logout = (req, res) => {
  // Mismas opciones con las que se creo (menos maxAge) -> el navegador si la borra.
  res.clearCookie(COOKIE_NAME, clearCookieOptions);
  return res.json({ message: 'Sesion cerrada' });
};

// 3. ME -> devuelve el usuario actual si la cookie sigue siendo valida.
export const me = (req, res) => {
  return res.json({
    user: {
      id_usuario: req.user.id_usuario,
      nombre: req.user.nombre ?? null,
      correo: req.user.correo,
      id_rol: req.user.id_rol,
      rol: req.user.rol,
      nivel_permiso: req.user.nivel_permiso,
      id_conductor: req.user.id_conductor ?? null
    }
  });
};
