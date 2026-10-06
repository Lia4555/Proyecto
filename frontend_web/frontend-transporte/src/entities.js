// ============================================================
// Configuración de TODAS las tablas del panel.
// Cada entidad define: endpoint del backend, llave primaria,
// grupo del menú, columnas visibles por defecto y sus campos.
//
// Opciones de un campo:
//   type       text | textarea | number | date | datetime | email | checkbox | select
//   required   marca el campo como obligatorio (* y validación)
//   ref        clave de otra tabla -> se muestra como lista desplegable
//              con NOMBRES en vez de ids (ver src/lib/referencias.js)
//   format     'uuid' -> valida el formato antes de enviar
//   min        valor mínimo (números)
//   integer    exige número entero
//   minLength  largo mínimo de texto
//   after      nombre de otro campo fecha que debe ser anterior
//   hint       texto de ayuda bajo el campo
//   options    lista de opciones para type: 'select'
//   auto       lo rellena el servidor (consecutivo): se muestra pero no se pide
//   unique     no puede repetirse en la tabla (se avisa antes de enviar)
//   distinctFrom  nombre de otro campo con el que no puede coincidir
//   soloEdicion   no aparece al crear (p. ej. la llegada real, que se conoce después)
//
// Los campos numéricos solo dejan escribir números (sin letras ni la
// "e" de notación científica): ver lib/validaciones.js.
//
// "mostrar" indica con qué texto se identifica una fila cuando otra
// tabla la referencia (puede ser una lista de campos o una función).
// ============================================================

