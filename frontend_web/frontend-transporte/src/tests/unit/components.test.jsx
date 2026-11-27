import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import api, { getErrorMessage } from '../../api/api.js'
import Login from '../../components/Login.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { ToastProvider, useToast } from '../../components/ui/Toast.jsx'
import { esAdmin, esConductor, iniciales, puedeEscribir } from '../../lib/session.js'
import { errorPlaca, errorTelefono, limpiarPlaca } from '../../lib/validaciones.js'

// Las peticiones al backend se simulan: una prueba unitaria no depende de
// que el servidor ni Supabase estén encendidos. getErrorMessage sigue siendo el real.
jest.mock('../../api/api.js', () => {
  const real = jest.requireActual('../../api/api.js')
  return {
    __esModule: true,
    ...real,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }
  }
})

const admin = { correo: 'admin@dviaje.com', nombre: 'Diego Rojas', rol: 'Administrador', nivel_permiso: 3 }
const conductor = { correo: 'ana@dviaje.com', nombre: 'Ana Ruiz', rol: 'Conductor', nivel_permiso: 2 }

beforeEach(() => jest.clearAllMocks())

describe('Nivel 1: Pruebas Unitarias - Frontend', () => {
  test('UT-01: session debe reconocer al administrador (nivel 3) y darle permiso de escritura', () => {
    expect(esAdmin(admin)).toBe(true)
    expect(puedeEscribir(admin)).toBe(true)
  })

  test('UT-02: session debe tratar al nivel 2 como conductor sin permiso de escritura', () => {
    expect(esConductor(conductor)).toBe(true)
    expect(esAdmin(conductor)).toBe(false)
    expect(puedeEscribir(conductor)).toBe(false)
    expect(esConductor(null)).toBe(false)
  })

  test('UT-03: iniciales debe salir del nombre o, si no hay, del correo', () => {
    expect(iniciales(admin)).toBe('DR')
    expect(iniciales({ correo: 'logistica@dviaje.com' })).toBe('LO')
  })

  test('UT-04: getErrorMessage debe traducir los errores del backend a texto legible', () => {
    expect(getErrorMessage({ response: { data: { error: 'Correo o contraseña incorrectos.' } } }))
      .toBe('Correo o contraseña incorrectos.')
    expect(getErrorMessage({ response: { data: { detalles: [{ campo: 'placa', mensaje: 'Ya existe' }] } } }))
      .toBe('placa: Ya existe')
    expect(getErrorMessage({})).toMatch(/No se pudo conectar con el servidor/)
  })

  test('UT-05: validaciones debe limpiar y validar la placa de un vehículo', () => {
    expect(limpiarPlaca('abc-123')).toBe('ABC123')
    expect(errorPlaca('ABC123')).toBeNull()
    expect(errorPlaca('AB1')).toMatch(/Entre 5 y 7/)
  })

  test('UT-06: validaciones debe rechazar teléfonos con letras o muy cortos', () => {
    expect(errorTelefono('300 123 4567')).toBeNull()
    expect(errorTelefono('300abc')).not.toBeNull()
    expect(errorTelefono('123')).toMatch(/entre 7 y 15 dígitos/)
  })

  test('UT-07: Login debe mostrar errores y no llamar al backend si los campos están vacíos', () => {
    render(<Login onLogin={jest.fn()} onVolver={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('Escribe tu correo.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  test('UT-08: Login debe enviar las credenciales y entregar el usuario al iniciar sesión', async () => {
    api.post.mockResolvedValue({ data: { message: 'ok', user: admin } })
    const onLogin = jest.fn()
    render(<Login onLogin={onLogin} onVolver={jest.fn()} />)

    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: ' admin@dviaje.com ' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'claveSegura1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(admin))
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      correo: 'admin@dviaje.com',
      contrasena: 'claveSegura1'
    })
  })

  test('UT-09: Login debe mostrar el mensaje del servidor si las credenciales son incorrectas', async () => {
    api.post.mockRejectedValue({ response: { status: 401, data: { error: 'Correo o contraseña incorrectos.' } } })
    render(<Login onLogin={jest.fn()} onVolver={jest.fn()} />)

    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'admin@dviaje.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'equivocada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.')
  })

  test('UT-10: ConfirmDialog debe mostrar el mensaje y ejecutar la acción al confirmar', () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()
    render(
      <ConfirmDialog
        titulo="Eliminar registro"
        mensaje="Se eliminará «ABC123» de Vehículos."
        textoConfirmar="Sí, eliminar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    expect(screen.getByRole('alertdialog')).toHaveTextContent('Se eliminará «ABC123» de Vehículos.')
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  test('UT-11: Toast debe renderizar el mensaje en pantalla', () => {
    function Boton() {
      const toast = useToast()
      return <button onClick={() => toast.exito('Se creó el registro en Clientes.')}>Guardar</button>
    }
    render(<ToastProvider><Boton /></ToastProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByRole('status')).toHaveTextContent('Se creó el registro en Clientes.')
  })
})
