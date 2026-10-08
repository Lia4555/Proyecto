// CONTRATO: lo que la cuenta con sesion abierta gestiona de si misma.
// La foto viaja como data URL ("data:image/jpeg;base64,...").
export interface PerfilRepository {
  /** Foto guardada, o null si no tiene (o el servidor aun no las admite). */
  obtenerFoto(): Promise<string | null>;
  guardarFoto(foto: string): Promise<string | null>;
  quitarFoto(): Promise<void>;
  /**
   * Cambia la contraseña propia conociendo la actual. Devuelve el mensaje
   * del servidor. Si rechaza un campo lanza ErrorValidacion({ actual | nueva }).
   */
  cambiarContrasena(actual: string, nueva: string): Promise<string>;
}
