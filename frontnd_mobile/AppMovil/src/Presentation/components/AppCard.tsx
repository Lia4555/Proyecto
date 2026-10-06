import React, { ReactNode } from 'react';
import {
  Pressable,
  PressableStateCallbackType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import { colors, radius, sombras, spacing } from '../theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  estilo?: StyleProp<ViewStyle>;
}

/** Tarjeta blanca con borde y sombra suave. Si recibe onPress se comporta como boton. */
export const AppCard = ({ children, onPress, estilo }: Props) => {
  if (!onPress) return <View style={[estilos.tarjeta, estilo]}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: PressableStateCallbackType) => [
        estilos.tarjeta,
        pressed && estilos.presionada,
        estilo
      ]}
    >
      {children}
    </Pressable>
  );
};

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.blanco,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.linea,
    padding: spacing.xl,
    gap: spacing.lg,
    ...sombras.s1
  },
  presionada: { borderColor: colors.salmon, backgroundColor: '#fffdfd' }
});
