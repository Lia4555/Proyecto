import { useCallback, useEffect, useMemo, useState } from 'react';
import { casosDeUso } from '../../Data/di/Container';
import {
  AccionCuenta,
  Alerta,
  Catalogos,
  ConductorResumen,
  CuentaAcceso,
  NombreRol,
  ResumenAdmin,
  Servicio,
  Vehiculo,
  estaCerrado,
  nombreEstado,
  vaConRetraso
} from '../../Domain/entities';

// ============================================================
//  VIEWMODELS DEL ADMINISTRADOR (listas y acciones).
//  Los formularios estan en useFormulariosAdmin.ts.
// ============================================================

const mensaje = (e: unknown, porDefecto: string) => (e instanceof Error ? e.message : porDefecto);

/** Carga una lista con estados de carga/refresco/error: el patron de todas las pantallas. */
function useLista<T>(cargarDatos: () => Promise<T>, inicial: T, textoError: string) {
  const [datos, setDatos] = useState<T>(inicial);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(
    async (esRefresco = false) => {
      esRefresco ? setRefrescando(true) : setCargando(true);
      setError(null);
      try {
        setDatos(await cargarDatos());
      } catch (e) {
        setError(mensaje(e, textoError));
      } finally {
        esRefresco ? setRefrescando(false) : setCargando(false);
      }
    },
    // cargarDatos es estable (sale de casosDeUso).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  return {
    datos,
    setDatos,
    cargando,
    refrescando,
    error,
    setError,
    refrescar: () => cargar(true),
    reintentar: () => cargar(false)
  };
}

// ---------------------------------------------------------------- Resumen
export const useResumenAdminViewModel = () => {
  const lista = useLista<ResumenAdmin | null>(
    () => casosDeUso.obtenerResumenAdmin.ejecutar(),
    null,
    'No se pudo cargar el resumen.'
  );
  return { ...lista, resumen: lista.datos };
};

// ---------------------------------------------------------------- Flota
/**
 * Conductores y vehiculos: los necesitan varias pantallas para mostrar
 * nombres y placas y para los selectores de los formularios.
 */
export const useFlota = () => {
  const lista = useLista<{ conductores: ConductorResumen[]; vehiculos: Vehiculo[] }>(
    async () => {
      const [conductores, vehiculos] = await Promise.all([
        casosDeUso.listarConductores.ejecutar(),
        casosDeUso.obtenerVehiculos.ejecutar().then((v) => v.map((x) => x.vehiculo))
      ]);
      return { conductores, vehiculos };
    },
    { conductores: [], vehiculos: [] },
    'No se pudieron cargar conductores y vehículos.'
  );

  const { conductores, vehiculos } = lista.datos;
  const conductorPorId = useMemo(() => new Map(conductores.map((c) => [c.id_conductor, c])), [conductores]);
  const vehiculoPorId = useMemo(() => new Map(vehiculos.map((v) => [v.id_vehiculo, v])), [vehiculos]);

  return { ...lista, conductores, vehiculos, conductorPorId, vehiculoPorId };
};

export type Flota = ReturnType<typeof useFlota>;

// ---------------------------------------------------------------- Cuentas
export type FiltroCuentas = 'pendientes' | 'activas' | 'desactivadas' | 'todas';

