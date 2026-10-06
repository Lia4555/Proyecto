import { PerfilRepository } from '../../repositories';

// Mismas reglas que el backend (controllers/perfilController.js): el
// servidor las vuelve a comprobar, esto solo evita un viaje inutil.
const RE_FOTO = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const MAX_CARACTERES = 200000;

// CASO DE USO: leer la foto de perfil propia.
export class ObtenerFotoPerfil {
  constructor(private readonly repositorio: PerfilRepository) {}

  ejecutar(): Promise<string | null> {
    return this.repositorio.obtenerFoto();
  }
}

// CASO DE USO: guardar (o reemplazar) la foto de perfil propia.
export class GuardarFotoPerfil {
  constructor(private readonly repositorio: PerfilRepository) {}

  async ejecutar(foto: string): Promise<string | null> {
    if (!RE_FOTO.test(foto)) throw new Error('La foto debe ser una imagen JPG, PNG o WebP.');
    if (foto.length > MAX_CARACTERES) throw new Error('La imagen es demasiado grande.');
    return this.repositorio.guardarFoto(foto);
  }
}

// CASO DE USO: quitar la foto de perfil (vuelven las iniciales).
export class QuitarFotoPerfil {
  constructor(private readonly repositorio: PerfilRepository) {}

  ejecutar(): Promise<void> {
    return this.repositorio.quitarFoto();
  }
}
