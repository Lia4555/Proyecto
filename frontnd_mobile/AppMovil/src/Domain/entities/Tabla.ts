// ============================================================
//  CONFIGURACION DE TODAS LAS TABLAS DEL ADMINISTRADOR
// ------------------------------------------------------------
//  Es el mismo catalogo que usa el panel web
//  (frontend-transporte/src/entities.js), traducido a TypeScript.
//  Con el, UNA sola pantalla generica sabe pintar y editar
//  cualquier tabla: no hace falta una vista por cada una.
//
//  Si se anade una tabla en el backend, se anade aqui y aparece
//  sola en la app.
// ============================================================

export type TipoCampo =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime'
  | 'email'
  | 'checkbox'
  | 'select';

/** Formatos que se validan antes de enviar. */
export type FormatoCampo = 'uuid' | 'nombre' | 'telefono';

export interface CampoTabla {
  name: string;
  label: string;
  type: TipoCampo;
  /** Obligatorio: marca con * y no deja guardar vacio. */
  required?: boolean;
  /** Clave de otra tabla: se elige por NOMBRE en una lista, no por id. */
  ref?: string;
  format?: FormatoCampo;
  /** Valor minimo (numeros). */
  min?: number;
  integer?: boolean;
  minLength?: number;
  /** Nombre de otro campo fecha que debe ser anterior a este. */
  after?: string;
  hint?: string;
  /** Opciones para type: 'select'. */
  options?: string[];
  /** Valor inicial de un checkbox al crear. */
  porDefecto?: boolean;
}

export type Fila = Record<string, any>;

export type GrupoTabla = 'Catálogos' | 'Personas' | 'Flota' | 'Operación';

export interface Tabla {
  key: string;
  label: string;
  descripcion: string;
  endpoint: string;
  pk: string;
  grupo: GrupoTabla;
  /** Sigue existiendo para traducir ids a nombres, pero no sale en el menu. */
  oculta?: boolean;
  /** Con que texto se identifica una fila cuando otra tabla la referencia. */
  mostrar?: string[] | ((f: Fila) => string);
  /** Campos que se resumen en la tarjeta de la lista. */
  columnas?: string[];
  fields: CampoTabla[];
}

const DOCUMENTOS = ['CC', 'CE', 'TI', 'PA', 'NIT'];
const LICENCIAS = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

