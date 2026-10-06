import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

// Los mismos iconos de linea del frontend web (components/ui/Icons.jsx),
// dibujados con react-native-svg. Todos usan trazo, sin relleno.

type Forma =
  | { d: string; opacity?: number }
  | { c: [number, number, number] }
  | { r: [number, number, number, number, number] };

const ICONOS = {
  actualizar: [{ d: 'M21 12a9 9 0 1 1-2.6-6.4' }, { d: 'M21 3v6h-6' }],
  editar: [{ d: 'M12 20h9' }, { d: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z' }],
  cerrar: [{ d: 'M18 6 6 18M6 6l12 12' }],
  menu: [{ d: 'M3 6h18M3 12h18M3 18h18' }],
  salir: [
    { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' },
    { d: 'm16 17 5-5-5-5' },
    { d: 'M21 12H9' }
  ],
  izquierda: [{ d: 'm15 18-6-6 6-6' }],
  derecha: [{ d: 'm9 18 6-6-6-6' }],
  alerta: [{ d: 'M12 3 2 20h20L12 3Z' }, { d: 'M12 9v5M12 17.5v.5' }],
  ok: [{ d: 'm4 12 5 5L20 6' }],
  info: [{ c: [12, 12, 9] }, { d: 'M12 11v5M12 8v.5' }],
  vacio: [{ r: [3, 5, 18, 14, 2] }, { d: 'M3 10h18M9 10v9' }],
  ojo: [{ d: 'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z' }, { c: [12, 12, 2.5] }],
  ojoCerrado: [
    { d: 'M3 3l18 18' },
    { d: 'M10.6 6.2A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.3 3.8' },
    { d: 'M6.3 7.9A16.7 16.7 0 0 0 2 12s3.6 6 10 6a9.7 9.7 0 0 0 3.7-.7' }
  ],
  maletin: [{ r: [3, 7, 18, 13, 2] }, { d: 'M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2' }],
  escuela: [{ d: 'm12 3 9 5-9 5-9-5 9-5Z' }, { d: 'M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5' }],
  avion: [
    { d: 'M10 3h2l1.5 7H21a1.5 1.5 0 0 1 0 3h-7.5L12 21h-2l1-8H6l-1.5 2H3l1-3.5L3 8h1.5L6 10h5l-1-7Z' }
  ],
  montana: [{ d: 'm3 20 6-9 4 5 2-3 6 7H3Z' }, { c: [7, 6, 2] }],
  escudo: [{ d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z' }, { d: 'm9 12 2 2 4-4' }],
  ubicacion: [{ d: 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z' }, { c: [12, 10, 2.5] }],
  telefono: [
    { d: 'M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3Z' }
  ],
  correo: [{ r: [3, 5, 18, 14, 2] }, { d: 'm3 7 9 6 9-6' }],
  reloj: [{ c: [12, 12, 9] }, { d: 'M12 7v5l3 2' }],
  llave: [{ d: 'M14 7a4 4 0 1 1-3.5 5.9L4 19v2H2v-3l7.1-7.1A4 4 0 0 1 14 7Z' }],
  gps: [{ c: [12, 12, 3] }, { c: [12, 12, 8] }, { d: 'M12 1v3M12 20v3M1 12h3M20 12h3' }],
  usuarios: [
    { c: [9, 8, 3.2] },
    { d: 'M2.5 20a6.5 6.5 0 0 1 13 0' },
    { d: 'M16 5.5a3.2 3.2 0 0 1 0 5.6M17.5 14.4A6.5 6.5 0 0 1 21.5 20' }
  ],
  usuario: [{ c: [12, 8, 4] }, { d: 'M4 21a8 8 0 0 1 16 0' }],
  bus: [
    { r: [3, 4, 18, 12, 2] },
    { d: 'M3 10h18' },
    { c: [7.5, 19, 1.6] },
    { c: [16.5, 19, 1.6] },
    { d: 'M6 16v1.5M18 16v1.5' }
  ],
  ruta: [
    { c: [6, 6, 2.5] },
    { c: [18, 18, 2.5] },
    { d: 'M8.5 6H14a3.5 3.5 0 0 1 0 7h-4a3.5 3.5 0 0 0 0 7h5.5' }
  ],
  campana: [{ d: 'M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z' }, { d: 'M10 19a2 2 0 0 0 4 0' }],
  calendario: [{ r: [3, 5, 18, 16, 2] }, { d: 'M3 10h18M8 3v4M16 3v4' }],
  documento: [
    { d: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z' },
    { d: 'M14 3v5h5' }
  ],
  herramienta: [{ d: 'M15 3a5 5 0 0 0-4.4 7.3L3 18v3h3l7.7-7.6A5 5 0 1 0 15 3Z' }],
  inicio: [{ d: 'm3 11 9-8 9 8' }, { d: 'M6 10v10h12V10' }],
  flechaLarga: [{ d: 'M4 12h15' }, { d: 'm14 7 5 5-5 5' }],
  camara: [
    { d: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z' },
    { c: [12, 13.5, 3.5] }
  ],
  imagen: [{ r: [3, 4, 18, 16, 2] }, { c: [9, 9.5, 1.6] }, { d: 'm21 16-5-5-9 9' }],
  eliminar: [{ d: 'M3 6h18' }, { d: 'M8 6V4h8v2' }, { d: 'M6 6l1 14h10l1-14' }]
} satisfies Record<string, Forma[]>;

export type NombreIcono = keyof typeof ICONOS;

interface Props {
  nombre: NombreIcono;
  tamano?: number;
  color?: string;
  grosor?: number;
}

export const Icono = ({ nombre, tamano = 18, color = colors.texto, grosor = 2 }: Props) => (
  <Svg
    width={tamano}
    height={tamano}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={grosor}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {(ICONOS[nombre] as Forma[]).map((forma, i) => {
      if ('d' in forma) return <Path key={i} d={forma.d} opacity={forma.opacity} />;
      if ('c' in forma) {
        const [cx, cy, r] = forma.c;
        return <Circle key={i} cx={cx} cy={cy} r={r} />;
      }
      const [x, y, width, height, rx] = forma.r;
      return <Rect key={i} x={x} y={y} width={width} height={height} rx={rx} />;
    })}
  </Svg>
);
