import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { documentoValido, mensajeDocumento, nombrePersona, telefono } from '../schemas/reglas.js';
import { NIVEL, ROL, limpiarCacheVehiculos } from '../middleware/permisos.js';
import { limpiarSesion } from '../middleware/authMiddleware.js';
import { enmascarar } from '../middleware/datosSensibles.js';

export const TIPOS_DOCUMENTO = ['CC', 'CE', 'PA'];

const esquemaRegistro = z.object({
  nombre: nombrePersona('El nombre'),
  apellido: nombrePersona('El apellido'),
  tipo_documento: z.enum(TIPOS_DOCUMENTO, {
    errorMap: () => ({ message: 'Elige un tipo de documento válido.' })
  }),
  numero_documento: z
    .string({ required_error: 'El número de documento es obligatorio.' })
    .trim()
    .transform((v) => v.replace(/[\s.]/g, '')),
  telefono: telefono(),
  correo: z
    .string({ required_error: 'El correo es obligatorio.' })
    .trim()
    .max(120, 'El correo es demasiado largo.')
    .email('El correo no tiene un formato válido.'),
  contrasena: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(72, 'La contraseña admite como máximo 72 caracteres.')
}).superRefine((d, ctx) => {
  // CC y CE solo numeros; el pasaporte  letras.
  if (!documentoValido(d.tipo_documento, d.numero_documento)) {
    ctx.addIssue({ code: 'custom', path: ['numero_documento'], message: mensajeDocumento(d.tipo_documento) });
  }
});

const conflicto = (res, campo, mensaje) =>
  res.status(409).json({ error: mensaje, detalles: [{ campo, mensaje }] });


async function idRolPorNombre(nombre) {
  const { data, error } = await supabase
    .from('roles')
    .select('id_rol, nivel_permiso')
    .eq('nombre_rol', nombre)
    .order('id_rol');
  if (error) throw error;

  const nivelEsperado = nombre === ROL.ADMIN ? NIVEL.ADMIN : NIVEL.CONDUCTOR;
  const fila = data?.find((r) => r.nivel_permiso === nivelEsperado) ?? data?.[0];
  return fila?.id_rol ?? null;
}

const idRolConductor = () => idRolPorNombre(ROL.CONDUCTOR);


// POST /api/auth/register  (publico)
export const registrar = async (req, res, next) => {
  try {
    const datos = esquemaRegistro.parse(req.body ?? {});

   //el documento no se puede repetir
    const [cuenta, fichaCorreo, fichaDocumento] = await Promise.all([
      supabase.from('usuario').select('id_usuario').eq('correo', datos.correo).limit(1),
      supabase.from('conductor').select('id_conductor').eq('email', datos.correo).limit(1),
      supabase
        .from('conductor')
        .select('id_conductor')
        .eq('numero_documento', datos.numero_documento)
        .limit(1)
    ]);
    for (const r of [cuenta, fichaCorreo, fichaDocumento]) if (r.error) throw r.error;

    if (cuenta.data.length || fichaCorreo.data.length) {
      return conflicto(res, 'correo', 'Ya existe una cuenta o una solicitud con ese correo.');
    }
    if (fichaDocumento.data.length) {
      return conflicto(res, 'numero_documento', 'Ya hay un conductor registrado con ese documento.');
    }

    const idRol = await idRolConductor();
    if (!idRol) {
      const err = new Error('El sistema no tiene configurado el rol Conductor.');
      err.status = 500;
      throw err;
    }

    // Ficha de conductor, apagada hasta la aprobacion.
    const { data: ficha, error: errorFicha } = await supabase
      .from('conductor')
      .insert([
        {
          nombre: datos.nombre,
          apellido: datos.apellido,
          tipo_documento: datos.tipo_documento,
          numero_documento: datos.numero_documento,
          email: datos.correo,
          telefono: datos.telefono,
          id_rol: idRol,
          activo: false
        }
      ])
      .select('id_conductor')
      .single();
    if (errorFicha) throw errorFicha;

    //  Cuenta de acceso, tambien apagada. Si falla, se deshace la ficha
    const hash = await bcrypt.hash(datos.contrasena, 10);
    const { error: errorCuenta } = await supabase.from('usuario').insert([
      {
        nombre: datos.nombre,
        apellido: datos.apellido,
        correo: datos.correo,
        contrasena: hash,
        telefono: datos.telefono,
        activo: false,
        id_rol: idRol
      }
    ]);

    if (errorCuenta) {
      await supabase.from('conductor').delete().eq('id_conductor', ficha.id_conductor);
      throw errorCuenta;
    }

    return res.status(201).json({
      message:
        'Solicitud enviada. Un administrador debe aprobar tu cuenta antes de que puedas iniciar sesión.'
    });
  } catch (error) {
    next(error);
  }
};

