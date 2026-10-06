import { SolicitudCuenta, Usuario } from '../../Domain/entities';
import { HttpClient } from '../api/HttpClient';

// Respuestas tal como las envia el backend (controllers/authController.js).
interface RespuestaLogin {
  message: string;
  user: Usuario;
  token?: string;
}

interface RespuestaMe {
  user: Usuario;
}

/** Habla con /api/auth. No sabe nada de pantallas ni de almacenamiento. */
export class AuthApiSource {
  constructor(private readonly http: HttpClient) {}

  login(correo: string, contrasena: string): Promise<RespuestaLogin> {
    return this.http.post<RespuestaLogin>('/auth/login', { correo, contrasena });
  }

  async registrar(solicitud: SolicitudCuenta): Promise<string> {
    const respuesta = await this.http.post<{ message: string }>('/auth/register', solicitud);
    return respuesta.message;
  }

  async me(): Promise<Usuario> {
    const respuesta = await this.http.get<RespuestaMe>('/auth/me');
    return respuesta.user;
  }

  async logout(): Promise<void> {
    await this.http.post<{ message: string }>('/auth/logout', {});
  }
}
