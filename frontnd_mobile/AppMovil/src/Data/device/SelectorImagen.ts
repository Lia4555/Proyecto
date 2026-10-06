import { Asset } from 'expo-asset';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// ============================================================
// Imagenes del telefono para la foto de perfil
// ------------------------------------------------------------
// Galeria y camara abren el recorte cuadrado nativo del sistema.
// Todo termina igual que en el panel web (lib/imagen.js): un JPEG
// de 256 x 256 px como data URL, que es lo que acepta el backend.
// Devuelve null si la persona cancela.
// ============================================================

const LADO = 256;
const CALIDAD = 0.85;

export class PermisoDenegadoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'PermisoDenegadoError';
  }
}

const OPCIONES: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [1, 1],
  quality: 1
};

async function aJpegCuadrado(uri: string, ancho: number, alto: number): Promise<string> {
  const contexto = ImageManipulator.manipulate(uri);
  try {
    // El recorte nativo ya suele dejarla cuadrada; si no, se recorta al centro.
    const lado = Math.min(ancho, alto);
    if (ancho > 0 && alto > 0 && ancho !== alto) {
      contexto.crop({
        originX: Math.floor((ancho - lado) / 2),
        originY: Math.floor((alto - lado) / 2),
        width: lado,
        height: lado
      });
    }
    contexto.resize({ width: LADO, height: LADO });

    const final = await contexto.renderAsync();
    const guardada = await final.saveAsync({ format: SaveFormat.JPEG, compress: CALIDAD, base64: true });
    if (!guardada.base64) throw new Error('No se pudo preparar la imagen.');
    return `data:image/jpeg;base64,${guardada.base64}`;
  } finally {
    contexto.release();
  }
}

export class SelectorImagen {
  async desdeGaleria(): Promise<string | null> {
    // Abre el selector de fotos del sistema: no necesita pedir permiso.
    const resultado = await ImagePicker.launchImageLibraryAsync(OPCIONES);
    const imagen = resultado.assets?.[0];
    if (resultado.canceled || !imagen) return null;
    return aJpegCuadrado(imagen.uri, imagen.width, imagen.height);
  }

  async desdeCamara(): Promise<string | null> {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      throw new PermisoDenegadoError('Sin permiso para usar la cámara. Actívalo en los ajustes del teléfono.');
    }
    const resultado = await ImagePicker.launchCameraAsync({
      ...OPCIONES,
      cameraType: ImagePicker.CameraType.front
    });
    const imagen = resultado.assets?.[0];
    if (resultado.canceled || !imagen) return null;
    return aJpegCuadrado(imagen.uri, imagen.width, imagen.height);
  }

  /** Imagen incluida en la app (require('...png')). */
  async desdeRecurso(modulo: number): Promise<string> {
    const [recurso] = await Asset.loadAsync(modulo);
    const uri = recurso.localUri ?? recurso.uri;
    return aJpegCuadrado(uri, recurso.width ?? 0, recurso.height ?? 0);
  }
}
