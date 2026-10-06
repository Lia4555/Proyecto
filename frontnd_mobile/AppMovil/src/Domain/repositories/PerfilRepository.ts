// CONTRATO: la foto de perfil de la cuenta con sesion abierta.
// La foto viaja como data URL ("data:image/jpeg;base64,...").
export interface PerfilRepository {
  /** Foto guardada, o null si no tiene (o el servidor aun no las admite). */
  obtenerFoto(): Promise<string | null>;
  guardarFoto(foto: string): Promise<string | null>;
  quitarFoto(): Promise<void>;
}
