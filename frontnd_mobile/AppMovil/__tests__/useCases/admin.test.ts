// PRUEBAS UNITARIAS: casos de uso del administrador
import { ErrorValidacion, NuevaAlerta, NuevoServicio } from '../../src/Domain/entities';
import {
  CrearAlerta,
  CrearServicio,
  EditarServicio,
  GestionarCuenta,
  ListarCuentas,
  ObtenerResumenAdmin,
  ResolverAlerta,
  RestablecerContrasena
} from '../../src/Domain/useCases';
import {
  adminRepoFalso,
  alerta,
  alertaRepoFalso,
  catalogoRepoFalso,
  catalogos,
  cuenta,
  documento,
  servicio,
  servicioRepoFalso,
  vehiculo,
  vehiculoRepoFalso
} from '../helpers/fabricas';

const nuevoServicio = (cambios: Partial<NuevoServicio> = {}): Partial<NuevoServicio> => ({
  codigo_servicio: ' SVC-0100 ',
  tipo_servicio: 'Regular',
  fecha_salida: '2025-03-01T08:00:00Z',
  fecha_llegada_estimada: '2025-03-01T14:00:00Z',
  numero_pasajeros: 10,
  precio_total: 300000,
  id_conductor: 'k-1',
  id_vehiculo: 1,
  id_origen: 1,
  id_destino: 2,
  id_estado: 1,
  ...cambios
});

describe('CrearServicio', () => {
  test('un servicio completo no tiene errores', () => {
    expect(new CrearServicio(servicioRepoFalso()).validar(nuevoServicio())).toEqual({});
  });

  test('un formulario vacio marca todos los campos obligatorios', () => {
    const errores = new CrearServicio(servicioRepoFalso()).validar({});
    expect(Object.keys(errores)).toEqual(
      expect.arrayContaining([
        'codigo_servicio', 'tipo_servicio', 'id_origen', 'id_destino', 'fecha_salida',
        'fecha_llegada_estimada', 'numero_pasajeros', 'precio_total', 'id_conductor', 'id_vehiculo', 'id_estado'
      ])
    );
  });

  test('el destino no puede ser igual al origen', () => {
    const errores = new CrearServicio(servicioRepoFalso()).validar(nuevoServicio({ id_destino: 1 }));
    expect(errores.id_destino).toMatch(/distinto/);
  });

  test('la llegada debe ser despues de la salida', () => {
    const errores = new CrearServicio(servicioRepoFalso()).validar(
      nuevoServicio({ fecha_llegada_estimada: '2025-03-01T08:00:00Z' })
    );
    expect(errores.fecha_llegada_estimada).toMatch(/después/);
  });

  test.each([0, -2, 1.5])('rechaza %p pasajeros', (n) => {
    expect(new CrearServicio(servicioRepoFalso()).validar(nuevoServicio({ numero_pasajeros: n })).numero_pasajeros).toBeDefined();
  });

  test('envia el codigo sin espacios y descarta observaciones vacias', async () => {
    const repo = servicioRepoFalso();
    await new CrearServicio(repo).ejecutar(nuevoServicio({ observaciones: '   ' }));
    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ codigo_servicio: 'SVC-0100', observaciones: undefined })
    );
  });

  test('con errores no llama al servidor', async () => {
    const repo = servicioRepoFalso();
    await expect(new CrearServicio(repo).ejecutar({})).rejects.toBeInstanceOf(ErrorValidacion);
    expect(repo.crear).not.toHaveBeenCalled();
  });
});

