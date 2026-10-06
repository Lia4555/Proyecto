import { useDialog } from '../../hooks/useDialog.js'
import { IconAlerta } from './Icons.jsx'

// Diálogo de confirmación accesible (reemplaza a window.confirm).
export default function ConfirmDialog({
  titulo,
  mensaje,
  detalle,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligro = false,
  cargando = false,
  onConfirm,
  onCancel
}) {
  const ref = useDialog(onCancel)

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        ref={ref}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={`modal-icon ${peligro ? 'danger' : ''}`} aria-hidden="true">
          <IconAlerta size={22} />
        </div>

        <h2 className="modal-title" id="confirm-title">{titulo}</h2>
        <p className="modal-text" id="confirm-desc">{mensaje}</p>
        {detalle && <p className="modal-detail">{detalle}</p>}

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel} disabled={cargando}>
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`btn ${peligro ? 'danger-solid' : 'primary'}`}
            onClick={onConfirm}
            disabled={cargando}
          >
            {cargando ? 'Procesando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
