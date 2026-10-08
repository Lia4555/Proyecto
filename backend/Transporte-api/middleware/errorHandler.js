// Manejador central de errores. Recibe todo lo que llega por next(error).
export const errorHandler = (err, req, res, next) => {
  // Registra el detalle completo SOLO en el servidor (nunca al cliente)
  console.error(err);

  const enProduccion = process.env.NODE_ENV === 'production';

  // 1) Errores de validación de Zod -> 400 con el detalle de cada campo
  if (err.name === 'ZodError') {
    const detalles = (err.issues || err.errors || []).map((e) => ({
      campo: Array.isArray(e.path) ? e.path.join('.') : '',
      mensaje: e.message
    }));
    return res.status(400).json({ error: 'Error de validación de datos', detalles });
  }

  // 1b) Cuerpo de la peticion demasiado grande (lo lanza express.json)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Los datos enviados son demasiado grandes.' });
  }

  // 2) Errores comunes de Postgres/Supabase (traducidos a mensajes claros)
  switch (err.code) {
    case '23505': // clave única duplicada
      return res.status(409).json({ error: 'Ya existe un registro con ese valor único.' });
    case '23503': // llave foránea inexistente
      return res.status(400).json({ error: 'Referencia inválida: el id relacionado no existe.' });
    case '23502': // columna NOT NULL sin valor
      return res.status(400).json({ error: 'Falta un campo obligatorio.' });
    case '22001': // texto más largo de lo que admite la columna
      return res.status(400).json({ error: 'Uno de los textos es demasiado largo. Acórtalo e inténtalo de nuevo.' });
    case '22P02': // tipo inválido (ej. texto donde va número/uuid)
      return res.status(400).json({ error: 'Formato de dato inválido en algún campo.' });
    default:
      break;
  }

  // 3) La base de datos (Supabase) no respondió a tiempo o está caída un momento.
  //    supabase-js entrega esos casos con el texto de la pasarela y sin código
  //    de Postgres; se traducen a un 503 con un mensaje que se entienda.
  const textoPasarela = /gateway time-?out|bad gateway|service unavailable|fetch failed|aborted/i;
  if (!err.status && !err.code && textoPasarela.test(err.message || '')) {
    return res.status(503).json({
      error: 'La base de datos tardó en responder. Inténtalo de nuevo en unos segundos.'
    });
  }

  // 4) Cualquier otro error
  const status = err.status || 500;
  // En producción NO se revela el mensaje interno de un error 500 (evita filtrar
  // detalles de la base de datos o del código). En desarrollo sí, para depurar.
  const mensaje =
    status >= 500 && enProduccion
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

  // Errores de regla de negocio (controllers/reglasTablas.js) traen el campo
  // afectado: el formulario lo pinta en rojo junto al input.
  return res.status(status).json(
    Array.isArray(err.detalles) && status < 500
      ? { error: mensaje, detalles: err.detalles }
      : { error: mensaje }
  );
};