import { useCallback, useEffect, useMemo, useState } from 'react'
import { cargarReferencia, invalidarReferencia, referenciasDe } from '../lib/referencias.js'

// Carga las tablas relacionadas de una entidad para poder mostrar
// nombres en vez de ids (y llenar las listas desplegables).
export function useReferencias(entity) {
  const claves = useMemo(() => referenciasDe(entity), [entity])
  const [referencias, setReferencias] = useState({})
  const [cargando, setCargando] = useState(claves.length > 0)
  const [fallidas, setFallidas] = useState([])
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (claves.length === 0) {
      setReferencias({})
      setFallidas([])
      setCargando(false)
      return
    }

    let vigente = true
    setCargando(true)

    Promise.all(
      claves.map((clave) =>
        cargarReferencia(clave)
          .then((registro) => [clave, registro])
          .catch(() => [clave, null])
      )
    ).then((pares) => {
      if (!vigente) return
      const listas = {}
      const errores = []
      for (const [clave, registro] of pares) {
        if (registro) listas[clave] = registro
        else errores.push(clave)
      }
      setReferencias(listas)
      setFallidas(errores)
      setCargando(false)
    })

    return () => {
      vigente = false
    }
  }, [claves, version])

  // Vuelve a pedir las tablas relacionadas (tras crear o borrar registros).
  const recargar = useCallback(() => {
    claves.forEach(invalidarReferencia)
    setVersion((v) => v + 1)
  }, [claves])

  return { referencias, cargandoRefs: cargando, refsFallidas: fallidas, recargarRefs: recargar }
}
