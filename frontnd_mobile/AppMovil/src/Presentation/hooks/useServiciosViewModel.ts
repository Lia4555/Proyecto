import { useCallback, useEffect, useMemo, useState } from 'react';
import { casosDeUso } from '../../Data/di/Container';
import { Servicio, vaConRetraso } from '../../Domain/entities';

export type FiltroServicios = 'todos' | 'pendientes' | 'retrasados';

// ============================================================
//  VIEWMODEL de la lista de servicios.
//  La vista solo pinta lo que hay aqui: nada de fetch en la pantalla.
// ============================================================
export const useServiciosViewModel = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroServicios>('todos');

  const cargar = useCallback(async (esRefresco = false) => {
    esRefresco ? setRefrescando(true) : setCargando(true);
    setError(null);
    try {
      setServicios(await casosDeUso.listarServicios.ejecutar());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los servicios.');
    } finally {
      esRefresco ? setRefrescando(false) : setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    if (filtro === 'pendientes') return servicios.filter((s) => !s.fecha_llegada_real);
    if (filtro === 'retrasados') return servicios.filter(vaConRetraso);
    return servicios;
  }, [servicios, filtro]);

  const resumen = useMemo(
    () => ({
      total: servicios.length,
      pendientes: servicios.filter((s) => !s.fecha_llegada_real).length,
      retrasados: servicios.filter(vaConRetraso).length
    }),
    [servicios]
  );

  return {
    servicios: visibles,
    resumen,
    filtro,
    cambiarFiltro: setFiltro,
    cargando,
    refrescando,
    error,
    refrescar: () => cargar(true),
    reintentar: () => cargar(false)
  };
};
