import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppCard,
  AppInput,
  AvisoError,
  AvisoExito,
  Badge,
  Cargando,
  Chips,
  Dato,
  Icono,
  Pantalla,
  RejillaDatos,
  Selector
} from '../../components';
import { Flota, useAdminServicioDetalleViewModel } from '../../hooks';
import { Catalogos, lugarDeServicio, nombreConductor, nombreEstado } from '../../../Domain/entities';
import { colors, formatearFechaHora, formatearPesos, radius, spacing, tonoEstado, typography } from '../../theme';

interface Props {
  idServicio: number;
  catalogos: Catalogos;
  flota: Flota;
  onVolver: () => void;
}

/** VISTA: detalle de un servicio y reasignacion (estado, conductor, vehiculo). */
export const AdminServicioDetalleView = ({ idServicio, catalogos, flota, onVolver }: Props) => {
  const vm = useAdminServicioDetalleViewModel(idServicio, catalogos);

  const volver = (
    <Pressable onPress={onVolver} style={estilos.volver} hitSlop={8} accessibilityRole="button">
      <Icono nombre="izquierda" tamano={16} color={colors.rojo} />
      <Text style={estilos.volverTexto}>Servicios</Text>
    </Pressable>
  );

  if (vm.cargando || !vm.servicio) {
    return (
      <Pantalla titulo="Servicio" arriba={volver}>
        {vm.cargando ? <Cargando /> : vm.error && <AvisoError mensaje={vm.error} onReintentar={vm.reintentar} />}
      </Pantalla>
    );
  }

  const s = vm.servicio;
  const estadoActual = nombreEstado(catalogos, s.id_estado);
  const vehiculoElegido = vm.idVehiculo ? flota.vehiculoPorId.get(vm.idVehiculo) : undefined;
  const excedeCapacidad = vehiculoElegido && vehiculoElegido.capacidad_pasajeros < s.numero_pasajeros;

  return (
    <Pantalla titulo={s.codigo_servicio} subtitulo={s.tipo_servicio} arriba={volver}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {vm.error && <AvisoError mensaje={vm.error} />}
        {vm.aviso && <AvisoExito mensaje={vm.aviso} />}

        <AppCard>
          <Badge texto={estadoActual} tono={tonoEstado(estadoActual)} />
          <View style={estilos.ruta}>
            <View style={{ gap: 3 }}>
              <Text style={typography.rotulo}>Salida</Text>
              <Text style={estilos.lugar}>{lugarDeServicio(catalogos, s.origen, s.id_origen)}</Text>
              <Text style={estilos.hora}>{formatearFechaHora(s.fecha_salida)}</Text>
            </View>
            <View style={{ alignSelf: 'center', transform: [{ rotate: '90deg' }] }}>
              <Icono nombre="flechaLarga" tamano={22} color={colors.rojo} />
            </View>
            <View style={{ gap: 3 }}>
              <Text style={typography.rotulo}>Llegada estimada</Text>
              <Text style={estilos.lugar}>{lugarDeServicio(catalogos, s.destino, s.id_destino)}</Text>
              <Text style={estilos.hora}>{formatearFechaHora(s.fecha_llegada_estimada)}</Text>
            </View>
          </View>
          <RejillaDatos>
            <Dato rotulo="Llegada real" valor={formatearFechaHora(s.fecha_llegada_real)} />
            <Dato rotulo="Pasajeros" valor={String(s.numero_pasajeros)} />
            <Dato rotulo="Valor" valor={formatearPesos(s.precio_total)} />
            <Dato rotulo="Distancia" valor={s.distancia_estimada_km ? `${s.distancia_estimada_km} km` : '—'} />
          </RejillaDatos>
        </AppCard>

        <AppCard>
          <View style={{ gap: 3 }}>
            <Text style={[typography.rotulo, { fontWeight: '800' }]}>Despacho</Text>
            <Text style={typography.subtitulo}>Asignación y estado</Text>
          </View>

          <Chips
            etiqueta="Estado"
            opciones={catalogos.estados.map((e) => ({ valor: e.id_estado, texto: e.nombre_estado }))}
            valor={vm.idEstado}
            onElegir={vm.setIdEstado}
          />

          <Selector
            etiqueta="Conductor"
            valor={vm.idConductor}
            onElegir={vm.setIdConductor}
            placeholder={flota.cargando ? 'Cargando conductores…' : 'Elegir conductor'}
            opciones={flota.conductores.map((c) => ({
              valor: c.id_conductor,
              etiqueta: nombreConductor(c),
              detalle: c.email,
              aviso: c.activo === false ? 'Inactivo' : undefined
            }))}
          />

          <Selector
            etiqueta="Vehículo"
            valor={vm.idVehiculo}
            onElegir={vm.setIdVehiculo}
            placeholder={flota.cargando ? 'Cargando vehículos…' : 'Elegir vehículo'}
            error={excedeCapacidad ? `Este vehículo lleva ${vehiculoElegido?.capacidad_pasajeros} pasajeros y el servicio tiene ${s.numero_pasajeros}.` : null}
            opciones={flota.vehiculos.map((v) => ({
              valor: v.id_vehiculo,
              etiqueta: v.placa,
              detalle: `${v.marca} ${v.linea} · ${v.capacidad_pasajeros} pasajeros`,
              aviso: v.estado_operativo ? undefined : 'Fuera de servicio'
            }))}
          />

          <AppInput
            etiqueta="Observaciones"
            valor={vm.observaciones}
            onCambio={vm.setObservaciones}
            placeholder="Indicaciones para el conductor"
            multilinea
          />

          <AppButton
            titulo={vm.hayCambios ? 'Guardar cambios' : 'Sin cambios'}
            icono="ok"
            onPress={vm.guardar}
            cargando={vm.guardando}
            deshabilitado={!vm.hayCambios}
          />
          <Text style={typography.ayuda}>
            Al pasar el viaje a Finalizado se registra la hora real de llegada.
          </Text>
        </AppCard>
      </ScrollView>
    </Pantalla>
  );
};

const estilos = StyleSheet.create({
  contenido: { gap: 14, paddingBottom: spacing.xxl },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  volverTexto: { color: colors.rojo, fontWeight: '700', fontSize: 14 },
  ruta: { backgroundColor: colors.papel, borderRadius: radius.sm, padding: spacing.lg, gap: spacing.md },
  lugar: { fontSize: 15, fontWeight: '700', color: colors.tinta },
  hora: { fontSize: 13, color: colors.muted }
});
