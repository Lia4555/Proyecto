// PRUEBAS UNITARIAS: casos de uso del conductor
// (servicios, vehiculo, alertas, perfil)
import { ErrorValidacion } from '../../src/Domain/entities';
import {
  ActualizarEstadoServicio,
  CambiarContrasena,
  GuardarFotoPerfil,
  ListarAlertas,
  ListarServicios,
  ObtenerVehiculos,
  QuitarFotoPerfil,
  ReportarEstadoVehiculo
} from '../../src/Domain/useCases';
import {
  alerta,
  alertaRepoFalso,
  documento,
  mantenimiento,
  perfilRepoFalso,
  servicio,
  servicioRepoFalso,
  vehiculo,
  vehiculoRepoFalso
} from '../helpers/fabricas';

describe('ListarServicios', () => {
  test('ordena por fecha de salida, el mas proximo primero', async () => {
    const repo = servicioRepoFalso();
    repo.listar.mockResolvedValue([
      servicio({ id_servicio: 3, fecha_salida: '2025-03-01T08:00:00Z' }),
      servicio({ id_servicio: 1, fecha_salida: '2025-01-01T08:00:00Z' }),
      servicio({ id_servicio: 2, fecha_salida: '2025-02-01T08:00:00Z' })
    ]);

    const lista = await new ListarServicios(repo).ejecutar();
    expect(lista.map((s) => s.id_servicio)).toEqual([1, 2, 3]);
  });

  test('no modifica la lista original del repositorio', async () => {
    const original = [servicio({ id_servicio: 2, fecha_salida: '2025-02-01' }), servicio({ id_servicio: 1, fecha_salida: '2025-01-01' })];
    const repo = servicioRepoFalso();
    repo.listar.mockResolvedValue(original);
    await new ListarServicios(repo).ejecutar();
    expect(original.map((s) => s.id_servicio)).toEqual([2, 1]);
  });
});

describe('ActualizarEstadoServicio', () => {
  test('envia solo el nuevo estado', async () => {
    const repo = servicioRepoFalso();
    await new ActualizarEstadoServicio(repo).ejecutar(7, 2);
    expect(repo.actualizar).toHaveBeenCalledWith(7, { id_estado: 2 });
  });

  test('al cerrar el viaje sella la hora real de llegada', async () => {
    const repo = servicioRepoFalso();
    const antes = Date.now();
    await new ActualizarEstadoServicio(repo).ejecutar(7, 3, { marcarLlegada: true });

    const cambios = repo.actualizar.mock.calls[0][1];
    expect(Date.parse(cambios.fecha_llegada_real as string)).toBeGreaterThanOrEqual(antes);
  });

  test('las observaciones vacias se envian como null', async () => {
    const repo = servicioRepoFalso();
    await new ActualizarEstadoServicio(repo).ejecutar(7, 2, { observaciones: '   ' });
    expect(repo.actualizar).toHaveBeenCalledWith(7, { id_estado: 2, observaciones: null });
  });

  test('recorta los espacios de las observaciones', async () => {
    const repo = servicioRepoFalso();
    await new ActualizarEstadoServicio(repo).ejecutar(7, 2, { observaciones: '  Trancon en la via ' });
    expect(repo.actualizar).toHaveBeenCalledWith(7, { id_estado: 2, observaciones: 'Trancon en la via' });
  });

  test.each([0, -1, 1.5, NaN])('rechaza el estado invalido %p', async (estado) => {
    const repo = servicioRepoFalso();
    await expect(new ActualizarEstadoServicio(repo).ejecutar(7, estado)).rejects.toThrow('estado valido');
    expect(repo.actualizar).not.toHaveBeenCalled();
  });
});

describe('ObtenerVehiculos', () => {
  test('arma la ficha de cada vehiculo con sus documentos y mantenimientos ordenados', async () => {
    const repo = vehiculoRepoFalso();
    repo.listar.mockResolvedValue([vehiculo({ id_vehiculo: 1 }), vehiculo({ id_vehiculo: 2, placa: 'DEF456' })]);
    repo.documentos.mockResolvedValue([
      documento({ id_documento: 1, id_vehiculo: 1, fecha_vencimiento: '2025-12-01' }),
      documento({ id_documento: 2, id_vehiculo: 1, fecha_vencimiento: '2025-06-01' }),
      documento({ id_documento: 3, id_vehiculo: 2 })
    ]);
    repo.mantenimientos.mockResolvedValue([
      mantenimiento({ id_mantenimiento: 1, id_vehiculo: 1, fecha_mantenimiento: '2024-01-01' }),
      mantenimiento({ id_mantenimiento: 2, id_vehiculo: 1, fecha_mantenimiento: '2024-09-01' })
    ]);

    const [primero, segundo] = await new ObtenerVehiculos(repo).ejecutar();

    // Documentos: el que vence antes, primero.
    expect(primero.documentos.map((d) => d.id_documento)).toEqual([2, 1]);
    // Mantenimientos: el mas reciente, primero.
    expect(primero.mantenimientos.map((m) => m.id_mantenimiento)).toEqual([2, 1]);
    expect(segundo.documentos.map((d) => d.id_documento)).toEqual([3]);
    expect(segundo.mantenimientos).toEqual([]);
  });
});

