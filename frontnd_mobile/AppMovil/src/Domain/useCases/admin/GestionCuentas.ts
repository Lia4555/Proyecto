import {
  AccionCuenta,
  CuentaAcceso,
  ErrorValidacion,
  ErroresCampos,
  EstadoCuenta,
  NombreRol,
  errorContrasena
} from '../../entities';
import { AdminRepository } from '../../repositories';

const ORDEN_ESTADO: Record<EstadoCuenta, number> = { pendiente: 0, activa: 1, desactivada: 2 };

// CASO DE USO: cuentas de acceso. Primero las pendientes (esperan una
// decision), luego las activas y al final las desactivadas; dentro de cada
// grupo, las mas recientes arriba.
export class ListarCuentas {
  constructor(private readonly repositorio: AdminRepository) {}

  async ejecutar(): Promise<CuentaAcceso[]> {
    const cuentas = await this.repositorio.cuentas();
    return [...cuentas].sort((a, b) => {
      if (a.estado !== b.estado) return ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado];
      return Date.parse(b.fecha_registro ?? '') - Date.parse(a.fecha_registro ?? '') || 0;
    });
  }
}

// CASO DE USO: aprobar, desactivar o rechazar una cuenta. Las reglas
// (no tocar la propia cuenta, rechazar solo pendientes) las aplica el
// servidor; aqui se evita el error obvio antes de pedirlo.
export class GestionarCuenta {
  constructor(private readonly repositorio: AdminRepository) {}

  ejecutar(cuenta: CuentaAcceso, accion: AccionCuenta, rol?: NombreRol): Promise<string> {
    if (cuenta.es_tu_cuenta && accion !== 'aprobar') {
      throw new Error('No puedes desactivar ni eliminar tu propia cuenta.');
    }
    if (accion === 'rechazar' && cuenta.estado !== 'pendiente') {
      throw new Error('Solo se pueden rechazar solicitudes pendientes.');
    }
    if (accion === 'desactivar' && cuenta.estado !== 'activa') {
      throw new Error('Esta cuenta ya no está activa.');
    }
    // Aprobar una solicitud nueva es el momento de delegar el permiso: hay
    // que decir con cual entra. Reactivar no, porque conserva el que tenia.
    if (accion === 'aprobar' && cuenta.estado === 'pendiente' && !rol) {
      throw new Error('Elige si entra como Administrador o como Conductor.');
    }
    return this.repositorio.gestionarCuenta(cuenta.id_usuario, accion, rol);
  }
}

export type CampoRestablecer = 'contrasena' | 'confirmar';

// CASO DE USO: restablecer la contraseña de otra cuenta. Es la unica forma
// de recuperar el acceso desde que se retiro "recuperar con correo y
// telefono": el administrador pone una temporal y se la entrega a la
// persona por un canal seguro. La propia se cambia desde «Mi perfil».
export class RestablecerContrasena {
  constructor(private readonly repositorio: AdminRepository) {}

  ejecutar(cuenta: CuentaAcceso, contrasena: string, confirmar: string): Promise<string> {
    if (cuenta.es_tu_cuenta) {
      throw new Error('Tu propia contraseña se cambia desde «Mi perfil».');
    }
    const errores: ErroresCampos<CampoRestablecer> = {};
    const problema = errorContrasena(contrasena);
    if (problema) errores.contrasena = problema;
    if (!confirmar) errores.confirmar = 'Repite la contraseña.';
    else if (!problema && confirmar !== contrasena) errores.confirmar = 'Las contraseñas no coinciden.';
    if (errores.contrasena || errores.confirmar) throw new ErrorValidacion(errores);

    return this.repositorio.restablecerContrasena(cuenta.id_usuario, contrasena);
  }
}

// CASO DE USO: conductores ordenados por nombre, para elegir a quien
// asignar un servicio o enviar una alerta.
export class ListarConductores {
  constructor(private readonly repositorio: AdminRepository) {}

  async ejecutar() {
    const conductores = await this.repositorio.conductores();
    return [...conductores].sort((a, b) =>
      `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`, 'es')
    );
  }
}
