
import { renderToString, renderToStaticMarkup } from 'react-dom/server'
import App from '../src/App.jsx'
import Dashboard, { SECCIONES_ADMIN } from '../src/components/Dashboard.jsx'
import Cuentas from '../src/components/Cuentas.jsx'
import Landing from '../src/components/Landing.jsx'
import Login from '../src/components/Login.jsx'
import Registro, { validarRegistro } from '../src/components/Registro.jsx'
import Recuperar from '../src/components/Recuperar.jsx'
import EntityForm from '../src/components/EntityForm.jsx'
import PanelConductor from '../src/components/conductor/PanelConductor.jsx'
import Pagination from '../src/components/ui/Pagination.jsx'
import { PasoSecciones } from '../src/components/ui/Navegador.jsx'
import { ToastProvider } from '../src/components/ui/Toast.jsx'
import { entities, entidadesVisibles, groups } from '../src/entities.js'
import { buildInitialValues, buildPayload, validateValues } from '../src/lib/form.js'
import {
  errorDocumento,
  errorNombre,
  errorPlaca,
  errorTelefono,
  limpiarDecimal,
  limpiarDocumento,
  limpiarEntero,
  limpiarNombre,
  limpiarPlaca,
  limpiarTelefono
} from '../src/lib/validaciones.js'
import {
  columnLabel,
  compareValues,
  fechaCorta,
  formatValue,
  pesos,
  textoVigencia
} from '../src/lib/format.js'
import { esAdmin, esConductor, iniciales, nombreVisible, puedeEscribir } from '../src/lib/session.js'
import { etiquetaDeFila, referenciasDe } from '../src/lib/referencias.js'

let fallos = 0

const chequear = (nombre, real, esperado) => {
  const ok = JSON.stringify(real) === JSON.stringify(esperado)
  if (!ok) fallos++
  console.log(
    `${ok ? '  OK  ' : ' FALLA'} ${nombre}` +
      (ok ? '' : `\n        esperado: ${JSON.stringify(esperado)}\n        recibido: ${JSON.stringify(real)}`)
  )
}

const renderiza = (nombre, elemento) => {
  try {
    const html = renderToString(elemento)
    console.log(`  OK   ${nombre} (${html.length} caracteres)`)
    return html
  } catch (e) {
    fallos++
    console.log(` FALLA ${nombre}: ${e.message}`)
    return ''
  }
}


console.log('\n· Renderizado de pantallas')

const admin = {
  correo: 'admin@dviaje.com',
  nombre: 'Diego Rojas',
  rol: 'Administrador',
  nivel_permiso: 3
}
const conductor = {
  correo: 'ana@dviaje.com',
  nombre: 'Ana Ruiz',
  rol: 'Conductor',
  nivel_permiso: 2,
  id_conductor: 'u1'
}

const servicios = entities.find((e) => e.key === 'servicios')
const vehiculos = entities.find((e) => e.key === 'vehiculos')
const navFalso = (ruta) => ({
  ruta,
  ir: () => {},
  atras: () => {},
  adelante: () => {},
  puedeVolver: true,
  puedeAvanzar: false
})

const PRIMERA_ADMIN = groups.flatMap((g) => entidadesVisibles.filter((e) => e.group === g))[0].key

renderiza('Arranque (comprobando la sesión)', <ToastProvider><App /></ToastProvider>)
renderiza('Landing (empresa)', <Landing onIngresar={() => {}} />)
renderiza('Login', <ToastProvider><Login onLogin={() => {}} onVolver={() => {}} /></ToastProvider>)
renderiza('Panel del administrador', <ToastProvider><Dashboard usuario={admin} nav={navFalso(PRIMERA_ADMIN)} onLogout={() => {}} /></ToastProvider>)
renderiza('Panel del conductor', <ToastProvider><PanelConductor usuario={conductor} nav={navFalso('mis-servicios')} onLogout={() => {}} /></ToastProvider>)
renderiza('Formulario nuevo', <ToastProvider><EntityForm entity={servicios} row={null} onClose={() => {}} onSaved={() => {}} /></ToastProvider>)
renderiza(
  'Formulario detalle',
  <ToastProvider>
    <EntityForm
      entity={vehiculos}
      row={{ id_vehiculo: 3, placa: 'ABC123', estado_operativo: true }}
      soloLectura
      onClose={() => {}}
      onSaved={() => {}}
    />
  </ToastProvider>
)

