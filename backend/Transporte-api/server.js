import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { configureGenericRouter } from './routers/genericRouter.js';
import { authRouter } from './routers/authRouter.js'; // <- Nuevo router de autenticación
import { errorHandler } from './middleware/errorHandler.js';
import { supabase } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. RUTAS MANUALES DE AUTENTICACIÓN (Públicas para Login y Registro)
app.use('/api/auth', authRouter);

// Configuración de mapeo (Quitamos 'usuario' y 'login' de aquí para que no sean genéricas)
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
  console.log(`[Ruta Registrada]: POST/GET -> ${urlPrefijo}`);
  app.use(urlPrefijo, configureGenericRouter(tabla, pk));
});

app.get('/health', (req, res) => res.json({ status: 'UP', timestamp: new Date() }));

app.use(errorHandler);

async function verificarConexionSupabase() {
  try {
    const { error } = await supabase.from('roles').select('id_rol').limit(1);
    if (error) throw error;
    console.log(' Conexión exitosa con SupaBase');
  } catch (error) {
    console.error(' Error de conexión con Supabase.');
    console.error(`Detalle: ${error.message || error}`);
  }
}

app.listen(PORT, async () => {
  console.log(`\n Servidor corriendo en: http://localhost:${PORT}`);
  console.log(` Total de APIs de tablas operativas: ${tablasConfig.length}`);
  await verificarConexionSupabase();
});