export const entities = [
  // ---------- CATÁLOGOS ----------
  {
    key: 'roles',
    label: 'Roles',
    descripcion: 'Perfiles de acceso y su nivel de permiso.',
    endpoint: 'roles',
    pk: 'id_rol',
    group: 'Catálogos',
    // El sistema tiene exactamente dos roles fijos (Administrador y Conductor),
    // así que esta tabla no se administra desde el menú: se mantiene solo para
    // que otras pantallas puedan mostrar el nombre del rol en vez del código.
    oculta: true,
    mostrar: ['nombre_rol'],
    fields: [
      { name: 'nombre_rol', label: 'Nombre del rol', type: 'text', required: true, minLength: 2 },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' },
      {
        name: 'nivel_permiso',
        label: 'Nivel de permiso',
        type: 'number',
        integer: true,
        min: 1,
        hint: '3 = Administrador · 2 = Conductor'
      }
    ]
  },
  {
    key: 'tipos-documentos',
    label: 'Tipos de documento',
    descripcion: 'Documentos legales que puede tener un vehículo.',
    endpoint: 'tipos-documentos',
    pk: 'id_tipo_documento',
    group: 'Catálogos',
    mostrar: ['nombre_tipo'],
    fields: [
      { name: 'nombre_tipo', label: 'Nombre del tipo', type: 'text', required: true, minLength: 2, unique: true },
      { name: 'vigencia_meses', label: 'Vigencia (meses)', type: 'number', integer: true, min: 1 }
    ]
  },
  {
    key: 'estados-servicio',
    label: 'Estados de servicio',
    descripcion: 'Estados por los que pasa un servicio.',
    endpoint: 'estados-servicio',
    pk: 'id_estado',
    group: 'Catálogos',
    mostrar: ['nombre_estado'],
    fields: [
      { name: 'nombre_estado', label: 'Nombre del estado', type: 'text', required: true, minLength: 2, unique: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' }
    ]
  },
  {
    key: 'tipos-alerta',
    label: 'Tipos de alerta',
    descripcion: 'Clasificación de las alertas del sistema.',
    endpoint: 'tipos-alerta',
    pk: 'id_tipo_alerta',
    group: 'Catálogos',
    mostrar: ['nombre_tipo'],
    fields: [
      { name: 'nombre_tipo', label: 'Nombre del tipo', type: 'text', required: true, minLength: 2, unique: true },
      { name: 'nivel_prioridad', label: 'Nivel de prioridad', type: 'number', integer: true, min: 1 },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' }
    ]
  },
  {
    key: 'clases-viaje',
    label: 'Clases de viaje',
    descripcion: 'Categorías comerciales del viaje.',
    endpoint: 'clases-viaje',
    pk: 'id_clase',
    group: 'Catálogos',
    mostrar: ['nombre_clase'],
    fields: [
      { name: 'nombre_clase', label: 'Nombre de la clase', type: 'text', required: true, minLength: 2, unique: true },
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
    group: 'Catálogos',
    mostrar: ['nombre_tipo'],
    fields: [
      { name: 'nombre_tipo', label: 'Nombre del tipo', type: 'text', required: true, minLength: 2, unique: true },
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
    group: 'Personas',
    mostrar: (f) => `${f.nombre || ''} ${f.apellido || ''}`.trim(),
    columnas: ['nombre', 'apellido', 'numero_documento', 'telefono', 'email', 'categoria_licencia', 'fecha_vencimiento_licencia'],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, format: 'nombre' },
      { name: 'apellido', label: 'Apellido', type: 'text', required: true, format: 'nombre' },
      { name: 'tipo_documento', label: 'Tipo de documento', type: 'select', required: true, options: ['CC', 'CE', 'TI', 'PA', 'NIT'] },
      { name: 'numero_documento', label: 'Número de documento', type: 'text', required: true, format: 'documento', unique: true, hint: 'Solo números. El pasaporte admite letras.' },
      { name: 'email', label: 'Email', type: 'email', required: true, unique: true },
      { name: 'telefono', label: 'Teléfono', type: 'text', required: true, format: 'telefono' },
      { name: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date' },
      { name: 'direccion', label: 'Dirección', type: 'text' },
      { name: 'licencia_conduccion', label: 'Licencia de conducción', type: 'text' },
      { name: 'categoria_licencia', label: 'Categoría de licencia', type: 'select', options: ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'] },
      { name: 'fecha_expedicion_licencia', label: 'Expedición licencia', type: 'date' },
      { name: 'fecha_vencimiento_licencia', label: 'Vencimiento licencia', type: 'date', after: 'fecha_expedicion_licencia' },
      { name: 'id_rol', label: 'Rol', type: 'number', required: true, integer: true, min: 1, ref: 'roles', hint: 'Para que pueda entrar al panel del conductor debe ser «Conductor».' }
    ]
  },
  {
    key: 'clientes',
    label: 'Clientes',
    descripcion: 'Pasajeros registrados en el sistema.',
    endpoint: 'clientes',
    pk: 'id_cliente',
    group: 'Personas',
    mostrar: (f) => `${f.nombre || ''} ${f.apellido || ''}`.trim(),
    columnas: ['nombre', 'apellido', 'tipo_documento', 'numero_documento', 'email', 'telefono'],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, format: 'nombre' },
      { name: 'apellido', label: 'Apellido', type: 'text', required: true, format: 'nombre' },
      { name: 'tipo_documento', label: 'Tipo de documento', type: 'select', required: true, options: ['CC', 'CE', 'TI', 'PA', 'NIT'] },
      { name: 'numero_documento', label: 'Número de documento', type: 'text', required: true, format: 'documento', unique: true, hint: 'Solo números. El pasaporte admite letras.' },
      { name: 'email', label: 'Email', type: 'email', required: true, unique: true },
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
    group: 'Flota',
    mostrar: (f) => [f.placa, f.marca, f.linea].filter(Boolean).join(' · '),
    columnas: ['placa', 'numero_interno', 'marca', 'linea', 'modelo', 'capacidad_pasajeros', 'estado_operativo'],
    fields: [
      { name: 'placa', label: 'Placa', type: 'text', required: true, format: 'placa', unique: true, hint: 'Ejemplo: ABC123' },
      { name: 'numero_interno', label: 'Número interno', type: 'text', auto: true, hint: 'Consecutivo de la flota: se asigna automáticamente.' },
      { name: 'marca', label: 'Marca', type: 'text', required: true },
      { name: 'linea', label: 'Línea', type: 'text', required: true },
      { name: 'modelo', label: 'Modelo', type: 'text', required: true },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'capacidad_pasajeros', label: 'Capacidad de pasajeros', type: 'number', required: true, integer: true, min: 1 },
      { name: 'estado_operativo', label: 'Vehículo operativo', type: 'checkbox', default: true },
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
    group: 'Flota',
    mostrar: ['numero_documento'],
    columnas: ['numero_documento', 'tipo_documento_legal', 'fecha_vencimiento', 'aseguradora', 'estado_vigente', 'id_vehiculo'],
    fields: [
      { name: 'numero_documento', label: 'Número de documento', type: 'text', required: true, unique: true },
      { name: 'tipo_documento_legal', label: 'Tipo documento legal', type: 'text', required: true },
      { name: 'fecha_expedicion', label: 'Fecha de expedición', type: 'date', required: true },
      { name: 'fecha_vencimiento', label: 'Fecha de vencimiento', type: 'date', required: true, after: 'fecha_expedicion' },
      { name: 'aseguradora', label: 'Aseguradora', type: 'text' },
      { name: 'valor_asegurado', label: 'Valor asegurado', type: 'number', min: 0 },
      { name: 'archivo_url', label: 'URL del archivo', type: 'text' },
      { name: 'estado_vigente', label: 'Documento vigente', type: 'checkbox', default: true },
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
    group: 'Flota',
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
    group: 'Flota',
    mostrar: (f) => `${f.tipo_mantenimiento || 'Mantenimiento'} · ${String(f.fecha_mantenimiento || '').slice(0, 10)}`,
    columnas: ['fecha_mantenimiento', 'tipo_mantenimiento', 'costo', 'taller_responsable', 'kilometraje_actual', 'id_vehiculo'],
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

  // ---------- OPERACIÓN ----------
  {
    key: 'servicios',
    label: 'Servicios',
    descripcion: 'Viajes programados y ejecutados.',
    endpoint: 'servicios',
    pk: 'id_servicio',
    group: 'Operación',
    mostrar: ['codigo_servicio'],
    columnas: ['codigo_servicio', 'origen', 'destino', 'fecha_salida', 'numero_pasajeros', 'precio_total', 'id_estado'],
    fields: [
      { name: 'codigo_servicio', label: 'Código de servicio', type: 'text', auto: true, hint: 'Se genera automáticamente al guardar (SVC-0001, SVC-0002…).' },
      { name: 'tipo_servicio', label: 'Tipo de servicio', type: 'text' },
      { name: 'origen', label: 'Origen', type: 'text', required: true, minLength: 2, hint: 'Escríbelo tal cual: Terminal Salitre, Bogotá' },
      { name: 'destino', label: 'Destino', type: 'text', required: true, minLength: 2, distinctFrom: 'origen', hint: 'Ciudad o punto de llegada' },
      { name: 'fecha_salida', label: 'Fecha de salida', type: 'datetime', required: true },
      { name: 'fecha_llegada_estimada', label: 'Llegada estimada', type: 'datetime', required: true, after: 'fecha_salida' },
      { name: 'fecha_llegada_real', label: 'Llegada real', type: 'datetime', soloEdicion: true },
      { name: 'numero_pasajeros', label: 'Número de pasajeros', type: 'number', required: true, integer: true, min: 1 },
      { name: 'precio_total', label: 'Precio total', type: 'number', required: true, min: 0 },
      { name: 'distancia_estimada_km', label: 'Distancia estimada (km)', type: 'number', min: 0, soloEdicion: true },
      { name: 'peajes_estimados', label: 'Peajes estimados', type: 'number', min: 0 },
      { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
      { name: 'id_conductor', label: 'Conductor', type: 'text', required: true, format: 'uuid', ref: 'conductor' },
      { name: 'id_vehiculo', label: 'Vehículo', type: 'number', required: true, integer: true, min: 1, ref: 'vehiculos' },
      { name: 'id_estado', label: 'Estado del servicio', type: 'number', required: true, integer: true, min: 1, ref: 'estados-servicio' }
    ]
  },
  {
    key: 'alertas',
    label: 'Alertas',
    descripcion: 'Avisos operativos dirigidos a un usuario.',
    endpoint: 'alertas',
    pk: 'id_alerta',
    group: 'Operación',
    mostrar: ['descripcion'],
    columnas: ['descripcion', 'id_tipo_alerta', 'prioridad', 'fecha_limite', 'id_usuario_destino'],
    fields: [
      { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
      { name: 'id_tipo_alerta', label: 'Tipo de alerta', type: 'number', required: true, integer: true, min: 1, ref: 'tipos-alerta' },
      { name: 'id_usuario_destino', label: 'Dirigida a (conductor)', type: 'text', required: true, format: 'uuid', ref: 'conductor' },
      { name: 'fecha_limite', label: 'Fecha límite', type: 'date' },
      { name: 'prioridad', label: 'Prioridad', type: 'number', integer: true, min: 1 },
      { name: 'id_vehiculo_relacionado', label: 'Vehículo relacionado', type: 'number', integer: true, min: 1, ref: 'vehiculos' },
      { name: 'id_servicio_relacionado', label: 'Servicio relacionado', type: 'number', integer: true, min: 1, ref: 'servicios' }
    ]
  }
]

// Tablas que se administran desde el menú lateral.
// Las marcadas con `oculta` siguen existiendo (otras pantallas las usan para
// traducir un id a un nombre), pero no aparecen como una sección más.
export const entidadesVisibles = entities.filter((e) => !e.oculta)

// Orden de los grupos en el menú lateral
export const groups = ['Catálogos', 'Personas', 'Flota', 'Operación']

export function getEntity(key) {
  return entities.find((e) => e.key === key)
}
