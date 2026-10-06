import { useCallback, useEffect, useMemo, useState } from 'react';
import { casosDeUso } from '../../Data/di/Container';
import { Fila, Tabla, etiquetaDeFila } from '../../Domain/entities';
import { ErroresCampo, OpcionRef, valoresIniciales } from '../../Domain/useCases';
import { ApiError } from '../../Data/api/HttpClient';
import { normalizarTexto as normalizar } from './normalizarTexto';

// ============================================================
//  VIEWMODEL DE UNA TABLA CUALQUIERA
// ------------------------------------------------------------
//  Sirve para las 15 tablas: recibe la configuracion y se encarga
//  de cargar, buscar, crear, editar y borrar. La pantalla solo
//  pinta lo que este hook le da.
// ============================================================

const mensajeDe = (e: unknown, porDefecto: string): string =>
  e instanceof ApiError || e instanceof Error ? e.message : porDefecto;

/** Errores por campo que manda el backend ({ detalles: [{ campo, mensaje }] }). */
const erroresDelServidor = (e: unknown): ErroresCampo => {
  if (!(e instanceof ApiError)) return {};
  const mapa: ErroresCampo = {};
  for (const d of e.detalles) if (d?.campo) mapa[d.campo] = d.mensaje;
  return mapa;
};


export const useTablaViewModel = (tabla: Tabla) => {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [referencias, setReferencias] = useState<Record<string, OpcionRef[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [erroresCampo, setErroresCampo] = useState<ErroresCampo>({});

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      // Las filas y las listas desplegables se piden a la vez: sin las
      // segundas, la lista mostraria codigos en vez de nombres.
      const [datos, listas] = await Promise.all([
        casosDeUso.listarFilas.ejecutar(tabla),
        casosDeUso.cargarReferencias.ejecutar(tabla)
      ]);
      setFilas(Array.isArray(datos) ? datos : []);
      setReferencias(listas);
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo cargar la información.'));
      setFilas([]);
    } finally {
      setCargando(false);
    }
  }, [tabla]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Se busca por el texto visible (el nombre de la referencia incluido).
  const visibles = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    if (!termino) return filas;
    return filas.filter((f) => {
      const texto = Object.entries(f)
        .map(([clave, valor]) => {
          const campo = tabla.fields.find((c) => c.name === clave);
          if (campo?.ref) {
            return referencias[campo.ref]?.find((o) => o.valor === String(valor))?.etiqueta ?? '';
          }
          return String(valor ?? '');
        })
        .join(' ');
      return normalizar(texto).includes(termino);
    });
  }, [filas, busqueda, referencias, tabla]);

  const guardar = useCallback(
    async (valores: Fila, filaOriginal?: Fila | null): Promise<boolean> => {
      setErroresCampo({});
      setAviso(null);

      // Primero la validacion local: evita un viaje y señala el campo.
      const problemas = casosDeUso.validarRegistro.ejecutar(tabla, valores);
      if (Object.keys(problemas).length > 0) {
        setErroresCampo(problemas);
        setError('Revisa los campos marcados.');
        return false;
      }

      setGuardando(true);
      setError(null);
      try {
        setAviso(await casosDeUso.guardarFila.ejecutar(tabla, valores, filaOriginal));
        await cargar();
        return true;
      } catch (e) {
        setErroresCampo(erroresDelServidor(e));
        setError(mensajeDe(e, 'No se pudo guardar.'));
        return false;
      } finally {
        setGuardando(false);
      }
    },
    [tabla, cargar]
  );

  const eliminar = useCallback(
    async (fila: Fila) => {
      setGuardando(true);
      setError(null);
      try {
        setAviso(await casosDeUso.eliminarFila.ejecutar(tabla, fila));
        await cargar();
      } catch (e) {
        setError(mensajeDe(e, 'No se pudo eliminar.'));
      } finally {
        setGuardando(false);
      }
    },
    [tabla, cargar]
  );

  return {
    tabla,
    filas: visibles,
    total: filas.length,
    referencias,
    cargando,
    error,
    aviso,
    busqueda,
    guardando,
    erroresCampo,
    setBusqueda,
    setError,
    setAviso,
    setErroresCampo,
    refrescar: cargar,
    guardar,
    eliminar,
    /** Valores con los que abre el formulario (fila al editar, vacios al crear). */
    iniciales: (fila?: Fila | null) => valoresIniciales(tabla, fila),
    etiqueta: (fila: Fila) => etiquetaDeFila(tabla, fila)
  };
};

export type TablaViewModel = ReturnType<typeof useTablaViewModel>;
