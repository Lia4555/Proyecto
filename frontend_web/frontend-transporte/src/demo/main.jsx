// ============================================================
// Punto de entrada del MODO DEMOSTRACIÓN (npm run demo).
// Monta la misma aplicación, pero sustituye las llamadas HTTP por
// un backend simulado en memoria. Nada de esto entra en el build
// de producción: solo lo carga demo.html.
// ============================================================
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App.jsx'
import api from '../api/api.js'
import ErrorBoundary from '../components/ui/ErrorBoundary.jsx'
import { ToastProvider } from '../components/ui/Toast.jsx'
import { MASCARA } from '../lib/validaciones.js'
import { almacen, siguienteId } from './datos.js'
import '../index.css'
import '../tema.css'

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

const responder = (config, status, data) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config
})

const fallar = (config, status, error) => {
  const err = new Error(error)
  err.config = config
  err.response = { status, data: { error }, config, headers: {} }
  return Promise.reject(err)
}

const fallarCampos = (config, status, error, detalles) => {
  const err = new Error(error)
  err.config = config
  err.response = { status, data: { error, detalles }, config, headers: {} }
  return Promise.reject(err)
}

// Datos delicados: igual que middleware/datosSensibles.js del backend, la API
// no devuelve algunos campos y enmascara otros ("••••6589").
const POLITICA = {
  conductor: { ocultar: ['fecha_nacimiento', 'direccion', 'ultimo_acceso'], enmascarar: ['numero_documento', 'licencia_conduccion'] },
  clientes: { ocultar: ['fecha_nacimiento', 'direccion'], enmascarar: ['numero_documento'] },
  cuentas: { ocultar: [], enmascarar: ['numero_documento'] }
}
const enmascarar = (v) => {
  if (v === null || v === undefined || v === '') return v
  const texto = String(v)
  return texto.length > 4 ? `${MASCARA}${texto.slice(-4)}` : MASCARA
}
const proteger = (recurso, datos) => {
  const politica = POLITICA[recurso]
  if (!politica) return datos
  const limpiar = (fila) => {
    const copia = { ...fila }
    for (const c of politica.ocultar) delete copia[c]
    for (const c of politica.enmascarar) if (c in copia) copia[c] = enmascarar(copia[c])
    return copia
  }
  return Array.isArray(datos) ? datos.map(limpiar) : limpiar(datos)
}
// Al editar, un valor enmascarado reenviado no es un cambio: se descarta.
const descartarEnmascarados = (recurso, cuerpo) => {
  for (const c of POLITICA[recurso]?.enmascarar || []) {
    if (typeof cuerpo[c] === 'string' && cuerpo[c].includes(MASCARA)) delete cuerpo[c]
  }
  return cuerpo
}

const claveValida = (v) => typeof v === 'string' && v.length >= 8 && v.length <= 72

// La sesión real vive en una cookie httpOnly que el navegador maneja solo.
// Aquí se imita con una variable: mientras valga null, /auth/me responde 401
// y la aplicación enseña la portada pública.
let sesionDemo = null

// demo.html?sesion=admin entra directo al panel (útil para presentar).
const ADMIN_DEMO = {
  id_usuario: 'demo',
  nombre: 'Administrador de prueba',
  correo: 'admin@dviaje.com',
  id_rol: 1,
  rol: 'Administrador',
  nivel_permiso: 3,
  id_conductor: null
}
if (new URLSearchParams(window.location.search).get('sesion') === 'admin') sesionDemo = ADMIN_DEMO

// ---- Automatización y evaluaciones simuladas
const enDias = (d) => {
  const f = new Date()
  f.setDate(f.getDate() + d)
  return f.toISOString().slice(0, 10)
}
const semaforo = (d) => (d < 0 ? 'vencido' : d <= 7 ? 'critico' : d <= 15 ? 'pronto' : 'aviso')
const vencimientosDemo = [
  ['documento', 'SOAT · 7845120', 'Vehículo WPK-482', -3],
  ['licencia', 'Licencia de conducción C2', 'Carlos Ramírez', 2],
  ['documento', 'Revisión técnico-mecánica', 'Vehículo TSL-219', 5],
  ['mantenimiento', 'Mantenimiento programado', 'Vehículo WPK-482', 6],
  ['documento', 'Póliza contractual · RC-55821', 'Vehículo JHN-730', 12],
  ['documento', 'Tarjeta de operación', 'Vehículo TSL-219', 24]
].map(([tipo, titulo, referencia, dias], i) => ({
  tipo, id: i + 1, titulo, referencia, fecha: enDias(dias), dias, estado: semaforo(dias)
}))

