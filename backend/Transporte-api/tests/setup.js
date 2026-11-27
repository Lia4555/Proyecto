// Se ejecuta antes de cargar cada archivo de prueba.
// Variables de entorno de prueba: nunca las reales del archivo .env.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-solo-para-pruebas-automatizadas';
process.env.SUPABASE_URL = 'http://supabase.falso.local';
process.env.SUPABASE_KEY = 'clave-falsa';
process.env.FRONTEND_URL = 'http://localhost:5173';
// dotenv no debe anunciar en consola que cargo variables.
process.env.DOTENV_CONFIG_QUIET = 'true';
