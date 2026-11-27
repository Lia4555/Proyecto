// PRUEBAS UNITARIAS: administracion generica de tablas
// (src/Domain/useCases/tablas/GestionTablas.ts + entities/Tabla.ts)
import { MASCARA, Tabla, TABLAS, buscarTabla, etiquetaDeFila, referenciasDe } from '../../src/Domain/entities';
import { TablaRepository } from '../../src/Domain/repositories';
import {
  CargarCatalogos,
  CargarReferencias,
  EliminarFila,
  GuardarFila,
  ListarFilas,
  ValidarRegistro,
  construirCuerpo,
  textoDeCampo,
  valoresIniciales
} from '../../src/Domain/useCases';
import { catalogoRepoFalso, catalogos } from '../helpers/fabricas';

const tablaRepoFalso = (): jest.Mocked<TablaRepository> => ({
  listar: jest.fn(),
  crear: jest.fn(),
  actualizar: jest.fn(),
  eliminar: jest.fn()
});

// Tabla de prueba con un campo de cada tipo y formato.
const PERSONAS: Tabla = {
  key: 'personas',
  label: 'Personas',
  descripcion: 'Tabla de prueba',
  endpoint: 'personas',
  pk: 'id_persona',
  grupo: 'Personas',
  mostrar: ['nombre', 'apellido'],
  fields: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true, format: 'nombre' },
    { name: 'apellido', label: 'Apellido', type: 'text', format: 'nombre' },
    { name: 'email', label: 'Correo', type: 'email' },
    { name: 'telefono', label: 'Teléfono', type: 'text', format: 'telefono' },
    { name: 'id_conductor', label: 'Conductor', type: 'text', format: 'uuid' },
    { name: 'documento', label: 'Documento', type: 'text', minLength: 5 },
    { name: 'edad', label: 'Edad', type: 'number', min: 18, integer: true },
    { name: 'inicio', label: 'Inicio', type: 'date' },
    { name: 'fin', label: 'Fin', type: 'date', after: 'inicio' },
    { name: 'salida', label: 'Salida', type: 'datetime' },
    { name: 'activo', label: 'Activo', type: 'checkbox', porDefecto: true }
  ]
};

const validar = (valores: Record<string, unknown>) => new ValidarRegistro().ejecutar(PERSONAS, valores);

describe('ValidarRegistro', () => {
  test('un registro valido no tiene errores', () => {
    expect(
      validar({
        nombre: 'Ana María',
        email: 'ana@dviaje.com',
        telefono: '+57 300 1234567',
        id_conductor: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        documento: '1012345',
        edad: '30',
        inicio: '2025-01-01',
        fin: '2025-02-01'
      })
    ).toEqual({});
  });

  test('un campo obligatorio vacio se marca', () => {
    expect(validar({ nombre: '' }).nombre).toBe('Este campo es obligatorio.');
    expect(validar({}).nombre).toBe('Este campo es obligatorio.');
  });

  test('un nombre escrito solo con espacios tampoco pasa', () => {
    expect(validar({ nombre: '   ' }).nombre).toBeDefined();
  });

  test.each([
    ['email', 'ana@', /correo válido/],
    ['nombre', 'Ana3', /Solo letras/],
    ['telefono', '12ab', /teléfono válido/],
    ['id_conductor', '123', /Elige una opción/],
    ['documento', '123', /al menos 5/],
    ['edad', 'treinta', /número/],
    ['edad', '17', /mínimo es 18/],
    ['edad', '20.5', /entero/]
  ])('el campo %s con "%s" da error', (campo, valor, mensaje) => {
    expect(validar({ nombre: 'Ana', [campo]: valor })[campo]).toMatch(mensaje);
  });

  test('una fecha final anterior a la inicial se rechaza', () => {
    expect(validar({ nombre: 'Ana', inicio: '2025-02-01', fin: '2025-01-01' }).fin).toMatch(/anterior a «Inicio»/);
  });

  test('un valor enmascarado sin tocar no se valida', () => {
    expect(validar({ nombre: 'Ana', documento: `${MASCARA}5678` })).toEqual({});
  });

  test('escribir encima de un valor enmascarado pide escribirlo completo', () => {
    expect(validar({ nombre: 'Ana', documento: `${MASCARA}5678999` }).documento).toMatch(/Borra el valor oculto/);
  });
});

describe('construirCuerpo', () => {
  test('convierte lo escrito en pantalla al formato del backend', () => {
    const cuerpo = construirCuerpo(PERSONAS, {
      nombre: '  Ana ',
      edad: '30',
      salida: '2025-01-07T08:00',
      activo: '',
      email: ''
    });

    expect(cuerpo.nombre).toBe('Ana');
    expect(cuerpo.edad).toBe(30);
    expect(cuerpo.salida).toBe(new Date('2025-01-07T08:00').toISOString());
    expect(cuerpo.activo).toBe(false);
    // Un opcional vacio se omite para no pisar la columna con "".
    expect(cuerpo).not.toHaveProperty('email');
  });

  test('un obligatorio vacio se envia vacio para que el servidor avise', () => {
    expect(construirCuerpo(PERSONAS, { nombre: '' }).nombre).toBe('');
  });

  test('un valor enmascarado no se envia (no pisa el dato real)', () => {
    expect(construirCuerpo(PERSONAS, { nombre: 'Ana', documento: `${MASCARA}5678` })).not.toHaveProperty('documento');
  });
});