export const TABLAS: Tabla[] = [
  // ---------- CATALOGOS ----------
  {
    key: 'roles',
    label: 'Roles',
    descripcion: 'Perfiles de acceso y su nivel de permiso.',
    endpoint: 'roles',
    pk: 'id_rol',
    grupo: 'Catálogos',
    // Solo hay dos roles fijos y se asignan al aprobar una cuenta,
    // asi que esta tabla no se administra a mano.
    oculta: true,
    mostrar: ['nombre_rol'],
    fields: [
      { name: 'nombre_rol', label: 'Nombre del rol', type: 'text', required: true, minLength: 2 },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' },
      { name: 'nivel_permiso', label: 'Nivel de permiso', type: 'number', integer: true, min: 1, hint: '3 = Administrador · 2 = Conductor' }
    ]
  },
  {
    key: 'tipos-documentos',
    label: 'Tipos de documento',
    descripcion: 'Documentos legales que puede tener un vehículo.',
    endpoint: 'tipos-documentos',
    pk: 'id_tipo_documento',
    grupo: 'Catálogos',
    mostrar: ['nombre_tipo'],
    fields: [
      { name: 'nombre_tipo', label: 'Nombre del tipo', type: 'text', required: true, minLength: 2 },
      { name: 'vigencia_meses', label: 'Vigencia (meses)', type: 'number', integer: true, min: 1 }
    ]
  },
  {
    key: 'estados-servicio',
    label: 'Estados de servicio',
    descripcion: 'Estados por los que pasa un servicio.',
    endpoint: 'estados-servicio',
    pk: 'id_estado',
    grupo: 'Catálogos',
    mostrar: ['nombre_estado'],
    fields: [
      { name: 'nombre_estado', label: 'Nombre del estado', type: 'text', required: true, minLength: 2 },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' }
    ]
  },
  {
    key: 'tipos-alerta',
    label: 'Tipos de alerta',
    descripcion: 'Clasificación de las alertas del sistema.',
    endpoint: 'tipos-alerta',
    pk: 'id_tipo_alerta',
    grupo: 'Catálogos',
    mostrar: ['nombre_tipo'],
    fields: [
      { name: 'nombre_tipo', label: 'Nombre del tipo', type: 'text', required: true, minLength: 2 },
      { name: 'nivel_prioridad', label: 'Nivel de prioridad', type: 'number', integer: true, min: 1 },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' }
    ]
  },
  {
    key: 'destinos',
    label: 'Destinos',
    descripcion: 'Ciudades y puntos de origen o llegada.',
    endpoint: 'destinos',
    pk: 'id_destino',
    grupo: 'Catálogos',
    mostrar: (f) => (f.ciudad ? `${f.nombre_destino} (${f.ciudad})` : String(f.nombre_destino ?? '')),
    columnas: ['nombre_destino', 'ciudad', 'departamento', 'activo'],
    fields: [
      { name: 'nombre_destino', label: 'Nombre del destino', type: 'text', required: true, minLength: 2 },
      { name: 'ciudad', label: 'Ciudad', type: 'text', required: true, minLength: 2 },
      { name: 'departamento', label: 'Departamento', type: 'text' },
      { name: 'tiempo_estimado_viaje_horas', label: 'Tiempo estimado (horas)', type: 'number', min: 0 },
      { name: 'activo', label: 'Destino activo', type: 'checkbox', porDefecto: true }
    ]
  },
  {
    key: 'clases-viaje',
    label: 'Clases de viaje',
    descripcion: 'Categorías comerciales del viaje.',
    endpoint: 'clases-viaje',
    pk: 'id_clase',
    grupo: 'Catálogos',
    mostrar: ['nombre_clase'],
    fields: [
      { name: 'nombre_clase', label: 'Nombre de la clase', type: 'text', required: true, minLength: 2 },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' },
      { name: 'multiplicador_precio', label: 'Multiplicador de precio', type: 'number', min: 0, hint: 'Ejemplo: 1.5 para clase premium' },
      { name: 'beneficios', label: 'Beneficios', type: 'textarea' }
    ]
  },
  {
    key: 'tipos-vehiculo',
    label: 'Tipos de vehículo',
    descripcion: 'Bus, buseta, van y demás categorías.',
    endpoint: 'tipos-vehiculo',
    pk: 'id_tipo_vehiculo',
    grupo: 'Catálogos',
    mostrar: ['nombre_tipo'],
    fields: [
      { name: 'nombre_tipo', label: 'Nombre del tipo', type: 'text', required: true, minLength: 2 },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' }
    ]
  },

  // ---------- PERSONAS ----------
  {
    key: 'conductor',
    label: 'Conductores',
    descripcion: 'Personal de conducción y estado de su licencia.',
    endpoint: 'conductor',
    pk: 'id_conductor',
    grupo: 'Personas',
    mostrar: (f) => `${f.nombre ?? ''} ${f.apellido ?? ''}`.trim(),
    columnas: ['nombre', 'apellido', 'numero_documento', 'telefono', 'email', 'categoria_licencia'],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, format: 'nombre' },
      { name: 'apellido', label: 'Apellido', type: 'text', required: true, format: 'nombre' },
      { name: 'tipo_documento', label: 'Tipo de documento', type: 'select', required: true, options: DOCUMENTOS },
      { name: 'numero_documento', label: 'Número de documento', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'telefono', label: 'Teléfono', type: 'text', required: true, format: 'telefono' },
      { name: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date' },
      { name: 'direccion', label: 'Dirección', type: 'text' },
      { name: 'licencia_conduccion', label: 'Licencia de conducción', type: 'text' },
      { name: 'categoria_licencia', label: 'Categoría de licencia', type: 'select', options: LICENCIAS },
      { name: 'fecha_expedicion_licencia', label: 'Expedición licencia', type: 'date' },
      { name: 'fecha_vencimiento_licencia', label: 'Vencimiento licencia', type: 'date', after: 'fecha_expedicion_licencia' },
      { name: 'id_rol', label: 'Rol', type: 'number', required: true, integer: true, min: 1, ref: 'roles', hint: 'Para que pueda entrar debe ser «Conductor».' }
    ]
  },
  {
    key: 'clientes',
    label: 'Clientes',
    descripcion: 'Pasajeros registrados en el sistema.',
    endpoint: 'clientes',
    pk: 'id_cliente',
    grupo: 'Personas',
    mostrar: (f) => `${f.nombre ?? ''} ${f.apellido ?? ''}`.trim(),
    columnas: ['nombre', 'apellido', 'tipo_documento', 'numero_documento', 'email', 'telefono'],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, format: 'nombre' },
      { name: 'apellido', label: 'Apellido', type: 'text', required: true, format: 'nombre' },
      { name: 'tipo_documento', label: 'Tipo de documento', type: 'select', required: true, options: DOCUMENTOS },
      { name: 'numero_documento', label: 'Número de documento', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'telefono', label: 'Teléfono', type: 'text', format: 'telefono' },
      { name: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date' },
      { name: 'direccion', label: 'Dirección', type: 'text' }
    ]
  },

  // ---------- FLOTA ----------
  {
    key: 'vehiculos',
    label: 'Vehículos',
    descripcion: 'Flota registrada y su estado operativo.',
    endpoint: 'vehiculos',
    pk: 'id_vehiculo',
    grupo: 'Flota',
    mostrar: (f) => [f.placa, f.marca, f.linea].filter(Boolean).join(' · '),
    columnas: ['placa', 'numero_interno', 'marca', 'linea', 'modelo', 'capacidad_pasajeros', 'estado_operativo'],
    fields: [
      { name: 'placa', label: 'Placa', type: 'text', required: true, minLength: 5, hint: 'Ejemplo: ABC123' },
      { name: 'numero_interno', label: 'Número interno', type: 'text', hint: 'Déjalo vacío: se asigna el siguiente consecutivo.' },
      { name: 'marca', label: 'Marca', type: 'text', required: true },
      { name: 'linea', label: 'Línea', type: 'text', required: true },
      { name: 'modelo', label: 'Modelo', type: 'text', required: true },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'capacidad_pasajeros', label: 'Capacidad de pasajeros', type: 'number', required: true, integer: true, min: 1 },
      { name: 'estado_operativo', label: 'Vehículo operativo', type: 'checkbox', porDefecto: true },
      { name: 'fecha_ultimo_mantenimiento', label: 'Último mantenimiento', type: 'date' },
      { name: 'fecha_proximo_mantenimiento', label: 'Próximo mantenimiento', type: 'date', after: 'fecha_ultimo_mantenimiento' },
      { name: 'id_tipo_vehiculo', label: 'Tipo de vehículo', type: 'number', required: true, integer: true, min: 1, ref: 'tipos-vehiculo' },
      { name: 'id_conductor_asignado', label: 'Conductor asignado', type: 'text', format: 'uuid', ref: 'conductor', hint: 'Opcional: puedes dejarlo sin asignar' }
    ]
  },
  {
    key: 'documentos-vehiculo',
    label: 'Documentos de vehículo',
    descripcion: 'SOAT, tecnomecánica, pólizas y vencimientos.',
    endpoint: 'documentos-vehiculo',
    pk: 'id_documento',
    grupo: 'Flota',
    mostrar: ['numero_documento'],
    columnas: ['numero_documento', 'tipo_documento_legal', 'fecha_vencimiento', 'aseguradora', 'estado_vigente', 'id_vehiculo'],
    fields: [
      { name: 'numero_documento', label: 'Número de documento', type: 'text', required: true },
      { name: 'tipo_documento_legal', label: 'Tipo documento legal', type: 'text', required: true },
      { name: 'fecha_expedicion', label: 'Fecha de expedición', type: 'date', required: true },
      { name: 'fecha_vencimiento', label: 'Fecha de vencimiento', type: 'date', required: true, after: 'fecha_expedicion' },
      { name: 'aseguradora', label: 'Aseguradora', type: 'text' },
      { name: 'valor_asegurado', label: 'Valor asegurado', type: 'number', min: 0 },
      { name: 'archivo_url', label: 'URL del archivo', type: 'text' },
      { name: 'estado_vigente', label: 'Documento vigente', type: 'checkbox', porDefecto: true },
      { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
      { name: 'id_vehiculo', label: 'Vehículo', type: 'number', required: true, integer: true, min: 1, ref: 'vehiculos' },
      { name: 'id_tipo_documento', label: 'Tipo de documento', type: 'number', required: true, integer: true, min: 1, ref: 'tipos-documentos' }
    ]
  },
  {
    key: 'historial-conductores',
    label: 'Historial de conductores',
    descripcion: 'Asignaciones de conductor por vehículo.',
    endpoint: 'historial-conductores',
    pk: 'id_historial',
    grupo: 'Flota',
    columnas: ['id_vehiculo', 'id_conductor', 'fecha_asignacion', 'fecha_desasignacion'],
    fields: [
      { name: 'id_vehiculo', label: 'Vehículo', type: 'number', required: true, integer: true, min: 1, ref: 'vehiculos' },
      { name: 'id_conductor', label: 'Conductor', type: 'text', required: true, format: 'uuid', ref: 'conductor' },
      { name: 'fecha_asignacion', label: 'Fecha de asignación', type: 'date', required: true },
      { name: 'fecha_desasignacion', label: 'Fecha de desasignación', type: 'date', after: 'fecha_asignacion' },
      { name: 'observaciones', label: 'Observaciones', type: 'textarea' }
    ]
  },
  {
    key: 'mantenimientos',
    label: 'Mantenimientos',
    descripcion: 'Intervenciones realizadas a la flota.',
    endpoint: 'mantenimientos',
    pk: 'id_mantenimiento',
    grupo: 'Flota',
    mostrar: (f) => `${f.tipo_mantenimiento ?? 'Mantenimiento'} · ${String(f.fecha_mantenimiento ?? '').slice(0, 10)}`,
    columnas: ['fecha_mantenimiento', 'tipo_mantenimiento', 'costo', 'taller_responsable', 'id_vehiculo'],
    fields: [
      { name: 'fecha_mantenimiento', label: 'Fecha de mantenimiento', type: 'date', required: true },
      { name: 'tipo_mantenimiento', label: 'Tipo de mantenimiento', type: 'select', required: true, options: ['Preventivo', 'Correctivo', 'Predictivo'] },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' },
      { name: 'costo', label: 'Costo', type: 'number', required: true, min: 0 },
      { name: 'taller_responsable', label: 'Taller responsable', type: 'text' },
      { name: 'kilometraje_actual', label: 'Kilometraje actual', type: 'number', integer: true, min: 0 },
      { name: 'proximo_mantenimiento', label: 'Próximo mantenimiento', type: 'date', after: 'fecha_mantenimiento' },
      { name: 'kilometraje_proximo_mantenimiento', label: 'Km próximo mantenimiento', type: 'number', integer: true, min: 0 },
      { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
      { name: 'id_vehiculo', label: 'Vehículo', type: 'number', required: true, integer: true, min: 1, ref: 'vehiculos' }
    ]
  },

  // ---------- OPERACION ----------
  {
    key: 'servicios',
    label: 'Servicios',
    descripcion: 'Viajes programados y ejecutados.',
    endpoint: 'servicios',
    pk: 'id_servicio',
    grupo: 'Operación',
    mostrar: ['codigo_servicio'],
    columnas: ['codigo_servicio', 'tipo_servicio', 'fecha_salida', 'numero_pasajeros', 'precio_total', 'id_estado'],
    fields: [
      { name: 'codigo_servicio', label: 'Código de servicio', type: 'text', hint: 'Déjalo vacío: se genera solo (SVC-0001…).' },
      { name: 'tipo_servicio', label: 'Tipo de servicio', type: 'text' },
      { name: 'fecha_salida', label: 'Fecha de salida', type: 'datetime', required: true },
      { name: 'fecha_llegada_estimada', label: 'Llegada estimada', type: 'datetime', required: true, after: 'fecha_salida' },
      { name: 'fecha_llegada_real', label: 'Llegada real', type: 'datetime' },
      { name: 'numero_pasajeros', label: 'Número de pasajeros', type: 'number', required: true, integer: true, min: 1 },
      { name: 'precio_total', label: 'Precio total', type: 'number', required: true, min: 0 },
      { name: 'distancia_estimada_km', label: 'Distancia estimada (km)', type: 'number', min: 0 },
      { name: 'peajes_estimados', label: 'Peajes estimados', type: 'number', min: 0 },
      { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
      { name: 'id_conductor', label: 'Conductor', type: 'text', required: true, format: 'uuid', ref: 'conductor' },
      { name: 'id_vehiculo', label: 'Vehículo', type: 'number', required: true, integer: true, min: 1, ref: 'vehiculos' },
      { name: 'id_origen', label: 'Origen', type: 'number', required: true, integer: true, min: 1, ref: 'destinos' },
      { name: 'id_destino', label: 'Destino', type: 'number', required: true, integer: true, min: 1, ref: 'destinos' },
      { name: 'id_estado', label: 'Estado del servicio', type: 'number', required: true, integer: true, min: 1, ref: 'estados-servicio' }
    ]
  },
  {
    key: 'reservas',
    label: 'Reservas',
    descripcion: 'Cupos vendidos por servicio.',
    endpoint: 'reservas',
    pk: 'id_reserva',
    grupo: 'Operación',
    mostrar: ['numero_reserva'],
    columnas: ['numero_reserva', 'asiento_asignado', 'precio_pagado', 'estado_reserva', 'id_servicio', 'id_cliente'],
    fields: [
      { name: 'numero_reserva', label: 'Número de reserva', type: 'text', hint: 'Déjalo vacío: se genera solo (RES-0001…).' },
      { name: 'asiento_asignado', label: 'Asiento asignado', type: 'text' },
      { name: 'clase_viaje', label: 'Clase de viaje', type: 'number', required: true, integer: true, min: 1, ref: 'clases-viaje' },
      { name: 'precio_pagado', label: 'Precio pagado', type: 'number', required: true, min: 0 },
      { name: 'estado_reserva', label: 'Estado de reserva', type: 'select', options: ['Pendiente', 'Confirmada', 'Cancelada', 'Completada'] },
      { name: 'fecha_check_in', label: 'Fecha de check-in', type: 'datetime' },
      { name: 'id_servicio', label: 'Servicio', type: 'number', integer: true, min: 1, ref: 'servicios', hint: 'Opcional.' },
      { name: 'id_cliente', label: 'Cliente', type: 'text', required: true, format: 'uuid', ref: 'clientes' }
    ]
  },
  {
    key: 'alertas',
    label: 'Alertas',
    descripcion: 'Avisos operativos dirigidos a un usuario.',
    endpoint: 'alertas',
    pk: 'id_alerta',
    grupo: 'Operación',
    mostrar: ['descripcion'],
    columnas: ['descripcion', 'id_tipo_alerta', 'prioridad', 'fecha_limite', 'id_usuario_destino'],
    fields: [
      { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
      { name: 'id_tipo_alerta', label: 'Tipo de alerta', type: 'number', required: true, integer: true, min: 1, ref: 'tipos-alerta' },
      { name: 'id_usuario_destino', label: 'Dirigida a (conductor)', type: 'text', required: true, format: 'uuid', ref: 'conductor' },
      { name: 'fecha_limite', label: 'Fecha límite', type: 'date' },
      { name: 'prioridad', label: 'Prioridad', type: 'number', integer: true, min: 1 },
      { name: 'id_vehiculo_relacionado', label: 'Vehículo relacionado', type: 'number', integer: true, min: 1, ref: 'vehiculos' },
      { name: 'id_servicio_relacionado', label: 'Servicio relacionado', type: 'number', integer: true, min: 1, ref: 'servicios' },
      { name: 'id_reserva_relacionada', label: 'Reserva relacionada', type: 'number', integer: true, min: 1, ref: 'reservas' }
    ]
  }
];

/** Orden de los grupos en el menu. */
export const GRUPOS: GrupoTabla[] = ['Catálogos', 'Personas', 'Flota', 'Operación'];

/** Tablas que se administran desde el menu (las ocultas no salen). */
export const TABLAS_VISIBLES = TABLAS.filter((t) => !t.oculta);

export const buscarTabla = (key: string): Tabla | undefined =>
  TABLAS.find((t) => t.key === key);

/** Texto con el que se identifica una fila. Nunca se cae al id: no dice nada. */
export const etiquetaDeFila = (tabla: Tabla, fila: Fila): string => {
  if (typeof tabla.mostrar === 'function') {
    return tabla.mostrar(fila).trim() || 'Sin nombre';
  }
  const campos = tabla.mostrar?.length ? tabla.mostrar : [tabla.fields[0]?.name].filter(Boolean);
  const texto = (campos as string[])
    .map((c) => fila[c])
    .filter((v) => v !== null && v !== undefined && v !== '')
    .join(' ');
  return texto.trim() || 'Sin nombre';
};

/** Claves de las tablas a las que apunta esta (sin repetir). */
export const referenciasDe = (tabla: Tabla): string[] => [
  ...new Set(tabla.fields.filter((f) => f.ref).map((f) => f.ref as string))
];
