import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
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
import { useSesion } from '../hooks';
import { colors, radius, sombras, spacing, typography } from '../theme';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PUNTOS = [
  'Control de vehículos, documentos y mantenimientos',
  'Servicios, reservas y alertas en tiempo real',
  'Acceso protegido por roles y permisos'
];

/**
 * VISTA de entrada. Es el login del web (AuthLayout + Login.jsx) puesto en
 * vertical: el panel de marca color vino arriba y la tarjeta del formulario
 * montada encima. Solo pinta y recoge datos: la logica esta en useSesion.
 */
export const LoginView = ({
  onVolver,
  onCrearCuenta
}: {
  onVolver: () => void;
  onCrearCuenta: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const { entrar, entrando, error, limpiarError } = useSesion();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string }>({});
  const campoClave = useRef<TextInput>(null);

  const enviar = () => {
    limpiarError();
    const problemas = {
      correo: !correo.trim()
        ? 'Escribe tu correo.'
        : !RE_EMAIL.test(correo.trim())
          ? 'El correo no tiene un formato válido.'
          : undefined,
      contrasena: contrasena ? undefined : 'Escribe tu contraseña.'
    };
    setErrores(problemas);
    if (problemas.correo || problemas.contrasena) return;
    entrar(correo, contrasena);
  };

  return (
    <KeyboardAvoidingView
      style={estilos.fondo}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ------------------------- Panel de marca ------------------------- */}
        <View style={[estilos.marca, { paddingTop: insets.top + spacing.md }]}>
          <Degradado
            colores={[colors.vino, colors.vino2, colors.vino3]}
            direccion="diagonal"
            brillos={[
              { x: 0.85, y: 0, color: colors.salmon, opacidad: 0.32 },
              { x: 0, y: 1, color: colors.salmon, opacidad: 0.22 }
            ]}
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
          <Text style={estilos.claim}>
            Gestiona tu flota, tus viajes y tus reservas desde un solo panel.
          </Text>
          <View style={estilos.puntos}>
            {PUNTOS.map((p) => (
              <View key={p} style={estilos.punto}>
                <View style={estilos.puntoAnillo}>
                  <View style={estilos.puntoCentro} />
                </View>
                <Text style={estilos.puntoTexto}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ---------------------------- Tarjeta ----------------------------- */}
        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo}>Iniciar sesión</Text>
          <Text style={estilos.sub}>Entra con la cuenta de trabajo que te entregó la empresa.</Text>

          <View style={estilos.formulario}>
            <AppInput
              etiqueta="Correo"
              valor={correo}
              onCambio={(t) => {
                setCorreo(t);
                if (errores.correo) setErrores((e) => ({ ...e, correo: undefined }));
              }}
              placeholder="tucorreo@empresa.com"
              tipoTeclado="email-address"
              autoComplete="email"
              teclaRetorno="next"
              onEnviar={() => campoClave.current?.focus()}
              error={errores.correo}
            />
            <AppInput
              ref={campoClave}
              etiqueta="Contraseña"
              valor={contrasena}
              onCambio={(t) => {
                setContrasena(t);
                if (errores.contrasena) setErrores((e) => ({ ...e, contrasena: undefined }));
              }}
              placeholder="••••••••"
              secreto
              autoComplete="current-password"
              teclaRetorno="go"
              onEnviar={enviar}
              error={errores.contrasena}
            />

            {error && <AvisoError mensaje={error} />}

            <AppButton titulo={entrando ? 'Entrando…' : 'Entrar'} onPress={enviar} cargando={entrando} />
          </View>

          {/* El registro crea una cuenta de conductor pendiente de aprobacion. */}
          <Text style={estilos.pie}>
            ¿No tienes cuenta?{' '}
            <Text style={estilos.enlace} onPress={onCrearCuenta} accessibilityRole="link">
              Crear una cuenta
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.papel },
  marca: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 64,
    gap: 22,
    overflow: 'hidden'
  },
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
  claim: { fontSize: 25, lineHeight: 32, fontWeight: '800', color: colors.blanco },
  puntos: { gap: 12 },
  punto: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  puntoAnillo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
    backgroundColor: 'rgba(216, 30, 36, 0.3)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  puntoCentro: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.rojo },
  puntoTexto: { flex: 1, fontSize: 14.5, lineHeight: 20, color: '#f2d9d9' },
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
  pie: { marginTop: spacing.xl, textAlign: 'center', color: colors.muted, fontSize: 14 },
  enlace: { color: colors.rojo, fontWeight: '700' }
});
