import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppCard,
  AppInput,
  AvisoError,
  Chips,
  Icono,
  Pantalla,
  Selector
} from '../../components';
import { Flota, useNuevoServicioViewModel } from '../../hooks';
import { Catalogos, TIPOS_SERVICIO, nombreConductor } from '../../../Domain/entities';
import { colors, mascaraFecha, mascaraHora, spacing, typography } from '../../theme';

interface Props {
  catalogos: Catalogos;
  flota: Flota;
  onCerrar: () => void;
  onCreado: () => void;
}

const Seccion = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <AppCard>
    <Text style={[typography.rotulo, { fontWeight: '800' }]}>{titulo}</Text>
    {children}
  </AppCard>
);

/** VISTA: formulario para crear un servicio y asignarlo a un conductor. */
export const NuevoServicioView = ({ catalogos, flota, onCerrar, onCreado }: Props) => {
  const vm = useNuevoServicioViewModel(catalogos);
  const { valores: v, set, errores: e } = vm;

  const destinos = catalogos.destinos.map((d) => ({
    valor: d.id_destino,
    etiqueta: d.nombre_destino,
    detalle: d.ciudad
  }));
  const vehiculo = v.idVehiculo ? flota.vehiculoPorId.get(v.idVehiculo) : undefined;
  const pasajeros = Number(v.pasajeros || 0);

  const crear = async () => {
    if (await vm.crear()) onCreado();
  };

  const cerrar = (
    <Pressable onPress={onCerrar} style={estilos.volver} hitSlop={8} accessibilityRole="button">
      <Icono nombre="izquierda" tamano={16} color={colors.rojo} />
      <Text style={estilos.volverTexto}>Cancelar</Text>
    </Pressable>
  );

  return (
    <Pantalla titulo="Nuevo servicio" subtitulo="Queda asignado al conductor que elijas." arriba={cerrar}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Seccion titulo="Servicio">
            <AppInput etiqueta="Código" valor={v.codigo} onCambio={set.codigo} error={e.codigo_servicio} />
            <Chips
              etiqueta="Tipo"
              opciones={TIPOS_SERVICIO.map((t) => ({ valor: t, texto: t }))}
              valor={v.tipo}
              onElegir={set.tipo}
            />
          </Seccion>

          <Seccion titulo="Ruta y horario">
            <Selector etiqueta="Origen" valor={v.idOrigen} onElegir={set.idOrigen} opciones={destinos} error={e.id_origen} />
            <Selector etiqueta="Destino" valor={v.idDestino} onElegir={set.idDestino} opciones={destinos} error={e.id_destino} />

            <View style={estilos.dos}>
              <View style={{ flex: 3 }}>
                <AppInput etiqueta="Fecha de salida" valor={v.fechaSalida} onCambio={(t) => set.fechaSalida(mascaraFecha(t))} placeholder="DD/MM/AAAA" tipoTeclado="number-pad" error={e.fecha_salida_dia ?? e.fecha_salida} />
              </View>
              <View style={{ flex: 2 }}>
                <AppInput etiqueta="Hora" valor={v.horaSalida} onCambio={(t) => set.horaSalida(mascaraHora(t))} placeholder="HH:MM" tipoTeclado="number-pad" error={e.hora_salida} />
              </View>
            </View>
            <View style={estilos.dos}>
              <View style={{ flex: 3 }}>
                <AppInput etiqueta="Llegada estimada" valor={v.fechaLlegada} onCambio={(t) => set.fechaLlegada(mascaraFecha(t))} placeholder="DD/MM/AAAA" tipoTeclado="number-pad" error={e.fecha_llegada_dia ?? e.fecha_llegada_estimada} />
              </View>
              <View style={{ flex: 2 }}>
                <AppInput etiqueta="Hora" valor={v.horaLlegada} onCambio={(t) => set.horaLlegada(mascaraHora(t))} placeholder="HH:MM" tipoTeclado="number-pad" error={e.hora_llegada} />
              </View>
            </View>
          </Seccion>

          <Seccion titulo="Pasajeros y valor">
            <View style={estilos.dos}>
              <View style={{ flex: 1 }}>
                <AppInput etiqueta="Pasajeros" valor={v.pasajeros} onCambio={set.pasajeros} tipoTeclado="number-pad" error={e.numero_pasajeros} />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput etiqueta="Valor (COP)" valor={v.precio} onCambio={set.precio} tipoTeclado="number-pad" placeholder="350000" error={e.precio_total} />
              </View>
            </View>
          </Seccion>

          <Seccion titulo="Asignación">
            <Selector
              etiqueta="Conductor"
              valor={v.idConductor}
              onElegir={set.idConductor}
              error={e.id_conductor}
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
              valor={v.idVehiculo}
              onElegir={set.idVehiculo}
              placeholder={flota.cargando ? 'Cargando vehículos…' : 'Elegir vehículo'}
              error={
                e.id_vehiculo ??
                (vehiculo && pasajeros > vehiculo.capacidad_pasajeros
                  ? `Este vehículo lleva ${vehiculo.capacidad_pasajeros} pasajeros.`
                  : null)
              }
              opciones={flota.vehiculos.map((x) => ({
                valor: x.id_vehiculo,
                etiqueta: x.placa,
                detalle: `${x.marca} ${x.linea} · ${x.capacidad_pasajeros} pasajeros`,
                aviso: x.estado_operativo ? undefined : 'Fuera de servicio'
              }))}
            />
            <Chips
              etiqueta="Estado inicial"
              opciones={catalogos.estados.map((x) => ({ valor: x.id_estado, texto: x.nombre_estado }))}
              valor={v.idEstado}
              onElegir={set.idEstado}
              error={e.id_estado}
            />
            <AppInput etiqueta="Observaciones (opcional)" valor={v.observaciones} onCambio={set.observaciones} placeholder="Indicaciones para el conductor" multilinea />
          </Seccion>

          {vm.error && <AvisoError mensaje={vm.error} />}
          <AppButton titulo="Crear servicio" icono="ok" onPress={crear} cargando={vm.guardando} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
};

const estilos = StyleSheet.create({
  contenido: { gap: 14, paddingBottom: spacing.xxl },
  dos: { flexDirection: 'row', gap: spacing.md },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  volverTexto: { color: colors.rojo, fontWeight: '700', fontSize: 14 }
});
