import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppCard,
  AvisoError,
  Badge,
  Cargando,
  Chips,
  Dato,
  Icono,
  Pantalla,
  RejillaDatos,
  SinDatos
} from '../../components';
import { Flota, FiltroServiciosAdmin, useAdminServiciosViewModel } from '../../hooks';
import {
  Catalogos,
  Servicio,
  estaCerrado,
  nombreConductor,
  lugarDeServicio,
  nombreEstado,
  vaConRetraso
} from '../../../Domain/entities';
import { colors, formatearFechaHora, radius, spacing, TONOS, tonoEstado, typography } from '../../theme';

interface Props {
  catalogos: Catalogos;
  flota: Flota;
  filtroInicial: string | null;
  onAbrir: (idServicio: number) => void;
  onNuevo: () => void;
}

/** VISTA: todos los servicios, con conductor y vehiculo, para despachar desde el telefono. */
export const AdminServiciosView = ({ catalogos, flota, filtroInicial, onAbrir, onNuevo }: Props) => {
  const vm = useAdminServiciosViewModel(catalogos, filtroInicial);

  const tarjeta = (s: Servicio) => {
    const estado = nombreEstado(catalogos, s.id_estado);
    const vehiculo = flota.vehiculoPorId.get(s.id_vehiculo);
    const conductor = flota.conductorPorId.get(s.id_conductor);

    return (
      <AppCard onPress={() => onAbrir(s.id_servicio)}>
        <View style={estilos.top}>
          <Text style={estilos.codigo}>{s.codigo_servicio}</Text>
          <Badge texto={estado} tono={tonoEstado(estado)} />
        </View>

        <View style={estilos.ruta}>
          <Text style={estilos.lugar} numberOfLines={1}>{lugarDeServicio(catalogos, s.origen, s.id_origen)}</Text>
          <Icono nombre="flechaLarga" tamano={18} color={colors.rojo} />
          <Text style={[estilos.lugar, { textAlign: 'right' }]} numberOfLines={1}>{lugarDeServicio(catalogos, s.destino, s.id_destino)}</Text>
        </View>

        <RejillaDatos>
          <Dato rotulo="Salida" valor={formatearFechaHora(s.fecha_salida)} />
          <Dato rotulo="Pasajeros" valor={String(s.numero_pasajeros)} />
          <Dato rotulo="Conductor" valor={flota.cargando ? '…' : nombreConductor(conductor)} />
          <Dato rotulo="Vehículo" valor={flota.cargando ? '…' : vehiculo?.placa ?? 'Sin asignar'} />
        </RejillaDatos>

        {!estaCerrado(estado) && vaConRetraso(s) && <Badge texto="Fuera de horario" tono={TONOS.programado} />}
        {vehiculo && !vehiculo.estado_operativo && !estaCerrado(estado) && (
          <Badge texto="Vehículo fuera de servicio" tono={TONOS.cancelado} />
        )}
      </AppCard>
    );
  };

  const FILTROS: { valor: FiltroServiciosAdmin; texto: string }[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'hoy', texto: 'Hoy' },
    { valor: 'curso', texto: 'En curso' },
    { valor: 'retrasados', texto: 'Retrasados' }
  ];

  return (
    <Pantalla
      titulo="Servicios"
      subtitulo="Todos los viajes de la flota."
      accion={<AppButton titulo="Nuevo" icono="ruta" pequeno onPress={onNuevo} />}
    >
      <View style={estilos.filtros}>
        <Chips
          opciones={FILTROS.map((f) => ({ ...f, cantidad: vm.cargando ? undefined : vm.conteos[f.valor] }))}
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
        <Cargando texto="Consultando servicios…" />
      ) : (
        <FlatList
          data={vm.servicios}
          keyExtractor={(s) => String(s.id_servicio)}
          renderItem={({ item }) => tarjeta(item)}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.refrescando}
              onRefresh={() => {
                vm.refrescar();
                flota.refrescar();
              }}
              colors={[colors.rojo]}
              tintColor={colors.rojo}
            />
          }
          ListEmptyComponent={
            vm.error ? null : (
              <SinDatos
                titulo={vm.filtro === 'todos' ? 'Todavía no hay servicios' : 'Ningún servicio en esta vista'}
                detalle={vm.filtro === 'todos' ? 'Crea el primero con el botón «Nuevo».' : 'Prueba con otro filtro.'}
              />
            )
          }
        />
      )}
    </Pantalla>
  );
};

const estilos = StyleSheet.create({
  filtros: { marginBottom: spacing.md },
  lista: { gap: 14, paddingBottom: spacing.xxl, flexGrow: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  codigo: { ...typography.subtitulo, flexShrink: 1 },
  ruta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.papel,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  lugar: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.tinta }
});
