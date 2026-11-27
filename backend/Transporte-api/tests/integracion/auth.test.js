// PRUEBAS DE INTEGRACION: autenticacion (/api/auth)
// Tecnica: caja negra sobre la API HTTP real (Supertest) con la base
// de datos sustituida por un doble en memoria.
import { beforeEach, describe, expect, test } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { AUTH, cargarApp, tokenDe } from '../helpers/app.js';
import { CLAVES, IDS } from '../helpers/datos.js';

const ctx = await cargarApp();
const { app, bd } = ctx;
beforeEach(() => ctx.reiniciar());

const login = (correo, contrasena, cabeceras = {}) =>
  request(app).post('/api/auth/login').set(cabeceras).send({ correo, contrasena });

describe('POST /api/auth/login', () => {
  test('con credenciales correctas responde 200 y guarda el token en una cookie httpOnly', async () => {
    const res = await login('admin@dviaje.com', CLAVES.admin);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ correo: 'admin@dviaje.com', rol: 'Administrador', nivel_permiso: 3 });
    // En la web el token NO viaja en el JSON (un XSS no podria robarlo).
    expect(res.body).not.toHaveProperty('token');
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  test('la app movil (X-Client: mobile) recibe el token en el cuerpo', async () => {
    const res = await login('conductor1@dviaje.com', CLAVES.conductor, { 'X-Client': 'mobile' });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    const datos = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(datos.id_usuario).toBe(IDS.conductor1);
    expect(res.body.user.id_conductor).toBe(IDS.fichaConductor1);
  });

  test('nunca devuelve la contraseña cifrada', async () => {
    const res = await login('admin@dviaje.com', CLAVES.admin);
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
  });

  test('con contraseña incorrecta responde 401', async () => {
    const res = await login('admin@dviaje.com', 'otra-clave');
    expect(res.status).toBe(401);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  test('un correo que no existe da el mismo mensaje que una clave incorrecta', async () => {
    const a = await login('nadie@dviaje.com', 'cualquiera');
    const b = await login('admin@dviaje.com', 'cualquiera');
    expect(a.status).toBe(401);
    expect(a.body.error).toBe(b.body.error);
  });

  test('sin correo o sin contraseña responde 400', async () => {
    expect((await login('admin@dviaje.com', '')).status).toBe(400);
    expect((await login('', CLAVES.admin)).status).toBe(400);
  });

  test('una cuenta pendiente de aprobacion no puede entrar (403)', async () => {
    const res = await login('pendiente@dviaje.com', CLAVES.pendiente);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/no está activa/);
  });

  test('un conductor sin ficha de conductor no puede entrar (403)', async () => {
    bd.tablas.conductor = bd.tablas.conductor.filter((c) => c.email !== 'conductor1@dviaje.com');
    const res = await login('conductor1@dviaje.com', CLAVES.conductor);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/ficha/);
  });
});

describe('GET /api/auth/me', () => {
  test('sin sesion responde 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('con un token valido devuelve el usuario actual', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', AUTH.conductor1());
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id_usuario: IDS.conductor1, rol: 'Conductor' });
  });

  test('acepta tambien el token en la cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', `token=${tokenDe(IDS.admin)}`);
    expect(res.status).toBe(200);
    expect(res.body.user.rol).toBe('Administrador');
  });

  test('un token con firma falsa responde 401 y borra la cookie', async () => {
    const falso = jwt.sign({ id_usuario: IDS.admin }, 'otro-secreto', { expiresIn: '1h' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${falso}`);
    expect(res.status).toBe(401);
    expect(res.headers['set-cookie'].join(';')).toMatch(/token=;/);
  });

  test('un token vencido responde 401 con mensaje de sesion expirada', async () => {
    const vencido = jwt.sign(
      { id_usuario: IDS.admin, exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET
    );
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${vencido}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expiro/);
  });

  test('un token sin fecha de caducidad se rechaza', async () => {
    const eterno = jwt.sign({ id_usuario: IDS.admin }, process.env.JWT_SECRET);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${eterno}`);
    expect(res.status).toBe(401);
  });

  test('un token con algoritmo "none" se rechaza', async () => {
    const sinFirma = jwt.sign({ id_usuario: IDS.admin }, null, { algorithm: 'none', expiresIn: '1h' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${sinFirma}`);
    expect(res.status).toBe(401);
  });

  test('el rol sale de la base de datos, no del token', async () => {
    // Un conductor que se fabrica un token diciendo que es admin sigue siendo conductor.
    const trucado = jwt.sign(
      { id_usuario: IDS.conductor1, rol: 'Administrador', nivel_permiso: 3 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${trucado}`);
    expect(res.body.user.rol).toBe('Conductor');
    expect(res.body.user.nivel_permiso).toBe(2);
  });

  test('una cuenta desactivada queda fuera aunque su token siga vigente', async () => {
    bd.tablas.usuario.find((u) => u.id_usuario === IDS.conductor1).activo = false;
    const res = await request(app).get('/api/auth/me').set('Authorization', AUTH.conductor1());
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  test('borra la cookie de sesion', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].join(';')).toMatch(/token=;/);
  });
});

describe('POST /api/auth/register', () => {
  const solicitud = () => ({
    nombre: 'Laura',
    apellido: 'Gómez',
    tipo_documento: 'CC',
    numero_documento: '1.023.456.789',
    telefono: '3101234567',
    correo: 'laura@dviaje.com',
    contrasena: 'ClaveSegura1'
  });

  test('crea la cuenta APAGADA y su ficha de conductor', async () => {
    const res = await request(app).post('/api/auth/register').send(solicitud());

    expect(res.status).toBe(201);
    const cuenta = bd.tablas.usuario.find((u) => u.correo === 'laura@dviaje.com');
    const ficha = bd.tablas.conductor.find((c) => c.email === 'laura@dviaje.com');
    expect(cuenta.activo).toBe(false);
    expect(cuenta.id_rol).toBe(2); // siempre nace como Conductor
    expect(cuenta.contrasena).not.toBe('ClaveSegura1'); // se guarda cifrada
    expect(ficha.numero_documento).toBe('1023456789'); // sin puntos
    expect(ficha.activo).toBe(false);
  });

  test('con datos invalidos responde 400 indicando cada campo', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...solicitud(), nombre: 'L4ura', correo: 'no-es-correo', contrasena: 'corta' });

    expect(res.status).toBe(400);
    const campos = res.body.detalles.map((d) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(['nombre', 'correo', 'contrasena']));
  });

  test('una cedula con letras se rechaza', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...solicitud(), numero_documento: '10AB345' });
    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe('numero_documento');
  });

  test('un correo ya registrado responde 409', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...solicitud(), correo: 'admin@dviaje.com' });
    expect(res.status).toBe(409);
    expect(res.body.detalles[0].campo).toBe('correo');
  });

  test('un documento ya registrado responde 409', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...solicitud(), numero_documento: '1012345678' });
    expect(res.status).toBe(409);
    expect(res.body.detalles[0].campo).toBe('numero_documento');
  });
});

describe('POST /api/auth/recuperar', () => {
  test('la recuperacion por correo y telefono esta retirada (410)', async () => {
    const res = await request(app).post('/api/auth/recuperar').send({ correo: 'admin@dviaje.com' });
    expect(res.status).toBe(410);
  });
});