const portada = renderToStaticMarkup(<Landing onIngresar={() => {}} />)
chequear('la portada muestra las 5 fotos de la flota', portada.split('src="/img/').length - 1, 5)
chequear('la portada enlaza las 4 secciones', ['#empresa','#servicios','#flota','#contacto'].every((a) => portada.includes(a)), true)
chequear('todas las imágenes tienen texto alternativo', (portada.match(/<img/g)||[]).length, (portada.match(/alt=/g)||[]).length)
chequear('ya no se ofrece crear una cuenta', portada.includes('Crear una cuenta'), false)

const pantallaLogin = renderToStaticMarkup(
  <ToastProvider><Login onLogin={() => {}} onVolver={() => {}} onCrearCuenta={() => {}} /></ToastProvider>
)
chequear('el login enlaza al registro', pantallaLogin.includes('Crear una cuenta'), true)
chequear('el login ya no manda a pedir acceso al administrador', pantallaLogin.includes('Solicítalo al administrador'), false)

renderiza('Registro', <ToastProvider><Registro onIrALogin={() => {}} onVolver={() => {}} /></ToastProvider>)
const pantallaRegistro = renderToStaticMarkup(
  <ToastProvider><Registro onIrALogin={() => {}} onVolver={() => {}} /></ToastProvider>
)
chequear('el registro pide los 8 datos', [
  'reg-nombre', 'reg-apellido', 'reg-tipo_documento', 'reg-numero_documento',
  'reg-telefono', 'reg-correo', 'reg-contrasena', 'reg-confirmar'
].every((id) => pantallaRegistro.includes(`id="${id}"`)), true)
chequear('el registro avisa que requiere aprobación', pantallaRegistro.includes('aprobará'), true)

const registroValido = {
  nombre: 'Ana', apellido: 'Ruiz', tipo_documento: 'CC', numero_documento: '1020304050',
  telefono: '300 123 4567', correo: 'ana@correo.com', contrasena: 'claveSegura1', confirmar: 'claveSegura1'
}
chequear('registro válido sin errores', validarRegistro(registroValido), {})
chequear(
  'registro: contraseña corta, que no coincide y documento con puntos',
  Object.keys(validarRegistro({ ...registroValido, contrasena: '123', confirmar: '124', numero_documento: '1.020.304' })).sort(),
  ['confirmar', 'contrasena', 'numero_documento']
)


console.log('\n· Navegación entre pantallas')

const panelAdmin = renderToStaticMarkup(
  <ToastProvider><Dashboard usuario={admin} nav={navFalso(PRIMERA_ADMIN)} onLogout={() => {}} /></ToastProvider>
)
chequear('el menú del administrador incluye «Cuentas de acceso»', panelAdmin.includes('Cuentas de acceso'), true)
chequear('las rutas del administrador incluyen las cuentas', SECCIONES_ADMIN.includes('cuentas'), true)
renderiza('Cuentas de acceso', <ToastProvider><Cuentas /></ToastProvider>)
chequear('el panel trae las flechas Atrás y Adelante', [
  panelAdmin.includes('Volver a la pantalla anterior'),
  panelAdmin.includes('Ir a la pantalla siguiente')
], [true, true])

const panelConductor = renderToStaticMarkup(
  <ToastProvider><PanelConductor usuario={conductor} nav={navFalso('mis-servicios')} onLogout={() => {}} /></ToastProvider>
)
chequear('el conductor solo ve sus tres secciones', [
  panelConductor.includes('Mis servicios'),
  panelConductor.includes('Mi vehículo'),
  panelConductor.includes('Mis alertas'),
  panelConductor.includes('Clientes'),
  panelConductor.includes('Reservas')
], [true, true, true, false, false])

const paso = renderToStaticMarkup(
  <PasoSecciones
    anterior={{ key: 'a', label: 'Vehículos' }}
    siguiente={{ key: 'b', label: 'Servicios' }}
    onIr={() => {}}
  />
)
chequear('el pie ofrece la sección anterior y la siguiente', [
  paso.includes('Anterior') && paso.includes('Vehículos'),
  paso.includes('Siguiente') && paso.includes('Servicios')
], [true, true])

