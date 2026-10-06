import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export interface OpcionChip<V extends string | number> {
  valor: V;
  texto: string;
  /** Numero pequeño dentro del chip (p. ej. cuantas cuentas pendientes). */
  cantidad?: number;
}

interface Props<V extends string | number> {
  opciones: OpcionChip<V>[];
  valor: V | null | undefined;
  onElegir: (valor: V) => void;
  etiqueta?: string;
  error?: string | null;
  /**
   * Una sola fila que se desliza de lado, en vez de partirse en varias.
   * Es para los filtros de las listas: en un telefono estrecho cuatro
   * pastillas no caben y la segunda fila queda descuadrada. La pastilla
   * cortada en el borde avisa de que hay mas.
   */
  desplazable?: boolean;
}

/** Grupo de pastillas de eleccion unica (.chip-filtro del web). */
export function Chips<V extends string | number>({
  opciones,
  valor,
  onElegir,
  etiqueta,
  error,
  desplazable = false
}: Props<V>) {
  const pastillas = opciones.map((o) => {
          const activo = o.valor === valor;
          return (
            <Pressable
              key={String(o.valor)}
              onPress={() => onElegir(o.valor)}
              style={[estilos.chip, activo && estilos.chipActivo]}
              accessibilityRole="radio"
              accessibilityState={{ checked: activo }}
            >
              <Text style={[estilos.texto, activo && estilos.textoActivo]}>{o.texto}</Text>
              {o.cantidad !== undefined && (
                <View style={[estilos.cantidad, activo && estilos.cantidadActiva]}>
                  <Text style={[estilos.cantidadTexto, activo && estilos.textoActivo]}>{o.cantidad}</Text>
                </View>
              )}
            </Pressable>
          );
  });

  return (
    <View style={{ gap: 6 }}>
      {etiqueta ? <Text style={typography.etiqueta}>{etiqueta}</Text> : null}
      {desplazable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // Llega hasta el borde de la pantalla (anula el margen de la
          // pantalla) para que se note que la fila continua.
          style={estilos.desplazable}
          contentContainerStyle={estilos.filaDesplazable}
          accessibilityRole="radiogroup"
        >
          {pastillas}
        </ScrollView>
      ) : (
        <View style={estilos.fila} accessibilityRole="radiogroup">
          {pastillas}
        </View>
      )}
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  desplazable: { marginHorizontal: -spacing.lg, flexGrow: 0 },
  filaDesplazable: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.linea,
    backgroundColor: colors.blanco
  },
  chipActivo: { backgroundColor: colors.vino, borderColor: colors.vino },
  texto: { fontSize: 13.5, fontWeight: '600', color: colors.texto },
  textoActivo: { color: colors.blanco },
  cantidad: {
    minWidth: 20,
    paddingHorizontal: 6,
    borderRadius: radius.full,
    backgroundColor: colors.fondoInput,
    alignItems: 'center'
  },
  cantidadActiva: { backgroundColor: 'rgba(255, 255, 255, 0.22)' },
  cantidadTexto: { fontSize: 11.5, fontWeight: '800', color: colors.muted },
  error: { fontSize: 12.5, fontWeight: '600', color: colors.error }
});