// Rutas del administrador (/api/cuentas)
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Estado de una cuenta: pendiente, activa o desactivada

let columnaAprobacion = { existe: null, revisarDespuesDe: 0 };

async function hayColumnaAprobacion() {
  if (columnaAprobacion.existe === true) return true;
  if (columnaAprobacion.existe === false && Date.now() < columnaAprobacion.revisarDespuesDe) return false;

  const { error } = await supabase.from('usuario').select('aprobada_en').limit(1);
  if (error && (error.code === '42703' || /aprobada_en/.test(error.message || ''))) {
    // Se vuelve a mirar cada minuto: asi basta con ejecutar el SQL, sin reiniciar.
    columnaAprobacion = { existe: false, revisarDespuesDe: Date.now() + 60000 };
    return false;
  }
  if (error) throw error;
  columnaAprobacion = { existe: true, revisarDespuesDe: 0 };
  return true;
}

export const estadoCuenta = (cuenta) => {
  if (cuenta.activo) return 'activa';
  return cuenta.aprobada_en ? 'desactivada' : 'pendiente';
};

async function buscarCuenta(id) {
  const columnas = `id_usuario, correo, activo, id_rol${(await hayColumnaAprobacion()) ? ', aprobada_en' : ''}`;
  const { data, error } = await supabase
    .from('usuario')
    .select(columnas)
    .eq('id_usuario', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function nombreRol(idRol) {
  const { data, error } = await supabase
    .from('roles')
    .select('nombre_rol')
    .eq('id_rol', idRol)
    .maybeSingle();
  if (error) throw error;
  return data?.nombre_rol ?? null;
}

const noEncontrada = (res) => res.status(404).json({ error: 'Cuenta no encontrada.' });

// GET /api/cuentas  — nunca se devuelve la columna "contrasena".
export const listar = async (req, res, next) => {
  try {
    const conAprobacion = await hayColumnaAprobacion();
    const [cuentas, roles, fichas] = await Promise.all([
      supabase
        .from('usuario')
        .select(
          `id_usuario, nombre, apellido, correo, telefono, activo, id_rol, fecha_registro${conAprobacion ? ', aprobada_en' : ''}`
        )
        .order('fecha_registro', { ascending: false }),
      supabase.from('roles').select('id_rol, nombre_rol'),
      supabase.from('conductor').select('id_conductor, email, tipo_documento, numero_documento')
    ]);
    for (const r of [cuentas, roles, fichas]) if (r.error) throw r.error;

    const rolPorId = new Map(roles.data.map((r) => [r.id_rol, r.nombre_rol]));
    const fichaPorCorreo = new Map(fichas.data.map((f) => [f.email, f]));

    return res.json(
      cuentas.data.map((c) => {
        const ficha = fichaPorCorreo.get(c.correo);
        const rol = rolPorId.get(c.id_rol) ?? null;
        return {
          ...c,
          // Un administrador nunca viene del registro publico: apagado, esta desactivado.
          estado: !c.activo && rol === ROL.ADMIN ? 'desactivada' : estadoCuenta(c),
          rol,
          tiene_ficha: Boolean(ficha),
          tipo_documento: ficha?.tipo_documento ?? null,
          numero_documento: enmascarar(ficha?.numero_documento ?? null),
          es_tu_cuenta: c.id_usuario === req.user.id_usuario
        };
      })
    );
  } catch (error) {
    next(error);
  }
};

// PATCH /api/cuentas/:id/aprobar
export const aprobar = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!RE_UUID.test(id)) return noEncontrada(res);

    const cuenta = await buscarCuenta(id);
    if (!cuenta) return noEncontrada(res);
    if (cuenta.activo) return res.status(400).json({ error: 'Esta cuenta ya está activa.' });

    //aqui el admi istrador delega el acceso
    const rolPedido = req.body?.rol;
    if (rolPedido !== undefined && rolPedido !== ROL.ADMIN && rolPedido !== ROL.CONDUCTOR) {
      return res.status(400).json({
        error: `El rol debe ser "${ROL.ADMIN}" o "${ROL.CONDUCTOR}".`,
        detalles: [{ campo: 'rol', mensaje: 'Elige uno de los dos roles.' }]
      });
    }

    const eraDesactivada = Boolean(cuenta.aprobada_en);
    const cambios = { activo: true };
    // La primera aprobacion queda registrada; reactivar no la cambia.
    if ((await hayColumnaAprobacion()) && !cuenta.aprobada_en) {
      cambios.aprobada_en = new Date().toISOString();
    }

    if (rolPedido) {
      const idRol = await idRolPorNombre(rolPedido);
      if (!idRol) {
        return res.status(500).json({ error: `El sistema no tiene configurado el rol ${rolPedido}.` });
      }
      cambios.id_rol = idRol;
    }

    // Rol con el que la cuenta queda finalmente 
    const rolFinal = rolPedido ?? (await nombreRol(cuenta.id_rol));

    const { error } = await supabase.from('usuario').update(cambios).eq('id_usuario', id);
    if (error) throw error;

    
    const esConductor = rolFinal === ROL.CONDUCTOR;
    const { error: errorFicha } = await supabase
      .from('conductor')
      .update({ activo: esConductor })
      .eq('email', cuenta.correo);
    if (errorFicha) throw errorFicha;

    // Un Conductor sin ficha no puede entrar 
    let advertencia = null;
    if (esConductor) {
      const { data: ficha, error: errorBusqueda } = await supabase
        .from('conductor')
        .select('id_conductor')
        .eq('email', cuenta.correo)
        .limit(1);
      if (errorBusqueda) throw errorBusqueda;
      if (!ficha?.length) {
        advertencia = `Ojo: no existe una ficha de conductor con el correo ${cuenta.correo}. Creala para que pueda entrar.`;
      }
    }

    limpiarCacheVehiculos();
    limpiarSesion(id);
    return res.json({
      success: true,
      rol: rolFinal,
      advertencia,
      message: eraDesactivada
        ? `Cuenta ${cuenta.correo} reactivada como ${rolFinal}.`
        : `Cuenta ${cuenta.correo} aprobada como ${rolFinal}.`
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/cuentas/:id/desactivar
export const desactivar = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!RE_UUID.test(id)) return noEncontrada(res);
    if (id === req.user.id_usuario) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta.' });
    }

    const cuenta = await buscarCuenta(id);
    if (!cuenta) return noEncontrada(res);
    if (!cuenta.activo) return res.status(400).json({ error: 'Esta cuenta ya no está activa.' });

    // Nunca puede quedar el sistema sin ningun administrador que pueda entrar.
    if ((await nombreRol(cuenta.id_rol)) === ROL.ADMIN) {
      const { count, error: errorConteo } = await supabase
        .from('usuario')
        .select('id_usuario', { count: 'exact', head: true })
        .eq('id_rol', cuenta.id_rol)
        .eq('activo', true);
      if (errorConteo) throw errorConteo;
      if ((count ?? 0) <= 1) {
        return res.status(400).json({ error: 'No puedes desactivar al último administrador activo.' });
      }
    }

    const cambios = { activo: false };
    // Una cuenta activa sin fecha de aprobacion (anterior a la columna) se
    // marca como aprobada: asi aparece como Desactivada y no como Pendiente.
    if ((await hayColumnaAprobacion()) && !cuenta.aprobada_en) {
      cambios.aprobada_en = new Date().toISOString();
    }

    const { error } = await supabase.from('usuario').update(cambios).eq('id_usuario', id);
    if (error) throw error;

    await supabase.from('conductor').update({ activo: false }).eq('email', cuenta.correo);

    // Sus sesiones abiertas dejan de servir desde ya.
    limpiarSesion(id);
    return res.json({ success: true, message: `Cuenta ${cuenta.correo} desactivada.` });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cuentas/:id  — rechaza una solicitud (solo cuentas pendientes).
export const rechazar = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!RE_UUID.test(id)) return noEncontrada(res);
    if (id === req.user.id_usuario) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
    }

    const cuenta = await buscarCuenta(id);
    if (!cuenta) return noEncontrada(res);
    if (cuenta.activo) {
      return res.status(400).json({ error: 'Solo se pueden rechazar solicitudes pendientes.' });
    }

    // Una cuenta desactivada ya estuvo en uso: rechazarla borraria una cuenta
    // real. Tampoco un administrador, que nunca viene del registro publico.
    const rol = await nombreRol(cuenta.id_rol);
    if (cuenta.aprobada_en || rol === ROL.ADMIN) {
      return res.status(400).json({
        error: 'Esta cuenta ya había sido aprobada: no es una solicitud. Puedes reactivarla o dejarla desactivada.'
      });
    }

    const { error } = await supabase.from('usuario').delete().eq('id_usuario', id);
    if (error) throw error;
    limpiarSesion(id);

    // La ficha se borra solo si es de un conductor sin historial: si ya tiene
    // servicios o vehiculos asignados, se conserva (y queda apagada).
    let fichaEliminada = false;
    if (rol === ROL.CONDUCTOR) {
      const { data: ficha } = await supabase
        .from('conductor')
        .select('id_conductor')
        .eq('email', cuenta.correo)
        .maybeSingle();

      if (ficha) {
        const [servicios, vehiculos] = await Promise.all([
          supabase.from('servicios').select('id_servicio').eq('id_conductor', ficha.id_conductor).limit(1),
          supabase.from('vehiculos').select('id_vehiculo').eq('id_conductor_asignado', ficha.id_conductor).limit(1)
        ]);
        if (!servicios.data?.length && !vehiculos.data?.length) {
          const { error: errorFicha } = await supabase
            .from('conductor')
            .delete()
            .eq('id_conductor', ficha.id_conductor);
          fichaEliminada = !errorFicha;
        }
      }
    }

    return res.json({
      success: true,
      message: fichaEliminada
        ? `Solicitud de ${cuenta.correo} rechazada y eliminada.`
        : `Solicitud de ${cuenta.correo} rechazada. Su ficha de conductor se conservó porque tiene historial.`
    });
  } catch (error) {
    next(error);
  }
};