describe('valoresIniciales', () => {
  test('al crear: campos vacios y casillas con su valor por defecto', () => {
    const valores = valoresIniciales(PERSONAS);
    expect(valores.nombre).toBe('');
    expect(valores.activo).toBe(true);
  });

  test('al editar: recorta fechas y convierte a texto', () => {
    const valores = valoresIniciales(PERSONAS, {
      nombre: 'Ana',
      edad: 30,
      inicio: '2025-01-01T00:00:00+00:00',
      salida: '2025-01-07T08:00:00+00:00',
      activo: false,
      apellido: null
    });
    expect(valores).toMatchObject({
      nombre: 'Ana',
      edad: '30',
      inicio: '2025-01-01',
      salida: '2025-01-07T08:00',
      activo: false,
      apellido: ''
    });
  });
});

describe('ListarFilas, GuardarFila y EliminarFila', () => {
  test('listar usa el endpoint de la tabla', async () => {
    const repo = tablaRepoFalso();
    repo.listar.mockResolvedValue([{ id_persona: 1 }]);
    await expect(new ListarFilas(repo).ejecutar(PERSONAS)).resolves.toEqual([{ id_persona: 1 }]);
    expect(repo.listar).toHaveBeenCalledWith('personas');
  });

  test('sin fila original crea un registro nuevo', async () => {
    const repo = tablaRepoFalso();
    const mensaje = await new GuardarFila(repo).ejecutar(PERSONAS, { nombre: 'Ana' });
    expect(repo.crear).toHaveBeenCalledWith('personas', expect.objectContaining({ nombre: 'Ana' }));
    expect(repo.actualizar).not.toHaveBeenCalled();
    expect(mensaje).toMatch(/Se creó/);
  });

  test('con fila original actualiza por su llave primaria', async () => {
    const repo = tablaRepoFalso();
    const mensaje = await new GuardarFila(repo).ejecutar(PERSONAS, { nombre: 'Ana' }, { id_persona: 7 });
    expect(repo.actualizar).toHaveBeenCalledWith('personas', 7, expect.objectContaining({ nombre: 'Ana' }));
    expect(mensaje).toMatch(/guardaron/);
  });

  test('eliminar usa la llave primaria de la fila', async () => {
    const repo = tablaRepoFalso();
    await new EliminarFila(repo).ejecutar(PERSONAS, { id_persona: 7 });
    expect(repo.eliminar).toHaveBeenCalledWith('personas', 7);
  });
});

describe('referencias (listas desplegables)', () => {
  const vehiculos = buscarTabla('vehiculos') as Tabla;

  test('todas las tablas declaradas tienen endpoint, llave y campos', () => {
    for (const tabla of TABLAS) {
      expect(tabla.endpoint).toBeTruthy();
      expect(tabla.pk).toBeTruthy();
      expect(tabla.fields.length).toBeGreaterThan(0);
    }
  });

  test('toda referencia apunta a una tabla que existe', () => {
    for (const tabla of TABLAS) {
      for (const ref of referenciasDe(tabla)) expect(buscarTabla(ref)).toBeDefined();
    }
  });

  test('vehiculos apunta a tipos de vehiculo y conductores', () => {
    expect(referenciasDe(vehiculos).sort()).toEqual(['conductor', 'tipos-vehiculo']);
  });

  test('etiquetaDeFila muestra nombres y nunca el id', () => {
    expect(etiquetaDeFila(vehiculos, { id_vehiculo: 1, placa: 'ABC123', marca: 'Chevrolet' })).toBe('ABC123 · Chevrolet');
    expect(etiquetaDeFila(PERSONAS, { id_persona: 9 })).toBe('Sin nombre');
  });

  test('carga las opciones ordenadas por nombre; si una lista falla, las demas siguen', async () => {
    const repo = tablaRepoFalso();
    repo.listar.mockImplementation(async (endpoint) => {
      if (endpoint === 'conductor') throw new Error('sin red');
      return [
        { id_tipo_vehiculo: 2, nombre_tipo: 'Van' },
        { id_tipo_vehiculo: 1, nombre_tipo: 'Buseta' }
      ];
    });

    const listas = await new CargarReferencias(repo).ejecutar(vehiculos);
    expect(listas['tipos-vehiculo']).toEqual([
      { valor: '1', etiqueta: 'Buseta' },
      { valor: '2', etiqueta: 'Van' }
    ]);
    expect(listas).not.toHaveProperty('conductor');
  });

  test('textoDeCampo muestra el nombre de una referencia', () => {
    const campo = vehiculos.fields.find((f) => f.name === 'id_tipo_vehiculo');
    const refs = { 'tipos-vehiculo': [{ valor: '1', etiqueta: 'Buseta' }] };
    expect(textoDeCampo(campo, 1, refs)).toBe('Buseta');
    expect(textoDeCampo(campo, 99, refs)).toBe('Sin nombre');
  });

  test.each([
    [undefined, null, '—'],
    [undefined, true, 'Sí'],
    [undefined, false, 'No'],
    [{ name: 'f', label: 'F', type: 'date' as const }, '2025-01-07T08:00:00Z', '2025-01-07'],
    [{ name: 'f', label: 'F', type: 'datetime' as const }, '2025-01-07T08:00:00Z', '2025-01-07 08:00'],
    [undefined, 42, '42']
  ])('textoDeCampo(%p, %p) -> %p', (campo, valor, esperado) => {
    expect(textoDeCampo(campo, valor, {})).toBe(esperado);
  });
});

describe('CargarCatalogos', () => {
  test('delega en el repositorio', async () => {
    const repo = catalogoRepoFalso();
    repo.cargar.mockResolvedValue(catalogos());
    await expect(new CargarCatalogos(repo).ejecutar()).resolves.toEqual(catalogos());
  });
});
