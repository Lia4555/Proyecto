import { useCallback, useState } from 'react';
import { casosDeUso } from '../../Data/di/Container';
import { ErrorValidacion, ErroresCampos } from '../../Domain/entities';
import { CampoCambioContrasena } from '../../Domain/useCases';

// ============================================================
//  VIEWMODEL: cambiar mi contraseña (desde «Mi perfil»)
// ------------------------------------------------------------
//  Errores por campo (los locales y los del servidor, p. ej. "La
//  contraseña actual no es correcta.") y un error general para el
//  resto, como el limite de intentos (429).
// ============================================================

const VACIOS: Record<CampoCambioContrasena, string> = { actual: '', nueva: '', repetir: '' };

export const useCambiarContrasenaViewModel = () => {
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState(VACIOS);
  const [errores, setErrores] = useState<ErroresCampos<CampoCambioContrasena>>({});
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const abrir = useCallback(() => {
    // Las contraseñas no se quedan en memoria entre una vez y otra.
    setValores(VACIOS);
    setErrores({});
    setError(null);
    setAviso(null);
    setAbierto(true);
  }, []);

  const cerrar = useCallback(() => {
    setValores(VACIOS);
    setAbierto(false);
  }, []);

  const cambiar = useCallback((campo: CampoCambioContrasena, valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  }, []);

  const guardar = useCallback(async () => {
    setGuardando(true);
    setErrores({});
    setError(null);
    try {
      const mensaje = await casosDeUso.cambiarContrasena.ejecutar(valores.actual, valores.nueva, valores.repetir);
      setAviso(mensaje);
      setValores(VACIOS);
      setAbierto(false);
    } catch (e) {
      if (e instanceof ErrorValidacion) {
        setErrores(e.campos as ErroresCampos<CampoCambioContrasena>);
        // Si el servidor dio un motivo (p. ej. la actual no es correcta)
        // ya sale debajo de su campo: no se repite arriba.
      } else {
        setError(e instanceof Error ? e.message : 'No se pudo cambiar la contraseña.');
      }
    } finally {
      setGuardando(false);
    }
  }, [valores]);

  return { abierto, valores, errores, error, aviso, guardando, abrir, cerrar, cambiar, guardar };
};

export type CambiarContrasenaViewModel = ReturnType<typeof useCambiarContrasenaViewModel>;
