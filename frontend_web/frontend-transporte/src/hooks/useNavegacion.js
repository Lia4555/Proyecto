import { useCallback, useEffect, useRef, useState } from 'react'

// ============================================================
// Navegación entre pantallas con historial real del navegador
// ------------------------------------------------------------
// Cada pantalla tiene su propia dirección (#/inicio, #/vehiculos,
// #/mis-servicios…). Eso da tres cosas que el usuario espera de
// cualquier página web:
//   · las flechas Atrás/Adelante del navegador funcionan
//   · se puede recargar sin perder dónde estabas
//   · se puede guardar o compartir el enlace de una pantalla
//
// La primera entrada del historial es SIEMPRE la página principal:
// aunque entres directo a `#/vehiculos`, por debajo se deja anclada
// `#/inicio`. Así la flecha «atrás» del navegador te devuelve a la
// portada en vez de sacarte del sitio.
// ============================================================

const CLAVE = 'dvPaso'

const leerRutaDelHash = () =>
  decodeURIComponent((window.location.hash || '').replace(/^#\/?/, '')).trim()

const arriba = () => window.scrollTo({ top: 0, behavior: 'auto' })

/**
 * @param {string[]} rutasValidas  direcciones que la aplicación acepta ahora mismo
 * @param {string}   rutaInicial   a dónde ir si la dirección no es válida
 * @param {string}   rutaBase      la página principal: el suelo del historial
 */
export function useNavegacion(rutasValidas, rutaInicial, rutaBase = rutaInicial) {
  // Se compara por contenido, no por identidad del array: así cambiar de rol
  // (que cambia la lista de pantallas) sí recalcula, pero un simple repintado no.
  const clave = rutasValidas.join('|')

  const normalizar = useCallback(
    (ruta) => (ruta && clave.split('|').includes(ruta) ? ruta : rutaInicial),
    [clave, rutaInicial]
  )

  const [ruta, setRuta] = useState(() => normalizar(leerRutaDelHash()))
  const [paso, setPaso] = useState(0)   // en qué punto del historial estamos
  const [tope, setTope] = useState(0)   // hasta dónde se ha llegado

  // Ancla el historial: debajo de todo queda la página principal.
  const anclado = useRef(false)
  useEffect(() => {
    if (anclado.current) return // en modo estricto los efectos corren dos veces
    anclado.current = true

    const inicial = normalizar(leerRutaDelHash())

    if (inicial === rutaBase) {
      window.history.replaceState({ [CLAVE]: 0 }, '', `#/${inicial}`)
      return
    }

    // Se entró directo a una pantalla interior: se pone la portada por debajo
    // para que «atrás» tenga a dónde volver dentro de la propia aplicación.
    window.history.replaceState({ [CLAVE]: 0 }, '', `#/${rutaBase}`)
    window.history.pushState({ [CLAVE]: 1 }, '', `#/${inicial}`)
    setPaso(1)
    setTope(1)
    setRuta(inicial)
    // Solo al montar: fija el punto de partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Flechas del navegador (o las nuestras, que llaman a las mismas funciones).
  useEffect(() => {
    const alMoverse = (evento) => {
      const guardada = evento.state?.[CLAVE]
      const posicion = typeof guardada === 'number' ? guardada : 0

      const cruda = leerRutaDelHash()
      const valida = normalizar(cruda)

      // Volver atrás puede caer en una pantalla que ya no existe para este
      // usuario (por ejemplo, una del panel después de cerrar sesión). Se
      // enseña la que corresponde y se corrige también la dirección, para que
      // la barra del navegador no diga una cosa y la pantalla otra.
      if (valida !== cruda) {
        window.history.replaceState({ [CLAVE]: posicion }, '', `#/${valida}`)
      }

      setPaso(posicion)
      setRuta(valida)
      arriba()
    }
    window.addEventListener('popstate', alMoverse)
    return () => window.removeEventListener('popstate', alMoverse)
  }, [normalizar])

  // Si la ruta deja de ser válida (se cerró sesión, cambió el rol…) se corrige
  // sola, sin añadir una entrada nueva al historial.
  useEffect(() => {
    if (!anclado.current) return
    const corregida = normalizar(ruta)
    if (corregida !== ruta) {
      setRuta(corregida)
      window.history.replaceState({ [CLAVE]: paso }, '', `#/${corregida}`)
    }
  }, [ruta, paso, normalizar])

  const ir = useCallback(
    (destino) => {
      const nueva = normalizar(destino)
      if (nueva === ruta) return
      const siguiente = paso + 1
      window.history.pushState({ [CLAVE]: siguiente }, '', `#/${nueva}`)
      setPaso(siguiente)
      setTope(siguiente) // avanzar por un camino nuevo borra el "adelante"
      setRuta(nueva)
      arriba()
    },
    [ruta, paso, normalizar]
  )

  const atras = useCallback(() => window.history.back(), [])
  const adelante = useCallback(() => window.history.forward(), [])

  return {
    ruta,
    ir,
    atras,
    adelante,
    puedeVolver: paso > 0,
    puedeAvanzar: paso < tope
  }
}