describe('ReportarEstadoVehiculo', () => {
  test('envia solo el estado operativo', async () => {
    const repo = vehiculoRepoFalso();
    await new ReportarEstadoVehiculo(repo).ejecutar(1, false);
    expect(repo.reportar).toHaveBeenCalledWith(1, { estado_operativo: false });
  });
});

describe('ListarAlertas', () => {
  test('primero las pendientes y, dentro de ellas, las de mayor prioridad', async () => {
    const repo = alertaRepoFalso();
    repo.listar.mockResolvedValue([
      alerta({ id_alerta: 1, prioridad: 5, estado_resuelta: true }),
      alerta({ id_alerta: 2, prioridad: 1 }),
      alerta({ id_alerta: 3, prioridad: 4 })
    ]);
    const lista = await new ListarAlertas(repo).ejecutar();
    expect(lista.map((a) => a.id_alerta)).toEqual([3, 2, 1]);
  });
});

describe('CambiarContrasena', () => {
  test('con datos validos llama al repositorio', async () => {
    const repo = perfilRepoFalso();
    repo.cambiarContrasena.mockResolvedValue('Tu contraseña se cambió.');
    await expect(new CambiarContrasena(repo).ejecutar('Actual123', 'Nueva1234', 'Nueva1234')).resolves.toMatch(/cambió/);
    expect(repo.cambiarContrasena).toHaveBeenCalledWith('Actual123', 'Nueva1234');
  });

  const errores = async (actual: string, nueva: string, repetir: string) => {
    try {
      await new CambiarContrasena(perfilRepoFalso()).ejecutar(actual, nueva, repetir);
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorValidacion);
      return (e as ErrorValidacion).campos;
    }
    throw new Error('Se esperaba un ErrorValidacion');
  };

  test('exige la contraseña actual', async () => {
    expect((await errores('', 'Nueva1234', 'Nueva1234')).actual).toBeDefined();
  });

  test('la nueva debe ser distinta de la actual', async () => {
    expect((await errores('Igual1234', 'Igual1234', 'Igual1234')).nueva).toMatch(/distinta/);
  });

  test('la nueva debe cumplir el largo minimo', async () => {
    expect((await errores('Actual123', 'corta', 'corta')).nueva).toMatch(/al menos 8/);
  });

  test('la repeticion debe coincidir', async () => {
    expect((await errores('Actual123', 'Nueva1234', 'Nueva9999')).repetir).toMatch(/no coinciden/);
  });

  test('pide repetir la contraseña', async () => {
    expect((await errores('Actual123', 'Nueva1234', '')).repetir).toMatch(/Repite/);
  });
});

describe('foto de perfil', () => {
  const PNG = 'data:image/png;base64,iVBORw0KGgo=';

  test('guarda una imagen con formato permitido', async () => {
    const repo = perfilRepoFalso();
    repo.guardarFoto.mockResolvedValue(PNG);
    await expect(new GuardarFotoPerfil(repo).ejecutar(PNG)).resolves.toBe(PNG);
  });

  test.each([
    'data:image/svg+xml;base64,PHN2Zy8+',
    'data:image/gif;base64,R0lGOD',
    'https://sitio.com/foto.png',
    'no es una imagen'
  ])('rechaza "%s"', async (foto) => {
    const repo = perfilRepoFalso();
    await expect(new GuardarFotoPerfil(repo).ejecutar(foto)).rejects.toThrow('JPG, PNG o WebP');
    expect(repo.guardarFoto).not.toHaveBeenCalled();
  });

  test('rechaza una imagen demasiado grande', async () => {
    const repo = perfilRepoFalso();
    const grande = `data:image/jpeg;base64,${'A'.repeat(200001)}`;
    await expect(new GuardarFotoPerfil(repo).ejecutar(grande)).rejects.toThrow('demasiado grande');
  });

  test('quitar la foto delega en el repositorio', async () => {
    const repo = perfilRepoFalso();
    await new QuitarFotoPerfil(repo).ejecutar();
    expect(repo.quitarFoto).toHaveBeenCalled();
  });
});
