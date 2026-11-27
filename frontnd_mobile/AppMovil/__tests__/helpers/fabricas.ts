// ============================================================
// FABRICAS DE DATOS Y DOBLES DE PRUEBA
// ------------------------------------------------------------
// Los casos de uso reciben sus repositorios por el constructor
// (inyeccion de dependencias). En las pruebas se les pasa un
// repositorio FALSO hecho con jest.fn(): asi se prueba solo la
// regla de negocio, sin red ni servidor.
// ============================================================
import {
  Alerta,
  Catalogos,
  CuentaAcceso,
  DocumentoVehiculo,
  Mantenimiento,
  Servicio,
  SolicitudCuenta,
  Usuario,
  Vehiculo
} from '../../src/Domain/entities';
import {
  AdminRepository,
  AlertaRepository,
  AuthRepository,
  CatalogoRepository,
  PerfilRepository,
  ServicioRepository,
  VehiculoRepository
} from '../../src/Domain/repositories';

export const usuario = (cambios: Partial<Usuario> = {}): Usuario => ({
  id_usuario: 'u-1',
  nombre: 'Carlos',
  apellido: 'Uno',
  correo: 'conductor1@dviaje.com',
  id_rol: 2,
  rol: 'Conductor',
  nivel_permiso: 2,
  id_conductor: 'k-1',
  ...cambios
});

export const servicio = (cambios: Partial<Servicio> = {}): Servicio => ({
  id_servicio: 1,
  codigo_servicio: 'SVC-0001',
  tipo_servicio: 'Regular',
  fecha_salida: '2025-01-07T13:00:00Z',
  fecha_llegada_estimada: '2025-01-07T19:00:00Z',
  fecha_llegada_real: null,
  numero_pasajeros: 10,
  precio_total: 500000,
  distancia_estimada_km: 400,
  peajes_estimados: 0,
  observaciones: null,
  id_conductor: 'k-1',
  id_vehiculo: 1,
  origen: 'Bogotá',
  destino: 'Medellín',
  id_origen: null,
  id_destino: null,
  id_estado: 1,
  ...cambios
});

export const alerta = (cambios: Partial<Alerta> = {}): Alerta => ({
  id_alerta: 1,
  tipo_alerta: null,
  descripcion: 'Revisar frenos',
  fecha_limite: null,
  estado_resuelta: false,
  prioridad: 1,
  id_usuario_destino: 'k-1',
  id_tipo_alerta: 1,
  id_vehiculo_relacionado: null,
  id_servicio_relacionado: null,
  id_reserva_relacionada: null,
  ...cambios
});

export const vehiculo = (cambios: Partial<Vehiculo> = {}): Vehiculo => ({
  id_vehiculo: 1,
  placa: 'ABC123',
  numero_interno: '001',
  marca: 'Chevrolet',
  linea: 'NPR',
  modelo: '2020',
  color: null,
  capacidad_pasajeros: 19,
  estado_operativo: true,
  fecha_ultimo_mantenimiento: null,
  fecha_proximo_mantenimiento: null,
  id_tipo_vehiculo: 1,
  id_conductor_asignado: 'k-1',
  ...cambios
});

export const documento = (cambios: Partial<DocumentoVehiculo> = {}): DocumentoVehiculo => ({
  id_documento: 1,
  numero_documento: 'SOAT-1',
  tipo_documento_legal: 'SOAT',
  fecha_expedicion: '2024-01-01',
  fecha_vencimiento: '2025-01-01',
  aseguradora: null,
  estado_vigente: true,
  id_vehiculo: 1,
  id_tipo_documento: 1,
  ...cambios
});

export const mantenimiento = (cambios: Partial<Mantenimiento> = {}): Mantenimiento => ({
  id_mantenimiento: 1,
  fecha_mantenimiento: '2024-06-01',
  tipo_mantenimiento: 'Preventivo',
  descripcion: null,
  costo: 100000,
  taller_responsable: null,
  kilometraje_actual: null,
  proximo_mantenimiento: null,
  id_vehiculo: 1,
  ...cambios
});

export const cuenta = (cambios: Partial<CuentaAcceso> = {}): CuentaAcceso => ({
  id_usuario: 'u-9',
  nombre: 'Pedro',
  apellido: 'Pendiente',
  correo: 'pendiente@dviaje.com',
  telefono: '3001234567',
  activo: false,
  estado: 'pendiente',
  id_rol: 2,
  rol: 'Conductor',
  fecha_registro: '2025-01-04T10:00:00Z',
  tiene_ficha: true,
  tipo_documento: 'CC',
  numero_documento: '••••5555',
  es_tu_cuenta: false,
  ...cambios
});

export const solicitud = (cambios: Partial<SolicitudCuenta> = {}): SolicitudCuenta => ({
  nombre: 'Laura',
  apellido: 'Gómez',
  tipo_documento: 'CC',
  numero_documento: '1023456789',
  telefono: '3101234567',
  correo: 'laura@dviaje.com',
  contrasena: 'ClaveSegura1',
  ...cambios
});

export const catalogos = (): Catalogos => ({
  estados: [
    { id_estado: 1, nombre_estado: 'Programado', descripcion: null },
    { id_estado: 2, nombre_estado: 'En ruta', descripcion: null },
    { id_estado: 3, nombre_estado: 'Finalizado', descripcion: null }
  ],
  destinos: [
    {
      id_destino: 1,
      nombre_destino: 'Terminal Norte',
      ciudad: 'Bogotá',
      departamento: null,
      tiempo_estimado_viaje_horas: null,
      activo: true
    }
  ],
  tiposVehiculo: [],
  tiposAlerta: []
});

// ---- repositorios falsos --------------------------------------------
export const authRepoFalso = (): jest.Mocked<AuthRepository> => ({
  iniciarSesion: jest.fn(),
  registrarCuenta: jest.fn(),
  sesionGuardada: jest.fn(),
  usuarioActual: jest.fn(),
  cerrarSesion: jest.fn()
});

export const servicioRepoFalso = (): jest.Mocked<ServicioRepository> => ({
  listar: jest.fn(),
  obtener: jest.fn(),
  actualizar: jest.fn(),
  crear: jest.fn()
});

export const alertaRepoFalso = (): jest.Mocked<AlertaRepository> => ({
  listar: jest.fn(),
  crear: jest.fn(),
  resolver: jest.fn()
});

export const vehiculoRepoFalso = (): jest.Mocked<VehiculoRepository> => ({
  listar: jest.fn(),
  documentos: jest.fn(),
  mantenimientos: jest.fn(),
  reportar: jest.fn()
});

export const perfilRepoFalso = (): jest.Mocked<PerfilRepository> => ({
  obtenerFoto: jest.fn(),
  guardarFoto: jest.fn(),
  quitarFoto: jest.fn(),
  cambiarContrasena: jest.fn()
});

export const adminRepoFalso = (): jest.Mocked<AdminRepository> => ({
  cuentas: jest.fn(),
  gestionarCuenta: jest.fn(),
  restablecerContrasena: jest.fn(),
  conductores: jest.fn()
});

export const catalogoRepoFalso = (): jest.Mocked<CatalogoRepository> => ({
  cargar: jest.fn()
});