// CONTRASEÑAS
// Cambiar una contraseña es una acción crítica: SIEMPRE exige token.
// Antes bastaba con conocer el correo y el teléfono (datos que no son
// secretos) para poner una contraseña nueva a cualquier cuenta.
export const esquemaContrasena = z
  .string({ required_error: 'La contraseña es obligatoria.', invalid_type_error: 'La contraseña debe ser texto.' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(72, 'La contraseña admite como máximo 72 caracteres.');

// POST /api/auth/recuperar  (publico, retirado)
// Se deja la ruta para que las pantallas antiguas reciban un mensaje claro.
export const recuperarContrasena = (req, res) =>
  res.status(410).json({
    error:
      'La recuperación con correo y teléfono se retiró por seguridad. Pide a un administrador que restablezca tu contraseña.'
  });

// PATCH /api/cuentas/:id/contrasena  (solo administrador)
export const restablecerContrasena = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!RE_UUID.test(id)) return noEncontrada(res);
    const contrasena = esquemaContrasena.parse(req.body?.contrasena);

    const cuenta = await buscarCuenta(id);
    if (!cuenta) return noEncontrada(res);

    const hash = await bcrypt.hash(contrasena, 10);
    const { error } = await supabase.from('usuario').update({ contrasena: hash }).eq('id_usuario', id);
    if (error) throw error;

    limpiarSesion(id);
    return res.json({
      success: true,
      message: `Contraseña de ${cuenta.correo} restablecida. Entrégasela por un canal seguro y pídele que la cambie al entrar.`
    });
  } catch (error) {
    next(error);
  }
};