const pasoPrimera = renderToStaticMarkup(
  <PasoSecciones anterior={null} siguiente={{ key: 'b', label: 'Servicios' }} onIr={() => {}} />
)
chequear('en la primera sección no hay flecha «Anterior»', pasoPrimera.includes('Anterior'), false)


console.log('\n· Paginación')

const paginacion = (pagina, total, tamano = 10) => {
  const html = renderToStaticMarkup(
    <Pagination pagina={pagina} tamano={tamano} total={total} onPagina={() => {}} onTamano={() => {}} />
  )
  return {
    botones: [...html.matchAll(/aria-label="Página (\d+)"/g)].map((m) => Number(m[1])),
    huecos: (html.match(/pagination-gap/g) || []).length,
    resumen: (html.match(/Mostrando.*?<\/p>/) || [''])[0].replace(/<[^>]+>/g, ''),
    actual: (html.match(/aria-current="page"[^>]*>(\d+)/) || [])[1]
  }
}

chequear('primera página muestra 1-4 y la última', paginacion(1, 137).botones, [1, 2, 3, 4, 14])
chequear('página intermedia muestra vecinas', paginacion(7, 137).botones, [1, 6, 7, 8, 14])
chequear('última página muestra las 4 finales', paginacion(14, 137).botones, [1, 11, 12, 13, 14])
chequear('sin huecos cuando hay pocas páginas', paginacion(2, 25).huecos, 0)
chequear('dos huecos en el centro', paginacion(7, 137).huecos, 2)
chequear('rango exacto', paginacion(7, 137).resumen, 'Mostrando 61–70 de 137 registros')
chequear('última página parcial', paginacion(14, 137).resumen, 'Mostrando 131–137 de 137 registros')
chequear('mensaje sin datos', paginacion(1, 0).resumen, '')
chequear('tamaño de página respetado', paginacion(2, 137, 50).resumen, 'Mostrando 51–100 de 137 registros')

// ---------------------------------------------- 4. VALIDACIÓN
console.log('\n· Validación de formularios')

const vacios = buildInitialValues(servicios.fields, null)
chequear('detecta todos los obligatorios', Object.keys(validateValues(servicios.fields, vacios)).length, 9)
chequear('el código de servicio no se pide: lo genera el servidor', 'codigo_servicio' in validateValues(servicios.fields, vacios), false)
chequear(
  'UUID mal escrito',
  validateValues(servicios.fields, { ...vacios, id_conductor: '123' }).id_conductor,
  'Debe ser un UUID válido (36 caracteres con guiones).'
)
chequear(
  'fecha de llegada anterior a la salida',
  validateValues(servicios.fields, {
    ...vacios,
    fecha_salida: '2026-01-10T08:00',
    fecha_llegada_estimada: '2026-01-09T08:00'
  }).fecha_llegada_estimada,
  'No puede ser anterior a «Fecha de salida».'
)
chequear(
  'número entero exigido',
  validateValues(servicios.fields, { ...vacios, numero_pasajeros: '2.5' }).numero_pasajeros,
  'Debe ser un número entero.'
)

const conductorEnt = entities.find((e) => e.key === 'conductor')
chequear(
  'el payload recorta espacios, convierte números y omite opcionales vacíos',
  buildPayload(conductorEnt.fields, {
    nombre: ' Ana ',
    apellido: 'Ruiz',
    tipo_documento: 'CC',
    numero_documento: '123',
    email: 'a@b.co',
    telefono: '3001234567',
    fecha_nacimiento: '',
    direccion: '',
    licencia_conduccion: '',
    categoria_licencia: '',
    fecha_expedicion_licencia: '',
    fecha_vencimiento_licencia: '',
    id_rol: '2'
  }),
  {
    nombre: 'Ana',
    apellido: 'Ruiz',
    tipo_documento: 'CC',
    numero_documento: '123',
    email: 'a@b.co',
    telefono: '3001234567',
    id_rol: 2
  }
)

// ------------------------------------------------- 5. FORMATO
console.log('\n· Formato de celdas')

