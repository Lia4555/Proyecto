import { Router } from 'express';
import { reporteServiciosSemanal } from '../controllers/reportesController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { soloAdmin } from '../middleware/permisos.js';

// Reportes descargables: exclusivos del administrador.
export const reportesRouter = Router();

reportesRouter.use(authMiddleware, soloAdmin);

reportesRouter.get('/servicios-semanal', reporteServiciosSemanal);
