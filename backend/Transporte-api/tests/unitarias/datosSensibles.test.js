// PRUEBAS UNITARIAS: minimizacion de datos personales
// (middleware/datosSensibles.js)
import { describe, expect, test } from '@jest/globals';
import {
  MASCARA,
  descartarEnmascarados,
  enmascarar,
  protegerDatos
} from '../../middleware/datosSensibles.js';

describe('enmascarar', () => {
  test('deja ver solo los ultimos 4 caracteres', () => {
    expect(enmascarar('1012345678')).toBe(`${MASCARA}5678`);
  });

  test('un valor de 4 caracteres o menos se oculta entero', () => {
    expect(enmascarar('1234')).toBe(MASCARA);
    expect(enmascarar('12')).toBe(MASCARA);
  });

  test('los valores vacios no se tocan', () => {
    expect(enmascarar(null)).toBeNull();
    expect(enmascarar(undefined)).toBeUndefined();
    expect(enmascarar('')).toBe('');
  });

  test('acepta numeros', () => {
    expect(enmascarar(123456789)).toBe(`${MASCARA}6789`);
  });
});

describe('protegerDatos', () => {
  const conductor = {
    id_conductor: 'x',
    nombre: 'Carlos',
    numero_documento: '1012345678',
    licencia_conduccion: 'LIC98765432',
    fecha_nacimiento: '1990-01-01',
    direccion: 'Calle 1',
    ultimo_acceso: '2025-01-01'
  };

  test('oculta y enmascara las columnas delicadas de un conductor', () => {
    const limpio = protegerDatos('conductor', conductor);
    expect(limpio).not.toHaveProperty('fecha_nacimiento');
    expect(limpio).not.toHaveProperty('direccion');
    expect(limpio).not.toHaveProperty('ultimo_acceso');
    expect(limpio.numero_documento).toBe(`${MASCARA}5678`);
    expect(limpio.licencia_conduccion).toBe(`${MASCARA}5432`);
    expect(limpio.nombre).toBe('Carlos');
  });

  test('no modifica el objeto original', () => {
    protegerDatos('conductor', conductor);
    expect(conductor.numero_documento).toBe('1012345678');
    expect(conductor.direccion).toBe('Calle 1');
  });

  test('funciona con listas', () => {
    const lista = protegerDatos('conductor', [conductor, conductor]);
    expect(lista).toHaveLength(2);
    lista.forEach((f) => expect(f).not.toHaveProperty('direccion'));
  });

  test('nunca devuelve la contraseña de un usuario', () => {
    const limpio = protegerDatos('usuario', { correo: 'a@b.co', contrasena: '$2a$10$hash' });
    expect(limpio).not.toHaveProperty('contrasena');
  });

  test('las tablas sin politica pasan sin cambios', () => {
    const fila = { placa: 'ABC123' };
    expect(protegerDatos('vehiculos', fila)).toBe(fila);
  });
});

describe('descartarEnmascarados', () => {
  test('quita del cuerpo los valores enmascarados reenviados por un formulario', () => {
    const cuerpo = { nombre: 'Carlos', numero_documento: `${MASCARA}5678` };
    expect(descartarEnmascarados('conductor', cuerpo)).toEqual({ nombre: 'Carlos' });
  });

  test('conserva un valor nuevo escrito completo', () => {
    const cuerpo = { numero_documento: '1099999999' };
    expect(descartarEnmascarados('conductor', cuerpo)).toEqual({ numero_documento: '1099999999' });
  });

  test('ignora cuerpos vacios', () => {
    expect(descartarEnmascarados('conductor', null)).toBeNull();
  });
});
