// ============================================================
// Crea una cuenta de ADMINISTRADOR desde la terminal.
// ------------------------------------------------------------
//   npm run crear-admin
//
// Pide los datos por teclado (la contraseña no se ve al escribirla),
// la cifra con bcrypt igual que el login y la guarda en la tabla
// "usuario" con el rol Administrador. No hay forma de crear un
// administrador desde la web: esta es la puerta de entrada inicial.
// ============================================================
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'node:readline';
import { nombrePersona, telefono as reglaTelefono } from '../schemas/reglas.js';

dotenv.config({ quiet: true });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('\n Falta SUPABASE_URL o SUPABASE_KEY en el archivo .env\n');
  process.exit(1);
}

const { supabase } = await import('../config/supabase.js');

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: Boolean(process.stdin.isTTY)
});

// Con la entrada redirigida (no es una terminal) las lineas pueden llegar
// todas juntas: se guardan en cola para que ninguna respuesta se pierda.
const cola = [];
const esperando = [];
if (!process.stdin.isTTY) {
  rl.on('line', (linea) => (esperando.length ? esperando.shift()(linea) : cola.push(linea)));
  rl.on('close', () => esperando.splice(0).forEach((r) => r('')));
}

const preguntar = (texto) =>
  new Promise((resolve) => {
    if (process.stdin.isTTY) return rl.question(texto, (r) => resolve(r.trim()));
    process.stdout.write(texto);
    const responder = (linea) => {
      process.stdout.write('\n');
      resolve(linea.trim());
    };
    cola.length ? responder(cola.shift()) : esperando.push(responder);
  });

// Pregunta sin mostrar lo que se escribe (para la contraseña).
const preguntarOculto = (texto) =>
  new Promise((resolve) => {
    if (!process.stdin.isTTY) return preguntar(texto).then(resolve);
    const escribirOriginal = rl._writeToOutput;
    rl._writeToOutput = (s) => {
      // Solo se deja ver el texto de la pregunta, no las teclas.
      if (s.includes(texto)) escribirOriginal.call(rl, texto);
    };
    rl.question(texto, (respuesta) => {
      rl._writeToOutput = escribirOriginal;
      process.stdout.write('\n');
      resolve(respuesta);
    });
  });

// Aplica una regla de schemas/reglas.js; si no se cumple, termina con su mensaje.
const validar = (regla, valor) => {
  const resultado = regla.safeParse(valor);
  if (!resultado.success) salir(resultado.error.issues[0].message);
  return resultado.data;
};

const salir = (mensaje, codigo = 1) => {
  console.error(`\n ${mensaje}\n`);
  rl.close();
  process.exit(codigo);
};

async function main() {
  console.log("\n D' VIAJE · Crear cuenta de administrador\n");

  const nombre = validar(nombrePersona('El nombre'), await preguntar(' Nombre: '));
  const apellido = validar(nombrePersona('El apellido'), await preguntar(' Apellido: '));

  const correo = await preguntar(' Correo: ');
  if (!RE_EMAIL.test(correo)) salir('El correo no tiene un formato válido.');

  // El login compara el correo tal cual, así que se busca exacto.
  const { data: existente, error: errorBusqueda } = await supabase
    .from('usuario')
    .select('id_usuario')
    .eq('correo', correo)
    .limit(1);
  if (errorBusqueda) salir(`No se pudo consultar la base de datos: ${errorBusqueda.message}`);
  if (existente?.length) salir(`Ya existe una cuenta con el correo ${correo}.`);

  const telefonoEscrito = await preguntar(' Teléfono (opcional): ');
  const telefono = telefonoEscrito ? validar(reglaTelefono(), telefonoEscrito) : '';

  const contrasena = await preguntarOculto(' Contraseña (mínimo 8 caracteres): ');
  if (contrasena.length < 8) salir('La contraseña debe tener al menos 8 caracteres.');
  const repetida = await preguntarOculto(' Repite la contraseña: ');
  if (repetida !== contrasena) salir('Las contraseñas no coinciden.');

  // Mientras no se ejecute sql/roles-2-niveles.sql puede haber roles
  // "Administrador" duplicados: se usa el de nivel 3 (el del diseño actual)
  // y, si no está, cualquiera con ese nombre.
  const { data: roles, error: errorRoles } = await supabase
    .from('roles')
    .select('id_rol, nivel_permiso')
    .eq('nombre_rol', 'Administrador')
    .order('id_rol');
  if (errorRoles) salir(`No se pudo leer la tabla roles: ${errorRoles.message}`);
  const rol = roles?.find((r) => r.nivel_permiso === 3) ?? roles?.[0];
  if (!rol) salir('No existe el rol "Administrador". Ejecuta primero sql/roles-2-niveles.sql.');

  const hash = await bcrypt.hash(contrasena, 10);

  const { data: creado, error: errorInsert } = await supabase
    .from('usuario')
    .insert([
      {
        nombre,
        apellido,
        correo,
        contrasena: hash,
        telefono: telefono || null,
        activo: true,
        id_rol: rol.id_rol
      }
    ])
    .select('id_usuario, correo')
    .single();

  if (errorInsert) salir(`No se pudo crear la cuenta: ${errorInsert.message}`);

  console.log(`\n Cuenta de administrador creada: ${creado.correo}`);
  console.log(` Rol: Administrador (id_rol ${rol.id_rol}, nivel ${rol.nivel_permiso})`);
  console.log(' Ya puedes iniciar sesión en la web o en la app.\n');
  rl.close();
}

main().catch((error) => salir(error.message || String(error)));
