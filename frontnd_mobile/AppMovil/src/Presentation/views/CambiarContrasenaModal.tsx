import React, { useRef } from 'react';
import { Text, TextInput } from 'react-native';
import { AppButton, AppInput, AvisoError, HojaModal } from '../components';
import { CambiarContrasenaViewModel } from '../hooks';
import { CONTRASENA_MAX, CONTRASENA_MIN } from '../../Domain/entities';
import { typography } from '../theme';

/** VISTA: cambiar la contraseña propia (actual, nueva y repetirla). */
export const CambiarContrasenaModal = ({ vm }: { vm: CambiarContrasenaViewModel }) => {
  const campoNueva = useRef<TextInput>(null);
  const campoRepetir = useRef<TextInput>(null);

  return (
    <HojaModal
      visible={vm.abierto}
      titulo="Cambiar contraseña"
      subtitulo="Necesitas la actual para poner una nueva."
      bloqueada={vm.guardando}
      onCerrar={vm.cerrar}
    >
      <AppInput
        etiqueta="Contraseña actual"
        valor={vm.valores.actual}
        onCambio={(t) => vm.cambiar('actual', t)}
        secreto
        autoComplete="current-password"
        teclaRetorno="next"
        onEnviar={() => campoNueva.current?.focus()}
        error={vm.errores.actual}
      />
      <AppInput
        ref={campoNueva}
        etiqueta="Contraseña nueva"
        valor={vm.valores.nueva}
        onCambio={(t) => vm.cambiar('nueva', t)}
        secreto
        autoComplete="new-password"
        teclaRetorno="next"
        onEnviar={() => campoRepetir.current?.focus()}
        error={vm.errores.nueva}
        ayuda={`Entre ${CONTRASENA_MIN} y ${CONTRASENA_MAX} caracteres.`}
      />
      <AppInput
        ref={campoRepetir}
        etiqueta="Repite la contraseña nueva"
        valor={vm.valores.repetir}
        onCambio={(t) => vm.cambiar('repetir', t)}
        secreto
        autoComplete="new-password"
        teclaRetorno="done"
        onEnviar={vm.guardar}
        error={vm.errores.repetir}
      />

      {vm.error && <AvisoError mensaje={vm.error} />}

      <AppButton titulo="Cambiar contraseña" icono="llave" onPress={vm.guardar} cargando={vm.guardando} />
      <AppButton titulo="Cancelar" variante="ghost" onPress={vm.cerrar} deshabilitado={vm.guardando} />
      <Text style={typography.ayuda}>
        Por seguridad, tras 5 intentos fallidos tendrás que esperar 15 minutos.
      </Text>
    </HojaModal>
  );
};
