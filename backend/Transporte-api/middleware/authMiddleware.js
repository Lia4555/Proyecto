import jwt from 'jsonwebtoken';

// Verifica el token JWT en cada petición 
const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'No hay token' });
  }

  // Formato esperado: "Bearer <token>"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET); // valida firma y expiración
    req.user = verified; // { id_usuario, correo, id_rol, nivel_permiso, rol }
    next();
  } catch (error) {
    // Diferencia token vencido de token manipulado (útil para depurar)
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'La sesión expiró, inicia sesión de nuevo' });
    }
    return res.status(403).json({ error: 'Token inválido' });
  }
};

export default authMiddleware;