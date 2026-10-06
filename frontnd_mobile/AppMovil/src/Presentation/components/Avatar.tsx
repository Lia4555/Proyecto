import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme';
import { Icono } from './Icono';

interface Props {
  foto: string | null;
  iniciales: string;
  tamano: number;
  /** Fondo cuando no hay foto (sobre la cabecera vino va translucido). */
  fondo?: string;
  /** Muestra el sello de camara: indica que se puede cambiar. */
  editable?: boolean;
  estilo?: StyleProp<ViewStyle>;
}

/** Circulo con la foto de perfil, o con las iniciales si no hay. */
export const Avatar = ({ foto, iniciales, tamano, fondo = colors.vino, editable = false, estilo }: Props) => {
  const sello = Math.max(18, Math.round(tamano * 0.34));

  return (
    <View style={[{ width: tamano, height: tamano }, estilo]}>
      <View
        style={[
          estilos.circulo,
          { width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: fondo }
        ]}
      >
        {foto ? (
          <Image source={{ uri: foto }} style={estilos.imagen} accessibilityIgnoresInvertColors />
        ) : (
          <Text style={[estilos.iniciales, { fontSize: Math.round(tamano * 0.36) }]}>{iniciales}</Text>
        )}
      </View>

      {editable && (
        <View style={[estilos.sello, { width: sello, height: sello, borderRadius: sello / 2 }]}>
          <Icono nombre="camara" tamano={Math.round(sello * 0.58)} color={colors.tinta} />
        </View>
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imagen: { width: '100%', height: '100%' },
  iniciales: { color: colors.blanco, fontWeight: '800' },
  sello: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.blanco,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.linea,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  }
});
