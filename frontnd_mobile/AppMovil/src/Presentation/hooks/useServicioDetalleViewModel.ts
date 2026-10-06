import { useCallback, useEffect, useState } from 'react';
import { casosDeUso } from '../../Data/di/Container';
import { EstadoServicio, Servicio } from '../../Domain/entities';

// ============================================================
//  VIEWMODEL del detalle de un servicio.
//  Aqui vive la unica accion de escritura que tiene el conductor:
//  cambiar el estado de su viaje.
// ============================================================
export const useServicioDetalleViewModel = (
  idServicio: number,
  alGuardar?: () => void
) => {
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await casosDeUso.listarServicios.ejecutar();
      const encontrado = datos.find((s) => s.id_servicio === idServicio) ?? null;
      setServicio(encontrado);
      setObservaciones(encontrado?.observaciones ?? '');
      if (!encontrado) setError('Este servicio ya no esta disponible para tu cuenta.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el servicio.');
    } finally {
      setCargando(false);
    }
  }, [idServicio]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /**
   * Cambia el estado del viaje. Si el estado elegido cierra el servicio
   * (Finalizado / Completado), tambien se registra la hora real de llegada.
   */
  const cambiarEstado = useCallback(
    async (nuevoEstado: EstadoServicio) => {
      if (!servicio) return;

      const cierra = /final|complet/i.test(nuevoEstado.nombre_estado);
      setGuardando(true);
      setError(null);
      setAviso(null);
      try {
        const actualizado = await casosDeUso.actualizarEstadoServicio.ejecutar(
          servicio.id_servicio,
          nuevoEstado.id_estado,
          { marcarLlegada: cierra, observaciones }
        );
        setServicio(actualizado);
        setAviso(`Estado actualizado a "${nuevoEstado.nombre_estado}".`);
        alGuardar?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo actualizar el servicio.');
      } finally {
        setGuardando(false);
      }
    },
    [servicio, observaciones, alGuardar]
  );

  return {
    servicio,
    observaciones,
    escribirObservaciones: setObservaciones,
    cargando,
    guardando,
    error,
    aviso,
    cambiarEstado,
    reintentar: cargar
  };
};