const evaluacionesDemo = [
  ['SVC-0041', 'Bogotá → Villa de Leyva', 'Carlos Ramírez', 5, 5, 5, 4, true, 'Puntual, muy amable y el vehículo impecable.'],
  ['SVC-0039', 'Terminal Salitre → Tunja', 'Andrés Gómez', 4, 4, 5, 4, true, 'Buen viaje, solo un pequeño retraso en la salida.'],
  ['SVC-0037', 'Aeropuerto El Dorado → Chía', 'Diana Torres', 5, 5, 5, 5, true, 'Excelente servicio ejecutivo.'],
  ['SVC-0035', 'Bogotá → Girardot', 'Andrés Gómez', 2, 1, 3, 3, false, 'Llegó 40 minutos tarde a recogernos.'],
  ['SVC-0042', 'Bogotá → Zipaquirá', 'Diana Torres', null],
  ['SVC-0043', 'Chía → Bogotá', 'Carlos Ramírez', null]
].map(([codigo, ruta, conductor, cal, pun, trato, veh, rec, com], i) => ({
  id_evaluacion: i + 1,
  id_servicio: 40 + i,
  codigo_servicio: codigo,
  ruta,
  conductor,
  id_conductor: conductor,
  fecha_salida: `${enDias(-(i + 1) * 2)}T13:00:00Z`,
  estado: cal ? 'respondida' : 'pendiente',
  calificacion: cal,
  puntualidad: pun ?? null,
  trato_conductor: trato ?? null,
  estado_vehiculo: veh ?? null,
  recomendaria: rec ?? null,
  comentario: com ?? null,
  respondida_en: cal ? `${enDias(-(i + 1))}T18:00:00Z` : null,
  enlace: cal ? null : `${window.location.origin}/?evaluar=demo${i}`
}))

function resumenEvaluacionesDemo() {
  const r = evaluacionesDemo.filter((e) => e.calificacion)
  const prom = (k) => Math.round((r.reduce((a, e) => a + e[k], 0) / r.length) * 100) / 100
  const porConductor = {}
  for (const e of r) (porConductor[e.conductor] ||= []).push(e.calificacion)
  return {
    enviadas: evaluacionesDemo.length,
    respondidas: r.length,
    tasaRespuesta: Math.round((r.length / evaluacionesDemo.length) * 100),
    promedio: prom('calificacion'),
    puntualidad: prom('puntualidad'),
    trato_conductor: prom('trato_conductor'),
    estado_vehiculo: prom('estado_vehiculo'),
    recomendarian: Math.round((r.filter((e) => e.recomendaria).length / r.length) * 100),
    distribucion: [1, 2, 3, 4, 5].map((n) => r.filter((e) => e.calificacion === n).length),
    porConductor: Object.entries(porConductor)
      .map(([c, n]) => ({ id_conductor: c, conductor: c, cantidad: n.length, promedio: n.reduce((a, b) => a + b, 0) / n.length }))
      .sort((a, b) => b.promedio - a.promedio)
  }
}

const ultimaRevisionDemo = () => ({
  ok: true,
  fin: new Date(Date.now() - 12 * 60000).toISOString(),
  resultado: { alertasCreadas: 3, alertasCerradas: 1 }
})

// Solicitudes de cuenta de la demo: una pendiente para poder probar «Aprobar».
const cuentasDemo = [
  {
    id_usuario: 'demo-pendiente',
    nombre: 'Laura',
    apellido: 'Gómez',
    correo: 'laura.gomez@correo.com',
    telefono: '300 555 1234',
    activo: false,
    estado: 'pendiente',
    rol: 'Conductor',
    tiene_ficha: true,
    tipo_documento: 'CC',
    numero_documento: '1020304050',
    fecha_registro: new Date().toISOString(),
    es_tu_cuenta: false
  }
]

