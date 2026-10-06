import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, sombras, spacing, typography } from '../theme';
import { Icono } from './Icono';

export interface OpcionSelector<V extends string | number> {
  valor: V;
  etiqueta: string;
  detalle?: string;
  /** Aviso corto a la derecha (p. ej. "Fuera de servicio"). */
  aviso?: string;
}

interface Props<V extends string | number> {
  etiqueta: string;
  valor: V | null | undefined;
  opciones: OpcionSelector<V>[];
  onElegir: (valor: V) => void;
  placeholder?: string;
  error?: string | null;
  deshabilitado?: boolean;
}

const sinTildes = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g'), '');

/**
 * Lista desplegable para el telefono: un campo que, al tocarlo, abre una
 * hoja con buscador. Reemplaza al <select> del panel web.
 */
export function Selector<V extends string | number>({
  etiqueta,
  valor,
  opciones,
  onElegir,
  placeholder = 'Elegir…',
  error,
  deshabilitado = false
}: Props<V>) {
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const elegida = opciones.find((o) => o.valor === valor);
  const visibles = useMemo(() => {
    const t = sinTildes(busqueda.trim());
    if (!t) return opciones;
    return opciones.filter((o) => sinTildes(`${o.etiqueta} ${o.detalle ?? ''}`).includes(t));
  }, [opciones, busqueda]);

  const cerrar = () => {
    setAbierto(false);
    setBusqueda('');
  };

  return (
    <View style={estilos.contenedor}>
      <Text style={typography.etiqueta}>{etiqueta}</Text>
      <Pressable
        onPress={() => setAbierto(true)}
        disabled={deshabilitado}
        style={({ pressed }) => [
          estilos.campo,
          pressed && estilos.campoPresionado,
          !!error && estilos.campoError,
          deshabilitado && estilos.bloqueado
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${etiqueta}: ${elegida?.etiqueta ?? 'sin elegir'}`}
      >
        <View style={{ flex: 1 }}>
          <Text style={[estilos.valor, !elegida && estilos.placeholder]} numberOfLines={1}>
            {elegida?.etiqueta ?? placeholder}
          </Text>
          {elegida?.detalle ? (
            <Text style={estilos.detalle} numberOfLines={1}>{elegida.detalle}</Text>
          ) : null}
        </View>
        <View style={{ transform: [{ rotate: '90deg' }] }}>
          <Icono nombre="derecha" tamano={18} color={colors.muted} />
        </View>
      </Pressable>
      {error ? <Text style={estilos.error}>{error}</Text> : null}

      <Modal visible={abierto} animationType="slide" transparent onRequestClose={cerrar}>
        <Pressable style={estilos.velo} onPress={cerrar} accessibilityLabel="Cerrar lista" />
        <View style={[estilos.hoja, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={estilos.hojaCabecera}>
            <Text style={typography.subtitulo}>{etiqueta}</Text>
            <Pressable onPress={cerrar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Icono nombre="cerrar" tamano={22} color={colors.muted} />
            </Pressable>
          </View>

          {opciones.length > 6 && (
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar…"
              placeholderTextColor={colors.muted2}
              style={estilos.buscador}
              autoCorrect={false}
            />
          )}

          <FlatList
            data={visibles}
            keyExtractor={(o) => String(o.valor)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={estilos.vacio}>No hay opciones que coincidan.</Text>}
            renderItem={({ item }) => {
              const activa = item.valor === valor;
              return (
                <Pressable
                  onPress={() => {
                    onElegir(item.valor);
                    cerrar();
                  }}
                  style={({ pressed }) => [estilos.opcion, (pressed || activa) && estilos.opcionActiva]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activa }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[estilos.opcionTexto, activa && { color: colors.vino }]}>{item.etiqueta}</Text>
                    {item.detalle ? <Text style={estilos.detalle}>{item.detalle}</Text> : null}
                  </View>
                  {item.aviso ? <Text style={estilos.aviso}>{item.aviso}</Text> : null}
                  {activa && <Icono nombre="ok" tamano={18} color={colors.rojo} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 6 },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea,
    borderRadius: radius.sm
  },
  campoPresionado: { borderColor: colors.rojo },
  campoError: { borderColor: colors.error, backgroundColor: colors.errorFondoCampo },
  bloqueado: { backgroundColor: colors.fondoInput, opacity: 0.7 },
  valor: { fontSize: 15, color: colors.texto },
  placeholder: { color: colors.muted2 },
  detalle: { fontSize: 12.5, color: colors.muted, marginTop: 1 },
  error: { fontSize: 12.5, fontWeight: '600', color: colors.error },
  velo: { flex: 1, backgroundColor: 'rgba(22, 24, 29, 0.4)' },
  hoja: {
    maxHeight: '75%',
    backgroundColor: colors.blanco,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    ...sombras.s3
  },
  hojaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md
  },
  buscador: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.fondoInput,
    color: colors.texto,
    fontSize: 15
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.linea2
  },
  opcionActiva: { backgroundColor: colors.rojoSuave },
  opcionTexto: { fontSize: 15, fontWeight: '600', color: colors.tinta },
  aviso: { fontSize: 12, fontWeight: '700', color: colors.ambar },
  vacio: { padding: spacing.xl, textAlign: 'center', color: colors.muted }
});
