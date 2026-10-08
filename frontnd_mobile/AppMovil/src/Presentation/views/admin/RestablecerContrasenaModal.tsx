import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { AppButton, AppInput, AvisoError, HojaModal } from '../../components';
import { CuentasViewModel } from '../../hooks';
import { CONTRASENA_MAX, CONTRASENA_MIN } from '../../../Domain/entities';
import { typography } from '../../theme';

/**
 * VISTA: el administrador pone una contraseña temporal a otra cuenta.
 * Sustituye a la antigua recuperacion con correo y telefono. La contraseña
 * no se guarda en ningun sitio de la app: al cerrar, los campos se vacian.
 */
export const RestablecerContrasenaModal = ({ vm }: { vm: CuentasViewModel }) => {
  const cuenta = vm.paraRestablecer;
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const campoConfirmar = useRef<TextInput>(null);

  // Cada vez que se abre (o se cierra) el formulario empieza vacio.
  useEffect(() => {
    setContrasena('');
    setConfirmar('');
  }, [cuenta]);

  const nombre = cuenta
    ? [cuenta.nombre, cuenta.apellido].filter(Boolean).join(' ') || cuenta.correo
    : '';

  const enviar = () => {
    vm.restablecer(contrasena, confirmar);
  };

  return (
    <HojaModal
      visible={cuenta !== null}
      titulo="Restablecer contraseña"
      subtitulo={cuenta ? `${nombre} · ${cuenta.correo}` : undefined}
      bloqueada={vm.guardandoClave}
      onCerrar={vm.cerrarRestablecer}
    >
      <Text style={typography.ayuda}>
        Escribe una contraseña temporal. Entrégasela por un canal seguro (en persona o por
        llamada, no por chat de grupo) y pídele que la cambie desde «Mi perfil» al entrar.
      </Text>

      <AppInput
        etiqueta="Contraseña temporal"
        valor={contrasena}
        onCambio={(t) => {
          setContrasena(t);
          vm.limpiarErrorClave('contrasena');
        }}
        secreto
        autoComplete="new-password"
        teclaRetorno="next"
        onEnviar={() => campoConfirmar.current?.focus()}
        error={vm.erroresClave.contrasena}
        ayuda={`Entre ${CONTRASENA_MIN} y ${CONTRASENA_MAX} caracteres.`}
      />
      <AppInput
        ref={campoConfirmar}
        etiqueta="Repite la contraseña"
        valor={confirmar}
        onCambio={(t) => {
          setConfirmar(t);
          vm.limpiarErrorClave('confirmar');
        }}
        secreto
        autoComplete="new-password"
        teclaRetorno="done"
        onEnviar={enviar}
        error={vm.erroresClave.confirmar}
      />

      {vm.errorClave && <AvisoError mensaje={vm.errorClave} />}

      <AppButton titulo="Restablecer contraseña" icono="llave" onPress={enviar} cargando={vm.guardandoClave} />
      <AppButton
        titulo="Cancelar"
        variante="ghost"
        onPress={vm.cerrarRestablecer}
        deshabilitado={vm.guardandoClave}
      />
    </HojaModal>
  );
};
