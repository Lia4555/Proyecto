import React from 'react';
import {  ActivityIndicator,  Pressable,  PressableStateCallbackType,  StyleProp,  StyleSheet,  Text,  View,ViewStyle} from 'react-native';
import { colors, radius, sombras, spacing } from '../theme';
import { Icono, NombreIcono } from './Icono';

// Mismas variantes que .btn del web: primary, ghost y danger-solid, mas
// una translucida para usar sobre las cabeceras color vino.
type Variante = 'primario' | 'ghost' | 'peligro' | 'translucido';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icono?: NombreIcono;
  pequeno?: boolean;
  cargando?: boolean;
  deshabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}

const APARIENCIA: Record<Variante, { fondo: string; presionado: string; texto: string; borde: string }> = {
  primario: { fondo: colors.rojo, presionado: colors.rojoHover, texto: colors.blanco, borde: colors.rojo },
  ghost: { fondo: colors.blanco, presionado: colors.papel, texto: colors.tinta, borde: colors.linea },
  peligro: { fondo: colors.error, presionado: '#a3241d', texto: colors.blanco, borde: colors.error },
  translucido: {
    fondo: 'rgba(255, 255, 255, 0.12)',
    presionado: 'rgba(255, 255, 255, 0.22)',
    texto: colors.blanco,
    borde: 'rgba(255, 255, 255, 0.24)'
  }
};

/** Boton unico de la app: mismo alto, mismo radio, mismo estado de carga. */
export const AppButton = ({
  titulo,
  onPress,
  variante = 'primario',
  icono,
  pequeno = false,
  cargando = false,
  deshabilitado = false,
  estilo
}: Props) => {
  const inactivo = deshabilitado || cargando;
  const a = APARIENCIA[variante];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={({ pressed }: PressableStateCallbackType) => [
        estilos.boton,
        pequeno && estilos.pequeno,
        { backgroundColor: pressed && !inactivo ? a.presionado : a.fondo, borderColor: a.borde },
        variante === 'primario' && sombras.rojo,
        variante === 'ghost' && sombras.s1,
        pressed && !inactivo && estilos.presionado,
        inactivo && estilos.inactivo,
        estilo
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={a.texto} />
      ) : (
        <View style={estilos.contenido}>
          {icono && <Icono nombre={icono} tamano={pequeno ? 15 : 17} color={a.texto} />}
          <Text style={[estilos.texto, pequeno && estilos.textoPequeno, { color: a.texto }]}>
            {titulo}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const estilos = StyleSheet.create({
  boton: {
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg
  },
  pequeno: { minHeight: 38, paddingHorizontal: spacing.md },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  presionado: { transform: [{ translateY: 1 }] },
  inactivo: { opacity: 0.55 },
  texto: { fontSize: 15, fontWeight: '700' },
  textoPequeno: { fontSize: 13.5 }
});
