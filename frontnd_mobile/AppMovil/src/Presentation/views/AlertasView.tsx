import React from 'react';
import { FlatList, ListRenderItemInfo, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AvisoError, Badge, Cargando, Icono, Pantalla, SinDatos } from '../components';
import { useAlertasViewModel } from '../hooks';
import { Alerta } from '../../Domain/entities';
import { colors, formatearFecha, radius, sombras, spacing, Tono, TONOS } from '../theme';

const prioridad = (valor: number): { texto: string; tono: Tono } => {
  if (valor >= 3) return { texto: 'Prioridad alta', tono: TONOS.cancelado };
  if (valor === 2) return { texto: 'Prioridad media', tono: TONOS.programado };
  return { texto: 'Prioridad baja', tono: TONOS.curso };
};

/** VISTA: avisos dirigidos al usuario (.alerta-card del web). */
export const AlertasView = ({ vm }: { vm: ReturnType<typeof useAlertasViewModel> }) => {
  const tarjeta = (alerta: Alerta) => {
    const resuelta = alerta.estado_resuelta;
    const p = prioridad(alerta.prioridad);

    return (
      <View style={[estilos.tarjeta, resuelta && estilos.resuelta]}>
        <View style={[estilos.icono, resuelta && estilos.iconoResuelta]}>
          <Icono
            nombre={resuelta ? 'ok' : 'campana'}
            tamano={18}
            color={resuelta ? colors.verdeTexto : colors.vino}
          />
        </View>
        <View style={estilos.cuerpo}>
          <View style={estilos.top}>
            <Text style={estilos.tipo}>{alerta.tipo_alerta ?? 'Aviso'}</Text>
            <Badge
              conPunto={false}
              texto={resuelta ? 'Resuelta' : p.texto}
              tono={resuelta ? TONOS.hecho : p.tono}
            />
          </View>
          <Text style={estilos.texto}>{alerta.descripcion}</Text>
          {alerta.fecha_limite && (
            <View style={estilos.pie}>
              <Icono nombre="calendario" tamano={14} color={colors.muted} />
              <Text style={estilos.ref}>Fecha límite: {formatearFecha(alerta.fecha_limite)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Pantalla
      titulo="Mis alertas"
      subtitulo={
        vm.pendientes === 0
          ? 'No tienes avisos sin resolver.'
          : `${vm.pendientes} aviso${vm.pendientes === 1 ? '' : 's'} sin resolver.`
      }
    >
      {vm.error && (
        <View style={{ marginBottom: spacing.md }}>
          <AvisoError mensaje={vm.error} onReintentar={vm.reintentar} />
        </View>
      )}

      {vm.cargando ? (
        <Cargando texto="Consultando alertas…" />
      ) : (
        <FlatList
          data={vm.alertas}
          keyExtractor={(item: Alerta) => String(item.id_alerta)}
          renderItem={({ item }: ListRenderItemInfo<Alerta>) => tarjeta(item)}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.refrescando}
              onRefresh={vm.refrescar}
              colors={[colors.rojo]}
              tintColor={colors.rojo}
            />
          }
          ListEmptyComponent={
            // Con error no se sabe si hay alertas: "Todo en orden" seria engañoso.
            vm.error ? null : (
              <SinDatos positivo titulo="Todo en orden" detalle="No tienes alertas pendientes." />
            )
          }
        />
      )}
    </Pantalla>
  );
};

const estilos = StyleSheet.create({
  lista: { gap: 14, paddingBottom: spacing.xxl, flexGrow: 1 },
  tarjeta: {
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea,
    borderLeftWidth: 4,
    borderLeftColor: colors.rojo,
    borderRadius: radius.md,
    ...sombras.s1
  },
  resuelta: { borderLeftColor: colors.verde, opacity: 0.72 },
  icono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.rojoSuave,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconoResuelta: { backgroundColor: colors.verdeSuave },
  cuerpo: { flex: 1, gap: 8 },
  top: { gap: 6 },
  tipo: { fontSize: 15.5, fontWeight: '800', color: colors.tinta },
  texto: { fontSize: 14.5, lineHeight: 21, color: colors.texto },
  pie: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ref: { fontSize: 12.5, color: colors.muted, fontWeight: '600' }
});
