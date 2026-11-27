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

// La app se arma en app.js; aqui solo se pone a escuchar en un puerto.
const { crearApp, tablasConfig, origenesPermitidos } = await import('./app.js');
const { supabase } = await import('./config/supabase.js');
const { cookieOptions } = await import('./config/cookies.js');

const app = crearApp();
const PORT = process.env.PORT || 3000;

tablasConfig.forEach(({ endpoint }) => console.log(`[Ruta Registrada]: -> /api/${endpoint}`));

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
