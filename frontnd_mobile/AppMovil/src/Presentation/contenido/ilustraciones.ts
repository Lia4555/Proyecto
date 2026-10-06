// Ilustraciones para la foto de perfil. Son las mismas del panel web
// (frontend-transporte/src/lib/ilustraciones.js), exportadas a PNG de
// 256 px en assets/ilustraciones: si cambia alguna alla, hay que volver
// a exportarla.

export interface Ilustracion {
  clave: string;
  nombre: string;
  imagen: number;
}

export const ILUSTRACIONES: Ilustracion[] = [
  { clave: 'estrellas-fugaces', nombre: 'Estrellas fugaces', imagen: require('../../../assets/ilustraciones/estrellas-fugaces.png') },
  { clave: 'atardecer-via', nombre: 'Atardecer en la vía', imagen: require('../../../assets/ilustraciones/atardecer-via.png') },
  { clave: 'montanas', nombre: 'Montañas', imagen: require('../../../assets/ilustraciones/montanas.png') },
  { clave: 'bus', nombre: 'Bus de viaje', imagen: require('../../../assets/ilustraciones/bus.png') },
  { clave: 'brujula', nombre: 'Brújula', imagen: require('../../../assets/ilustraciones/brujula.png') },
  { clave: 'destino', nombre: 'Destino', imagen: require('../../../assets/ilustraciones/destino.png') },
  { clave: 'luna', nombre: 'Luna', imagen: require('../../../assets/ilustraciones/luna.png') },
  { clave: 'ciudad', nombre: 'Ciudad de noche', imagen: require('../../../assets/ilustraciones/ciudad.png') },
  { clave: 'mar', nombre: 'Mar', imagen: require('../../../assets/ilustraciones/mar.png') },
  { clave: 'volante', nombre: 'Volante', imagen: require('../../../assets/ilustraciones/volante.png') },
  { clave: 'bosque', nombre: 'Bosque', imagen: require('../../../assets/ilustraciones/bosque.png') },
  { clave: 'globo', nombre: 'Globo aerostático', imagen: require('../../../assets/ilustraciones/globo.png') }
];
