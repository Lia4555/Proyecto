import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, sombras } from '../theme';

interface Props {
  /** 'clara' sobre fondo blanco, 'oscura' sobre vino o tinta. */
  sobre?: 'clara' | 'oscura';
  eslogan?: string;
  /** Circulo "DV" translucido en vez de rojo (cabecera del panel). */
  sello?: 'rojo' | 'translucido';
  tamano?: number;
}

/** Circulo "DV" + nombre de la empresa, como .brand-mark / .brand-name del web. */
export const Marca = ({ sobre = 'clara', eslogan, sello = 'rojo', tamano = 36 }: Props) => (
  <View style={estilos.fila}>
    <SelloMarca tamano={tamano} translucido={sello === 'translucido'} />
    <View style={estilos.textos}>
      <Text
        style={[estilos.nombre, { color: sobre === 'clara' ? colors.vino : colors.blanco }]}
        numberOfLines={1}
      >
        D' VIAJE
      </Text>
      {eslogan && (
        <Text
          style={[estilos.eslogan, { color: sobre === 'clara' ? colors.muted : colors.salmon }]}
          numberOfLines={1}
        >
          {eslogan}
        </Text>
      )}
    </View>
  </View>
);

export const SelloMarca = ({
  tamano = 36,
  translucido = false
}: {
  tamano?: number;
  translucido?: boolean;
}) => (
  <View
    style={[
      estilos.sello,
      { width: tamano, height: tamano, borderRadius: tamano / 2 },
      translucido ? estilos.selloTranslucido : sombras.rojo
    ]}
  >
    <Text style={[estilos.selloTexto, { fontSize: tamano * 0.36 }]}>DV</Text>
  </View>
);

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 11, flexShrink: 1 },
  textos: { flexShrink: 1 },
  nombre: { fontSize: 16, fontWeight: '800', letterSpacing: 0.7, lineHeight: 19 },
  eslogan: { fontSize: 11, fontWeight: '600' },
  sello: { backgroundColor: colors.rojo, alignItems: 'center', justifyContent: 'center' },
  selloTranslucido: { backgroundColor: 'rgba(255, 255, 255, 0.16)' },
  selloTexto: { color: colors.blanco, fontWeight: '800', letterSpacing: 0.3 }
});
