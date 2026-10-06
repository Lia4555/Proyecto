import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AppButton, AvisoError, Badge, Cargando, Chips, Icono, Pantalla, SinDatos } from '../../components';
import { Flota, FiltroAlertas, useAdminAlertasViewModel } from '../../hooks';
import { Alerta, nombreConductor } from '../../../Domain/entities';
import { colors, formatearFecha, radius, sombras, spacing, Tono, TONOS } from '../../theme';

const prioridad = (valor: number): { texto: string; tono: Tono } => {
  if (valor >= 4) return { texto: `Prioridad ${valor} · alta`, tono: TONOS.cancelado };
  if (valor === 3) return { texto: 'Prioridad 3 · media', tono: TONOS.programado };
  return { texto: `Prioridad ${valor} · baja`, tono: TONOS.curso };
};

interface Props {
  flota: Flota;
  onNueva: () => void;
}

/** VISTA: todas las alertas enviadas, con quien las recibe, y la opcion de resolverlas. */
export const AdminAlertasView = ({ flota, onNueva }: Props) => {
  const vm = useAdminAlertasViewModel();

  const tarjeta = (a: Alerta) => {
    const p = prioridad(a.prioridad);
    const resuelta = a.estado_resuelta;
    return (
      <View style={[estilos.tarjeta, resuelta && estilos.resuelta]}>
        <View style={[estilos.icono, resuelta && { backgroundColor: colors.verdeSuave }]}>
          <Icono nombre={resuelta ? 'ok' : 'campana'} tamano={18} color={resuelta ? colors.verdeTexto : colors.vino} />
        </View>
        <View style={estilos.cuerpo}>
          <Text style={estilos.tipo}>{a.tipo_alerta ?? 'Aviso'}</Text>
          <Badge conPunto={false} texto={resuelta ? 'Resuelta' : p.texto} tono={resuelta ? TONOS.hecho : p.tono} />
          <Text style={estilos.texto}>{a.descripcion}</Text>
          <View style={estilos.pie}>
            <Icono nombre="usuario" tamano={14} color={colors.muted} />
            <Text style={estilos.ref}>
              {flota.cargando ? '…' : nombreConductor(flota.conductorPorId.get(a.id_usuario_destino))}
            </Text>
            {a.fecha_limite ? (
              <>
                <Icono nombre="calendario" tamano={14} color={colors.muted} />
                <Text style={estilos.ref}>{formatearFecha(a.fecha_limite)}</Text>
              </>
            ) : null}
          </View>
          {!resuelta && (
            <AppButton
              titulo="Marcar como resuelta"
              icono="ok"
              variante="ghost"
              pequeno
              cargando={vm.procesando === a.id_alerta}
              onPress={() => vm.resolver(a)}
            />
          )}
        </View>
      </View>
    );
  };

  const FILTROS: { valor: FiltroAlertas; texto: string; cantidad: number }[] = [
    { valor: 'pendientes', texto: 'Sin resolver', cantidad: vm.pendientes },
    { valor: 'resueltas', texto: 'Resueltas', cantidad: vm.alertas.length - vm.pendientes },
    { valor: 'todas', texto: 'Todas', cantidad: vm.alertas.length }
  ];

  return (
    <Pantalla
      titulo="Alertas"
      subtitulo="Avisos enviados a los conductores."
      accion={<AppButton titulo="Nueva" icono="campana" pequeno onPress={onNueva} />}
    >
      <View style={{ marginBottom: spacing.md }}>
        <Chips
          opciones={FILTROS.map((f) => ({ ...f, cantidad: vm.cargando ? undefined : f.cantidad }))}
          valor={vm.filtro}
          onElegir={vm.setFiltro}
          desplazable
        />
      </View>

      {vm.error && (
        <View style={{ marginBottom: spacing.md }}>
          <AvisoError mensaje={vm.error} onReintentar={vm.reintentar} />
        </View>
      )}

      {vm.cargando ? (
        <Cargando texto="Consultando alertas…" />
      ) : (
        <FlatList
          data={vm.visibles}
          keyExtractor={(a) => String(a.id_alerta)}
          renderItem={({ item }) => tarjeta(item)}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={vm.refrescando} onRefresh={vm.refrescar} colors={[colors.rojo]} tintColor={colors.rojo} />}
          ListEmptyComponent={
            vm.error ? null : vm.filtro === 'pendientes' ? (
              <SinDatos positivo titulo="Todo en orden" detalle="No hay alertas sin resolver." />
            ) : (
              <SinDatos titulo="No hay alertas en esta vista" />
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
  resuelta: { borderLeftColor: colors.verde, opacity: 0.78 },
  icono: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.rojoSuave, alignItems: 'center', justifyContent: 'center' },
  cuerpo: { flex: 1, gap: 8 },
  tipo: { fontSize: 15.5, fontWeight: '800', color: colors.tinta },
  texto: { fontSize: 14.5, lineHeight: 21, color: colors.texto },
  pie: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  ref: { fontSize: 12.5, color: colors.muted, fontWeight: '600', marginRight: 8 }
});
