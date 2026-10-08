import { useState } from 'react'
import { createPortal } from 'react-dom'
import { IconLlave } from '../ui/Icons.jsx'
import { CambiarContrasenaDialog } from './ContrasenaDialog.jsx'

// Botón de la cabecera (junto al avatar) para cambiar la contraseña propia.
// Sirve igual para el administrador y para el conductor.
export default function BotonContrasena() {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        className="iconbtn"
        onClick={() => setAbierto(true)}
        aria-label="Cambiar mi contraseña"
        title="Cambiar mi contraseña"
      >
        <IconLlave size={18} />
      </button>

      {/* Portal: igual que la foto de perfil, no hereda los estilos de la barra. */}
      {abierto && createPortal(<CambiarContrasenaDialog onClose={() => setAbierto(false)} />, document.body)}
    </>
  )
}
