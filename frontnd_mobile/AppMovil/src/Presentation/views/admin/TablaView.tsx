import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput, AvisoError, AvisoExito, Cargando, Icono } from '../../components';
import { Fila, Tabla } from '../../../Domain/entities';
import { textoDeCampo } from '../../../Domain/useCases';
import { useTablaViewModel } from '../../hooks/useTablaViewModel';
import { FormularioTablaView } from './FormularioTablaView';
import { colors, spacing, typography } from '../../theme';

// ============================================================
//  LISTA GENERICA DE UNA TABLA
// ------------------------------------------------------------
//  Vale para las 15 tablas. Cada fila se resume en una tarjeta
//  con los campos que marca `columnas` en la configuracion, y
//  siempre con NOMBRES en vez de ids.
// ============================================================

interface Props {
  tabla: Tabla;
  onVolver: () => void;
}

export const TablaView = ({ tabla, onVolver }: Props) => {
  const vm = useTablaViewModel(tabla);
  // null = cerrado · { fila: null } = crear · { fila } = editar
  const [formulario, setFormulario] = useState<{ fila: Fila | null } | null>(null);

  if (formulario) {
    return (
      <FormularioTablaView
        vm={vm}
        fila={formulario.fila}
        onCerrar={() => setFormulario(null)}
      />
    );
  }

  const confirmarBorrado = (fila: Fila) => {
    Alert.alert(
      'Eliminar registro',
      `Se eliminará «${vm.etiqueta(fila)}» de ${tabla.label}. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, eliminar', style: 'destructive', onPress: () => vm.eliminar(fila) }
      ]
    );
  };

  // Campos que se resumen en la tarjeta: los de `columnas`, o los
  // primeros del formulario si la tabla no los define.
  const resumen = (tabla.columnas ?? tabla.fields.slice(0, 4).map((f) => f.name)).filter(
    (c) => c !== tabla.pk
  );

  const tarjeta = (fila: Fila) => (
    <AppCard>
      <Text style={typography.subtitulo}>{vm.etiqueta(fila)}</Text>

      <View style={estilos.datos}>
        {resumen.map((clave) => {
          const campo = tabla.fields.find((f) => f.name === clave);
          return (
            <View key={clave} style={estilos.dato}>
              <Text style={typography.rotulo}>{campo?.label ?? clave}</Text>
              <Text style={typography.valor} numberOfLines={2}>
                {textoDeCampo(campo, fila[clave], vm.referencias)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={estilos.acciones}>
        <AppButton
          titulo="Editar"
          icono="editar"
          variante="ghost"
          pequeno
          deshabilitado={vm.guardando}
          onPress={() => setFormulario({ fila })}
          estilo={{ flex: 1 }}
        />
        <AppButton
          titulo="Eliminar"
          variante="peligro"
          pequeno
          deshabilitado={vm.guardando}
          onPress={() => confirmarBorrado(fila)}
          estilo={{ flex: 1 }}
        />
      </View>
    </AppCard>
  );

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabecera}>
        <AppButton titulo="Volver" icono="izquierda" variante="ghost" pequeno onPress={onVolver} />
        <View style={{ flex: 1 }}>
          <Text style={typography.titulo}>{tabla.label}</Text>
          <Text style={typography.ayuda}>
            {vm.total} registro{vm.total === 1 ? '' : 's'} · {tabla.descripcion}
          </Text>
        </View>
      </View>

      <View style={estilos.barra}>
        <AppInput
          etiqueta=""
          valor={vm.busqueda}
          onCambio={vm.setBusqueda}
          placeholder={`Buscar en ${tabla.label.toLowerCase()}…`}
        />
        <AppButton
          titulo="Nuevo registro"
          onPress={() => setFormulario({ fila: null })}
        />
      </View>

      {vm.aviso && <AvisoExito mensaje={vm.aviso} />}
      {vm.error && <AvisoError mensaje={vm.error} onReintentar={vm.refrescar} />}

      {vm.cargando ? (
        <Cargando texto={`Cargando ${tabla.label.toLowerCase()}…`} />
      ) : (
        <FlatList
          data={vm.filas}
          keyExtractor={(f, i) => String(f[tabla.pk] ?? i)}
          renderItem={({ item }) => tarjeta(item)}
          contentContainerStyle={estilos.lista}
          onRefresh={vm.refrescar}
          refreshing={false}
          ListEmptyComponent={
            <View style={estilos.vacio}>
              <Icono nombre="alerta" tamano={32} color={colors.muted} />
              <Text style={typography.subtitulo}>
                {vm.busqueda ? 'Sin resultados' : 'Aún no hay registros'}
              </Text>
              <Text style={typography.ayuda}>
                {vm.busqueda
                  ? 'Prueba con otro término de búsqueda.'
                  : 'Crea el primero con «Nuevo registro».'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colors.papel },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.sm
  },
  barra: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm },
  lista: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  datos: { gap: spacing.xs, marginTop: spacing.xs },
  dato: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  acciones: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  vacio: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl }
});
