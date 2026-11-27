// PRUEBAS DE INTEGRACION: reporte semanal en Excel (/api/reportes)
import { beforeEach, describe, expect, test } from '@jest/globals';
import ExcelJS from 'exceljs';
import request from 'supertest';
import { AUTH, cargarApp } from '../helpers/app.js';

const ctx = await cargarApp();
const { app } = ctx;
beforeEach(() => ctx.reiniciar());

// Semana de los datos de prueba: lunes 6 al domingo 12 de enero de 2025.
const SEMANA = '2025-01-06';

// Supertest entrega el archivo como Buffer.
const comoBuffer = (res, callback) => {
  const partes = [];
  res.on('data', (p) => partes.push(p));
  res.on('end', () => callback(null, Buffer.concat(partes)));
};

const pedir = (desde, auth = AUTH.admin()) =>
  request(app)
    .get('/api/reportes/servicios-semanal')
    .query(desde === undefined ? {} : { desde })
    .set('Authorization', auth)
    .buffer(true)
    .parse(comoBuffer);

describe('GET /api/reportes/servicios-semanal', () => {
  test('un conductor no puede descargar reportes (403)', async () => {
    const res = await pedir(SEMANA, AUTH.conductor1());
    expect(res.status).toBe(403);
  });

  test.each([undefined, 'ayer', '2025-13-01', '2025-02-30'])('una fecha invalida (%p) responde 400', async (desde) => {
    const res = await pedir(desde);
    expect(res.status).toBe(400);
  });

  test('una semana futura responde 400', async () => {
    const res = await pedir('2999-01-01');
    expect(res.status).toBe(400);
  });

  test('genera un Excel con los servicios de la semana', async () => {
    const res = await pedir(SEMANA);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheetml/);
    expect(res.headers['content-disposition']).toMatch(/reporte-servicios_2025-01-06_a_2025-01-12\.xlsx/);
    expect(res.headers['x-total-servicios']).toBe('2');

    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(res.body);
    expect(libro.worksheets.map((h) => h.name)).toEqual(['Resumen', 'Servicios']);

    const hoja = libro.getWorksheet('Servicios');
    const codigos = [];
    hoja.eachRow((fila, n) => n > 1 && codigos.push(fila.getCell(1).value));
    expect(codigos).toEqual(['SVC-0001', 'SVC-0002', 'TOTAL']);

    // El servicio 1 llego 30 minutos tarde: el retraso se calcula.
    // Columna 7 = "Retraso (min)".
    expect(hoja.getRow(1).getCell(7).value).toBe('Retraso (min)');
    expect(hoja.getRow(2).getCell(7).value).toBe(30);
  });

  test('una semana sin servicios genera el reporte vacio', async () => {
    const res = await pedir('2024-06-03');
    expect(res.status).toBe(200);
    expect(res.headers['x-total-servicios']).toBe('0');
  });
});
