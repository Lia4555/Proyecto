import React, { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, sombras, spacing, typography } from '../theme';
import { Icono } from './Icono';

/**
 * Hoja que sube desde abajo con un formulario corto (misma apariencia que
 * la lista del Selector). Mientras `bloqueada` sea true no se puede cerrar,
 * para no perder una peticion a medias.
 */
export const HojaModal = ({
  visible,
  titulo,
  subtitulo,
  bloqueada = false,
  onCerrar,
  children
}: {
  visible: boolean;
  titulo: string;
  subtitulo?: string;
  bloqueada?: boolean;
  onCerrar: () => void;
  children: ReactNode;
}) => {
  const insets = useSafeAreaInsets();
  const cerrar = () => {
    if (!bloqueada) onCerrar();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cerrar} statusBarTranslucent>
      <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={estilos.velo} onPress={cerrar} accessibilityLabel="Cerrar" />
        <View style={[estilos.hoja, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={estilos.cabecera}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={typography.subtitulo}>{titulo}</Text>
              {subtitulo ? <Text style={typography.ayuda}>{subtitulo}</Text> : null}
            </View>
            <Pressable
              onPress={cerrar}
              disabled={bloqueada}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Icono nombre="cerrar" tamano={22} color={colors.muted} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={estilos.cuerpo} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  velo: { flex: 1, backgroundColor: 'rgba(22, 24, 29, 0.4)' },
  hoja: {
    maxHeight: '90%',
    backgroundColor: colors.blanco,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    ...sombras.s3
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md
  },
  cuerpo: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.lg }
});
