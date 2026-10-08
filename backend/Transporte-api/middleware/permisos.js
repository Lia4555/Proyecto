// ============================================================
// PERMISOS POR ROL  (solo existen dos roles en el sistema)
// ------------------------------------------------------------
//   Administrador (nivel 3) -> acceso total a toda la informacion.
//   Conductor     (nivel 2) -> SOLO puede:
//        · ver los servicios que el administrador le asigno
//        · cambiar el estado (y la llegada real / observaciones)
//          de esos servicios
//        · ver y reportar la informacion operativa del vehiculo
//          que conduce, con sus documentos y mantenimientos
//        · ver los catalogos necesarios para que la pantalla
//          muestre nombres en vez de codigos
//      Cualquier otra tabla u operacion se responde con 403.
//
// La regla vive AQUI, en el servidor. El frontend solo esconde
// botones: quien mande la peticion a mano igualmente choca con
// esta capa.
// ============================================================
import { supabase } from '../config/supabase.js';

export const NIVEL = { CONDUCTOR: 2, ADMIN: 3 };
export const ROL = { ADMIN: 'Administrador', CONDUCTOR: 'Conductor' };

export const esAdmin = (usuario) => (usuario?.nivel_permiso ?? 0) >= NIVEL.ADMIN;

// ------------------------------------------------------------------
// Que puede tocar un conductor, tabla por tabla.
//   ver: 'todos'   -> la tabla completa (catalogos sin datos sensibles)
//   ver: 'propios' -> solo las filas cuya columna esta en su alcance
//   editar: [...]  -> unicas columnas que puede modificar (PUT)
// Una tabla que no aparezca aqui esta prohibida por completo.
// ------------------------------------------------------------------
const PERMISOS_CONDUCTOR = {
  servicios: {
    ver: 'propios',
    columna: 'id_conductor',
    alcance: 'conductor',
    editar: ['id_estado', 'fecha_llegada_real', 'observaciones']
  },
  vehiculos: {
    ver: 'propios',
    columna: 'id_vehiculo',
    alcance: 'vehiculos',
    editar: ['estado_operativo', 'fecha_ultimo_mantenimiento', 'fecha_proximo_mantenimiento']
  },
  documentos_vehiculo: { ver: 'propios', columna: 'id_vehiculo', alcance: 'vehiculos' },
  mantenimientos: { ver: 'propios', columna: 'id_vehiculo', alcance: 'vehiculos' },
  alertas: { ver: 'propios', columna: 'id_usuario_destino', alcance: 'conductor' },
  conductor: { ver: 'propios', columna: 'id_conductor', alcance: 'conductor' },

  // Catalogos de solo lectura: sin ellos la pantalla mostraria numeros.
  estados_servicio: { ver: 'todos' },
  destinos: { ver: 'todos' },
  tipos_vehiculo: { ver: 'todos' },
  tipos_documentos: { ver: 'todos' },
  tipos_alerta: { ver: 'todos' }
};

