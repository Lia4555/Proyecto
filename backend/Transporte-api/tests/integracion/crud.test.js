// PRUEBAS DE INTEGRACION: CRUD 
// (controllers/genericController.js + controllers/reglasTablas.js)
import { beforeEach, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import { AUTH, cargarApp } from '../helpers/app.js';
import { IDS } from '../helpers/datos.js';
import { MASCARA } from '../../middleware/datosSensibles.js';

const ctx = await cargarApp();
const { app, bd } = ctx;
beforeEach(() => ctx.reiniciar());

const nuevoVehiculo = () => ({
  placa: 'ghi 789',
  marca: 'Hyundai',
  linea: 'County',
  modelo: '2023',
  capacidad_pasajeros: 29,
  id_tipo_vehiculo: 1
});

const nuevoServicio = () => ({
  fecha_salida: '2025-03-01T08:00:00-05:00',
  fecha_llegada_estimada: '2025-03-01T14:00:00-05:00',
  numero_pasajeros: 12,
  precio_total: 450000,
  id_conductor: IDS.fichaConductor1,
  id_vehiculo: 1,
  id_estado: 1,
  origen: 'Cali',
  destino: 'Pereira'
});

const crear = (ruta, cuerpo) =>
  request(app).post(`/api/${ruta}`).set('Authorization', AUTH.admin()).send(cuerpo);

describe('crear (POST)', () => {
  test('crea un vehiculo con la placa normalizada y el numero interno consecutivo', async () => {
    const res = await crear('vehiculos', nuevoVehiculo());

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ placa: 'GHI789', numero_interno: '003' });
    expect(bd.tablas.vehiculos).toHaveLength(3);
  });

  test('crea un servicio con el codigo consecutivo SVC-0003', async () => {
    const res = await crear('servicios', nuevoServicio());
    expect(res.status).toBe(201);
    expect(res.body.data.codigo_servicio).toBe('SVC-0003');
  });

  test('ignora una llave primaria enviada por el cliente', async () => {
    const res = await crear('vehiculos', { ...nuevoVehiculo(), id_vehiculo: 999 });
    expect(res.status).toBe(201);
    expect(res.body.data.id_vehiculo).not.toBe(999);
  });

  test('una placa repetida (sin importar mayusculas) responde 409 en el campo placa', async () => {
    const res = await crear('vehiculos', { ...nuevoVehiculo(), placa: 'abc123' });
    expect(res.status).toBe(409);
    expect(res.body.detalles[0].campo).toBe('placa');
  });

  test('origen y destino iguales responde 400', async () => {
    const res = await crear('servicios', { ...nuevoServicio(), destino: ' cali ' });
    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe('destino');
  });

  test('datos invalidos responden 400 con el detalle de cada campo', async () => {
    const res = await crear('servicios', { ...nuevoServicio(), numero_pasajeros: -3, id_conductor: 'x' });
    expect(res.status).toBe(400);
    const campos = res.body.detalles.map((d) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(['numero_pasajeros', 'id_conductor']));
  });

  test('un conductor con cedula alfanumerica se rechaza', async () => {
    const res = await crear('conductor', {
      nombre: 'Mario',
      apellido: 'Ruiz',
      tipo_documento: 'CC',
      numero_documento: 'AB12345',
      email: 'mario@dviaje.com',
      telefono: '3150000000',
      id_rol: 2
    });
    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe('numero_documento');
  });
});

describe('leer (GET)', () => {
  test('un id que no existe responde 404', async () => {
    const res = await request(app).get('/api/vehiculos/999').set('Authorization', AUTH.admin());
    expect(res.status).toBe(404);
  });

  test('devuelve un registro por id', async () => {
    const res = await request(app).get('/api/vehiculos/2').set('Authorization', AUTH.admin());
    expect(res.status).toBe(200);
    expect(res.body.placa).toBe('DEF456');
  });
});

describe('actualizar (PUT)', () => {
  test('actualiza solo los campos enviados', async () => {
    const res = await request(app)
      .put('/api/vehiculos/1')
      .set('Authorization', AUTH.admin())
      .send({ color: 'Blanco' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ color: 'Blanco', placa: 'ABC123' });
  });

  test('un valor enmascarado reenviado no pisa el dato real', async () => {
    const res = await request(app)
      .put(`/api/conductor/${IDS.fichaConductor1}`)
      .set('Authorization', AUTH.admin())
      .send({ numero_documento: `${MASCARA}5678`, telefono: '3119998877' });

    expect(res.status).toBe(200);
    const ficha = bd.tablas.conductor.find((c) => c.id_conductor === IDS.fichaConductor1);
    expect(ficha.numero_documento).toBe('1012345678');
    expect(ficha.telefono).toBe('3119998877');
  });

  test('cambiar la placa a una que ya usa otro vehiculo responde 409', async () => {
    const res = await request(app)
      .put('/api/vehiculos/1')
      .set('Authorization', AUTH.admin())
      .send({ placa: 'DEF456' });
    expect(res.status).toBe(409);
  });

  test('conservar la propia placa no cuenta como repetida', async () => {
    const res = await request(app)
      .put('/api/vehiculos/1')
      .set('Authorization', AUTH.admin())
      .send({ placa: 'ABC123', color: 'Rojo' });
    expect(res.status).toBe(200);
  });

  test('sin cambios validos responde 400', async () => {
    const res = await request(app)
      .put('/api/vehiculos/1')
      .set('Authorization', AUTH.admin())
      .send({ columna_inventada: 1 });
    expect(res.status).toBe(400);
  });

  test('un registro que no existe responde 404', async () => {
    const res = await request(app)
      .put('/api/vehiculos/999')
      .set('Authorization', AUTH.admin())
      .send({ color: 'Azul' });
    expect(res.status).toBe(404);
  });
});

describe('eliminar (DELETE)', () => {
  test('el administrador elimina un registro', async () => {
    const res = await request(app).delete('/api/mantenimientos/2').set('Authorization', AUTH.admin());
    expect(res.status).toBe(200);
    expect(bd.tablas.mantenimientos.map((m) => m.id_mantenimiento)).toEqual([1]);
  });
});

describe('errores de la base de datos', () => {
  test('una caida de Supabase responde 503 con un mensaje claro', async () => {
    bd.fallos.vehiculos = { message: 'Gateway Timeout' };
    const res = await request(app).get('/api/vehiculos').set('Authorization', AUTH.admin());
    expect(res.status).toBe(503);
  });

  test('una llave foranea inexistente responde 400', async () => {
    bd.fallos.mantenimientos = { code: '23503', message: 'violates foreign key' };
    const res = await request(app).get('/api/mantenimientos').set('Authorization', AUTH.admin());
    expect(res.status).toBe(400);
  });
});

describe('rutas generales', () => {
  test('GET /health responde UP', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toBe('UP');
  });

  test('una ruta inexistente responde 404 en JSON', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Ruta no encontrada/);
  });

  test('las respuestas de la API llevan cabeceras de seguridad', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('un origen no permitido por CORS responde 403', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://sitio-malicioso.com');
    expect(res.status).toBe(403);
  });

  test('el frontend configurado si esta permitido por CORS', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  test('la documentacion OpenAPI esta disponible', async () => {
    const res = await request(app).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBeDefined();
  });
});
