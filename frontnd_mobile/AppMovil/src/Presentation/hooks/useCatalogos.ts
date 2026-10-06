import { useEffect, useState } from 'react';
import { casosDeUso } from '../../Data/di/Container';
import { Catalogos, catalogosVacios } from '../../Domain/entities';

/**
 * VIEWMODEL de catalogos: los pide una vez y los deja listos para que
 * las pantallas traduzcan ids a nombres. Si fallan, la app sigue
 * funcionando mostrando el numero: no es un error que valga bloquear.
 */
export const useCatalogos = () => {
  const [catalogos, setCatalogos] = useState<Catalogos>(catalogosVacios());
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    casosDeUso.cargarCatalogos
      .ejecutar()
      .then((datos) => {
        if (vigente) setCatalogos(datos);
      })
      .catch(() => undefined)
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  return { catalogos, cargando };
};
