import { Catalogos } from '../entities';
import { CatalogoRepository } from '../repositories';

// CASO DE USO: trae los catalogos (estados, destinos, tipos de vehiculo)
// que las pantallas necesitan para mostrar nombres en vez de numeros.
export class CargarCatalogos {
  constructor(private readonly repositorio: CatalogoRepository) {}

  ejecutar(): Promise<Catalogos> {
    return this.repositorio.cargar();
  }
}