describe('EditarServicio', () => {
  test('envia solo lo que cambio', async () => {
    const repo = servicioRepoFalso();
    await new EditarServicio(repo).ejecutar(
      servicio({ id_estado: 1, id_vehiculo: 1 }),
      { id_estado: 2, id_vehiculo: 1 },
      { cierraViaje: false }
    );
    expect(repo.actualizar).toHaveBeenCalledWith(1, { id_estado: 2 });
  });

  test('al cerrar el viaje sella la llegada real si no la tenia', async () => {
    const repo = servicioRepoFalso();
    await new EditarServicio(repo).ejecutar(servicio(), { id_estado: 3 }, { cierraViaje: true });
    expect(repo.actualizar.mock.calls[0][1].fecha_llegada_real).toEqual(expect.any(String));
  });

  test('no pisa una llegada real ya registrada', async () => {
    const repo = servicioRepoFalso();
    await new EditarServicio(repo).ejecutar(
      servicio({ fecha_llegada_real: '2025-01-07T19:30:00Z' }),
      { id_estado: 3 },
      { cierraViaje: true }
    );
    expect(repo.actualizar.mock.calls[0][1]).not.toHaveProperty('fecha_llegada_real');
  });

  test('sin cambios avisa y no llama al servidor', async () => {
    const repo = servicioRepoFalso();
    await expect(
      new EditarServicio(repo).ejecutar(servicio(), { id_estado: 1, observaciones: '  ' }, { cierraViaje: false })
    ).rejects.toThrow('No hay cambios');
    expect(repo.actualizar).not.toHaveBeenCalled();
  });
});

describe('CrearAlerta y ResolverAlerta', () => {
  const nueva = (cambios: Partial<NuevaAlerta> = {}): Partial<NuevaAlerta> => ({
    id_usuario_destino: 'k-1',
    id_tipo_alerta: 1,
    tipo_alerta: 'Mantenimiento',
    prioridad: 3,
    descripcion: '  Revisar frenos ',
    ...cambios
  });

  test('crea la alerta pendiente con la descripcion limpia', async () => {
    const repo = alertaRepoFalso();
    await new CrearAlerta(repo).ejecutar(nueva());
    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ descripcion: 'Revisar frenos', estado_resuelta: false })
    );
  });

  test.each([0, 6])('rechaza la prioridad %p (fuera de 1 a 5)', (prioridad) => {
    expect(new CrearAlerta(alertaRepoFalso()).validar(nueva({ prioridad })).prioridad).toBeDefined();
  });

  test('exige conductor, tipo y descripcion', () => {
    const errores = new CrearAlerta(alertaRepoFalso()).validar({ prioridad: 1 });
    expect(Object.keys(errores).sort()).toEqual(['descripcion', 'id_tipo_alerta', 'id_usuario_destino']);
  });

  test('no se puede resolver dos veces la misma alerta', () => {
    const repo = alertaRepoFalso();
    expect(() => new ResolverAlerta(repo).ejecutar(alerta({ estado_resuelta: true }))).toThrow('ya estaba resuelta');
    expect(repo.resolver).not.toHaveBeenCalled();
  });

  test('resuelve una alerta pendiente', async () => {
    const repo = alertaRepoFalso();
    await new ResolverAlerta(repo).ejecutar(alerta({ id_alerta: 9 }));
    expect(repo.resolver).toHaveBeenCalledWith(9);
  });
});

