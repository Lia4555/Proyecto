import { Router } from 'express';
import { createController } from '../controllers/genericController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireNivel } from '../middleware/roles.js';

export const configureGenericRouter = (tableName, primaryKeyName) => {
  const router = Router();
  const controller = createController(tableName, primaryKeyName);

  //  Autenticación de  todas las rutas requieren un token 
  router.use(authMiddleware);

  // 2) Autorización por nivel de permiso 
  router.route('/')
    .get(controller.getAll)
    .post(requireNivel(3), controller.create);

  router.route('/:id')
    .get(controller.getById)
    .put(requireNivel(3), controller.update)
    .delete(requireNivel(3), controller.delete);

  return router;
};

