import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { casosDeUso, escucharSesionPerdida, limpiarCaches } from '../../Data/di/Container';
import { Usuario, esAdministrador, esConductor } from '../../Domain/entities';
import { olvidarFotoPerfil } from './fotoPerfilStore';

// ============================================================
//  VIEWMODEL DE SESION (compartido por toda la app)
// ------------------------------------------------------------
//  Guarda el estado del usuario y expone las acciones. Las vistas
//  solo leen datos y llaman funciones: no saben que hay detras.
// ============================================================

interface EstadoSesion {
  usuario: Usuario | null;
  iniciando: boolean;
  entrando: boolean;
  error: string | null;
  esAdmin: boolean;
  esConductor: boolean;
  entrar: (correo: string, contrasena: string) => Promise<boolean>;
  salir: () => Promise<void>;
  limpiarError: () => void;
}

const ContextoSesion = createContext<EstadoSesion | null>(null);

export const ProveedorSesion = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [iniciando, setIniciando] = useState(true);
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al abrir la app: si hay sesion guardada y sigue siendo valida, se entra
  // directo sin pedir la contrasena otra vez.
  useEffect(() => {
    let vigente = true;

    casosDeUso.restaurarSesion
      .ejecutar()
      .then((sesion) => {
        if (vigente) setUsuario(sesion?.usuario ?? null);
      })
      .catch(() => {
        if (vigente) setUsuario(null);
      })
      .finally(() => {
        if (vigente) setIniciando(false);
      });

    // Evita avisar a un componente que ya se desmonto.
    return () => {
      vigente = false;
    };
  }, []);

  const entrar = useCallback(async (correo: string, contrasena: string) => {
    setEntrando(true);
    setError(null);
    try {
      const sesion = await casosDeUso.iniciarSesion.ejecutar(correo, contrasena);
      setUsuario(sesion.usuario);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesion.');
      return false;
    } finally {
      setEntrando(false);
    }
  }, []);

  const salir = useCallback(async () => {
    await casosDeUso.cerrarSesion.ejecutar();
    limpiarCaches();
    olvidarFotoPerfil();
    setUsuario(null);
  }, []);

  // Si el servidor deja de aceptar la sesion a mitad de uso (caducada, o
  // "Tu cuenta ya no está activa..."), se sale y el mensaje del servidor
  // queda como error para que el login explique que paso.
  useEffect(
    () =>
      escucharSesionPerdida((mensaje) => {
        setError(mensaje);
        salir();
      }),
    [salir]
  );

  const valor = useMemo<EstadoSesion>(
    () => ({
      usuario,
      iniciando,
      entrando,
      error,
      esAdmin: esAdministrador(usuario),
      esConductor: esConductor(usuario),
      entrar,
      salir,
      limpiarError: () => setError(null)
    }),
    [usuario, iniciando, entrando, error, entrar, salir]
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
};

export const useSesion = (): EstadoSesion => {
  const contexto = useContext(ContextoSesion);
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de <ProveedorSesion>.');
  }
  return contexto;
};
