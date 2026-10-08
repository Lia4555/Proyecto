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
