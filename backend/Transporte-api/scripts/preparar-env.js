// Se ejecuta antes de `npm run dev` (script "predev").
// `node --watch-path=.env` falla con ENOENT si el archivo .env no existe,
// asi que si falta se crea a partir de .env.example.
import { existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = path.join(raiz, '.env');
const ejemplo = path.join(raiz, '.env.example');

if (!existsSync(env)) {
  if (!existsSync(ejemplo)) {
    console.error('\n No existe .env ni .env.example. Crea el archivo .env antes de ejecutar el servidor.\n');
    process.exit(1);
  }
  copyFileSync(ejemplo, env);
  console.warn('\n Se creo .env a partir de .env.example. Revisa sus valores (SUPABASE_KEY, JWT_SECRET...).\n');
}
