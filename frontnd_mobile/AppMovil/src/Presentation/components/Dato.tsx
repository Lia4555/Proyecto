import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { typography } from '../theme';

interface Props {
  rotulo: string;
  valor: string;
  estilo?: StyleProp<ViewStyle>;
}

/** Par rotulo/valor, como los <dt>/<dd> de las fichas del web. */
export const Dato = ({ rotulo, valor, estilo }: Props) => (
  <View style={[estilos.dato, estilo]}>
    <Text style={typography.rotulo}>{rotulo}</Text>
    <Text style={typography.valor}>{valor}</Text>
  </View>
);

/** Rejilla de dos columnas para varios Dato. */
export const RejillaDatos = ({ children }: { children: React.ReactNode }) => (
  <View style={estilos.rejilla}>{children}</View>
);

const estilos = StyleSheet.create({
  dato: { gap: 2, width: '47%', flexGrow: 1 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 14 }
});
