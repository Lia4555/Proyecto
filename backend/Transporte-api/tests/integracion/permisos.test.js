// PRUEBAS DE INTEGRACION: permisos por rol 
import { beforeEach, describe, expect, test } from '@jest/globals';
import request from 'supertest';
import { AUTH, cargarApp } from '../helpers/app.js';
import { IDS } from '../helpers/datos.js';
import { MASCARA } from '../../middleware/datosSensibles.js';

const ctx = await cargarApp();
const { app, bd } = ctx;
beforeEach(() => ctx.reiniciar());

const servicio = (id) => bd.tablas.servicios.find((s) => s.id_servicio === id);

describe('sin sesion', () => {
  test.each(['servicios', 'vehiculos', 'conductor', 'clientes', 'roles'])(
    'GET /api/%s responde 401',
    async (tabla) => {
      const res = await request(app).get(`/api/${tabla}`);
      expect(res.status).toBe(401);
    }
  );
});

describe('conductor: lectura', () => {
  test('solo ve sus propios servicios', async () => {
    const res = await request(app).get('/api/servicios').set('Authorization', AUTH.conductor1());
    expect(res.status).toBe(200);
    expect(res.body.map((s) => s.id_servicio)).toEqual([1]);
  });

  test('pedir por id el servicio de otro conductor responde 404 (no revela que existe)', async () => {
    const res = await request(app).get('/api/servicios/2').set('Authorization', AUTH.conductor1());
    expect(res.status).toBe(404);
  });

  test('ve solo su vehiculo, sus documentos y sus mantenimientos', async () => {
    for (const ruta of ['vehiculos', 'documentos-vehiculo', 'mantenimientos']) {
      const res = await request(app).get(`/api/${ruta}`).set('Authorization', AUTH.conductor1());
      expect(res.status).toBe(200);
      expect(res.body.every((f) => f.id_vehiculo === 1)).toBe(true);
    }
  });

  test('ve solo las alertas dirigidas a el', async () => {
    const res = await request(app).get('/api/alertas').set('Authorization', AUTH.conductor2());
    expect(res.body.map((a) => a.id_alerta)).toEqual([2]);
  });

  test('ve su propia ficha con los datos delicados enmascarados', async () => {
    const res = await request(app).get('/api/conductor').set('Authorization', AUTH.conductor1());
    expect(res.body).toHaveLength(1);
    expect(res.body[0].numero_documento).toBe(`${MASCARA}5678`);
    expect(res.body[0]).not.toHaveProperty('direccion');
    expect(res.body[0]).not.toHaveProperty('fecha_nacimiento');
  });

  test('puede leer los catalogos', async () => {
    const res = await request(app).get('/api/estados-servicio').set('Authorization', AUTH.conductor1());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  test.each(['clientes', 'reservas', 'roles', 'historial-conductores'])(
    'no tiene acceso a /api/%s (403)',
    async (ruta) => {
      const res = await request(app).get(`/api/${ruta}`).set('Authorization', AUTH.conductor1());
      expect(res.status).toBe(403);
    }
  );

  test('sin nada asignado recibe una lista vacia, no la tabla completa', async () => {
    bd.tablas.vehiculos = [];
    bd.tablas.servicios = [];
    const res = await request(app).get('/api/mantenimientos').set('Authorization', AUTH.conductor1());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('conductor: escritura', () => {
  test('no puede crear registros (403)', async () => {
    const res = await request(app)
      .post('/api/servicios')
      .set('Authorization', AUTH.conductor1())
      .send({ precio_total: 1 });
    expect(res.status).toBe(403);
    expect(bd.tablas.servicios).toHaveLength(2);
  });

  test('no puede eliminar registros (403)', async () => {
    const res = await request(app).delete('/api/servicios/1').set('Authorization', AUTH.conductor1());
    expect(res.status).toBe(403);
    expect(servicio(1)).toBeDefined();
  });

  test('puede cambiar el estado de su servicio', async () => {
    const res = await request(app)
      .put('/api/servicios/1')
      .set('Authorization', AUTH.conductor1())
      .send({ id_estado: 2, observaciones: 'Salimos a tiempo' });

    expect(res.status).toBe(200);
    expect(servicio(1)).toMatchObject({ id_estado: 2, observaciones: 'Salimos a tiempo' });
  });

  test('las columnas que no le corresponden se ignoran (no puede cambiar el precio)', async () => {
    const res = await request(app)
      .put('/api/servicios/1')
      .set('Authorization', AUTH.conductor1())
      .send({ id_estado: 2, precio_total: 1, id_conductor: IDS.fichaConductor2 });

    expect(res.status).toBe(200);
    expect(servicio(1).precio_total).toBe(500000);
    expect(servicio(1).id_conductor).toBe(IDS.fichaConductor1);
  });

  test('si solo envia columnas prohibidas responde 400', async () => {
    const res = await request(app)
      .put('/api/servicios/1')
      .set('Authorization', AUTH.conductor1())
      .send({ precio_total: 1 });
    expect(res.status).toBe(400);
  });

  test('un valor con tipo invalido responde 400', async () => {
    const res = await request(app)
      .put('/api/servicios/1')
      .set('Authorization', AUTH.conductor1())
      .send({ id_estado: 'finalizado' });
    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe('id_estado');
  });

  test('no puede modificar el servicio de otro conductor (404)', async () => {
    const res = await request(app)
      .put('/api/servicios/2')
      .set('Authorization', AUTH.conductor1())
      .send({ id_estado: 3 });
    expect(res.status).toBe(404);
    expect(servicio(2).id_estado).toBe(1);
  });

  test('puede reportar su vehiculo fuera de servicio', async () => {
    const res = await request(app)
      .put('/api/vehiculos/1')
      .set('Authorization', AUTH.conductor1())
      .send({ estado_operativo: false, placa: 'ZZZ999' });

    expect(res.status).toBe(200);
    const vehiculo = bd.tablas.vehiculos.find((v) => v.id_vehiculo === 1);
    expect(vehiculo.estado_operativo).toBe(false);
    expect(vehiculo.placa).toBe('ABC123'); // la placa no la puede cambiar
  });

  test('no puede editar los catalogos (403)', async () => {
    const res = await request(app)
      .put('/api/estados-servicio/1')
      .set('Authorization', AUTH.conductor1())
      .send({ nombre_estado: 'Hackeado' });
    expect(res.status).toBe(403);
  });

  test('una cuenta de conductor sin ficha no ve nada (403)', async () => {
    bd.tablas.conductor = bd.tablas.conductor.filter((c) => c.email !== 'conductor1@dviaje.com');
    const res = await request(app).get('/api/servicios').set('Authorization', AUTH.conductor1());
    expect(res.status).toBe(403);
  });
});

describe('administrador', () => {
  test('ve todos los servicios', async () => {
    const res = await request(app).get('/api/servicios').set('Authorization', AUTH.admin());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('tampoco recibe completos los datos personales de los clientes', async () => {
    const res = await request(app).get('/api/clientes').set('Authorization', AUTH.admin());
    expect(res.body[0].numero_documento).toBe(`${MASCARA}3456`);
    expect(res.body[0]).not.toHaveProperty('direccion');
  });

  test('puede acceder a cualquier tabla', async () => {
    for (const ruta of ['clientes', 'reservas', 'roles', 'historial-conductores']) {
      const res = await request(app).get(`/api/${ruta}`).set('Authorization', AUTH.admin());
      expect(res.status).toBe(200);
    }
  });
});