chequear('booleano', formatValue(true), 'Sí')
chequear('valor vacío', formatValue(null), '—')
chequear('fecha sin desfase de zona horaria', formatValue('2026-03-05', { type: 'date' }), '05/03/2026')
chequear('fecha guardada como timestamp', formatValue('2026-03-05T00:00:00.000Z', { type: 'date' }), '05/03/2026')
chequear('un UUID nunca se enseña', formatValue('3f7a1c2e-1111-2222-3333-444455556666'), '—')
chequear('texto largo recortado', formatValue('a'.repeat(60)).length, 45)
chequear('vacíos al final al ordenar', [3, null, 1].sort(compareValues), [1, 3, null])
chequear('encabezado desde la configuración', columnLabel(servicios, 'precio_total'), 'Precio total')
chequear('fecha corta', fechaCorta('2026-03-05'), '05/03/2026')
chequear('sin fecha', fechaCorta(null), '—')
chequear('documento vencido', textoVigencia('2020-01-01').estado, 'vencido')
chequear('documento vigente', textoVigencia('2099-01-01').estado, 'vigente')
chequear('precio en pesos', pesos(150000).replace(/ /g, ' ').startsWith('$'), true)

// ------------------------------ 6. NADA DE CÓDIGOS INTERNOS
console.log('\n· Los ids no se muestran en pantalla')

chequear(
  'ninguna tabla enseña su llave primaria como columna',
  entities.filter((e) => e.columnas?.includes(e.pk)).map((e) => e.key),
  []
)
chequear(
  'sin nombre no se cae al código',
  etiquetaDeFila(conductorEnt, { id_conductor: 'u9' }),
  'Sin nombre'
)
chequear(
  'el conductor se identifica con nombre y apellido',
  etiquetaDeFila(conductorEnt, { id_conductor: 'u1', nombre: 'Ana', apellido: 'Ruiz' }),
  'Ana Ruiz'
)

chequear('destinos ya no está en el panel', entities.some((e) => e.key === 'destinos'), false)
chequear('reservas ya no está en el panel', entities.some((e) => e.key === 'reservas'), false)

const refsFalsas = {
  conductor: {
    opciones: [{ valor: 'u1', etiqueta: 'Ana Ruiz' }],
    mapa: new Map([['u1', 'Ana Ruiz']])
  },
  vehiculos: {
    opciones: [{ valor: '7', etiqueta: 'ABC123 · Hino' }],
    mapa: new Map([['7', 'ABC123 · Hino']])
  },
  'estados-servicio': {
    opciones: [{ valor: '1', etiqueta: 'Programado' }],
    mapa: new Map([['1', 'Programado']])
  }
}

const formulario = renderToStaticMarkup(
  <ToastProvider>
    <EntityForm
      entity={servicios}
      row={null}
      referencias={refsFalsas}
      onClose={() => {}}
      onSaved={() => {}}
    />
  </ToastProvider>
)

chequear('el formulario usa listas desplegables para las 3 llaves foráneas', (formulario.match(/<select/g) || []).length, 3)
chequear('origen y destino se escriben a mano', formulario.includes('name="origen"') && formulario.includes('name="destino"'), true)
chequear('el código de servicio aparece como automático', formulario.includes('Se asignará al guardar'), true)
chequear('el código de servicio no es un campo editable', formulario.includes('name="codigo_servicio"'), false)
chequear('los números usan teclado numérico y no type=number', formulario.includes('type="number"'), false)
chequear('al crear un servicio no se pide la llegada real', formulario.includes('name="fecha_llegada_real"'), false)
chequear('al crear un servicio no se pide la distancia estimada', formulario.includes('name="distancia_estimada_km"'), false)
const edicionServicio = renderToStaticMarkup(
  <ToastProvider>
    <EntityForm entity={servicios} row={{ id_servicio: 1 }} referencias={refsFalsas} onClose={() => {}} onSaved={() => {}} />
  </ToastProvider>
)
chequear('al editar un servicio sí aparece la llegada real', edicionServicio.includes('name="fecha_llegada_real"'), true)
chequear('las opciones muestran nombres', formulario.includes('Ana Ruiz') && formulario.includes('ABC123 · Hino'), true)
chequear('los ids ya no se piden a mano', formulario.includes('ID Vehículo'), false)

const detalle = renderToStaticMarkup(
  <ToastProvider>
    <EntityForm
      entity={vehiculos}
      row={{ id_vehiculo: 3, placa: 'ABC123', estado_operativo: true }}
      soloLectura
      referencias={refsFalsas}
      onClose={() => {}}
      onSaved={() => {}}
    />
  </ToastProvider>
)
chequear('la cabecera del detalle no muestra el código', detalle.includes('drawer-id'), false)

