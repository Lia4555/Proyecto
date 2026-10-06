import { supabase } from '../config/supabase.js';
import { schemas } from '../schemas/genericSchema.js';

export const createController = (tableName, primaryKeyName) => {
  return {

    // 1. POST (Crear)
    create: async (req, res, next) => {
      try {
        const schema = schemas[tableName];
        
        if (schema) {
          req.body = schema.parse(req.body);
        }

        const { data, error } = await supabase
          .from(tableName)
          .insert([req.body])
          .select();

        if (error) throw error;

        return res.status(201).json({
          success: true,
          message: `Registro creado en ${tableName}`,
          data: data && data.length > 0 ? data[0] : req.body
        });
      } catch (error) {
        next(error);
      }
    },

    // 2. GET ALL (Listar todos)
    getAll: async (req, res, next) => {
      try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) throw error;
        return res.status(200).json(data);
      } catch (error) {
        next(error);
      }
    },

    // 3. GET BY ID (Buscar uno)
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

        return res.status(200).json(data);
      } catch (error) {
        next(error);
      }
    },

    // 4. PUT (Actualizar)
    update: async (req, res, next) => {
      try {
        const { id } = req.params;

        const schema = schemas[tableName];
        if (schema) {
          req.body = schema.parse(req.body);
        }

        const { data, error } = await supabase
          .from(tableName)
          .update(req.body)
          .eq(primaryKeyName, id)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          return res.status(404).json({ error: 'Registro no encontrado' });
        }

        return res.status(200).json({ success: true, data: data[0] });
      } catch (error) {
        next(error);
      }
    },

    // 5. DELETE (Eliminar)
    delete: async (req, res, next) => {
      try {
        const { id } = req.params;
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq(primaryKeyName, id);

        if (error) throw error;

        return res.status(200).json({ success: true, message: 'Registro eliminado exitosamente' });
      } catch (error) {
        next(error);
      }
    }
  };
};