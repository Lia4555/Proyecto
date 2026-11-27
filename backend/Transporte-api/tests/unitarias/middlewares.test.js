// PRUEBAS UNITARIAS: middlewares aislados
// Tecnica: dobles de prueba (objetos req/res/next falsos con jest.fn).
import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { z } from 'zod';
import { errorHandler } from '../../middleware/errorHandler.js';
import { limitarIntentos } from '../../middleware/limitador.js';
import { esAdmin, soloAdmin } from '../../middleware/permisos.js';

// Respuesta falsa que recuerda el status, el cuerpo y las cabeceras.
const crearRes = () => {
  const res = { cabeceras: {} };
  res.status = jest.fn((codigo) => {
    res.codigo = codigo;
    return res;
  });
  res.json = jest.fn((cuerpo) => {
    res.cuerpo = cuerpo;
    return res;
  });
  res.set = jest.fn((nombre, valor) => {
    res.cabeceras[nombre] = valor;
    return res;
  });
  return res;
};

describe('errorHandler', () => {
  const entornoOriginal = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = entornoOriginal;
  });

  test('un error de Zod responde 400 con el detalle de cada campo', () => {
    const resultado = z.object({ correo: z.string().email() }).safeParse({ correo: 'no-es-correo' });
    const res = crearRes();
    errorHandler(resultado.error, {}, res, jest.fn());
    expect(res.codigo).toBe(400);
    expect(res.cuerpo.detalles).toEqual([expect.objectContaining({ campo: 'correo' })]);
  });

  test.each([
    ['23505', 409],
    ['23503', 400],
    ['23502', 400],
    ['22001', 400],
    ['22P02', 400]
  ])('el codigo de Postgres %s se traduce a %i', (code, esperado) => {
    const res = crearRes();
    errorHandler({ code, message: 'detalle interno' }, {}, res, jest.fn());
    expect(res.codigo).toBe(esperado);
    expect(res.cuerpo.error).not.toMatch(/detalle interno/);
  });

  test('un cuerpo demasiado grande responde 413', () => {
    const res = crearRes();
    errorHandler({ type: 'entity.too.large' }, {}, res, jest.fn());
    expect(res.codigo).toBe(413);
  });

  test('una caida de la base de datos responde 503 con un mensaje entendible', () => {
    const res = crearRes();
    errorHandler(new Error('fetch failed'), {}, res, jest.fn());
    expect(res.codigo).toBe(503);
  });

  test('en produccion un 500 no revela el mensaje interno', () => {
    process.env.NODE_ENV = 'production';
    const res = crearRes();
    errorHandler(new Error('columna secreta no existe'), {}, res, jest.fn());
    expect(res.codigo).toBe(500);
    expect(res.cuerpo.error).toBe('Error interno del servidor');
  });

  test('un error de negocio conserva su status y sus detalles', () => {
    const err = Object.assign(new Error('Placa repetida'), {
      status: 409,
      detalles: [{ campo: 'placa', mensaje: 'Placa repetida' }]
    });
    const res = crearRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.codigo).toBe(409);
    expect(res.cuerpo).toEqual({ error: 'Placa repetida', detalles: err.detalles });
  });
});

describe('limitarIntentos', () => {
  test('deja pasar hasta el maximo y despues responde 429 con Retry-After', () => {
    const limitar = limitarIntentos({ maximo: 3, ventanaMs: 60000, mensaje: 'Demasiados.' });
    const req = { ip: '10.0.0.1' };

    for (let i = 0; i < 3; i++) {
      const next = jest.fn();
      limitar(req, crearRes(), next);
      expect(next).toHaveBeenCalled();
    }

    const next = jest.fn();
    const res = crearRes();
    limitar(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.codigo).toBe(429);
    expect(res.cabeceras['Retry-After']).toBeDefined();
  });

  test('cuenta por separado cada IP', () => {
    const limitar = limitarIntentos({ maximo: 1, ventanaMs: 60000, mensaje: 'x' });
    const next = jest.fn();
    limitar({ ip: '1.1.1.1' }, crearRes(), next);
    limitar({ ip: '2.2.2.2' }, crearRes(), next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  test('la ventana se reinicia cuando pasa el tiempo', () => {
    jest.useFakeTimers();
    try {
      const limitar = limitarIntentos({ maximo: 1, ventanaMs: 1000, mensaje: 'x' });
      const req = { ip: '3.3.3.3' };
      limitar(req, crearRes(), jest.fn());
      const bloqueado = crearRes();
      limitar(req, bloqueado, jest.fn());
      expect(bloqueado.codigo).toBe(429);

      jest.advanceTimersByTime(1001);
      const next = jest.fn();
      limitar(req, crearRes(), next);
      expect(next).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('permisos por rol', () => {
  test('esAdmin depende del nivel de permiso', () => {
    expect(esAdmin({ nivel_permiso: 3 })).toBe(true);
    expect(esAdmin({ nivel_permiso: 2 })).toBe(false);
    expect(esAdmin(undefined)).toBe(false);
  });

  test('soloAdmin bloquea a un conductor con 403', () => {
    const res = crearRes();
    const next = jest.fn();
    soloAdmin({ user: { nivel_permiso: 2 } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.codigo).toBe(403);
  });

  test('soloAdmin deja pasar al administrador', () => {
    const next = jest.fn();
    soloAdmin({ user: { nivel_permiso: 3 } }, crearRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
