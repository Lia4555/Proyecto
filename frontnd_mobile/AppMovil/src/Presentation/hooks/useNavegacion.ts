import { useCallback, useState } from 'react';

// ============================================================
//  VIEWMODEL DE NAVEGACION
// ------------------------------------------------------------
//  Navegacion propia con un estado simple, sin librerias extra.
//  Pestañas abajo y, encima de ellas, una pantalla de detalle o un
//  formulario. El conductor y el administrador tienen pestañas distintas.
// ============================================================

export type Pestana =
  // Conductor
  | 'servicios'
  | 'vehiculo'
  | 'alertas'
  | 'perfil'
  // Administrador (tambien usa servicios, alertas y perfil)
  | 'resumen'
  | 'cuentas'
  | 'gestion';

/** Formularios que se abren a pantalla completa (solo administrador). */
export type Formulario = 'nuevo-servicio' | 'nueva-alerta';

/** Filtro con el que se abre una lista al llegar desde el resumen. */
export type FiltroInicial = string | null;

export const useNavegacion = (inicial: Pestana = 'servicios') => {
  const [pestana, setPestana] = useState<Pestana>(inicial);
  const [servicioAbierto, setServicioAbierto] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [filtro, setFiltro] = useState<FiltroInicial>(null);

  const irA = useCallback((destino: Pestana, filtroInicial: FiltroInicial = null) => {
    // Cambiar de pestaña cierra lo que estuviera abierto encima.
    setServicioAbierto(null);
    setFormulario(null);
    setFiltro(filtroInicial);
    setPestana(destino);
  }, []);

  const abrirServicio = useCallback((idServicio: number) => setServicioAbierto(idServicio), []);
  const abrirFormulario = useCallback((f: Formulario) => setFormulario(f), []);

  /** Cierra la capa de encima (formulario primero, luego el detalle). */
  const volver = useCallback(() => {
    if (formulario) setFormulario(null);
    else setServicioAbierto(null);
  }, [formulario]);

  return {
    pestana,
    servicioAbierto,
    formulario,
    filtro,
    inicial,
    irA,
    abrirServicio,
    abrirFormulario,
    volver
  };
};
