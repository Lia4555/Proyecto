import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { Pestana } from '../hooks/useNavegacion';
import { Icono, NombreIcono } from './Icono';

export interface DefinicionPestana {
  id: Pestana;
  icono: NombreIcono;
  titulo: string;
}

// Mismas secciones e iconos que las pestañas del panel web (.cond-tabs),
// llevadas abajo, que es donde el pulgar llega en un telefono.
export const PESTANAS_CONDUCTOR: DefinicionPestana[] = [
  { id: 'servicios', icono: 'ruta', titulo: 'Servicios' },
  { id: 'vehiculo', icono: 'bus', titulo: 'Vehículo' },
  { id: 'alertas', icono: 'campana', titulo: 'Alertas' },
  { id: 'perfil', icono: 'usuario', titulo: 'Perfil' }
];

export const PESTANAS_ADMIN: DefinicionPestana[] = [
  { id: 'resumen', icono: 'inicio', titulo: 'Resumen' },
  { id: 'servicios', icono: 'ruta', titulo: 'Servicios' },
  { id: 'cuentas', icono: 'usuarios', titulo: 'Cuentas' },
  { id: 'gestion', icono: 'herramienta', titulo: 'Gestión' },
  { id: 'alertas', icono: 'campana', titulo: 'Alertas' },
  { id: 'perfil', icono: 'usuario', titulo: 'Perfil' }
];

interface Props {
  pestanas: DefinicionPestana[];
  activa: Pestana;
  onCambiar: (pestana: Pestana) => void;
  /** Numero rojo sobre el icono de cada pestaña (p. ej. alertas o cuentas pendientes). */
  avisos?: Partial<Record<Pestana, number>>;
}

/** Barra inferior. Navegacion propia, sin librerias externas. */
export const BarraNavegacion = ({ pestanas, activa, onCambiar, avisos = {} }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[estilos.barra, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {pestanas.map((pestana) => {
        const seleccionada = pestana.id === activa;
        const cantidad = avisos[pestana.id] ?? 0;
        const color = seleccionada ? colors.rojo : colors.muted;

        return (
          <Pressable
            key={pestana.id}
            onPress={() => onCambiar(pestana.id)}
            style={estilos.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: seleccionada }}
            accessibilityLabel={cantidad > 0 ? `${pestana.titulo}, ${cantidad} pendientes` : pestana.titulo}
          >
            <View style={[estilos.indicador, seleccionada && estilos.indicadorActivo]} />
            <View>
              <Icono nombre={pestana.icono} tamano={22} color={color} />
              {cantidad > 0 && (
                <View style={estilos.badge}>
                  <Text style={estilos.badgeTexto}>{cantidad > 9 ? '9+' : cantidad}</Text>
                </View>
              )}
            </View>
            <Text style={[estilos.titulo, { color }]} numberOfLines={1}>
              {pestana.titulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: colors.blanco,
    borderTopWidth: 1,
    borderTopColor: colors.linea
  },
  item: { flex: 1, alignItems: 'center', gap: 3, paddingBottom: spacing.xs },
  indicador: { alignSelf: 'stretch', height: 3, marginHorizontal: 14, marginBottom: 7, borderRadius: 2 },
  indicadorActivo: { backgroundColor: colors.rojo },
  titulo: { fontSize: 11, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.blanco,
    backgroundColor: colors.rojo,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeTexto: { color: colors.blanco, fontSize: 10, fontWeight: '800' }
});
