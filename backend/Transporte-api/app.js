
import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { configureGenericRouter } from './routers/genericRouter.js';
import { authRouter } from './routers/authRouter.js';
import { cuentasRouter } from './routers/cuentasRouter.js';
import { reportesRouter } from './routers/reportesRouter.js';
import { perfilRouter } from './routers/perfilRouter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { construirOpenApi } from './docs/openapi.js';

// endpoints de las tablas que se exponen con el router generico
export const tablasConfig = [
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

export const origenesPermitidos = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export function crearApp() {
  const app = express();

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

  tablasConfig.forEach(({ endpoint, tabla, pk }) => {
    app.use(`/api/${endpoint}`, configureGenericRouter(tabla, pk));
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

  return app;
}
