// PRUEBAS UNITARIAS: reglas de formato (schemas/reglas.js)
// Tecnica: caja negra 
import { describe, expect, test } from '@jest/globals';
import {
  documentoValido,
  lugar,
  mensajeDocumento,
  nombrePersona,
  placa,
  telefono
} from '../../schemas/reglas.js';

describe('documentoValido', () => {
  test.each([
    ['CC', '12345', true], // limite inferior: 5 digitos
    ['CC', '123456789012345', true], // limite superior: 15 digitos
    ['CC', '1234', false], // por debajo del limite
    ['CC', '1234567890123456', false], // por encima del limite
    ['CC', '10A2345', false], // letras en una cedula
    ['CE', '987654', true],
    ['PA', 'AB12345', true], // el pasaporte admite letras
    ['PA', 'AB-12345', false], // pero no simbolos
    ['CC', null, false],
    ['CC', undefined, false]
  ])('tipo %s con numero %p -> %p', (tipo, numero, esperado) => {
    expect(documentoValido(tipo, numero)).toBe(esperado);
  });

  test('el mensaje de error depende del tipo de documento', () => {
    expect(mensajeDocumento('PA')).toMatch(/pasaporte/i);
    expect(mensajeDocumento('CC')).toMatch(/solo puede tener números/i);
  });
});

describe('nombrePersona', () => {
  const esquema = nombrePersona('El nombre');

  test.each(['Ana', 'María José', "O'Connor", 'Pérez-Gómez', 'Ñandú'])('acepta "%s"', (nombre) => {
    expect(esquema.safeParse(nombre).success).toBe(true);
  });

  test.each(['A', 'Ana2', 'Ana@', '', 'Ana  -María'])('rechaza "%s"', (nombre) => {
    expect(esquema.safeParse(nombre).success).toBe(false);
  });

  test('quita los espacios de mas antes de validar', () => {
    expect(esquema.parse('  Ana   María ')).toBe('Ana María');
  });

  test('rechaza mas de 60 caracteres', () => {
    expect(esquema.safeParse('A'.repeat(61)).success).toBe(false);
    expect(esquema.safeParse('A'.repeat(60)).success).toBe(true);
  });
});

describe('telefono', () => {
  const esquema = telefono();

  test.each(['3001234567', '+57 300 123 4567', '1234567'])('acepta "%s"', (t) => {
    expect(esquema.safeParse(t).success).toBe(true);
  });

  test.each([
    ['123456', 'menos de 7 digitos'],
    ['1234567890123456', 'mas de 15 digitos'],
    ['300-123-4567', 'guiones'],
    ['30012a4567', 'letras'],
    ['57+3001234567', 'un + que no esta al inicio']
  ])('rechaza "%s" (%s)', (t) => {
    expect(esquema.safeParse(t).success).toBe(false);
  });
});

describe('placa', () => {
  const esquema = placa();

  test('normaliza a mayusculas sin espacios ni guiones', () => {
    expect(esquema.parse('abc 123')).toBe('ABC123');
    expect(esquema.parse('abc-12d')).toBe('ABC12D');
  });

  test.each(['AB12', 'ABCD1234', 'ABC$23'])('rechaza "%s"', (p) => {
    expect(esquema.safeParse(p).success).toBe(false);
  });
});

describe('lugar', () => {
  const esquema = lugar('El origen');

  test('acepta un texto normal y limpia espacios', () => {
    expect(esquema.parse('  Medellín   centro ')).toBe('Medellín centro');
  });

  test('rechaza textos demasiado cortos o largos', () => {
    expect(esquema.safeParse('A').success).toBe(false);
    expect(esquema.safeParse('A'.repeat(121)).success).toBe(false);
  });
});
