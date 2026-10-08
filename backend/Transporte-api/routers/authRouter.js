import { Router } from 'express';
import { login, logout, me } from '../controllers/authController.js';
import { recuperarContrasena, registrar } from '../controllers/cuentasController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { limitarIntentos } from '../middleware/limitador.js';

export const authRouter = Router();

// Registro publico: la cuenta nace APAGADA y como Conductor. No da acceso a
// nada hasta que un administrador la apruebe (ver controllers/cuentasController.js).
const limiteRegistro = limitarIntentos({
  maximo: 5,
  ventanaMs: 60 * 60 * 1000,
  mensaje: 'Se enviaron demasiadas solicitudes de cuenta desde esta conexión.'
});

const limiteLogin = limitarIntentos({
  maximo: 20,
  ventanaMs: 15 * 60 * 1000,
  mensaje: 'Demasiados intentos de inicio de sesión.'
});

authRouter.post('/register', limiteRegistro, registrar);
authRouter.post('/login', limiteLogin, login);
// Recuperar contraseña: pocos intentos, porque el telefono es un dato
// que se puede adivinar con paciencia.
const limiteRecuperar = limitarIntentos({
  maximo: 5,
  ventanaMs: 15 * 60 * 1000,
  mensaje: 'Demasiados intentos de recuperación.'
});

authRouter.post('/recuperar', limiteRecuperar, recuperarContrasena);
authRouter.post('/logout', logout);
authRouter.get('/me', authMiddleware, me);
