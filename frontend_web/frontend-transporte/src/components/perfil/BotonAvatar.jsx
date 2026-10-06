import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useFotoPerfil } from '../../hooks/useFotoPerfil.js'
import { iniciales } from '../../lib/session.js'
import { IconCamara } from '../ui/Icons.jsx'
import FotoPerfilDialog from './FotoPerfilDialog.jsx'

// Avatar de la cabecera: muestra la foto (o las iniciales) y, al
// pulsarlo, abre el diálogo para cambiarla.
export default function BotonAvatar({ usuario }) {
  const foto = useFotoPerfil(usuario?.id_usuario)
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        className="avatar avatar-btn"
        onClick={() => setAbierto(true)}
        aria-label="Cambiar foto de perfil"
        title="Cambiar foto de perfil"
      >
        {foto ? <img src={foto} alt="" /> : iniciales(usuario)}
        <span className="avatar-camara" aria-hidden="true"><IconCamara size={9} /></span>
      </button>

      {/* Portal: el diálogo no debe heredar los estilos de la barra superior
          (en el panel del conductor sus iconos y botones son claros). */}
      {abierto && createPortal(
        <FotoPerfilDialog usuario={usuario} foto={foto} onClose={() => setAbierto(false)} />,
        document.body
      )}
    </>
  )
}
