import { Catalogos, catalogosVacios } from '../../Domain/entities';
import { CatalogoRepository } from '../../Domain/repositories';
import { TransporteApiSource } from '../sources/TransporteApiSource';

/**
 * Los catalogos casi nunca cambian, asi que se piden una sola vez por
 * sesion y se guardan en memoria: evita tres peticiones cada vez que se
 * entra a una pantalla.
 */
export class CatalogoRepositoryImpl implements CatalogoRepository {
  private cache: Catalogos | null = null;

  constructor(private readonly api: TransporteApiSource) {}

  async cargar(): Promise<Catalogos> {
    if (this.cache) return this.cache;

    const [estados, destinos, tiposVehiculo, tiposAlerta] = await Promise.all([
      this.api.estadosServicio(),
      this.api.destinos(),
      this.api.tiposVehiculo(),
      // Si fallara, no se bloquea el resto: solo lo usa el formulario de alertas.
      this.api.tiposAlerta().catch(() => [])
    ]);

    this.cache = { estados, destinos, tiposVehiculo, tiposAlerta };
    return this.cache;
  }

  /** Al cerrar sesion se vacia: el siguiente usuario puede ver otra cosa. */
  limpiar(): void {
    this.cache = null;
  }

  get vacio(): Catalogos {
    return catalogosVacios();
  }
}
