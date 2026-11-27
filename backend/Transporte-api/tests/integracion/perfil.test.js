// PRUEBAS DE INTEGRACION: perfil propio (/api/perfil)
import { beforeEach, describe, expect, test } from '@jest/globals';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AUTH, cargarApp } from '../helpers/app.js';
import { CLAVES, IDS } from '../helpers/datos.js';

const ctx = await cargarApp();
const { app, bd } = ctx;
beforeEach(() => ctx.reiniciar());

const cuenta = (id) => bd.tablas.usuario.find((u) => u.id_usuario === id);

// Imagen PNG minima: la firma del formato + unos bytes.
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32, 1)
]);
const fotoPng = `data:image/png;base64,${PNG.toString('base64')}`;

describe('PUT /api/perfil/contrasena', () => {
  const cambiar = (actual, nueva) =>
    request(app).put('/api/perfil/contrasena').set('Authorization', AUTH.conductor1()).send({ actual, nueva });

  test('con la contraseña actual correcta la cambia', async () => {
    const res = await cambiar(CLAVES.conductor, 'NuevaClave2025');
    expect(res.status).toBe(200);
    expect(await bcrypt.compare('NuevaClave2025', cuenta(IDS.conductor1).contrasena)).toBe(true);
  });

  test('con la contraseña actual incorrecta responde 400 y no cambia nada', async () => {
    const antes = cuenta(IDS.conductor1).contrasena;
    const res = await cambiar('equivocada', 'NuevaClave2025');
    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe('actual');
    expect(cuenta(IDS.conductor1).contrasena).toBe(antes);
  });

  test('sin la contraseña actual responde 400', async () => {
    const res = await cambiar('', 'NuevaClave2025');
    expect(res.status).toBe(400);
  });

  test('una contraseña nueva demasiado corta responde 400', async () => {
    const res = await cambiar(CLAVES.conductor, '123');
    expect(res.status).toBe(400);
  });

  test('sin sesion responde 401', async () => {
    const res = await request(app).put('/api/perfil/contrasena').send({ actual: 'a', nueva: 'b' });
    expect(res.status).toBe(401);
  });
});

describe('foto de perfil', () => {
  test('al principio no hay foto', async () => {
    const res = await request(app).get('/api/perfil/foto').set('Authorization', AUTH.admin());
    expect(res.status).toBe(200);
    expect(res.body.foto).toBeNull();
  });

  test('guarda una imagen PNG valida y la devuelve', async () => {
    const guardar = await request(app)
      .put('/api/perfil/foto')
      .set('Authorization', AUTH.admin())
      .send({ foto: fotoPng });
    expect(guardar.status).toBe(200);

    const leer = await request(app).get('/api/perfil/foto').set('Authorization', AUTH.admin());
    expect(leer.body.foto).toBe(fotoPng);
  });

  test('cada usuario solo modifica su propia foto', async () => {
    await request(app).put('/api/perfil/foto').set('Authorization', AUTH.conductor1()).send({ foto: fotoPng });
    expect(cuenta(IDS.conductor1).foto_perfil).toBe(fotoPng);
    expect(cuenta(IDS.admin).foto_perfil).toBeNull();
  });

  test('rechaza un archivo que dice ser PNG pero no lo es', async () => {
    const falso = `data:image/png;base64,${Buffer.from('<script>alert(1)</script>').toString('base64')}`;
    const res = await request(app).put('/api/perfil/foto').set('Authorization', AUTH.admin()).send({ foto: falso });
    expect(res.status).toBe(400);
  });

  test('rechaza formatos no permitidos', async () => {
    const svg = `data:image/svg+xml;base64,${Buffer.from('<svg/>').toString('base64')}`;
    const res = await request(app).put('/api/perfil/foto').set('Authorization', AUTH.admin()).send({ foto: svg });
    expect(res.status).toBe(400);
  });

  test('rechaza imagenes de mas de 150 KB', async () => {
    const grande = Buffer.concat([PNG, Buffer.alloc(160 * 1024)]);
    const res = await request(app)
      .put('/api/perfil/foto')
      .set('Authorization', AUTH.admin())
      .send({ foto: `data:image/png;base64,${grande.toString('base64')}` });
    expect(res.status).toBe(400);
  });

  test('quitar la foto la deja vacia', async () => {
    cuenta(IDS.admin).foto_perfil = fotoPng;
    const res = await request(app).delete('/api/perfil/foto').set('Authorization', AUTH.admin());
    expect(res.status).toBe(200);
    expect(cuenta(IDS.admin).foto_perfil).toBeNull();
  });
});
