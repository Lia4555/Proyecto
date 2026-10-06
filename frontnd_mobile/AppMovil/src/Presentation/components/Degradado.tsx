import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

// Fondo con degradado, pintado con SVG para no depender de otra libreria.
// Replica los "linear-gradient + radial-gradient" del CSS del frontend web.

interface Brillo {
  /** Centro del brillo, en fraccion del ancho/alto (0..1). */
  x: number;
  y: number;
  color: string;
  opacidad: number;
}

interface Props {
  /** Colores del degradado lineal, de inicio a fin. */
  colores: string[];
  /** Direccion: 'vertical' (arriba -> abajo) o 'diagonal' (arriba izq. -> abajo der.). */
  direccion?: 'vertical' | 'diagonal';
  brillos?: Brillo[];
}

export const Degradado = ({ colores, direccion = 'vertical', brillos = [] }: Props) => {
  const id = useId().replace(/:/g, '');
  const fin = direccion === 'vertical' ? { x2: '0', y2: '1' } : { x2: '1', y2: '1' };

  return (
    <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={`lin${id}`} x1="0" y1="0" {...fin}>
          {colores.map((color, i) => (
            <Stop key={i} offset={colores.length === 1 ? 0 : i / (colores.length - 1)} stopColor={color} />
          ))}
        </LinearGradient>
        {brillos.map((b, i) => (
          <RadialGradient
            key={i}
            id={`rad${id}${i}`}
            cx={String(b.x)}
            cy={String(b.y)}
            rx="0.75"
            ry="0.5"
            fx={String(b.x)}
            fy={String(b.y)}
          >
            <Stop offset="0" stopColor={b.color} stopOpacity={b.opacidad} />
            <Stop offset="1" stopColor={b.color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#lin${id})`} />
      {brillos.map((_, i) => (
        <Rect key={i} x="0" y="0" width="100%" height="100%" fill={`url(#rad${id}${i})`} />
      ))}
    </Svg>
  );
};
