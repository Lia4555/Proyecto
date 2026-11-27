// PRUEBAS UNITARIAS: reglas de las entidades (src/Domain/entities)
// Tecnica: caja negra con particion de equivalencia y valores limite.
import {
  MASCARA,
  errorContrasena,
  errorNombre,
  errorTelefono,
  esAdministrador,
  esConductor,
  esUrgente,
  esValorEnmascarado,
  estaCerrado,
  documentoVencido,
  limpiarNombre,
  limpiarTelefono,
  lugarDeServicio,
  nombreEstado,
  normalizarNombre,
  vaConRetraso
} from '../../src/Domain/entities';
import { alerta, catalogos, documento, servicio, usuario } from '../helpers/fabricas';

describe('nombres de persona', () => {
  test('limpiarNombre quita numeros y simbolos mientras se escribe', () => {
    expect(limpiarNombre('Ana2  María$')).toBe('Ana María');
  });

  test('limpiarNombre corta en 60 caracteres', () => {
    expect(limpiarNombre('a'.repeat(80))).toHaveLength(60);
  });

  test('normalizarNombre deja un solo espacio entre palabras', () => {
    expect(normalizarNombre('  Ana   María ')).toBe('Ana María');
  });

  test.each(['Ana', 'María José', "O'Connor", 'Pérez-Gómez'])('errorNombre acepta "%s"', (n) => {
    expect(errorNombre(n)).toBeNull();
  });

  test.each([
    ['A', /al menos 2/],
    ['Ana3', /Solo letras/],
    ['Ana@', /Solo letras/]
  ])('errorNombre rechaza "%s"', (n, mensaje) => {
    expect(errorNombre(n)).toMatch(mensaje);
  });
});

describe('telefonos', () => {
  test('limpiarTelefono conserva solo digitos, espacios y el + inicial', () => {
    expect(limpiarTelefono('+57 (300) abc-123')).toBe('+57 300 123');
    expect(limpiarTelefono('300+123')).toBe('300123');
  });

  test.each(['3001234567', '+57 300 123 4567', '1234567'])('errorTelefono acepta "%s"', (t) => {
    expect(errorTelefono(t)).toBeNull();
  });

  test.each(['123456', '1234567890123456', '300-1234567', '30a1234567'])('errorTelefono rechaza "%s"', (t) => {
    expect(errorTelefono(t)).not.toBeNull();
  });
});

describe('contraseñas', () => {
  test('vacia', () => expect(errorContrasena('')).toMatch(/Escribe/));
  test('7 caracteres (limite inferior - 1)', () => expect(errorContrasena('1234567')).toMatch(/al menos 8/));
  test('8 caracteres (limite inferior)', () => expect(errorContrasena('12345678')).toBeNull());
  test('72 caracteres (limite superior)', () => expect(errorContrasena('a'.repeat(72))).toBeNull());
  test('73 caracteres (limite superior + 1)', () => expect(errorContrasena('a'.repeat(73))).toMatch(/máximo 72/));
});

describe('valores enmascarados', () => {
  test('reconoce un dato oculto por el servidor', () => {
    expect(esValorEnmascarado(`${MASCARA}5678`)).toBe(true);
    expect(esValorEnmascarado('1012345678')).toBe(false);
    expect(esValorEnmascarado(null)).toBe(false);
  });
});

describe('roles', () => {
  test('distingue administrador y conductor', () => {
    expect(esAdministrador(usuario({ rol: 'Administrador' }))).toBe(true);
    expect(esConductor(usuario())).toBe(true);
    expect(esAdministrador(null)).toBe(false);
    expect(esConductor(null)).toBe(false);
  });
});

describe('servicios', () => {
  test.each(['Finalizado', 'Completado', 'Cancelado', 'Anulado', 'terminado'])('"%s" es un estado cerrado', (e) => {
    expect(estaCerrado(e)).toBe(true);
  });

  test.each(['Programado', 'En ruta'])('"%s" sigue abierto', (e) => {
    expect(estaCerrado(e)).toBe(false);
  });

  test('va con retraso si paso la hora estimada y no ha llegado', () => {
    expect(vaConRetraso(servicio({ fecha_llegada_estimada: '2000-01-01T00:00:00Z' }))).toBe(true);
  });

  test('no va con retraso si ya registro la llegada', () => {
    expect(
      vaConRetraso(servicio({ fecha_llegada_estimada: '2000-01-01T00:00:00Z', fecha_llegada_real: '2000-01-01T01:00:00Z' }))
    ).toBe(false);
  });

  test('no va con retraso si la llegada estimada es futura', () => {
    expect(vaConRetraso(servicio({ fecha_llegada_estimada: '2999-01-01T00:00:00Z' }))).toBe(false);
  });
});

describe('catalogos', () => {
  test('nombreEstado traduce el id a su nombre', () => {
    expect(nombreEstado(catalogos(), 2)).toBe('En ruta');
  });

  test('nombreEstado no falla con un id desconocido', () => {
    expect(nombreEstado(catalogos(), 99)).toBe('Estado 99');
  });

  test('lugarDeServicio prefiere el texto escrito a mano', () => {
    expect(lugarDeServicio(catalogos(), '  Cali ', 1)).toBe('Cali');
  });

  test('lugarDeServicio usa el catalogo para servicios antiguos', () => {
    expect(lugarDeServicio(catalogos(), null, 1)).toBe('Terminal Norte (Bogotá)');
    expect(lugarDeServicio(catalogos(), '', null)).toBe('Sin definir');
  });
});

describe('alertas y documentos', () => {
  test('una alerta pendiente con prioridad 3 o mas es urgente', () => {
    expect(esUrgente(alerta({ prioridad: 3 }))).toBe(true);
    expect(esUrgente(alerta({ prioridad: 2 }))).toBe(false);
    expect(esUrgente(alerta({ prioridad: 5, estado_resuelta: true }))).toBe(false);
  });

  test('un documento con fecha pasada esta vencido', () => {
    expect(documentoVencido(documento({ fecha_vencimiento: '2000-01-01' }))).toBe(true);
    expect(documentoVencido(documento({ fecha_vencimiento: '2999-01-01' }))).toBe(false);
  });
});
