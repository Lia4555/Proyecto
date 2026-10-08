import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// Se valida ANTES de importar nada que dependa del entorno, para fallar con un
// mensaje claro en vez de con un error raro a mitad de una peticion.
const requeridas = ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET'];
const faltantes = requeridas.filter((v) => !process.env[v]);
if (faltantes.length) {
  console.error(`\n Falta configurar en el archivo .env: ${faltantes.join(', ')}\n`);
  process.exit(1);
}

const { configureGenericRouter } = await import('./routers/genericRouter.js');
const { authRouter } = await import('./routers/authRouter.js');
const { cuentasRouter } = await import('./routers/cuentasRouter.js');
const { reportesRouter } = await import('./routers/reportesRouter.js');
const { perfilRouter } = await import('./routers/perfilRouter.js');
const { errorHandler } = await import('./middleware/errorHandler.js');
const { supabase } = await import('./config/supabase.js');
const { cookieOptions } = await import('./config/cookies.js');
const { construirOpenApi } = await import('./docs/openapi.js');
const { default: swaggerUi } = await import('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

// Detras de un proxy (Render, Railway, Nginx...) Express necesita esto para
// saber que la conexion original era HTTPS y poder emitir cookies "secure".
app.set('trust proxy', 1);

// No anunciar que el servidor es Express (pista gratis para un atacante).
app.disable('x-powered-by');

// Cabeceras de seguridad para todas las respuestas.
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff', // el navegador no "adivina" el tipo de archivo
    'X-Frame-Options': 'DENY', // nadie puede meter la API en un iframe (clickjacking)
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Opener-Policy': 'same-origin'
  });
  if (req.path.startsWith('/api/')) {
    // Las respuestas de la API son datos, nunca una pagina: no ejecutan nada
    // y no se guardan en caches intermedias (llevan datos personales).
    res.set({
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Cache-Control': 'no-store'
    });
  }
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// CORS con credenciales.
const origenesPermitidos = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Sin origin = peticiones del mismo servidor o de curl/Postman: se permiten.
    if (!origin || origenesPermitidos.includes(origin)) return callback(null, true);
    const err = new Error(`Origen no permitido por CORS: ${origin}`);
    err.status = 403; // si no, el errorHandler lo trataria como un 500
    return callback(err);
  },
  credentials: true,
  // Sin esto el navegador oculta estas cabeceras de las descargas de reportes.
  exposedHeaders: ['Content-Disposition', 'X-Total-Servicios']
}));

app.use(cookieParser());


app.use('/api/perfil', perfilRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de autenticación (register, login, logout, me)
app.use('/api/auth', authRouter);

// Cuentas de acceso: aprobar, desactivar o rechazar (solo administrador)
app.use('/api/cuentas', cuentasRouter);

// Reportes descargables en Excel (solo administrador)
app.use('/api/reportes', reportesRouter);

// endpoints
const tablasConfig = [
  { endpoint: 'roles', tabla: 'roles', pk: 'id_rol' },
  { endpoint: 'tipos-documentos', tabla: 'tipos_documentos', pk: 'id_tipo_documento' },
  { endpoint: 'estados-servicio', tabla: 'estados_servicio', pk: 'id_estado' },
  { endpoint: 'tipos-alerta', tabla: 'tipos_alerta', pk: 'id_tipo_alerta' },
  { endpoint: 'destinos', tabla: 'destinos', pk: 'id_destino' },
  { endpoint: 'clases-viaje', tabla: 'clases_viaje', pk: 'id_clase' },
  { endpoint: 'tipos-vehiculo', tabla: 'tipos_vehiculo', pk: 'id_tipo_vehiculo' },
  { endpoint: 'conductor', tabla: 'conductor', pk: 'id_conductor' },
  { endpoint: 'clientes', tabla: 'cliente', pk: 'id_cliente' },
  { endpoint: 'vehiculos', tabla: 'vehiculos', pk: 'id_vehiculo' },
  { endpoint: 'documentos-vehiculo', tabla: 'documentos_vehiculo', pk: 'id_documento' },
  { endpoint: 'historial-conductores', tabla: 'historial_conductores', pk: 'id_historial' },
  { endpoint: 'mantenimientos', tabla: 'mantenimientos', pk: 'id_mantenimiento' },
  { endpoint: 'servicios', tabla: 'servicios', pk: 'id_servicio' },
  { endpoint: 'reservas', tabla: 'reservas', pk: 'id_reserva' },
  { endpoint: 'alertas', tabla: 'alertas', pk: 'id_alerta' }
];

tablasConfig.forEach(({ endpoint, tabla, pk }) => {
  const urlPrefijo = `/api/${endpoint}`;
  console.log(`[Ruta Registrada]: -> ${urlPrefijo}`);
  app.use(urlPrefijo, configureGenericRouter(tabla, pk));
});

//swagger
const openApi = construirOpenApi(tablasConfig);

//si se quiere  ver enotra como postma
app.get('/api-docs.json', (req, res) => res.json(openApi));

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApi, {
    customSiteTitle: "D' VIAJE · API",
    swaggerOptions: {
      persistAuthorization: true,
      
      requestInterceptor: (peticion) => {
        peticion.credentials = 'include';
        return peticion;
      },
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true
    }
  })
);

app.get('/health', (req, res) => res.json({ status: 'UP', timestamp: new Date() }));

// Ruta inexistente
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// El manejador de errores va de ultimo: recibe todo lo que llegue por next(error)
app.use(errorHandler);

async function verificarConexionSupabase() {
  try {
    const { error } = await supabase.from('roles').select('id_rol').limit(1);
    if (error) throw error;
    console.log(' Conexion exitosa con Supabase');
  } catch (error) {
    console.error(' Error de conexion con Supabase.');
    console.error(`Detalle: ${error.message || error}`);
  }
}

app.listen(PORT, async () => {
  console.log(`\n Servidor corriendo en: http://localhost:${PORT}`);
  console.log(` Total de APIs de tablas operativas: ${tablasConfig.length}`);
  console.log(` CORS permitido para: ${origenesPermitidos.join(', ')}`);
  console.log(` Documentacion de la API: http://localhost:${PORT}/api-docs`);
  console.log(` Cookies: httpOnly, sameSite=${cookieOptions.sameSite}, secure=${cookieOptions.secure}`);
  await verificarConexionSupabase();
});