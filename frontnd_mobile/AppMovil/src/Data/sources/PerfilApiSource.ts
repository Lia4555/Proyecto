import { HttpClient } from '../api/HttpClient';

// Respuestas de routers/perfilRouter.js.
interface RespuestaFoto {
  foto: string | null;
  /** false mientras no se haya ejecutado sql/foto-perfil.sql */
  disponible?: boolean;
}

/** Habla con /api/perfil. Siempre sobre la cuenta del token. */
export class PerfilApiSource {
  constructor(private readonly http: HttpClient) {}

  foto(): Promise<RespuestaFoto> {
    return this.http.get<RespuestaFoto>('/perfil/foto');
  }

  guardarFoto(foto: string): Promise<RespuestaFoto> {
    return this.http.put<RespuestaFoto>('/perfil/foto', { foto });
  }

  /** PUT /perfil/contrasena: la propia, conociendo la actual. */
  async cambiarContrasena(actual: string, nueva: string): Promise<string> {
    const r = await this.http.put<{ success: boolean; message: string }>('/perfil/contrasena', { actual, nueva });
    return r.message;
  }

  quitarFoto(): Promise<RespuestaFoto> {
    return this.http.delete<RespuestaFoto>('/perfil/foto');
  }
}