chequear(
  'todas las referencias apuntan a tablas existentes',
  entities
    .flatMap((e) => e.fields.filter((f) => f.ref).map((f) => f.ref))
    .filter((clave) => !entities.some((e) => e.key === clave)),
  []
)
chequear(
  'servicios relaciona conductor, vehículo y estado (origen y destino son texto)',
  referenciasDe(servicios).sort(),
  ['conductor', 'estados-servicio', 'vehiculos'].sort()
)

// ------------------------------------------- 7. SESIÓN Y ROLES
console.log('\n· Sesión y permisos (solo dos roles)')

chequear('el administrador puede escribir', puedeEscribir(admin), true)
chequear('el conductor no puede escribir', puedeEscribir(conductor), false)
chequear('se reconoce al administrador', esAdmin(admin), true)
chequear('se reconoce al conductor', esConductor(conductor), true)
chequear('sin sesión no hay conductor', esConductor(null), false)
chequear('iniciales del nombre', iniciales(admin), 'DR')
chequear('iniciales desde el correo', iniciales({ correo: 'soporte@dviaje.com' }), 'SO')
chequear('nombre visible', nombreVisible(conductor), 'Ana Ruiz')

// ----------------------------------------- NOMBRES Y TELÉFONOS
console.log('\n· Nombres sin números y teléfonos sin letras')

chequear('al escribir, un nombre pierde números y símbolos', limpiarNombre('Ana2 María_3'), 'Ana María')
chequear('al escribir, se juntan los espacios repetidos', limpiarNombre('  Ana   Ruiz'), 'Ana Ruiz')
chequear('se admiten tildes, ñ, apóstrofo y guion', limpiarNombre("Núñez O'Brien-Pérez"), "Núñez O'Brien-Pérez")
chequear('al escribir, un teléfono pierde las letras', limpiarTelefono('300abc 123-4567'), '300 1234567')
chequear('el + solo vale al principio', limpiarTelefono('+57 3+00'), '+57 300')
chequear('nombre válido', errorNombre('María José'), null)
chequear('nombre con números', errorNombre('Juan2'), 'Solo letras y espacios, sin números ni símbolos.')
chequear('nombre de una letra', errorNombre('A'), 'Debe tener al menos 2 letras.')
chequear('teléfono válido', errorTelefono('+57 300 123 4567'), null)
chequear('teléfono con letras', errorTelefono('300abc4567'), 'Solo números y espacios (puede empezar con +).')
chequear('teléfono corto', errorTelefono('123452'), 'Debe tener entre 7 y 15 dígitos.')
chequear(
  'el formulario de conductor rechaza nombre con números y teléfono con letras',
  validateValues(conductorEnt.fields, { nombre: 'Ana1', apellido: 'Ruiz', telefono: '300x' }),
  {
    nombre: 'Solo letras y espacios, sin números ni símbolos.',
    tipo_documento: 'Este campo es obligatorio.',
    numero_documento: 'Este campo es obligatorio.',
    email: 'Este campo es obligatorio.',
    telefono: 'Solo números y espacios (puede empezar con +).',
    id_rol: 'Este campo es obligatorio.'
  }
)
chequear(
  'el registro público aplica las mismas reglas',
  (({ nombre, apellido, telefono }) => ({ nombre, apellido, telefono }))(
    validarRegistro({
      nombre: '456', apellido: 'Ruiz', tipo_documento: 'CC', numero_documento: '12345',
      telefono: '12', correo: 'a@b.co', contrasena: '12345678', confirmar: '12345678'
    })
  ),
  { nombre: 'Solo letras y espacios, sin números ni símbolos.', apellido: undefined, telefono: 'Debe tener entre 7 y 15 dígitos.' }
)

// ------------------------------------ 7b. DATOS NUMÉRICOS Y ÚNICOS
console.log('\n· Datos numéricos, documentos y valores únicos')

