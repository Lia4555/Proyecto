import { Router } from 'express';
import { createController } from '../controllers/genericController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { aplicarPermisos, soloAdmin } from '../middleware/permisos.js';

export const configureGenericRouter = (tableName, primaryKeyName) => {
  const router = Router();
  const controller = createController(tableName, primaryKeyName);

  // 1) Autenticacion: ninguna ruta responde sin una sesion valida.
  router.use(authMiddleware);

  // 2) Autorizacion. Solo hay dos roles:
  //    Administrador (nivel 3) -> todo.
  //    Conductor     (nivel 2) -> solo lo que autoriza middleware/permisos.js:
  //      leer sus servicios, cambiar su estado, y leer/reportar su vehiculo.
  //    aplicarPermisos deja en req.alcance el filtro que usa el controlador
  //    y recorta el cuerpo del PUT a las columnas permitidas.
  router.use(aplicarPermisos(tableName));

  router.route('/')
    .get(controller.getAll)
    .post(soloAdmin, controller.create);

  router.route('/:id')
    .get(controller.getById)
    .put(controller.update)
    .delete(soloAdmin, controller.delete);

  return router;
};
