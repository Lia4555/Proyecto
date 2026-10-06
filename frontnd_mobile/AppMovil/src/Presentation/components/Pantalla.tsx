import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface Props {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  accion?: ReactNode;
  /** Algo que va encima del titulo (p. ej. "Volver"). */
  arriba?: ReactNode;
}

/**
 * Marco comun de las secciones del panel: titulo grande + subtitulo
 * (.cond-head del web) y el contenido debajo. La cabecera color vino y la
 * barra de estado las pone BarraSuperior.
 */
export const Pantalla = ({ titulo, subtitulo, children, accion, arriba }: Props) => (
  <View style={estilos.fondo}>
    <View style={estilos.cabecera}>
      {arriba}
      <View style={estilos.fila}>
        <View style={estilos.textos}>
          <Text style={typography.titulo}>{titulo}</Text>
          {subtitulo && <Text style={estilos.sub}>{subtitulo}</Text>}
        </View>
        {accion}
      </View>
    </View>
    <View style={estilos.contenido}>{children}</View>
  </View>
);

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.papel },
  cabecera: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm
  },
  fila: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  textos: { flex: 1, gap: 4 },
  sub: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  contenido: { flex: 1, paddingHorizontal: spacing.lg }
});
