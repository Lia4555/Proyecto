import { z } from 'zod';

export const schemas = {
  roles: z.object({
    nombre_rol: z.string().min(2),
    descripcion: z.string().optional(),
    nivel_permiso: z.number().int().default(1)
  }),

  tipos_documentos: z.object({
    nombre_tipo: z.string().min(2),
    vigencia_meses: z.number().int().positive().optional()
  }),

  estados_servicio: z.object({
    nombre_estado: z.string().min(2),
    descripcion: z.string().optional()
  }),

  tipos_alerta: z.object({
    nombre_tipo: z.string().min(2),
    nivel_prioridad: z.number().int().default(1),
    descripcion: z.string().optional()
  }),

  destinos: z.object({
    nombre_destino: z.string().min(2),
    ciudad: z.string().min(2),
    departamento: z.string().optional(),
    tiempo_estimado_viaje_horas: z.number().positive().optional(),
    activo: z.boolean().default(true)
  }),

  clases_viaje: z.object({
    nombre_clase: z.string().min(2),
    descripcion: z.string().optional(),
    multiplicador_precio: z.number().default(1.00),
    beneficios: z.string().optional()
  }),

  tipos_vehiculo: z.object({
    nombre_tipo: z.string().min(2),
    descripcion: z.string().optional()
  }),

  conductor: z.object({
    id_conductor: z.string().uuid().optional(),
    nombre: z.string().min(2),
    apellido: z.string().min(2),
    tipo_documento: z.string(),
    numero_documento: z.string(),
    email: z.string().email(),
    telefono: z.string(),
    fecha_nacimiento: z.string().datetime().optional().or(z.string().date()),
    direccion: z.string().optional(),
    licencia_conduccion: z.string().optional(),
    categoria_licencia: z.string().max(5).optional(),
    fecha_expedicion_licencia: z.string().date().optional(),
    fecha_vencimiento_licencia: z.string().date().optional(),
    id_rol: z.number().int()
  }),

  cliente: z.object({
    id_cliente: z.string().uuid().optional(),
    nombre: z.string().min(2),
    apellido: z.string().min(2),
    tipo_documento: z.string(),
    numero_documento: z.string(),
    email: z.string().email(),
    telefono: z.string().optional(),
    fecha_nacimiento: z.string().date().optional(),
    direccion: z.string().optional()
  }),

  vehiculos: z.object({
    placa: z.string().max(10),
    numero_interno: z.string().optional(),
    marca: z.string(),
    linea: z.string(), // Corregido de 'linee' a 'linea'
    modelo: z.string(),
    color: z.string().optional(),
    capacidad_pasajeros: z.number().int().positive(),
    estado_operativo: z.boolean().default(true),
    fecha_ultimo_mantenimiento: z.string().date().optional(),
    fecha_proximo_mantenimiento: z.string().date().optional(),
    id_tipo_vehiculo: z.number().int(),
    id_conductor_asignado: z.string().uuid().nullable().optional()
  }),

  documentos_vehiculo: z.object({
    numero_documento: z.string(),
    tipo_documento_legal: z.string(),
    fecha_expedicion: z.string().date(),
    fecha_vencimiento: z.string().date(),
    aseguradora: z.string().optional(),
    valor_asegurado: z.number().optional(),
    archivo_url: z.string().url().optional(),
    estado_vigente: z.boolean().default(true),
    observaciones: z.string().optional(),
    id_vehiculo: z.number().int(),
    id_tipo_documento: z.number().int()
  }),

  historial_conductores: z.object({
    id_vehiculo: z.number().int(),
    id_conductor: z.string().uuid(),
    fecha_asignacion: z.string().date(),
    fecha_desasignacion: z.string().date().nullable().optional(),
    observaciones: z.string().optional()
  }),

  mantenimientos: z.object({
    fecha_mantenimiento: z.string().date(),
    tipo_mantenimiento: z.string(),
    descripcion: z.string().optional(),
    costo: z.number().positive(),
    taller_responsable: z.string().optional(),
    kilometraje_actual: z.number().optional(),
    proximo_mantenimiento: z.string().date().optional(),
    kilometraje_proximo_mantenimiento: z.number().optional(),
    observaciones: z.string().optional(),
    id_vehiculo: z.number().int()
  }),

  servicios: z.object({
    codigo_servicio: z.string(),
    tipo_servicio: z.string().default('Regular'),
    fecha_salida: z.string().datetime(),
    fecha_llegada_estimada: z.string().datetime(),
    fecha_llegada_real: z.string().datetime().optional(),
    numero_pasajeros: z.number().int().positive(),
    precio_total: z.number().positive(),
    distancia_estimada_km: z.number().optional(),
    peajes_estimados: z.number().default(0),
    observaciones: z.string().optional(),
    id_conductor: z.string().uuid(),
    id_vehiculo: z.number().int(),
    id_origen: z.number().int(),
    id_destino: z.number().int(),
    id_estado: z.number().int()
  }),

  reservas: z.object({
    numero_reserva: z.string(),
    asiento_asignado: z.string().max(10).optional(),
    clase_viaje: z.number().int(),
    precio_pagado: z.number().positive(),
    estado_reserva: z.string().default('Confirmada'),
    fecha_check_in: z.string().datetime().optional(),
    id_servicio: z.number().int(),
    id_cliente: z.string().uuid()
  }),

  // ====== NUEVO: faltaba el esquema de alertas (coincide con tu tabla real) ======
  alertas: z.object({
    tipo_alerta: z.string().optional(),
    descripcion: z.string().min(2),
    fecha_limite: z.string().date().optional(),
    estado_resuelta: z.boolean().default(false),
    prioridad: z.number().int().default(1),
    id_usuario_destino: z.string().uuid(),          // es un id_conductor (UUID)
    id_tipo_alerta: z.number().int(),
    id_vehiculo_relacionado: z.number().int().nullable().optional(),
    id_servicio_relacionado: z.number().int().nullable().optional(),
    id_reserva_relacionada: z.number().int().nullable().optional()
  }),

  usuario: z.object({
    id_usuario: z.string().uuid().optional(),
    nombre: z.string().min(2, 'El nombre es obligatorio'),
    apellido: z.string().min(2, 'El apellido es obligatorio'),
    correo: z.string().email('Email inválido'), // Sincronizado con la BD
    contrasena: z.string().min(6, 'La contraseña debe tener mínimo 6 caracteres'), // Sincronizado con la BD
    telefono: z.string().optional(),
    activo: z.boolean().default(true),
    id_rol: z.number().int()
  })
};