chequear('un entero pierde letras y símbolos al escribir', limpiarEntero('12a3.4e'), '1234')
chequear('un decimal acepta coma y un solo separador', limpiarDecimal('1.234,5x'), '1.2345')
chequear('la cédula pierde letras y puntos', limpiarDocumento('1.023.4AB56', 'CC'), '1023456')
chequear('el pasaporte conserva las letras', limpiarDocumento('ab-123 456', 'PA'), 'AB123456')
chequear('cédula con letras rechazada', errorDocumento('12AB456', 'CC') !== null, true)
chequear('cédula válida aceptada', errorDocumento('1023456789', 'CC'), null)
chequear('pasaporte con letras aceptado', errorDocumento('AB123456', 'PA'), null)
chequear('la placa se normaliza', limpiarPlaca('abc 12-3'), 'ABC123')
chequear('placa corta rechazada', errorPlaca('AB1') !== null, true)

const vehiculosEnt = entities.find((e) => e.key === 'vehiculos')
const filasVehiculos = [{ id_vehiculo: 1, placa: 'ABC123' }, { id_vehiculo: 2, placa: 'XYZ789' }]
const unVehiculo = { placa: 'abc123', marca: 'Hino', linea: 'AK', modelo: '2020', capacidad_pasajeros: '30', id_tipo_vehiculo: '1' }
chequear(
  'placa repetida detectada antes de enviar (sin distinguir mayúsculas)',
  !!validateValues(vehiculosEnt.fields, unVehiculo, { filas: filasVehiculos, pk: 'id_vehiculo' }).placa,
  true
)
chequear(
  'al editar, la propia placa no cuenta como repetida',
  validateValues(vehiculosEnt.fields, { ...unVehiculo, placa: 'ABC123' }, { filas: filasVehiculos, pk: 'id_vehiculo', fila: filasVehiculos[0] }).placa,
  undefined
)
chequear('el número interno es automático: no se envía', 'numero_interno' in buildPayload(vehiculosEnt.fields, { ...unVehiculo, numero_interno: '099' }), false)
chequear(
  'el origen y el destino no pueden coincidir',
  validateValues(servicios.fields, { ...vacios, origen: 'Bogotá', destino: 'bogotá' }).destino,
  'Debe ser distinto de «Origen».'
)
chequear('el código de servicio nunca se envía', 'codigo_servicio' in buildPayload(servicios.fields, { ...vacios, codigo_servicio: 'SVC-9' }), false)

// ------------------------------------------- 7c. RECUPERAR CONTRASEÑA
console.log('\n· Recuperar contraseña')

const htmlRecuperar = renderiza('pantalla de recuperación', <Recuperar onIrALogin={() => {}} onVolver={() => {}} />)
chequear('pide correo, teléfono y la nueva contraseña dos veces',
  ['rec-correo', 'rec-telefono', 'rec-contrasena', 'rec-confirmar'].every((id) => htmlRecuperar.includes(`id="${id}"`)), true)
chequear('cada campo tiene su etiqueta asociada', (htmlRecuperar.match(/<label[^>]*for="rec-/g) || []).length, 4)
const htmlLogin = renderToStaticMarkup(<Login onLogin={() => {}} onVolver={() => {}} onRecuperar={() => {}} />)
chequear('el login ofrece recuperar la contraseña', htmlLogin.includes('¿Olvidaste tu contraseña?'), true)
chequear('el login trae el correo recordado', renderToStaticMarkup(<Login onLogin={() => {}} correoInicial="ana@x.co" />).includes('value="ana@x.co"'), true)

// ----------------------------------------------- 8. ENTIDADES
console.log('\n· Configuración de tablas')

chequear('14 tablas configuradas', entities.length, 14)
chequear('la tabla de roles ya no se administra desde el menú', entidadesVisibles.length, 13)
chequear('roles queda oculta', entities.find((e) => e.key === 'roles').oculta, true)
chequear(
  'todas tienen endpoint, llave primaria y campos',
  entities.filter((e) => e.endpoint && e.pk && e.fields?.length > 0).length,
  entities.length
)
chequear(
  'las columnas por defecto existen dentro de los campos',
  entities.filter((e) => e.columnas?.some((c) => !e.fields.some((f) => f.name === c))).map((e) => e.key),
  []
)

console.log(
  fallos === 0
    ? '\n✔ Todas las pruebas pasaron\n'
    : `\n✖ ${fallos} prueba(s) fallaron\n`
)
process.exitCode = fallos === 0 ? 0 : 1
