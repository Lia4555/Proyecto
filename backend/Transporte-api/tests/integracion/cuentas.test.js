// PRUEBAS DE INTEGRACION: gestion de cuentas (/api/cuentas)
import { beforeEach, describe, expect, test } from '@jest/globals';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AUTH, cargarApp } from '../helpers/app.js';
import { IDS } from '../helpers/datos.js';

const ctx = await cargarApp();
const { app, bd } = ctx;
beforeEach(() => ctx.reiniciar());

const cuenta = (id) => bd.tablas.usuario.find((u) => u.id_usuario === id);
const comoAdmin = (peticion) => peticion.set('Authorization', AUTH.admin());

describe('acceso', () => {
  test('un conductor no puede gestionar cuentas (403)', async () => {
    const res = await request(app).get('/api/cuentas').set('Authorization', AUTH.conductor1());
    expect(res.status).toBe(403);
  });

  test('sin sesion responde 401', async () => {
    const res = await request(app).get('/api/cuentas');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/cuentas', () => {
  test('lista las cuentas con su estado y sin contraseñas', async () => {
    const res = await comoAdmin(request(app).get('/api/cuentas'));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
    res.body.forEach((c) => expect(c).not.toHaveProperty('contrasena'));
    const porCorreo = Object.fromEntries(res.body.map((c) => [c.correo, c]));
    expect(porCorreo['pendiente@dviaje.com'].estado).toBe('pendiente');
    expect(porCorreo['conductor1@dviaje.com'].estado).toBe('activa');
    expect(porCorreo['admin@dviaje.com'].es_tu_cuenta).toBe(true);
  });

  test('las mas recientes salen primero', async () => {
    const res = await comoAdmin(request(app).get('/api/cuentas'));
    expect(res.body[0].correo).toBe('pendiente@dviaje.com');
  });
});

describe('PATCH /api/cuentas/:id/aprobar', () => {
  test('aprueba una solicitud y activa la ficha de conductor', async () => {
    const res = await comoAdmin(request(app).patch(`/api/cuentas/${IDS.pendiente}/aprobar`)).send({ rol: 'Conductor' });

    expect(res.status).toBe(200);
    expect(cuenta(IDS.pendiente).activo).toBe(true);
    expect(cuenta(IDS.pendiente).aprobada_en).toBeTruthy();
    expect(bd.tablas.conductor.find((c) => c.email === 'pendiente@dviaje.com').activo).toBe(true);
  });

  test('puede aprobarla como Administrador', async () => {
    const res = await comoAdmin(request(app).patch(`/api/cuentas/${IDS.pendiente}/aprobar`)).send({ rol: 'Administrador' });
    expect(res.status).toBe(200);
    expect(cuenta(IDS.pendiente).id_rol).toBe(1);
  });

  test('un rol que no existe responde 400', async () => {
    const res = await comoAdmin(request(app).patch(`/api/cuentas/${IDS.pendiente}/aprobar`)).send({ rol: 'SuperUsuario' });
    expect(res.status).toBe(400);
    expect(cuenta(IDS.pendiente).activo).toBe(false);
  });

  test('una cuenta ya activa responde 400', async () => {
    const res = await comoAdmin(request(app).patch(`/api/cuentas/${IDS.conductor1}/aprobar`));
    expect(res.status).toBe(400);
  });

  test('un id con formato invalido responde 404', async () => {
    const res = await comoAdmin(request(app).patch('/api/cuentas/123/aprobar'));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/cuentas/:id/desactivar', () => {
  test('desactiva una cuenta y la saca del sistema al instante', async () => {
    // El conductor tiene sesion abierta...
    expect((await request(app).get('/api/auth/me').set('Authorization', AUTH.conductor1())).status).toBe(200);

    const res = await comoAdmin(request(app).patch(`/api/cuentas/${IDS.conductor1}/desactivar`));
    expect(res.status).toBe(200);
    expect(cuenta(IDS.conductor1).activo).toBe(false);

    // ...y deja de servirle sin esperar a que caduque el token.
    expect((await request(app).get('/api/auth/me').set('Authorization', AUTH.conductor1())).status).toBe(401);
  });

  test('el administrador no puede desactivar su propia cuenta', async () => {
    const res = await comoAdmin(request(app).patch(`/api/cuentas/${IDS.admin}/desactivar`));
    expect(res.status).toBe(400);
    expect(cuenta(IDS.admin).activo).toBe(true);
  });

  test('con dos administradores, uno puede desactivar al otro', async () => {
    cuenta(IDS.conductor2).id_rol = 1; // conductor2 pasa a ser administrador
    const res = await request(app)
      .patch(`/api/cuentas/${IDS.admin}/desactivar`)
      .set('Authorization', AUTH.conductor2());
    expect(res.status).toBe(200);
    expect(cuenta(IDS.admin).activo).toBe(false);
  });

  test('no se puede desactivar al ultimo administrador activo de su rol', async () => {
    // Bases con roles duplicados: un segundo rol "Administrador" (id 3).
    // Quien desactiva tiene ese rol; el objetivo es el unico activo del rol 1.
    bd.tablas.roles.push({ id_rol: 3, nombre_rol: 'Administrador', nivel_permiso: 3 });
    cuenta(IDS.conductor2).id_rol = 3;

    const res = await request(app)
      .patch(`/api/cuentas/${IDS.admin}/desactivar`)
      .set('Authorization', AUTH.conductor2());
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/último administrador/);
    expect(cuenta(IDS.admin).activo).toBe(true);
  });

  test('una cuenta ya desactivada responde 400', async () => {
    const res = await comoAdmin(request(app).patch(`/api/cuentas/${IDS.pendiente}/desactivar`));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/cuentas/:id (rechazar solicitud)', () => {
  test('rechaza una solicitud pendiente y borra su ficha sin historial', async () => {
    const res = await comoAdmin(request(app).delete(`/api/cuentas/${IDS.pendiente}`));

    expect(res.status).toBe(200);
    expect(cuenta(IDS.pendiente)).toBeUndefined();
    expect(bd.tablas.conductor.find((c) => c.email === 'pendiente@dviaje.com')).toBeUndefined();
  });

  test('una cuenta activa no se puede rechazar', async () => {
    const res = await comoAdmin(request(app).delete(`/api/cuentas/${IDS.conductor1}`));
    expect(res.status).toBe(400);
    expect(cuenta(IDS.conductor1)).toBeDefined();
  });

  test('una cuenta que ya habia sido aprobada no es una solicitud', async () => {
    cuenta(IDS.conductor1).activo = false; // desactivada, pero con aprobada_en
    const res = await comoAdmin(request(app).delete(`/api/cuentas/${IDS.conductor1}`));
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/cuentas/:id/contrasena', () => {
  test('el administrador restablece la contraseña de otra cuenta', async () => {
    const res = await comoAdmin(request(app).patch(`/api/cuentas/${IDS.conductor1}/contrasena`)).send({ contrasena: 'Temporal2025' });

    expect(res.status).toBe(200);
    expect(await bcrypt.compare('Temporal2025', cuenta(IDS.conductor1).contrasena)).toBe(true);
  });

  test('una contraseña corta responde 400', async () => {
    const res = await comoAdmin(request(app).patch(`/api/cuentas/${IDS.conductor1}/contrasena`)).send({ contrasena: '123' });
    expect(res.status).toBe(400);
  });

  test('una cuenta que no existe responde 404', async () => {
    const res = await comoAdmin(request(app).patch('/api/cuentas/99999999-9999-4999-8999-999999999999/contrasena')).send({ contrasena: 'Temporal2025' });
    expect(res.status).toBe(404);
  });
});
