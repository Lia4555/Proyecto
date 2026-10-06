import { Catalogos } from '../entities';

export interface CatalogoRepository {
  cargar(): Promise<Catalogos>;
}
