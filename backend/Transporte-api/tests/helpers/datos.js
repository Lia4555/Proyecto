// ============================================================
// DATOS DE PRUEBA (fixtures)
// ------------------------------------------------------------
// Un escenario pequeño pero completo: un administrador, dos
// conductores con su vehiculo y su servicio, y una solicitud de
// cuenta pendiente. Se recarga limpio antes de cada prueba.
// ============================================================
import bcrypt from 'bcryptjs';

// Coste bajo de bcrypt: la prueba no necesita que sea lento.
const hash = (texto) => bcrypt.hashSync(texto, 4);

export const CLAVES = {
  admin: 'Admin12345',
  conductor: 'Conductor123',
  pendiente: 'Pendiente123'
};

export const IDS = {
  admin: '11111111-1111-4111-8111-111111111111',
  conductor1: '22222222-2222-4222-8222-222222222222',
  conductor2: '33333333-3333-4333-8333-333333333333',
  pendiente: '44444444-4444-4444-8444-444444444444',
  fichaConductor1: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  fichaConductor2: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  fichaPendiente: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  cliente: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
};

const HASHES = {
  admin: hash(CLAVES.admin),
  conductor: hash(CLAVES.conductor),
  pendiente: hash(CLAVES.pendiente)
};

export function datosIniciales() {
  return {
    roles: [
      { id_rol: 1, nombre_rol: 'Administrador', descripcion: 'Todo', nivel_permiso: 3 },
      { id_rol: 2, nombre_rol: 'Conductor', descripcion: 'Sus viajes', nivel_permiso: 2 }
    ],
    usuario: [
      {
        id_usuario: IDS.admin, nombre: 'Ana', apellido: 'Admin', correo: 'admin@dviaje.com',
        contrasena: HASHES.admin, telefono: '3000000000', activo: true, id_rol: 1,
        fecha_registro: '2025-01-01T10:00:00+00:00', aprobada_en: '2025-01-01T10:00:00+00:00', foto_perfil: null
      },
      {
        id_usuario: IDS.conductor1, nombre: 'Carlos', apellido: 'Uno', correo: 'conductor1@dviaje.com',
        contrasena: HASHES.conductor, telefono: '3011111111', activo: true, id_rol: 2,
        fecha_registro: '2025-01-02T10:00:00+00:00', aprobada_en: '2025-01-02T10:00:00+00:00', foto_perfil: null
      },
      {
        id_usuario: IDS.conductor2, nombre: 'Diana', apellido: 'Dos', correo: 'conductor2@dviaje.com',
        contrasena: HASHES.conductor, telefono: '3022222222', activo: true, id_rol: 2,
        fecha_registro: '2025-01-03T10:00:00+00:00', aprobada_en: '2025-01-03T10:00:00+00:00', foto_perfil: null
      },
      {
        id_usuario: IDS.pendiente, nombre: 'Pedro', apellido: 'Pendiente', correo: 'pendiente@dviaje.com',
        contrasena: HASHES.pendiente, telefono: '3033333333', activo: false, id_rol: 2,
        fecha_registro: '2025-01-04T10:00:00+00:00', aprobada_en: null, foto_perfil: null
      }
    ],
    conductor: [
      {
        id_conductor: IDS.fichaConductor1, nombre: 'Carlos', apellido: 'Uno', tipo_documento: 'CC',
        numero_documento: '1012345678', email: 'conductor1@dviaje.com', telefono: '3011111111',
        fecha_nacimiento: '1990-05-01', direccion: 'Calle 1 # 2-3', licencia_conduccion: 'LIC98765432',
        id_rol: 2, activo: true
      },
      {
        id_conductor: IDS.fichaConductor2, nombre: 'Diana', apellido: 'Dos', tipo_documento: 'CC',
        numero_documento: '1098765432', email: 'conductor2@dviaje.com', telefono: '3022222222',
        fecha_nacimiento: '1991-06-02', direccion: 'Calle 4 # 5-6', licencia_conduccion: 'LIC11112222',
        id_rol: 2, activo: true
      },
      {
        id_conductor: IDS.fichaPendiente, nombre: 'Pedro', apellido: 'Pendiente', tipo_documento: 'CC',
        numero_documento: '1055555555', email: 'pendiente@dviaje.com', telefono: '3033333333',
        id_rol: 2, activo: false
      }
    ],
    cliente: [
      {
        id_cliente: IDS.cliente, nombre: 'Laura', apellido: 'Cliente', tipo_documento: 'CC',
        numero_documento: '52123456', email: 'laura@correo.com', telefono: '3044444444',
        fecha_nacimiento: '1985-03-03', direccion: 'Carrera 9'
      }
    ],
    estados_servicio: [
      { id_estado: 1, nombre_estado: 'Programado', descripcion: null },
      { id_estado: 2, nombre_estado: 'En ruta', descripcion: null },
      { id_estado: 3, nombre_estado: 'Finalizado', descripcion: null }
    ],
    destinos: [
      { id_destino: 1, nombre_destino: 'Bogotá', ciudad: 'Bogotá', activo: true },
      { id_destino: 2, nombre_destino: 'Medellín', ciudad: 'Medellín', activo: true }
    ],
    tipos_vehiculo: [{ id_tipo_vehiculo: 1, nombre_tipo: 'Buseta', descripcion: null }],
    tipos_alerta: [{ id_tipo_alerta: 1, nombre_tipo: 'Mantenimiento', nivel_prioridad: 2, descripcion: null }],
    tipos_documentos: [{ id_tipo_documento: 1, nombre_tipo: 'SOAT', vigencia_meses: 12 }],
    clases_viaje: [],
    vehiculos: [
      {
        id_vehiculo: 1, placa: 'ABC123', numero_interno: '001', marca: 'Chevrolet', linea: 'NPR',
        modelo: '2020', capacidad_pasajeros: 19, estado_operativo: true, id_tipo_vehiculo: 1,
        id_conductor_asignado: IDS.fichaConductor1
      },
      {
        id_vehiculo: 2, placa: 'DEF456', numero_interno: '002', marca: 'Mercedes', linea: 'Sprinter',
        modelo: '2022', capacidad_pasajeros: 15, estado_operativo: true, id_tipo_vehiculo: 1,
        id_conductor_asignado: IDS.fichaConductor2
      }
    ],
    servicios: [
      {
        id_servicio: 1, codigo_servicio: 'SVC-0001', tipo_servicio: 'Regular',
        fecha_salida: '2025-01-07T13:00:00+00:00', fecha_llegada_estimada: '2025-01-07T19:00:00+00:00',
        fecha_llegada_real: '2025-01-07T19:30:00+00:00', numero_pasajeros: 10, precio_total: 500000,
        distancia_estimada_km: 400, peajes_estimados: 60000, observaciones: null,
        id_conductor: IDS.fichaConductor1, id_vehiculo: 1, origen: 'Bogotá', destino: 'Medellín',
        id_origen: null, id_destino: null, id_estado: 3
      },
      {
        id_servicio: 2, codigo_servicio: 'SVC-0002', tipo_servicio: 'Expreso',
        fecha_salida: '2025-01-08T13:00:00+00:00', fecha_llegada_estimada: '2025-01-08T15:00:00+00:00',
        fecha_llegada_real: null, numero_pasajeros: 5, precio_total: 200000,
        distancia_estimada_km: 100, peajes_estimados: 0, observaciones: null,
        id_conductor: IDS.fichaConductor2, id_vehiculo: 2, origen: 'Medellín', destino: 'Rionegro',
        id_origen: null, id_destino: null, id_estado: 1
      }
    ],
    documentos_vehiculo: [
      { id_documento: 1, numero_documento: 'SOAT-1', id_vehiculo: 1, id_tipo_documento: 1 },
      { id_documento: 2, numero_documento: 'SOAT-2', id_vehiculo: 2, id_tipo_documento: 1 }
    ],
    mantenimientos: [
      { id_mantenimiento: 1, id_vehiculo: 1, tipo_mantenimiento: 'Preventivo', costo: 100000 },
      { id_mantenimiento: 2, id_vehiculo: 2, tipo_mantenimiento: 'Correctivo', costo: 300000 }
    ],
    alertas: [
      { id_alerta: 1, descripcion: 'Revisar frenos', prioridad: 3, estado_resuelta: false, id_tipo_alerta: 1, id_usuario_destino: IDS.fichaConductor1 },
      { id_alerta: 2, descripcion: 'Cambiar aceite', prioridad: 1, estado_resuelta: false, id_tipo_alerta: 1, id_usuario_destino: IDS.fichaConductor2 }
    ],
    reservas: [],
    historial_conductores: []
  };
}
