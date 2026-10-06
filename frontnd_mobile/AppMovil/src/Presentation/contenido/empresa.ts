import { ImageSourcePropType } from 'react-native';
import { NombreIcono } from '../components/Icono';

// ============================================================
// CONTENIDO de la pagina principal (publica).
// Es el mismo texto de frontend-transporte/src/components/Landing.jsx:
// si la empresa cambia de telefono o de cifras, se cambia en los dos.
// ============================================================

export const EMPRESA = {
  nombre: "D' VIAJE",
  eslogan: 'Transporte especial de pasajeros',
  ciudad: 'Bogotá D.C., Colombia',
  direccion: 'Calle 26 # 68-35, Bogotá D.C.',
  telefono: '+57 601 000 0000',
  whatsapp: '+57 300 000 0000',
  correo: 'contacto@dviaje.com',
  horario: 'Lunes a sábado, 6:00 a.m. – 8:00 p.m.',
  anios: 12
};

export const CIFRAS = [
  { valor: '12', etiqueta: 'años de experiencia' },
  { valor: '45', etiqueta: 'vehículos en la flota' },
  { valor: '30 mil', etiqueta: 'viajes realizados' },
  { valor: '15', etiqueta: 'ciudades atendidas' }
];

interface Tarjeta {
  icono: NombreIcono;
  titulo: string;
  texto: string;
}

export const SERVICIOS: Tarjeta[] = [
  {
    icono: 'maletin',
    titulo: 'Transporte empresarial',
    texto:
      'Rutas fijas para el personal de tu empresa, con horarios controlados y reportes de cumplimiento por trayecto.'
  },
  {
    icono: 'escuela',
    titulo: 'Transporte escolar',
    texto:
      'Recorridos puerta a puerta con monitor a bordo, cinturones en todos los asientos y control de asistencia.'
  },
  {
    icono: 'montana',
    titulo: 'Turismo y excursiones',
    texto:
      'Viajes a destinos nacionales con conductores conocedores de la ruta y vehículos preparados para carretera.'
  },
  {
    icono: 'avion',
    titulo: 'Traslados al aeropuerto',
    texto:
      'Recogida y entrega puntual, seguimiento del vuelo y espacio suficiente para el equipaje de todo el grupo.'
  },
  {
    icono: 'usuarios',
    titulo: 'Eventos y convenciones',
    texto:
      'Coordinamos varios vehículos a la vez para mover grupos grandes sin que nadie se quede esperando.'
  },
  {
    icono: 'llave',
    titulo: 'Servicio por horas',
    texto:
      'Vehículo y conductor a disposición durante la jornada, ideal para agendas con varias paradas.'
  }
];

export const GARANTIAS: Tarjeta[] = [
  {
    icono: 'escudo',
    titulo: 'Documentación siempre vigente',
    texto:
      'SOAT, tecnomecánica, pólizas y tarjetas de operación con alertas automáticas antes de cada vencimiento.'
  },
  {
    icono: 'usuarios',
    titulo: 'Conductores certificados',
    texto:
      'Licencias al día, exámenes médicos, curso de manejo defensivo y evaluación permanente del servicio.'
  },
  {
    icono: 'gps',
    titulo: 'Monitoreo en ruta',
    texto:
      'Seguimiento satelital de cada servicio: sabemos dónde va el vehículo y a qué hora llegará.'
  },
  {
    icono: 'reloj',
    titulo: 'Mantenimiento preventivo',
    texto:
      'Cada vehículo tiene su hoja de vida con kilometraje, revisiones y próximo mantenimiento programado.'
  }
];

export const FLOTA: { imagen: ImageSourcePropType; titulo: string; capacidad: string; texto: string }[] = [
  {
    imagen: require('../../../assets/img/van-frontal.jpg'),
    titulo: 'Van ejecutiva',
    capacidad: '12 – 19 pasajeros',
    texto: 'Aire acondicionado, sillas reclinables y espacio para equipaje.'
  },
  {
    imagen: require('../../../assets/img/buseta-escolar.jpg'),
    titulo: 'Buseta escolar',
    capacidad: '20 – 30 pasajeros',
    texto: 'Cinturones en cada asiento, monitor a bordo y puerta con sensor.'
  },
  {
    imagen: require('../../../assets/img/interior-bus.jpg'),
    titulo: 'Bus de turismo',
    capacidad: '30 – 45 pasajeros',
    texto: 'Sillas amplias, bodega para maletas y equipo de sonido.'
  }
];

export const IMAGENES = {
  hero: require('../../../assets/img/hero-van.jpg') as ImageSourcePropType,
  empresa: require('../../../assets/img/van-blanca.jpg') as ImageSourcePropType
};

export type SeccionInicio = 'empresa' | 'servicios' | 'flota' | 'contacto';

export const ENLACES: [SeccionInicio, string][] = [
  ['empresa', 'La empresa'],
  ['servicios', 'Servicios'],
  ['flota', 'Flota'],
  ['contacto', 'Contacto']
];