api.defaults.adapter = async (config) => {
  await espera(220) // latencia simulada para ver los estados de carga

  const ruta = (config.url || '').replace(/^\//, '')
  const [recurso, id] = ruta.split('/')
  const metodo = (config.method || 'get').toLowerCase()
  const cuerpo = config.data ? JSON.parse(config.data) : {}

  // ---- Autenticación simulada
  if (recurso === 'auth') {
    if (id === 'login') {
      if (!cuerpo.correo || !cuerpo.contrasena) {
        return fallar(config, 400, 'Correo y contraseña son obligatorios')
      }
      if (String(cuerpo.contrasena).length < 6) {
        return fallar(config, 401, 'El correo o la contraseña son incorrectos.')
      }
      sesionDemo = {
        id_usuario: 'demo',
        nombre: 'Administrador de prueba',
        correo: cuerpo.correo,
        id_rol: 1,
        rol: 'Administrador',
        nivel_permiso: 3,
        id_conductor: null
      }
      return responder(config, 200, { message: 'Login exitoso', user: sesionDemo })
    }

    if (id === 'me') {
      if (!sesionDemo) return fallar(config, 401, 'No hay sesion activa. Inicia sesion.')
      return responder(config, 200, { user: sesionDemo })
    }

    if (id === 'logout') {
      sesionDemo = null
      return responder(config, 200, { message: 'Sesion cerrada' })
    }

    // Retirado por seguridad: la contraseña la restablece un administrador.
    if (id === 'recuperar') {
      return fallar(config, 410, 'La recuperación con correo y teléfono se retiró por seguridad. Pide a un administrador que restablezca tu contraseña.')
    }

    if (id === 'register') {
      cuentasDemo.unshift({
        id_usuario: `demo-${Date.now()}`,
        nombre: cuerpo.nombre,
        apellido: cuerpo.apellido,
        correo: cuerpo.correo,
        telefono: cuerpo.telefono,
        activo: false,
        estado: 'pendiente',
        rol: 'Conductor',
        tiene_ficha: true,
        tipo_documento: cuerpo.tipo_documento,
        numero_documento: cuerpo.numero_documento,
        fecha_registro: new Date().toISOString(),
        es_tu_cuenta: false
      })
      return responder(config, 201, {
        message: 'Solicitud enviada. Un administrador debe aprobar tu cuenta antes de que puedas iniciar sesión.'
      })
    }
  }

  // ---- Cambiar la contraseña propia (en la demo cualquier actual de 6+ vale)
  if (recurso === 'perfil' && id === 'contrasena' && metodo === 'put') {
    if (!sesionDemo) return fallar(config, 401, 'No hay sesion activa. Inicia sesion.')
    if (!cuerpo.actual || String(cuerpo.actual).length < 6) {
      return fallarCampos(config, 400, 'La contraseña actual no es correcta.', [
        { campo: 'actual', mensaje: 'La contraseña actual no es correcta.' }
      ])
    }
    if (!claveValida(cuerpo.nueva)) {
      return fallarCampos(config, 400, 'Datos inválidos', [
        { campo: 'nueva', mensaje: 'Debe tener entre 8 y 72 caracteres.' }
      ])
    }
    return responder(config, 200, { success: true, message: 'Tu contraseña se cambió.' })
  }

  // ---- Cuentas de acceso simuladas (solo administrador)
  if (recurso === 'cuentas') {
    if (metodo === 'get') return responder(config, 200, proteger('cuentas', cuentasDemo))
    const i = cuentasDemo.findIndex((c) => c.id_usuario === id)
    if (i === -1) return fallar(config, 404, 'Cuenta no encontrada.')
    if (ruta.split('/')[2] === 'contrasena') {
      if (!claveValida(cuerpo.contrasena)) {
        return fallarCampos(config, 400, 'Datos inválidos', [
          { campo: 'contrasena', mensaje: 'Debe tener entre 8 y 72 caracteres.' }
        ])
      }
      return responder(config, 200, {
        success: true,
        message: `Contraseña de ${cuentasDemo[i].correo} restablecida. Entrégasela por un canal seguro y pídele que la cambie al entrar.`
      })
    }
    if (metodo === 'delete') {
      cuentasDemo.splice(i, 1)
      return responder(config, 200, { success: true, message: 'Solicitud rechazada.' })
    }
    const accion = ruta.split('/')[2]
    const aprobar = accion === 'aprobar'
    cuentasDemo[i] = { ...cuentasDemo[i], activo: aprobar, estado: aprobar ? 'activa' : 'desactivada' }
    return responder(config, 200, {
      success: true,
      message: accion === 'aprobar' ? 'Cuenta aprobada.' : 'Cuenta desactivada.'
    })
  }

  if (recurso === 'automatizacion') {
    if (id === 'ejecutar') {
      return responder(config, 200, {
        success: true,
        resultado: { alertasCreadas: 2, alertasCerradas: 1, documentosMarcadosVencidos: 1, serviciosFinalizados: 0, enlacesEvaluacionCreados: 1 }
      })
    }
    return responder(config, 200, {
      automatizacion: {
        activa: true,
        intervaloMin: 60,
        enEjecucion: false,
        ultimaEjecucion: ultimaRevisionDemo(),
        proximaEjecucion: new Date(Date.now() + 48 * 60000).toISOString()
      },
      conteos: {
        vencidos: vencimientosDemo.filter((v) => v.estado === 'vencido').length,
        documentosVencidos: vencimientosDemo.filter((v) => v.tipo === 'documento' && v.estado === 'vencido').length,
        licenciasVencidas: vencimientosDemo.filter((v) => v.tipo === 'licencia' && v.estado === 'vencido').length,
        mantenimientosAtrasados: vencimientosDemo.filter((v) => v.tipo === 'mantenimiento' && v.estado === 'vencido').length,
        porVencer: vencimientosDemo.filter((v) => v.estado !== 'vencido').length,
        criticos: vencimientosDemo.filter((v) => v.estado === 'critico').length,
        proximos: vencimientosDemo.filter((v) => v.estado === 'pronto' || v.estado === 'aviso').length,
        alertasAbiertas: 7,
        alertasUrgentes: 3
      },
      vencimientos: vencimientosDemo
    })
  }

  if (recurso === 'evaluaciones' && id === 'publica') {
    if (metodo === 'post') {
      return responder(config, 201, { success: true, message: '¡Gracias! Tu opinión nos ayuda a mejorar el servicio.' })
    }
    return responder(config, 200, {
      servicio: {
        codigo_servicio: 'SVC-0042',
        origen: 'Aeropuerto El Dorado',
        destino: 'Hotel Casa Medina, Bogotá',
        fecha_salida: `${enDias(-1)}T14:30:00Z`,
        conductor: 'Diana T.',
        vehiculo: 'Mercedes-Benz Sprinter · WPK-482'
      },
      respondida: false,
      vencida: false,
      respuesta: null
    })
  }

  if (recurso === 'evaluaciones') {
    return responder(config, 200, { resumen: resumenEvaluacionesDemo(), evaluaciones: evaluacionesDemo })
  }

  const registro = almacen.get(recurso)
  if (!registro) return fallar(config, 404, `Recurso «${recurso}» no existe en la demo`)

  const pk = registro.entidad.pk

  if (metodo === 'get') {
    if (id) {
      const fila = registro.filas.find((f) => String(f[pk]) === String(id))
      return fila ? responder(config, 200, proteger(recurso, fila)) : fallar(config, 404, 'Registro no encontrado')
    }
    return responder(config, 200, proteger(recurso, registro.filas))
  }

  if (metodo === 'post') {
    const nueva = { ...cuerpo, [pk]: siguienteId(registro) }
    registro.filas.unshift(nueva)
    return responder(config, 201, { success: true, data: nueva })
  }

  if (metodo === 'put') {
    const i = registro.filas.findIndex((f) => String(f[pk]) === String(id))
    if (i === -1) return fallar(config, 404, 'Registro no encontrado')
    registro.filas[i] = { ...registro.filas[i], ...descartarEnmascarados(recurso, cuerpo) }
    return responder(config, 200, { success: true, data: proteger(recurso, registro.filas[i]) })
  }

  if (metodo === 'delete') {
    const i = registro.filas.findIndex((f) => String(f[pk]) === String(id))
    if (i === -1) return fallar(config, 404, 'Registro no encontrado')
    registro.filas.splice(i, 1)
    return responder(config, 200, { success: true })
  }

  return fallar(config, 405, 'Método no permitido en la demo')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <div className="demo-aviso">
          Modo demostración · entra con cualquier correo y una contraseña de 6+ caracteres
        </div>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
