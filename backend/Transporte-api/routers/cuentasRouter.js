import { Router } from 'express';
import { aprobar, desactivar, listar, rechazar, restablecerContrasena } from '../controllers/cuentasController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { soloAdmin } from '../middleware/permisos.js';

// Gestion de cuentas de acceso: exclusiva del administrador.
// Va aparte del router generico porque la tabla "usuario" guarda la
// contraseña cifrada y NUNCA debe salir entera por la API.
export const cuentasRouter = Router();

cuentasRouter.use(authMiddleware, soloAdmin);

cuentasRouter.get('/', listar);
cuentasRouter.patch('/:id/aprobar', aprobar);
cuentasRouter.patch('/:id/desactivar', desactivar);
cuentasRouter.patch('/:id/contrasena', restablecerContrasena);
cuentasRouter.delete('/:id', rechazar);
