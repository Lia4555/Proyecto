import { supabase } from '../config/supabase.js';
import { schemas } from '../schemas/genericSchema.js';
import { limpiarCacheVehiculos } from '../middleware/permisos.js';
import { completarServicios, prepararEscritura } from './reglasTablas.js';
import { descartarEnmascarados, protegerDatos } from '../middleware/datosSensibles.js';

const AFECTAN_ALCANCE = new Set(['vehiculos', 'servicios']);


const dentroDelAlcance = (alcance, fila) => {
  if (!alcance) return true;
  if (!fila) return false;
  return alcance.valores.map(String).includes(String(fila[alcance.columna]));
};

export const createController = (tableName, primaryKeyName) => {
  return {

    // 1. POST (Crear) - reservado al administrador por el router
    create: async (req, res, next) => {
      try {
        const schema = schemas[tableName];
        // Zod valida Y elimina campos no definidos (protege contra "mass assignment":
        // que alguien intente colar columnas extra en el insert).
        if (schema) {
          req.body = schema.parse(req.body);
        }
        // La clave primaria la asigna la base de datos, nunca el cliente.
        delete req.body[primaryKeyName];

        // Consecutivos, valores repetidos, documentos y origen/destino.
        await prepararEscritura(tableName, primaryKeyName, req.body, { esCreacion: true });

        const { data, error } = await supabase
          .from(tableName)
          .insert([req.body])
          .select();

        if (error) throw error;
        if (AFECTAN_ALCANCE.has(tableName)) limpiarCacheVehiculos();

        return res.status(201).json({
          success: true,
          message: `Registro creado en ${tableName}`,
          data: protegerDatos(tableName, data && data.length > 0 ? data[0] : req.body)
        });
      } catch (error) {
        next(error);
      }
    },

    // 2. GET ALL (Listar)
   
    getAll: async (req, res, next) => {
      try {
        let consulta = supabase.from(tableName).select('*');

        if (req.alcance) {
          // Sin nada asignado todavia: lista vacia, no la tabla completa.
          if (req.alcance.valores.length === 0) return res.status(200).json([]);
          consulta = consulta.in(req.alcance.columna, req.alcance.valores);
        }

        const { data, error } = await consulta;
        if (error) throw error;
        if (tableName === 'servicios') await completarServicios(data);
        return res.status(200).json(protegerDatos(tableName, data));
      } catch (error) {
        next(error);
      }
    },

    // 3. GET
    getById: async (req, res, next) => {
      try {
        const { id } = req.params;
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq(primaryKeyName, id)
          .maybeSingle(); // no lanza error si no encuentra nada

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Registro no encontrado' });

       
        if (!dentroDelAlcance(req.alcance, data)) {
          return res.status(404).json({ error: 'Registro no encontrado' });
        }

        if (tableName === 'servicios') await completarServicios(data);
        return res.status(200).json(protegerDatos(tableName, data));
      } catch (error) {
        next(error);
      }
    },

    // 4. PUT (Actualizar)
    update: async (req, res, next) => {
      try {
        const { id } = req.params;

        if (req.alcance) {
          const { data: actual, error: errorLectura } = await supabase
            .from(tableName)
            .select('*')
            .eq(primaryKeyName, id)
            .maybeSingle();

          if (errorLectura) throw errorLectura;
          if (!actual || !dentroDelAlcance(req.alcance, actual)) {
            return res.status(404).json({ error: 'Registro no encontrado' });
          }
        }

        // Un formulario puede reenviar los valores enmascarados que leyo
        // (••••5678): no son cambios y no deben pisar el dato real.
        descartarEnmascarados(tableName, req.body);

        const schema = schemas[tableName];
        if (schema && !req.cambioParcial) {
          req.body = schema.partial().parse(req.body ?? {});
        }
        // La clave primaria identifica el registro: no se puede cambiar.
        if (req.body) delete req.body[primaryKeyName];

        if (!req.body || Object.keys(req.body).length === 0) {
          return res.status(400).json({ error: 'No enviaste ningún cambio válido.' });
        }

        await prepararEscritura(tableName, primaryKeyName, req.body, { esCreacion: false, id });

        const { data, error } = await supabase
          .from(tableName)
          .update(req.body)
          .eq(primaryKeyName, id)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          return res.status(404).json({ error: 'Registro no encontrado' });
        }

        if (AFECTAN_ALCANCE.has(tableName)) limpiarCacheVehiculos();

        return res.status(200).json({ success: true, data: protegerDatos(tableName, data[0]) });
      } catch (error) {
        next(error);
      }
    },

    // 5. DELETE 
    delete: async (req, res, next) => {
      try {
        const { id } = req.params;
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq(primaryKeyName, id);

        if (error) throw error;
        if (AFECTAN_ALCANCE.has(tableName)) limpiarCacheVehiculos();

        return res.status(200).json({ success: true, message: 'Registro eliminado exitosamente' });
      } catch (error) {
        next(error);
      }
    }
  };
};
