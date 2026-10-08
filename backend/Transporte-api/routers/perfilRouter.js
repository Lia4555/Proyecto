import express, { Router } from 'express';
import { cambiarContrasena, guardarFoto, obtenerFoto, quitarFoto } from '../controllers/perfilController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { limitarIntentos } from '../middleware/limitador.js';

// Perfil propio: cualquier usuario con sesion, siempre sobre su cuenta
// (el id sale del token, nunca de la URL).
export const perfilRouter = Router();

// Primero la sesion: sin ella no se lee ni un byte del cuerpo.
perfilRouter.use(authMiddleware);

// Una foto en base64 supera el limite general de 100 KB del JSON. Este
// router se monta ANTES del express.json() global para usar el suyo.
perfilRouter.use(express.json({ limit: '250kb' }));

perfilRouter.get('/foto', obtenerFoto);
perfilRouter.put('/foto', guardarFoto);
perfilRouter.delete('/foto', quitarFoto);

// Cambiar la propia contraseña: pide la actual, y pocos intentos para que
// una sesion robada no sirva para adivinarla.
const limiteContrasena = limitarIntentos({
  maximo: 5,
  ventanaMs: 15 * 60 * 1000,
  mensaje: 'Demasiados intentos de cambio de contraseña.'
});
perfilRouter.put('/contrasena', limiteContrasena, cambiarContrasena);
