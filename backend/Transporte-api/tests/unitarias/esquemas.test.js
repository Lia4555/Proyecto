// PRUEBAS UNITARIAS: esquemas de validacion de las tablas
// (schemas/genericSchema.js)
import { describe, expect, test } from '@jest/globals';
import { schemas } from '../../schemas/genericSchema.js';

const UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const servicioValido = () => ({
  fecha_salida: '2025-02-01T08:00:00-05:00',
  fecha_llegada_estimada: '2025-02-01T14:00:00-05:00',
  numero_pasajeros: 10,
  precio_total: 350000,
  id_conductor: UUID,
  id_vehiculo: 1,
  id_estado: 1,
  origen: 'Bogotá',
  destino: 'Medellín'
});

describe('esquema de servicios', () => {
  test('acepta un servicio completo y pone valores por defecto', () => {
    const datos = schemas.servicios.parse(servicioValido());
    expect(datos.tipo_servicio).toBe('Regular');
    expect(datos.peajes_estimados).toBe(0);
  });

  test('elimina columnas que no existen (proteccion contra mass assignment)', () => {
    const datos = schemas.servicios.parse({ ...servicioValido(), es_admin: true, contrasena: 'x' });
    expect(datos).not.toHaveProperty('es_admin');
    expect(datos).not.toHaveProperty('contrasena');
  });

  test.each([
    ['numero_pasajeros', 0],
    ['numero_pasajeros', 2.5],
    ['precio_total', -1],
    ['id_conductor', 'no-es-uuid'],
    ['fecha_salida', 'mañana']
  ])('rechaza %s = %p', (campo, valor) => {
    expect(schemas.servicios.safeParse({ ...servicioValido(), [campo]: valor }).success).toBe(false);
  });

  test('una edicion parcial no exige el registro completo', () => {
    expect(schemas.servicios.partial().safeParse({ id_estado: 2 }).success).toBe(true);
  });
});

describe('esquema de vehiculos', () => {
  const vehiculo = {
    placa: 'abc 123',
    marca: 'Chevrolet',
    linea: 'NPR',
    modelo: '2020',
    capacidad_pasajeros: 19,
    id_tipo_vehiculo: 1
  };

  test('normaliza la placa', () => {
    expect(schemas.vehiculos.parse(vehiculo).placa).toBe('ABC123');
  });

  test('el numero interno solo admite digitos', () => {
    expect(schemas.vehiculos.safeParse({ ...vehiculo, numero_interno: '12A' }).success).toBe(false);
    expect(schemas.vehiculos.safeParse({ ...vehiculo, numero_interno: '012' }).success).toBe(true);
  });

  test('la capacidad debe ser un entero positivo', () => {
    expect(schemas.vehiculos.safeParse({ ...vehiculo, capacidad_pasajeros: 0 }).success).toBe(false);
  });
});

describe('esquema de alertas', () => {
  test('exige el conductor destino como UUID', () => {
    const alerta = { descripcion: 'Revisar llantas', id_tipo_alerta: 1, id_usuario_destino: UUID };
    expect(schemas.alertas.safeParse(alerta).success).toBe(true);
    expect(schemas.alertas.safeParse({ ...alerta, id_usuario_destino: '5' }).success).toBe(false);
  });
});
