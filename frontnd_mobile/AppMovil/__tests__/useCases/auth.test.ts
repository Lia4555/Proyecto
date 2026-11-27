// PRUEBAS UNITARIAS: casos de uso de sesion y registro
// Tecnica: dobles de prueba (repositorio falso con jest.fn).
import { ErrorValidacion } from '../../src/Domain/entities';
import { CerrarSesion, IniciarSesion, RegistrarCuenta, RestaurarSesion } from '../../src/Domain/useCases';
import { authRepoFalso, solicitud, usuario } from '../helpers/fabricas';

describe('IniciarSesion', () => {
  test('con datos validos llama al repositorio con el correo sin espacios', async () => {
    const repo = authRepoFalso();
    const sesion = { usuario: usuario(), token: 'jwt' };
    repo.iniciarSesion.mockResolvedValue(sesion);

    await expect(new IniciarSesion(repo).ejecutar('  conductor1@dviaje.com ', 'Clave123')).resolves.toBe(sesion);
    expect(repo.iniciarSesion).toHaveBeenCalledWith('conductor1@dviaje.com', 'Clave123');
  });

  test('NO cambia el correo a minusculas (el servidor lo compara tal cual)', async () => {
    const repo = authRepoFalso();
    await new IniciarSesion(repo).ejecutar('Ana@DViaje.com', 'x');
    expect(repo.iniciarSesion).toHaveBeenCalledWith('Ana@DViaje.com', 'x');
  });

  test.each([
    ['', 'Clave123'],
    ['   ', 'Clave123'],
    ['ana@dviaje.com', '']
  ])('con campos vacios (%p, %p) falla sin llamar al servidor', async (correo, clave) => {
    const repo = authRepoFalso();
    await expect(new IniciarSesion(repo).ejecutar(correo, clave)).rejects.toThrow('Escribe tu correo');
    expect(repo.iniciarSesion).not.toHaveBeenCalled();
  });

  test.each(['ana', 'ana@', 'ana@dviaje', 'ana dviaje@x.com'])('rechaza el correo mal escrito "%s"', async (correo) => {
    const repo = authRepoFalso();
    await expect(new IniciarSesion(repo).ejecutar(correo, 'x')).rejects.toThrow('formato');
    expect(repo.iniciarSesion).not.toHaveBeenCalled();
  });

  test('propaga el error del servidor (credenciales incorrectas)', async () => {
    const repo = authRepoFalso();
    repo.iniciarSesion.mockRejectedValue(new Error('El correo o la contrasena son incorrectos.'));
    await expect(new IniciarSesion(repo).ejecutar('a@b.co', 'mala')).rejects.toThrow('incorrectos');
  });
});

describe('RegistrarCuenta', () => {
  test('una solicitud valida no tiene errores', () => {
    expect(new RegistrarCuenta(authRepoFalso()).validar(solicitud(), 'ClaveSegura1')).toEqual({});
  });

  test('marca cada campo invalido con su mensaje', () => {
    const errores = new RegistrarCuenta(authRepoFalso()).validar(
      solicitud({
        nombre: '',
        apellido: 'G0mez',
        numero_documento: '12.3',
        telefono: '12',
        correo: 'no-correo',
        contrasena: 'corta'
      }),
      'otra'
    );
    expect(Object.keys(errores).sort()).toEqual(
      ['apellido', 'confirmar', 'contrasena', 'correo', 'nombre', 'numero_documento', 'telefono'].sort()
    );
    expect(errores.nombre).toBe('Escribe tu nombre.');
  });

  test('una contraseña de mas de 72 caracteres se rechaza', () => {
    const larga = 'a'.repeat(73);
    const errores = new RegistrarCuenta(authRepoFalso()).validar(solicitud({ contrasena: larga }), larga);
    expect(errores.contrasena).toMatch(/Máximo 72/);
  });

  test('si hay errores lanza ErrorValidacion y no llama al servidor', async () => {
    const repo = authRepoFalso();
    const intento = new RegistrarCuenta(repo).ejecutar(solicitud({ correo: '' }), 'ClaveSegura1');
    await expect(intento).rejects.toBeInstanceOf(ErrorValidacion);
    expect(repo.registrarCuenta).not.toHaveBeenCalled();
  });

  test('envia los datos limpios (espacios de mas fuera)', async () => {
    const repo = authRepoFalso();
    repo.registrarCuenta.mockResolvedValue('Solicitud enviada.');

    const mensaje = await new RegistrarCuenta(repo).ejecutar(
      solicitud({ nombre: '  Laura   María ', correo: ' laura@dviaje.com ', telefono: ' 3101234567 ' }),
      'ClaveSegura1'
    );

    expect(mensaje).toBe('Solicitud enviada.');
    expect(repo.registrarCuenta).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Laura María', correo: 'laura@dviaje.com', telefono: '3101234567' })
    );
  });
});

describe('RestaurarSesion', () => {
  test('sin sesion guardada devuelve null sin preguntar al servidor', async () => {
    const repo = authRepoFalso();
    repo.sesionGuardada.mockResolvedValue(null);
    await expect(new RestaurarSesion(repo).ejecutar()).resolves.toBeNull();
    expect(repo.usuarioActual).not.toHaveBeenCalled();
  });

  test('con un token vigente devuelve la sesion con los datos frescos del servidor', async () => {
    const repo = authRepoFalso();
    repo.sesionGuardada.mockResolvedValue({ usuario: usuario({ nombre: 'Viejo' }), token: 'jwt' });
    repo.usuarioActual.mockResolvedValue(usuario({ nombre: 'Nuevo' }));

    const sesion = await new RestaurarSesion(repo).ejecutar();
    expect(sesion).toEqual({ usuario: usuario({ nombre: 'Nuevo' }), token: 'jwt' });
  });

  test('con un token vencido cierra la sesion y devuelve null', async () => {
    const repo = authRepoFalso();
    repo.sesionGuardada.mockResolvedValue({ usuario: usuario(), token: 'vencido' });
    repo.usuarioActual.mockRejectedValue(new Error('401'));

    await expect(new RestaurarSesion(repo).ejecutar()).resolves.toBeNull();
    expect(repo.cerrarSesion).toHaveBeenCalledTimes(1);
  });
});

describe('CerrarSesion', () => {
  test('borra la sesion del telefono', async () => {
    const repo = authRepoFalso();
    await new CerrarSesion(repo).ejecutar();
    expect(repo.cerrarSesion).toHaveBeenCalledTimes(1);
  });
});
