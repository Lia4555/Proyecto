// MODELO: los datos con los que alguien pide una cuenta de conductor.
// La cuenta queda pendiente hasta que un administrador la aprueba.

export type TipoDocumento = 'CC' | 'CE' | 'PA';

export const TIPOS_DOCUMENTO: { valor: TipoDocumento; texto: string }[] = [
  { valor: 'CC', texto: 'Cédula de ciudadanía' },
  { valor: 'CE', texto: 'Cédula de extranjería' },
  { valor: 'PA', texto: 'Pasaporte' }
];

export interface SolicitudCuenta {
  nombre: string;
  apellido: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  telefono: string;
  correo: string;
  contrasena: string;
}

export type CampoSolicitud = keyof SolicitudCuenta | 'confirmar';

/** Errores por campo, con el mensaje que se pinta debajo de cada input. */
export type ErroresCampos<C extends string = CampoSolicitud> = Partial<Record<C, string>>;

/** Error de validacion que sabe a que campo pertenece cada mensaje. */
export class ErrorValidacion extends Error {
  constructor(
    public readonly campos: Partial<Record<string, string>>,
    /** Mensaje general del servidor (p. ej. "Ya existe una cuenta..."), si lo hubo. */
    public readonly mensajeServidor?: string
  ) {
    super(mensajeServidor ?? 'Revisa los datos marcados.');
    this.name = 'ErrorValidacion';
  }
}
