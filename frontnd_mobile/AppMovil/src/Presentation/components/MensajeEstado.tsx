import React, { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Icono, NombreIcono } from './Icono';

/** Rueda de carga centrada, para mientras llegan los datos. */
export const Cargando = ({ texto = 'Cargando…' }: { texto?: string }) => (
  <View style={estilos.centro}>
    <ActivityIndicator size="large" color={colors.rojo} />
    <Text style={typography.ayuda}>{texto}</Text>
  </View>
);

/** Aviso rojo (.alert.error) con opcion de reintentar: el error nunca se traga en silencio. */
export const AvisoError = ({
  mensaje,
  onReintentar
}: {
  mensaje: string;
  onReintentar?: () => void;
}) => (
  <View style={[estilos.aviso, estilos.avisoError]} accessibilityRole="alert">
    <Icono nombre="alerta" tamano={18} color={colors.errorTexto} />
    <Text style={[estilos.avisoTexto, { color: colors.errorTexto }]}>{mensaje}</Text>
    {onReintentar && (
      <Pressable onPress={onReintentar} hitSlop={8} accessibilityRole="button">
        <Text style={[estilos.enlace, { color: colors.errorTexto }]}>Reintentar</Text>
      </Pressable>
    )}
  </View>
);

/** Aviso verde (.alert.success). */
export const AvisoExito = ({ mensaje }: { mensaje: string }) => (
  <View style={[estilos.aviso, estilos.avisoExito]}>
    <Icono nombre="ok" tamano={18} color={colors.verdeTexto} />
    <Text style={[estilos.avisoTexto, { color: colors.verdeTexto }]}>{mensaje}</Text>
  </View>
);

/** Lista vacia: se explica por que no hay nada, en vez de dejar el hueco. */
export const SinDatos = ({
  titulo,
  detalle,
  icono = 'vacio',
  positivo = false,
  accion
}: {
  titulo: string;
  detalle?: string;
  icono?: NombreIcono;
  /** Circulo verde (.empty-ok): "todo en orden". */
  positivo?: boolean;
  accion?: ReactNode;
}) => (
  <View style={estilos.vacio}>
    {positivo ? (
      <View style={estilos.circuloOk}>
        <Icono nombre="ok" tamano={28} color={colors.verdeTexto} />
      </View>
    ) : (
      <Icono nombre={icono} tamano={40} grosor={1.4} color={colors.muted2} />
    )}
    <Text style={[typography.subtitulo, estilos.centrado]}>{titulo}</Text>
    {detalle && <Text style={[typography.ayuda, estilos.centrado]}>{detalle}</Text>}
    {accion}
  </View>
);

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl
  },
  centrado: { textAlign: 'center' },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 14
  },
  avisoError: { backgroundColor: colors.rojoSuave, borderColor: colors.errorBorde },
  avisoExito: { backgroundColor: colors.verdeSuave, borderColor: colors.verdeBorde },
  avisoTexto: { flex: 1, fontSize: 14, lineHeight: 20 },
  enlace: { fontSize: 14, fontWeight: '700' },
  vacio: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea,
    borderStyle: 'dashed',
    borderRadius: radius.md
  },
  circuloOk: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.verdeSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  }
});
