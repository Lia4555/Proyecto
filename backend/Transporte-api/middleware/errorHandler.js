// Manejador de errores. 
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const enProduccion = process.env.NODE_ENV === 'production';

  if (err.name === 'ZodError') {
    const detalles = (err.issues || err.errors || []).map((e) => ({
      campo: Array.isArray(e.path) ? e.path.join('.') : '',
      mensaje: e.message
    }));
    return res.status(400).json({ error: 'Error de validación de datos', detalles });
  }

  switch (err.code) {
    case '23505': // clave única duplicada
      return res.status(409).json({ error: 'Ya existe un registro con ese valor único.' });
    case '23503': // llave foránea inexistente
      return res.status(400).json({ error: 'Referencia inválida: el id relacionado no existe.' });
    case '23502': // columna NOT NULL sin valor
      return res.status(400).json({ error: 'Falta un campo obligatorio.' });
    case '22P02': // tipo inválido (ej. texto donde va número/uuid)
      return res.status(400).json({ error: 'Formato de dato inválido en algún campo.' });
    default:
      break;
  }

  // 3) Cualquier otro error
  const status = err.status || 500;
  
  const mensaje =
    status >= 500 && enProduccion
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

  return res.status(status).json({ error: mensaje });
};