import { ApiConfig } from '../config/ApiConfig';

// Cliente HTTP unico de la app. Toda peticion a la API pasa por aqui:
// aqui se pone el token, se corta por tiempo de espera y se traduce el
// error del servidor a un mensaje que la pantalla pueda mostrar.

export interface DetalleError {
  campo: string;
  mensaje: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    mensaje: string,
    /** Errores por campo que manda el backend ({ detalles: [{ campo, mensaje }] }). */
    public readonly detalles: DetalleError[] = []
  ) {
    super(mensaje);
    this.name = 'ApiError';
  }

  /** La sesion ya no vale: hay que volver al login. */
  get esSesionInvalida(): boolean {
    return this.status === 401;
  }

  get esSinPermiso(): boolean {
    return this.status === 403;
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class HttpClient {
  private token: string | null = null;

  constructor(private readonly baseUrl: string = ApiConfig.baseUrl) {}

  /** El repositorio de sesion avisa aqui cada vez que el token cambia. */
  usarToken(token: string | null): void {
    this.token = token;
  }

  get<T>(ruta: string): Promise<T> {
    return this.peticion<T>('GET', ruta);
  }

  post<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return this.peticion<T>('POST', ruta, cuerpo);
  }

  put<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return this.peticion<T>('PUT', ruta, cuerpo);
  }

  patch<T>(ruta: string, cuerpo: unknown = {}): Promise<T> {
    return this.peticion<T>('PATCH', ruta, cuerpo);
  }

  delete<T>(ruta: string): Promise<T> {
    return this.peticion<T>('DELETE', ruta);
  }

  private async peticion<T>(metodo: Metodo, ruta: string, cuerpo?: unknown): Promise<T> {
    // AbortController: sin esto, si el servidor esta apagado la app se
    // queda "cargando" para siempre en vez de avisar al usuario.
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), ApiConfig.timeoutMs);

    try {
      const respuesta = await fetch(`${this.baseUrl}${ruta}`, {
        method: metodo,
        signal: control.signal,
        headers: {
          'Content-Type': 'application/json',
          ...ApiConfig.cabeceraCliente,
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
        },
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
      });

      const texto = await respuesta.text();
      const datos = texto ? this.parsear(texto) : null;

      if (!respuesta.ok) {
        const mensaje =
          (datos && typeof datos === 'object' && 'error' in datos
            ? String((datos as { error: unknown }).error)
            : null) ?? `Error ${respuesta.status} al conectar con el servidor.`;
        const detalles =
          datos && typeof datos === 'object' && Array.isArray((datos as { detalles?: unknown }).detalles)
            ? ((datos as { detalles: DetalleError[] }).detalles)
            : [];
        throw new ApiError(respuesta.status, mensaje, detalles);
      }

      return datos as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'El servidor tardo demasiado en responder.');
      }
      // Caso tipico en clase: el servidor no esta encendido o la IP
      // configurada en ApiConfig no es la correcta.
      throw new ApiError(
        0,
        `No se pudo conectar con el servidor (${this.baseUrl}). Revisa que este encendido y la direccion en Data/config/ApiConfig.ts.`
      );
    } finally {
      clearTimeout(temporizador);
    }
  }

  private parsear(texto: string): unknown {
    try {
      return JSON.parse(texto);
    } catch {
      return null;
    }
  }
}

/** Instancia compartida por toda la app. */
export const httpClient = new HttpClient();
