import { Router } from 'express';
import { register, login } from '../controllers/authController.js';

export const authRouter = Router();

// Definir los endpoints usando la constante correcta
authRouter.post('/register', register);
authRouter.post('/login', login);