// Limitador de intentos en memoria, por IP.
// Frena a quien intenta crear cuentas (o adivinar contraseñas) en bucle.
// Vive en la memoria del proceso: se reinicia al reiniciar el servidor y no
// se comparte entre varias instancias, lo cual basta para este proyecto.
export const limitarIntentos = ({ maximo, ventanaMs, mensaje }) => {
  const intentos = new Map();

  return (req, res, next) => {
    const ahora = Date.now();
    const clave = req.ip || 'desconocida';
    const registro = intentos.get(clave);

    if (!registro || registro.reinicio <= ahora) {
      intentos.set(clave, { cuenta: 1, reinicio: ahora + ventanaMs });
    } else if (registro.cuenta >= maximo) {
      const minutos = Math.ceil((registro.reinicio - ahora) / 60000);
      res.set('Retry-After', String(Math.ceil((registro.reinicio - ahora) / 1000)));
      return res.status(429).json({ error: `${mensaje} Inténtalo de nuevo en ${minutos} min.` });
    } else {
      registro.cuenta += 1;
    }

    // Limpieza ocasional para que el mapa no crezca sin fin.
    if (intentos.size > 5000) {
      for (const [ip, r] of intentos) if (r.reinicio <= ahora) intentos.delete(ip);
    }
    return next();
  };
};
