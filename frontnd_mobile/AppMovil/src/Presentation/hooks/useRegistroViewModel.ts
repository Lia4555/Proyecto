import { useCallback, useState } from 'react';
import { casosDeUso } from '../../Data/di/Container';
import {
  CampoSolicitud,
  ErrorValidacion,
  ErroresCampos,
  SolicitudCuenta,
  TipoDocumento,
  limpiarNombre,
  limpiarTelefono
} from '../../Domain/entities';

// ============================================================
//  VIEWMODEL del registro. Guarda lo que se escribe, pinta los
//  errores por campo y recuerda si la solicitud ya se envio.
// ============================================================

type Valores = SolicitudCuenta & { confirmar: string };

// Nombres sin números y teléfono sin letras: se filtran al escribir.
const LIMPIAR: Partial<Record<CampoSolicitud, (texto: string) => string>> = {
  nombre: limpiarNombre,
  apellido: limpiarNombre,
  telefono: limpiarTelefono
};

const VACIO: Valores = {
  nombre: '',
  apellido: '',
  tipo_documento: 'CC',
  numero_documento: '',
  telefono: '',
  correo: '',
  contrasena: '',
  confirmar: ''
};

export const useRegistroViewModel = () => {
  const [valores, setValores] = useState<Valores>(VACIO);
  const [errores, setErrores] = useState<ErroresCampos>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const cambiar = useCallback((campo: CampoSolicitud, texto: string) => {
    const valor = LIMPIAR[campo]?.(texto) ?? texto;
    setValores((v) => ({ ...v, [campo]: valor }));
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  }, []);

  const elegirDocumento = useCallback(
    (tipo: TipoDocumento) => setValores((v) => ({ ...v, tipo_documento: tipo })),
    []
  );

  const enviar = useCallback(async () => {
    setError(null);
    setErrores({});
    setEnviando(true);
    const { confirmar, ...solicitud } = valores;
    try {
      const mensaje = await casosDeUso.registrarCuenta.ejecutar(solicitud, confirmar);
      setMensajeExito(mensaje);
    } catch (e) {
      if (e instanceof ErrorValidacion) {
        setErrores(e.campos);
        // Si el error vino del servidor, su mensaje explica el motivo (p. ej. correo repetido).
        if (e.mensajeServidor) setError(e.mensajeServidor);
      } else {
        setError(e instanceof Error ? e.message : 'No se pudo enviar la solicitud.');
      }
    } finally {
      setEnviando(false);
    }
  }, [valores]);

  return { valores, errores, error, enviando, mensajeExito, cambiar, elegirDocumento, enviar };
};
