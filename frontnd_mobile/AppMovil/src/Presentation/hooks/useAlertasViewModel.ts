import { useCallback, useEffect, useMemo, useState } from 'react';
import { casosDeUso } from '../../Data/di/Container';
import { Alerta } from '../../Domain/entities';

// VIEWMODEL de alertas. Solo lectura: en este sistema quien las resuelve
// es el administrador desde el panel web.
export const useAlertasViewModel = () => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (esRefresco = false) => {
    esRefresco ? setRefrescando(true) : setCargando(true);
    setError(null);
    try {
      setAlertas(await casosDeUso.listarAlertas.ejecutar());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las alertas.');
    } finally {
      esRefresco ? setRefrescando(false) : setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const pendientes = useMemo(
    () => alertas.filter((a) => !a.estado_resuelta).length,
    [alertas]
  );

  return {
    alertas,
    pendientes,
    cargando,
    refrescando,
    error,
    refrescar: () => cargar(true),
    reintentar: () => cargar(false)
  };
};
