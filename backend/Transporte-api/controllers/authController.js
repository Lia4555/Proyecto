import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { schemas } from '../schemas/genericSchema.js';

if (!process.env.JWT_SECRET) {
  console.error(' Falta JWT_SECRET en el archivo .env. Defínelo antes de usar auth.');
}


// 1. REGISTRO

export const register = async (req, res, next) => {
  try {
    // Validación f con Zod: email válido, contraseña 
    const datos = schemas.usuario.parse(req.body);


    //  el usuariario no puede escoger el rol
    let idRolFinal = datos.id_rol;
    const { data: rolCliente } = await supabase
      .from('roles')
      .select('id_rol')
      .eq('nombre_rol', 'Cliente')
      .maybeSingle();
    if (rolCliente) idRolFinal = rolCliente.id_rol;
    

    // Encriptar contraseña 
    const hashedPassword = await bcrypt.hash(datos.contrasena, 12);

    // Guardar en Supabase (se guarda la contraseña encriptada)
    const { error } = await supabase
      .from('usuario')
      .insert([{
        nombre: datos.nombre,
        apellido: datos.apellido,
        correo: datos.correo,
        contrasena: hashedPassword,
        telefono: datos.telefono || null,
        id_rol: idRolFinal
      }]);

    if (error) {
      // 23505 =  (correo repetido) 
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ese correo ya está registrado.' });
      }
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado con éxito. Ya puedes iniciar sesión.'
    });
  } catch (error) {
    next(error); 
  }
};


// 2. LOGIN
export const login = async (req, res, next) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    // Buscar el usuario por correo
    const { data: usuario, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('correo', correo)
      .single();

    if (error || !usuario) {
      return res.status(401).json({ error: 'El correo o la contraseña son incorrectos.' });
    }

    const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esValida) {
      return res.status(401).json({ error: 'El correo o la contraseña son incorrectos.' });
    }

    // Traer el nivel de permiso del rol (para autorización por rol en las rutas)
    const { data: rol } = await supabase
      .from('roles')
      .select('nombre_rol, nivel_permiso')
      .eq('id_rol', usuario.id_rol)
      .maybeSingle();

    const nivelPermiso = rol?.nivel_permiso ?? 1;
    const nombreRol = rol?.nombre_rol ?? null;

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo,
        id_rol: usuario.id_rol,
        nivel_permiso: nivelPermiso,
        rol: nombreRol
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      message: '¡Login exitoso!',
      token,
      user: {
        correo: usuario.correo,
        id_rol: usuario.id_rol,
        rol: nombreRol
      }
    });
  } catch (error) {
    next(error);
  }
};