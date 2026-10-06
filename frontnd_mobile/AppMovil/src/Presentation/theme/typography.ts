import { TextStyle } from 'react-native';
import { colors } from './colors';

// Escala tipografica del panel web adaptada a pantalla de telefono.
export const typography = {
  titulo: { fontSize: 24, fontWeight: '800', color: colors.tinta, letterSpacing: -0.2 },
  subtitulo: { fontSize: 17, fontWeight: '800', color: colors.tinta },
  cuerpo: { fontSize: 15, fontWeight: '400', color: colors.texto, lineHeight: 22 },
  lead: { fontSize: 15, fontWeight: '400', color: colors.muted, lineHeight: 24 },
  etiqueta: { fontSize: 13, fontWeight: '700', color: colors.tinta },
  ayuda: { fontSize: 13, fontWeight: '400', color: colors.muted, lineHeight: 19 },
  // Antetitulo en mayusculas y rojo (.lp-eyebrow)
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.rojo,
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },
  // Rotulo de un dato (dt): "SALIDA", "VEHICULO"...
  rotulo: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted2,
    textTransform: 'uppercase',
    letterSpacing: 0.7
  },
  valor: { fontSize: 14, fontWeight: '600', color: colors.tinta }
} satisfies Record<string, TextStyle>;
