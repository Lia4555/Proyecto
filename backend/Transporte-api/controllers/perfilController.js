import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { limpiarSesion } from '../middleware/authMiddleware.js';
import { esquemaContrasena } from './cuentasController.js';

// CAMBIAR LA PROPIA CONTRASEÑA (con sesion y conociendo la actual)
export const cambiarContrasena = async (req, res, next) => {
  try {
    const actual = req.body?.actual;
    if (typeof actual !== 'string' || !actual) {
      return res.status(400).json({ error: 'Escribe tu contraseña actual.', detalles: [{ campo: 'actual', mensaje: 'Escribe tu contraseña actual.' }] });
    }
    const nueva = esquemaContrasena.parse(req.body?.nueva);

    const { data: cuenta, error } = await supabase
      .from('usuario')
      .select('contrasena')
      .eq('id_usuario', req.user.id_usuario)
      .maybeSingle();
    if (error) throw error;
    if (!cuenta) return res.status(404).json({ error: 'Tu cuenta ya no existe.' });

    if (!(await bcrypt.compare(actual, cuenta.contrasena))) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta.', detalles: [{ campo: 'actual', mensaje: 'La contraseña actual no es correcta.' }] });
    }

    const hash = await bcrypt.hash(nueva, 10);
    const { error: errorUpdate } = await supabase
      .from('usuario')
      .update({ contrasena: hash })
      .eq('id_usuario', req.user.id_usuario);
    if (errorUpdate) throw errorUpdate;

    limpiarSesion(req.user.id_usuario);
    return res.json({ success: true, message: 'Tu contraseña se cambió.' });
  } catch (error) {
    next(error);
  }
};


// FOTO DE PERFIL (cualquier usuario con sesion, solo la suya)
const MAX_BYTES = 150 * 1024;
const RE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;


const FIRMAS = {
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  webp: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP'
};

const FALTA_COLUMNA =
  'La base de datos aún no admite fotos de perfil. Un administrador debe ejecutar sql/foto-perfil.sql en Supabase.';

const esColumnaFaltante = (error) =>
  error?.code === '42703' || /foto_perfil/.test(error?.message || '');

// Devuelve un mensaje de error, o null si la foto es valida.
function problemaConLaFoto(foto) {
  if (typeof foto !== 'string') return 'Envía la foto como una imagen.';
  const partes = RE_DATA_URL.exec(foto);
  if (!partes) return 'La foto debe ser una imagen JPG, PNG o WebP.';

  const bytes = Buffer.from(partes[2], 'base64');
  if (bytes.length === 0) return 'La imagen está vacía.';
  if (bytes.length > MAX_BYTES) return 'La imagen es demasiado grande (máximo 150 KB).';
  if (!FIRMAS[partes[1]](bytes)) return 'El archivo no es una imagen válida.';
  return null;
}

async function actualizarFoto(req, res, foto) {
  const { data, error } = await supabase
    .from('usuario')
    .update({ foto_perfil: foto })
    .eq('id_usuario', req.user.id_usuario)
    .select('foto_perfil');

  if (error) {
    if (esColumnaFaltante(error)) return res.status(503).json({ error: FALTA_COLUMNA });
    throw error;
  }
  // La cuenta pudo borrarse mientras su sesion seguia abierta.
  if (!data || data.length === 0) return res.status(404).json({ error: 'Tu cuenta ya no existe.' });

  return res.json({ foto: data[0].foto_perfil ?? null });
}

export const obtenerFoto = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('foto_perfil')
      .eq('id_usuario', req.user.id_usuario)
      .maybeSingle();

    if (error) {
      // Sin la columna todavia no hay fotos: se responde vacio para que el
      // panel siga mostrando las iniciales sin aparecer un error.
      if (esColumnaFaltante(error)) return res.json({ foto: null, disponible: false });
      throw error;
    }

    res.set('Cache-Control', 'private, no-store');
    return res.json({ foto: data?.foto_perfil ?? null, disponible: true });
  } catch (error) {
    next(error);
  }
};

export const guardarFoto = async (req, res, next) => {
  try {
    const problema = problemaConLaFoto(req.body?.foto);
    if (problema) return res.status(400).json({ error: problema });
    return await actualizarFoto(req, res, req.body.foto);
  } catch (error) {
    next(error);
  }
};

export const quitarFoto = async (req, res, next) => {
  try {
    return await actualizarFoto(req, res, null);
  } catch (error) {
    next(error);
  }
};
