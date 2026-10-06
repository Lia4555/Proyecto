import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tono, TONOS } from '../theme';

interface Props {
  texto: string;
  tono?: Tono;
  /** Punto de color delante del texto, como .estado del web. */
  conPunto?: boolean;
}

/** Pastilla de estado (Programado, En curso, Vigente, Vencido...). */
export const Badge = ({ texto, tono = TONOS.neutro, conPunto = true }: Props) => (
  <View style={[estilos.contenedor, { backgroundColor: tono.fondo }]}>
    {conPunto && <View style={[estilos.punto, { backgroundColor: tono.texto }]} />}
    <Text style={[estilos.texto, { color: tono.texto }]} numberOfLines={1}>
      {texto}
    </Text>
  </View>
);

const estilos = StyleSheet.create({
  contenedor: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexShrink: 1
  },
  punto: { width: 7, height: 7, borderRadius: 4 },
  texto: { fontSize: 12, fontWeight: '800' }
});