export const useCuentasViewModel = () => {
  const lista = useLista<CuentaAcceso[]>(
    () => casosDeUso.listarCuentas.ejecutar(),
    [],
    'No se pudieron cargar las cuentas.'
  );
  const [filtro, setFiltro] = useState<FiltroCuentas>('pendientes');
  const [procesando, setProcesando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cuentas = lista.datos;
  const conteos = useMemo(
    () => ({
      pendientes: cuentas.filter((c) => c.estado === 'pendiente').length,
      activas: cuentas.filter((c) => c.estado === 'activa').length,
      desactivadas: cuentas.filter((c) => c.estado === 'desactivada').length,
      todas: cuentas.length
    }),
    [cuentas]
  );
  const pendientes = conteos.pendientes;

  const visibles = useMemo(() => {
    if (filtro === 'pendientes') return cuentas.filter((c) => c.estado === 'pendiente');
    if (filtro === 'activas') return cuentas.filter((c) => c.estado === 'activa');
    if (filtro === 'desactivadas') return cuentas.filter((c) => c.estado === 'desactivada');
    return cuentas;
  }, [cuentas, filtro]);

  const ejecutar = useCallback(
    async (cuenta: CuentaAcceso, accion: AccionCuenta, rol?: NombreRol) => {
      setProcesando(cuenta.id_usuario);
      setAviso(null);
      lista.setError(null);
      try {
        setAviso(await casosDeUso.gestionarCuenta.ejecutar(cuenta, accion, rol));
        await lista.refrescar();
      } catch (e) {
        lista.setError(mensaje(e, 'No se pudo completar la acción.'));
      } finally {
        setProcesando(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { ...lista, cuentas, visibles, pendientes, conteos, filtro, setFiltro, procesando, aviso, ejecutar };
};

export type CuentasViewModel = ReturnType<typeof useCuentasViewModel>;

// ---------------------------------------------------------------- Servicios
export type FiltroServiciosAdmin = 'hoy' | 'curso' | 'retrasados' | 'todos';

export const useAdminServiciosViewModel = (catalogos: Catalogos, filtroInicial?: string | null) => {
  const lista = useLista<Servicio[]>(
    () => casosDeUso.listarServicios.ejecutar(),
    [],
    'No se pudieron cargar los servicios.'
  );
  const [filtro, setFiltro] = useState<FiltroServiciosAdmin>(
    (['hoy', 'curso', 'retrasados', 'todos'] as const).find((f) => f === filtroInicial) ?? 'todos'
  );

  const servicios = lista.datos;
  const clasificar = useMemo(() => {
    const hoy = new Date();
    const esHoy = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate();
    };
    const estado = (s: Servicio) => nombreEstado(catalogos, s.id_estado);
    return {
      hoy: servicios.filter((s) => esHoy(s.fecha_salida)),
      curso: servicios.filter((s) => !estaCerrado(estado(s)) && /curso|ruta|transito|tránsito/i.test(estado(s))),
      retrasados: servicios.filter((s) => !estaCerrado(estado(s)) && vaConRetraso(s)),
      todos: servicios
    };
  }, [servicios, catalogos]);

  return {
    ...lista,
    servicios: clasificar[filtro],
    conteos: {
      hoy: clasificar.hoy.length,
      curso: clasificar.curso.length,
      retrasados: clasificar.retrasados.length,
      todos: servicios.length
    },
    filtro,
    setFiltro
  };
};

// ---------------------------------------------------------------- Alertas
export type FiltroAlertas = 'pendientes' | 'resueltas' | 'todas';

export const useAdminAlertasViewModel = () => {
  const lista = useLista<Alerta[]>(
    () => casosDeUso.listarAlertas.ejecutar(),
    [],
    'No se pudieron cargar las alertas.'
  );
  const [filtro, setFiltro] = useState<FiltroAlertas>('pendientes');
  const [procesando, setProcesando] = useState<number | null>(null);

  const alertas = lista.datos;
  const pendientes = alertas.filter((a) => !a.estado_resuelta).length;
  const visibles = useMemo(() => {
    if (filtro === 'pendientes') return alertas.filter((a) => !a.estado_resuelta);
    if (filtro === 'resueltas') return alertas.filter((a) => a.estado_resuelta);
    return alertas;
  }, [alertas, filtro]);

  const resolver = useCallback(
    async (alerta: Alerta) => {
      setProcesando(alerta.id_alerta);
      lista.setError(null);
      try {
        const actualizada = await casosDeUso.resolverAlerta.ejecutar(alerta);
        lista.setDatos((previas) => previas.map((a) => (a.id_alerta === actualizada.id_alerta ? actualizada : a)));
      } catch (e) {
        lista.setError(mensaje(e, 'No se pudo marcar la alerta.'));
      } finally {
        setProcesando(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { ...lista, alertas, visibles, pendientes, filtro, setFiltro, procesando, resolver };
};
