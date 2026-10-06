// ============================================================
// Preparar una imagen para usarla como foto de perfil
// ------------------------------------------------------------
// Todo sale igual: un cuadrado de 256 px recortado al centro, en
// JPEG. Así la foto pesa unos 20-40 KB, cabe de sobra en el límite
// del backend (150 KB) y ya no importa si el original era una foto
// de 12 MP del móvil.
// ============================================================

export const LADO = 256
const MAX_ORIGINAL = 15 * 1024 * 1024
const MAX_DATA_URL = 190000
const CALIDADES = [0.88, 0.75, 0.6]

function aCuadrado(fuente, ancho, alto, { espejo = false } = {}) {
  const lienzo = document.createElement('canvas')
  lienzo.width = LADO
  lienzo.height = LADO
  const ctx = lienzo.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  // Fondo blanco: una imagen con transparencia no debe quedar negra en JPEG.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, LADO, LADO)

  if (espejo) {
    ctx.translate(LADO, 0)
    ctx.scale(-1, 1)
  }

  const lado = Math.min(ancho, alto)
  ctx.drawImage(fuente, (ancho - lado) / 2, (alto - lado) / 2, lado, lado, 0, 0, LADO, LADO)

  for (const calidad of CALIDADES) {
    const url = lienzo.toDataURL('image/jpeg', calidad)
    if (url.length <= MAX_DATA_URL) return url
  }
  throw new Error('No se pudo reducir la imagen lo suficiente. Prueba con otra.')
}

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    img.src = src
  })
}

export async function desdeArchivo(archivo) {
  if (!archivo) throw new Error('No elegiste ninguna imagen.')
  if (!archivo.type.startsWith('image/')) throw new Error('El archivo elegido no es una imagen.')
  if (archivo.size > MAX_ORIGINAL) throw new Error('La imagen pesa más de 15 MB. Elige una más liviana.')

  // createImageBitmap respeta la orientación EXIF de las fotos del móvil.
  if (typeof createImageBitmap === 'function') {
    try {
      const mapa = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
      try {
        return aCuadrado(mapa, mapa.width, mapa.height)
      } finally {
        mapa.close()
      }
    } catch {
      // Algunos navegadores no aceptan la opción: se intenta a la antigua.
    }
  }

  const url = URL.createObjectURL(archivo)
  try {
    const img = await cargarImagen(url)
    return aCuadrado(img, img.naturalWidth, img.naturalHeight)
  } catch {
    throw new Error('Tu navegador no puede abrir ese formato (por ejemplo HEIC). Usa JPG o PNG.')
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Fotograma actual de la cámara. Se guarda en espejo, igual que se ve
// en la vista previa (como un selfie).
export function desdeVideo(video) {
  return aCuadrado(video, video.videoWidth, video.videoHeight, { espejo: true })
}

export const svgComoUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

export async function desdeSvg(svg) {
  const img = await cargarImagen(svgComoUrl(svg))
  return aCuadrado(img, img.naturalWidth || LADO, img.naturalHeight || LADO)
}
