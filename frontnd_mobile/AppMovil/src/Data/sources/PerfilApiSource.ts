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

  quitarFoto(): Promise<RespuestaFoto> {
    return this.http.delete<RespuestaFoto>('/perfil/foto');
  }
}
