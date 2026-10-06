import { useEffect, useRef } from 'react'

const FOCUSABLES = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

// Comportamiento estándar de un diálogo modal:
//  · foco inicial dentro del diálogo
//  · Escape para cerrar
//  · Tab/Shift+Tab atrapados dentro (focus trap)
//  · scroll del fondo bloqueado
//  · al cerrar, el foco vuelve al elemento que lo abrió
export function useDialog(onClose) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return

    const anterior = document.activeElement
    const visibles = () =>
      Array.from(nodo.querySelectorAll(FOCUSABLES)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )

    // Foco inicial: el primer campo editable si lo hay (formularios); si no,
    // el primer elemento enfocable (en un diálogo de confirmación, "Cancelar").
    const lista = visibles()
    const primerCampo = lista.find(
      (el) => /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !el.disabled
    )
    const destino = primerCampo || lista[0] || nodo
    destino.focus()

    const alPresionar = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab') return

      const lista = visibles()
      if (lista.length === 0) return
      const inicio = lista[0]
      const fin = lista[lista.length - 1]

      if (e.shiftKey && document.activeElement === inicio) {
        e.preventDefault()
        fin.focus()
      } else if (!e.shiftKey && document.activeElement === fin) {
        e.preventDefault()
        inicio.focus()
      }
    }

    nodo.addEventListener('keydown', alPresionar)
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      nodo.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = overflowPrevio
      if (anterior instanceof HTMLElement) anterior.focus()
    }
  }, [])

  return ref
}
