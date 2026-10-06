import { ViewStyle } from 'react-native';

// Espaciados y redondeos en una sola escala: mantiene las pantallas
// alineadas entre si sin tener que inventar numeros en cada estilo.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32
} as const;

// Mismos radios que el frontend web (--r-xs ... --pill).
export const radius = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 20,
  full: 999
} as const;

// Equivalentes de --sombra-1/2/3. En Android la sombra la da "elevation".
export const sombras = {
  s1: {
    shadowColor: '#16181d',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1
  },
  s2: {
    shadowColor: '#16181d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  s3: {
    shadowColor: '#2d080a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 8
  },
  rojo: {
    shadowColor: '#d81e24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3
  }
} satisfies Record<string, ViewStyle>;
