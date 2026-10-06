import { useCallback, useEffect, useState } from 'react';
import { casosDeUso } from '../../Data/di/Container';
import { VehiculoConDetalle } from '../../Domain/useCases';

// ============================================================
//  VIEWMODEL del vehiculo: ficha, papeles, mantenimientos y el
//  reporte de "operativo / fuera de servicio".
// ============================================================
export const useVehiculoViewModel = () => {
  const [vehiculos, setVehiculos] = useState<VehiculoConDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [reportando, setReportando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (esRefresco = false) => {
    esRefresco ? setRefrescando(true) : setCargando(true);
    setError(null);
    try {
      setVehiculos(await casosDeUso.obtenerVehiculos.ejecutar());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el vehiculo.');
    } finally {
      esRefresco ? setRefrescando(false) : setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const reportarEstado = useCallback(async (idVehiculo: number, operativo: boolean) => {
    setReportando(idVehiculo);
    setError(null);
    try {
      const actualizado = await casosDeUso.reportarEstadoVehiculo.ejecutar(
        idVehiculo,
        operativo
      );
      // Se reemplaza solo el vehiculo tocado: no hace falta recargar todo.
      setVehiculos((previos) =>
        previos.map((item) =>
          item.vehiculo.id_vehiculo === idVehiculo ? { ...item, vehiculo: actualizado } : item
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el reporte.');
    } finally {
      setReportando(null);
    }
  }, []);

  return {
    vehiculos,
    cargando,
    refrescando,
    reportando,
    error,
    reportarEstado,
    refrescar: () => cargar(true),
    reintentar: () => cargar(false)
  };
};