describe('cuentas de acceso', () => {
  test('ListarCuentas: pendientes primero, luego activas y desactivadas; recientes arriba', async () => {
    const repo = adminRepoFalso();
    repo.cuentas.mockResolvedValue([
      cuenta({ id_usuario: 'desactivada', estado: 'desactivada' }),
      cuenta({ id_usuario: 'activa', estado: 'activa' }),
      cuenta({ id_usuario: 'pend-vieja', fecha_registro: '2025-01-01T00:00:00Z' }),
      cuenta({ id_usuario: 'pend-nueva', fecha_registro: '2025-02-01T00:00:00Z' })
    ]);
    const lista = await new ListarCuentas(repo).ejecutar();
    expect(lista.map((c) => c.id_usuario)).toEqual(['pend-nueva', 'pend-vieja', 'activa', 'desactivada']);
  });

  test('no se puede desactivar la propia cuenta', () => {
    expect(() =>
      new GestionarCuenta(adminRepoFalso()).ejecutar(cuenta({ es_tu_cuenta: true, estado: 'activa' }), 'desactivar')
    ).toThrow('propia cuenta');
  });

  test('solo se rechazan solicitudes pendientes', () => {
    expect(() => new GestionarCuenta(adminRepoFalso()).ejecutar(cuenta({ estado: 'activa' }), 'rechazar')).toThrow(
      'pendientes'
    );
  });

  test('aprobar una solicitud exige elegir el rol', () => {
    expect(() => new GestionarCuenta(adminRepoFalso()).ejecutar(cuenta(), 'aprobar')).toThrow('Elige');
  });

  test('reactivar una cuenta desactivada no exige rol', async () => {
    const repo = adminRepoFalso();
    await new GestionarCuenta(repo).ejecutar(cuenta({ estado: 'desactivada' }), 'aprobar');
    expect(repo.gestionarCuenta).toHaveBeenCalledWith('u-9', 'aprobar', undefined);
  });

  test('aprueba con el rol elegido', async () => {
    const repo = adminRepoFalso();
    await new GestionarCuenta(repo).ejecutar(cuenta(), 'aprobar', 'Conductor');
    expect(repo.gestionarCuenta).toHaveBeenCalledWith('u-9', 'aprobar', 'Conductor');
  });

  test('RestablecerContrasena valida y delega', async () => {
    const repo = adminRepoFalso();
    await new RestablecerContrasena(repo).ejecutar(cuenta(), 'Temporal2025', 'Temporal2025');
    expect(repo.restablecerContrasena).toHaveBeenCalledWith('u-9', 'Temporal2025');
  });

  test('RestablecerContrasena no se usa para la propia cuenta', () => {
    expect(() =>
      new RestablecerContrasena(adminRepoFalso()).ejecutar(cuenta({ es_tu_cuenta: true }), 'Temporal2025', 'Temporal2025')
    ).toThrow('Mi perfil');
  });

  test('RestablecerContrasena exige que coincidan', () => {
    expect(() => new RestablecerContrasena(adminRepoFalso()).ejecutar(cuenta(), 'Temporal2025', 'Otra12345')).toThrow(
      ErrorValidacion
    );
  });
});

describe('ObtenerResumenAdmin', () => {
  test('calcula los indicadores del dia', async () => {
    const ahora = new Date(2025, 0, 10, 12, 0, 0); // 10 de enero de 2025, mediodia local
    const admin = adminRepoFalso();
    const servicios = servicioRepoFalso();
    const vehiculos = vehiculoRepoFalso();
    const alertas = alertaRepoFalso();
    const cats = catalogoRepoFalso();

    admin.cuentas.mockResolvedValue([cuenta(), cuenta({ estado: 'activa' })]);
    servicios.listar.mockResolvedValue([
      // hoy, en ruta y con la llegada vencida -> en curso y retrasado
      servicio({ id_servicio: 1, fecha_salida: new Date(2025, 0, 10, 8).toISOString(), id_estado: 2, fecha_llegada_estimada: '2000-01-01T00:00:00Z' }),
      // hoy, finalizado -> no cuenta como en curso ni retrasado
      servicio({ id_servicio: 2, fecha_salida: new Date(2025, 0, 10, 6).toISOString(), id_estado: 3, fecha_llegada_estimada: '2000-01-01T00:00:00Z' }),
      // otro dia, programado
      servicio({ id_servicio: 3, fecha_salida: new Date(2025, 0, 20, 8).toISOString(), id_estado: 1, fecha_llegada_estimada: '2999-01-01T00:00:00Z' })
    ]);
    vehiculos.listar.mockResolvedValue([vehiculo(), vehiculo({ id_vehiculo: 2, estado_operativo: false })]);
    vehiculos.documentos.mockResolvedValue([
      documento({ fecha_vencimiento: '2025-01-05' }), // vencido
      documento({ fecha_vencimiento: '2025-01-10' }), // vence hoy: por vencer
      documento({ fecha_vencimiento: '2025-02-01' }), // dentro de 30 dias: por vencer
      documento({ fecha_vencimiento: '2025-06-01' }) // lejano
    ]);
    alertas.listar.mockResolvedValue([alerta(), alerta({ estado_resuelta: true })]);
    cats.cargar.mockResolvedValue(catalogos());

    const resumen = await new ObtenerResumenAdmin(admin, servicios, vehiculos, alertas, cats).ejecutar(ahora);

    expect(resumen).toEqual({
      cuentasPendientes: 1,
      serviciosHoy: 2,
      serviciosEnCurso: 1,
      serviciosRetrasados: 1,
      vehiculosFueraDeServicio: 1,
      documentosVencidos: 1,
      documentosPorVencer: 2,
      alertasSinResolver: 1
    });
  });
});