// Columnas que un conductor puede cambiar, validadas de nuevo por tipo.
// Se aplican como parche parcial: no se exige el registro completo.
const VALIDACION_PARCIAL = {
  servicios: {
    id_estado: (v) => Number.isInteger(v) && v > 0,
    fecha_llegada_real: (v) => v === null || (typeof v === 'string' && !Number.isNaN(Date.parse(v))),
    observaciones: (v) => v === null || typeof v === 'string'
  },
  vehiculos: {
    estado_operativo: (v) => typeof v === 'boolean',
    fecha_ultimo_mantenimiento: (v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(String(v)),
    fecha_proximo_mantenimiento: (v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(String(v))
  }
};

// ------------------------------------------------------------------
// Vehiculos que le corresponden a un conductor: el que tiene asignado
// de forma fija mas los que conduce en alguno de sus servicios.
// Se cachean unos segundos porque el panel del conductor pide varias
// tablas seguidas y todas necesitan la misma lista.
// ------------------------------------------------------------------
const CACHE_MS = 15000;
const cacheVehiculos = new Map();

async function vehiculosDelConductor(idConductor) {
  const guardado = cacheVehiculos.get(idConductor);
  if (guardado && guardado.hasta > Date.now()) return guardado.ids;

  const [asignados, enServicios] = await Promise.all([
    supabase.from('vehiculos').select('id_vehiculo').eq('id_conductor_asignado', idConductor),
    supabase.from('servicios').select('id_vehiculo').eq('id_conductor', idConductor)
  ]);

  if (asignados.error) throw asignados.error;
  if (enServicios.error) throw enServicios.error;

  const ids = [
    ...new Set([
      ...(asignados.data || []).map((f) => f.id_vehiculo),
      ...(enServicios.data || []).map((f) => f.id_vehiculo)
    ])
  ].filter((v) => v !== null && v !== undefined);

  cacheVehiculos.set(idConductor, { ids, hasta: Date.now() + CACHE_MS });
  return ids;
}

// Si el administrador reasigna un vehiculo, el cache no debe retrasar el cambio.
export function limpiarCacheVehiculos() {
  cacheVehiculos.clear();
}

// ------------------------------------------------------------------
// Ficha del conductor que corresponde a la cuenta con la que se entro.
// Normalmente ya viaja dentro del token; el rodeo por correo cubre los
// tokens emitidos antes de este cambio.
// ------------------------------------------------------------------
async function idConductorDe(req) {
  if (req.user?.id_conductor) return req.user.id_conductor;
  if (req._idConductor !== undefined) return req._idConductor;

  const { data, error } = await supabase
    .from('conductor')
    .select('id_conductor')
    .eq('email', req.user?.correo || '')
    .limit(1);

  if (error) throw error;
  req._idConductor = data?.[0]?.id_conductor ?? null;
  return req._idConductor;
}

const prohibido = (res, mensaje) =>
  res.status(403).json({ error: mensaje || 'Tu rol no tiene acceso a esta informacion.' });

// ------------------------------------------------------------------
// Middleware principal. Se coloca delante de cada ruta generica.
//   · Administrador: pasa sin restricciones.
//   · Conductor: deja en req.alcance el filtro que debe aplicar el
//     controlador, y recorta el cuerpo del PUT a lo que puede tocar.
// ------------------------------------------------------------------
export const aplicarPermisos = (tabla) => async (req, res, next) => {
  try {
    if (esAdmin(req.user)) return next();

    const regla = PERMISOS_CONDUCTOR[tabla];
    if (!regla) return prohibido(res);

    const metodo = req.method.toUpperCase();

    // Crear y eliminar son exclusivos del administrador.
    if (metodo === 'POST' || metodo === 'DELETE') {
      return prohibido(res, 'Solo un administrador puede crear o eliminar registros.');
    }

    if (metodo === 'PUT' && !regla.editar) {
      return prohibido(res, 'Solo puedes consultar esta informacion, no modificarla.');
    }

    // Catalogo abierto: se lee entero y no hay nada mas que comprobar.
    if (regla.ver === 'todos') {
      if (metodo !== 'GET') return prohibido(res);
      return next();
    }

    const idConductor = await idConductorDe(req);
    if (!idConductor) {
      return prohibido(
        res,
        'Tu cuenta no esta vinculada a una ficha de conductor. Pide al administrador que la cree con tu mismo correo.'
      );
    }

    // Filtro que el controlador aplicara a la consulta.
    req.alcance = {
      columna: regla.columna,
      valores:
        regla.alcance === 'vehiculos'
          ? await vehiculosDelConductor(idConductor)
          : [idConductor]
    };

    if (metodo === 'GET') return next();

    // --- PUT: solo las columnas permitidas, y validadas por tipo -----
    const reglasTipo = VALIDACION_PARCIAL[tabla] || {};
    const cambios = {};
    const invalidos = [];

    for (const columna of regla.editar) {
      if (!(columna in req.body)) continue;
      const valor = req.body[columna];
      const comprueba = reglasTipo[columna];
      if (comprueba && !comprueba(valor)) {
        invalidos.push({ campo: columna, mensaje: 'El valor enviado no es valido.' });
        continue;
      }
      cambios[columna] = valor;
    }

    if (invalidos.length > 0) {
      return res.status(400).json({ error: 'Datos invalidos', detalles: invalidos });
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({
        error: `No enviaste ningun cambio permitido. En ${tabla} solo puedes modificar: ${regla.editar.join(', ')}.`
      });
    }

    // El controlador no debe volver a validar con el esquema completo:
    // esto es un cambio parcial, no el registro entero.
    req.body = cambios;
    req.cambioParcial = true;
    return next();
  } catch (error) {
    return next(error);
  }
};

// Puerta simple para rutas que son exclusivamente del administrador.
export const soloAdmin = (req, res, next) => {
  if (esAdmin(req.user)) return next();
  return prohibido(res, 'Solo un administrador puede realizar esta accion.');
};
