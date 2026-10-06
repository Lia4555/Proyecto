import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { Avatar } from './Avatar';
import { Icono } from './Icono';
import { Marca } from './Marca';

interface Props {
  subtitulo: string;
  iniciales: string;
  foto: string | null;
  onInicio: () => void;
  onPerfil: () => void;
}

/** Cabecera color vino del panel (.cond-topbar del web). */
export const BarraSuperior = ({ subtitulo, iniciales, foto, onInicio, onPerfil }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[estilos.barra, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={estilos.fila}>
        <Marca sobre="oscura" sello="translucido" eslogan={subtitulo} />

        <View style={estilos.derecha}>
          <Pressable
            onPress={onInicio}
            hitSlop={6}
            style={({ pressed }) => [estilos.iconbtn, pressed && estilos.presionado]}
            accessibilityRole="button"
            accessibilityLabel="Ir a la página principal"
          >
            <Icono nombre="inicio" tamano={20} color="#f3dede" />
          </Pressable>
          <Pressable
            onPress={onPerfil}
            hitSlop={6}
            style={({ pressed }) => pressed && estilos.avatarPresionado}
            accessibilityRole="button"
            accessibilityLabel="Abrir mi perfil"
          >
            <Avatar foto={foto} iniciales={iniciales} tamano={36} fondo="rgba(255, 255, 255, 0.18)" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  barra: { backgroundColor: colors.vino },
  fila: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    gap: spacing.md
  },
  derecha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconbtn: { padding: 8, borderRadius: 8 },
  presionado: { backgroundColor: 'rgba(255, 255, 255, 0.14)' },
  avatarPresionado: { opacity: 0.75 }
});
