import { StatusBar } from 'expo-status-bar';
import React, { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppInput, AvisoError, Degradado, Icono, Marca } from '../components';
import { useRegistroViewModel } from '../hooks';
import { TIPOS_DOCUMENTO } from '../../Domain/entities';
import { colors, radius, sombras, spacing, typography } from '../theme';

interface Props {
  onVolver: () => void;
  onIrALogin: () => void;
}

/**
 * VISTA de registro. Mismo marco que el login (cabecera vino + tarjeta).
 * La cuenta queda como Conductor y APAGADA: al terminar se explica que
 * falta la aprobacion del administrador, en vez de entrar directo.
 */
export const RegistroView = ({ onVolver, onIrALogin }: Props) => {
  const insets = useSafeAreaInsets();
  const vm = useRegistroViewModel();
  const refs = {
    apellido: useRef<TextInput>(null),
    numero_documento: useRef<TextInput>(null),
    telefono: useRef<TextInput>(null),
    correo: useRef<TextInput>(null),
    contrasena: useRef<TextInput>(null),
    confirmar: useRef<TextInput>(null)
  };

  return (
    <KeyboardAvoidingView style={estilos.fondo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[estilos.cabecera, { paddingTop: insets.top + spacing.md }]}>
          <Degradado
            colores={[colors.vino, colors.vino2, colors.vino3]}
            direccion="diagonal"
            brillos={[{ x: 0.85, y: 0, color: colors.salmon, opacidad: 0.32 }]}
          />
          <Pressable
            onPress={onVolver}
            style={({ pressed }) => [estilos.volver, pressed && estilos.volverPresionado]}
            hitSlop={6}
            accessibilityRole="button"
          >
            <Icono nombre="izquierda" tamano={16} color="#f3dede" />
            <Text style={estilos.volverTexto}>Volver a la página principal</Text>
          </Pressable>
          <Marca sobre="oscura" tamano={40} />
          <Text style={estilos.claim}>Únete al equipo de conductores de D' VIAJE.</Text>
        </View>

        <View style={estilos.tarjeta}>
          {vm.mensajeExito ? (
            <>
              <View style={estilos.exitoIcono}>
                <Icono nombre="ok" tamano={30} color={colors.blanco} />
              </View>
              <Text style={estilos.titulo}>Solicitud enviada</Text>
              <Text style={estilos.sub}>Tu cuenta quedó registrada como conductor.</Text>
              <View style={estilos.exito}>
                <Text style={estilos.exitoTitulo}>Falta un paso: la aprobación.</Text>
                <Text style={estilos.exitoTexto}>
                  Un administrador de la flota debe revisar y aprobar tu cuenta. Cuando lo haga,
                  podrás entrar con <Text style={{ fontWeight: '700' }}>{vm.valores.correo.trim()}</Text> y
                  la contraseña que elegiste.
                </Text>
              </View>
              <AppButton titulo="Ir a iniciar sesión" onPress={onIrALogin} />
            </>
          ) : (
            <>
              <Text style={estilos.titulo}>Crear una cuenta</Text>
              <Text style={estilos.sub}>
                Regístrate como conductor. Un administrador aprobará tu acceso.
              </Text>

              <View style={estilos.formulario}>
                <AppInput
                  etiqueta="Nombre"
                  valor={vm.valores.nombre}
                  onCambio={(t) => vm.cambiar('nombre', t)}
                  autoComplete="given-name"
                  teclaRetorno="next"
                  onEnviar={() => refs.apellido.current?.focus()}
                  error={vm.errores.nombre}
                />
                <AppInput
                  ref={refs.apellido}
                  etiqueta="Apellido"
                  valor={vm.valores.apellido}
                  onCambio={(t) => vm.cambiar('apellido', t)}
                  autoComplete="family-name"
                  teclaRetorno="next"
                  onEnviar={() => refs.numero_documento.current?.focus()}
                  error={vm.errores.apellido}
                />

                <View style={{ gap: 6 }}>
                  <Text style={typography.etiqueta}>Tipo de documento</Text>
                  <View style={estilos.opciones} accessibilityRole="radiogroup">
                    {TIPOS_DOCUMENTO.map((t) => {
                      const activo = vm.valores.tipo_documento === t.valor;
                      return (
                        <Pressable
                          key={t.valor}
                          onPress={() => vm.elegirDocumento(t.valor)}
                          style={[estilos.opcion, activo && estilos.opcionActiva]}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: activo }}
                          accessibilityLabel={t.texto}
                        >
                          <Text style={[estilos.opcionTexto, activo && { color: colors.blanco }]}>
                            {t.texto}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <AppInput
                  ref={refs.numero_documento}
                  etiqueta="Número de documento"
                  valor={vm.valores.numero_documento}
                  onCambio={(t) => vm.cambiar('numero_documento', t.replace(/[^A-Za-z0-9]/g, ''))}
                  tipoTeclado={vm.valores.tipo_documento === 'PA' ? 'default' : 'number-pad'}
                  teclaRetorno="next"
                  onEnviar={() => refs.telefono.current?.focus()}
                  error={vm.errores.numero_documento}
                />
                <AppInput
                  ref={refs.telefono}
                  etiqueta="Teléfono"
                  valor={vm.valores.telefono}
                  onCambio={(t) => vm.cambiar('telefono', t)}
                  placeholder="300 000 0000"
                  tipoTeclado="phone-pad"
                  autoComplete="tel"
                  teclaRetorno="next"
                  onEnviar={() => refs.correo.current?.focus()}
                  error={vm.errores.telefono}
                />
                <AppInput
                  ref={refs.correo}
                  etiqueta="Correo"
                  valor={vm.valores.correo}
                  onCambio={(t) => vm.cambiar('correo', t)}
                  placeholder="tucorreo@empresa.com"
                  tipoTeclado="email-address"
                  autoComplete="email"
                  teclaRetorno="next"
                  onEnviar={() => refs.contrasena.current?.focus()}
                  error={vm.errores.correo}
                />
                <AppInput
                  ref={refs.contrasena}
                  etiqueta="Contraseña"
                  valor={vm.valores.contrasena}
                  onCambio={(t) => vm.cambiar('contrasena', t)}
                  secreto
                  autoComplete="new-password"
                  teclaRetorno="next"
                  onEnviar={() => refs.confirmar.current?.focus()}
                  error={vm.errores.contrasena}
                  ayuda="Mínimo 8 caracteres."
                />
                <AppInput
                  ref={refs.confirmar}
                  etiqueta="Repite la contraseña"
                  valor={vm.valores.confirmar}
                  onCambio={(t) => vm.cambiar('confirmar', t)}
                  secreto
                  autoComplete="new-password"
                  teclaRetorno="go"
                  onEnviar={vm.enviar}
                  error={vm.errores.confirmar}
                />

                {vm.error && <AvisoError mensaje={vm.error} />}

                <AppButton
                  titulo={vm.enviando ? 'Enviando solicitud…' : 'Crear cuenta'}
                  onPress={vm.enviar}
                  cargando={vm.enviando}
                />
              </View>

              <Text style={estilos.pie}>
                ¿Ya tienes cuenta?{' '}
                <Text style={estilos.enlace} onPress={onIrALogin} accessibilityRole="link">
                  Inicia sesión
                </Text>
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.papel },
  cabecera: { paddingHorizontal: spacing.xl, paddingBottom: 60, gap: 20, overflow: 'hidden' },
  volver: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginLeft: -4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)'
  },
  volverPresionado: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  volverTexto: { color: '#f3dede', fontSize: 13, fontWeight: '600' },
  claim: { fontSize: 23, lineHeight: 30, fontWeight: '800', color: colors.blanco },
  tarjeta: {
    marginTop: -36,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea,
    borderRadius: radius.lg,
    paddingVertical: 28,
    paddingHorizontal: 22,
    ...sombras.s2
  },
  titulo: { ...typography.titulo, fontSize: 26 },
  sub: { color: colors.muted, fontSize: 14.5, lineHeight: 20, marginTop: 4, marginBottom: 22 },
  formulario: { gap: spacing.lg },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  opcion: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.linea,
    backgroundColor: colors.blanco
  },
  opcionActiva: { backgroundColor: colors.vino, borderColor: colors.vino },
  opcionTexto: { fontSize: 13.5, fontWeight: '600', color: colors.texto },
  pie: { marginTop: spacing.xl, textAlign: 'center', color: colors.muted, fontSize: 14 },
  enlace: { color: colors.rojo, fontWeight: '700' },
  exitoIcono: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.verde,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg
  },
  exito: {
    backgroundColor: colors.verdeSuave,
    borderWidth: 1,
    borderColor: colors.verdeBorde,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 6,
    marginBottom: spacing.xl
  },
  exitoTitulo: { fontSize: 15, fontWeight: '800', color: colors.verdeTexto },
  exitoTexto: { fontSize: 14, lineHeight: 21, color: colors.verdeTexto }
});
