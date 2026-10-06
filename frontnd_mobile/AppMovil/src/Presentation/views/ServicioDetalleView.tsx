import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppCard,
  AppInput,
  AvisoError,
  AvisoExito,
  Badge,
  Cargando,
  Dato,
  Icono,
  Pantalla,
  RejillaDatos,
  SinDatos
} from '../components';
import { useServicioDetalleViewModel } from '../hooks';
import { Catalogos, EstadoServicio, lugarDeServicio, nombreEstado } from '../../Domain/entities';
import {
  colors,
  formatearFechaHora,
  formatearPesos,
  radius,
  spacing,
  tonoEstado,
  typography
} from '../theme';

interface Props {
  idServicio: number;
  catalogos: Catalogos;
  onVolver: () => void;
  soloLectura: boolean;
}

/** VISTA: detalle del viaje y cambio de estado (el dialogo CambiarEstado del web, a pantalla completa). */
export const ServicioDetalleView = ({ idServicio, catalogos, onVolver, soloLectura }: Props) => {
  const vm = useServicioDetalleViewModel(idServicio);
  const [elegido, setElegido] = useState<EstadoServicio | null>(null);

  const volver = (
    <Pressable onPress={onVolver} style={estilos.volver} hitSlop={8} accessibilityRole="button">
      <Icono nombre="izquierda" tamano={16} color={colors.rojo} />
      <Text style={estilos.volverTexto}>Mis servicios</Text>
    </Pressable>
  );

  if (vm.cargando) {
    return (
      <Pantalla titulo="Servicio" arriba={volver}>
        <Cargando />
      </Pantalla>
    );
  }

  if (!vm.servicio) {
    return (
      <Pantalla titulo="Servicio" arriba={volver}>
        <View style={estilos.contenido}>
          {vm.error && <AvisoError mensaje={vm.error} onReintentar={vm.reintentar} />}
          <SinDatos titulo="Servicio no disponible" />
        </View>
      </Pantalla>
    );
  }

  const servicio = vm.servicio;
  const estadoActual = nombreEstado(catalogos, servicio.id_estado);
  const opciones = catalogos.estados.filter((e) => e.id_estado !== servicio.id_estado);

  const guardar = async () => {
    if (!elegido) return;
    await vm.cambiarEstado(elegido);
    setElegido(null);
  };

  return (
    <Pantalla titulo={servicio.codigo_servicio} subtitulo={servicio.tipo_servicio} arriba={volver}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {vm.error && <AvisoError mensaje={vm.error} onReintentar={vm.reintentar} />}
        {vm.aviso && <AvisoExito mensaje={vm.aviso} />}

        <AppCard>
          <Badge texto={estadoActual} tono={tonoEstado(estadoActual)} />
          <View style={estilos.ruta}>
            <View style={estilos.punto}>
              <Text style={typography.rotulo}>Salida</Text>
              <Text style={estilos.lugar}>{lugarDeServicio(catalogos, servicio.origen, servicio.id_origen)}</Text>
              <Text style={estilos.hora}>{formatearFechaHora(servicio.fecha_salida)}</Text>
            </View>
            <View style={estilos.flecha}>
              <Icono nombre="flechaLarga" tamano={22} color={colors.rojo} />
            </View>
            <View style={estilos.punto}>
              <Text style={typography.rotulo}>Llegada estimada</Text>
              <Text style={estilos.lugar}>{lugarDeServicio(catalogos, servicio.destino, servicio.id_destino)}</Text>
              <Text style={estilos.hora}>{formatearFechaHora(servicio.fecha_llegada_estimada)}</Text>
            </View>
          </View>
          <RejillaDatos>
            <Dato rotulo="Llegada real" valor={formatearFechaHora(servicio.fecha_llegada_real)} />
            <Dato rotulo="Pasajeros" valor={String(servicio.numero_pasajeros)} />
            <Dato rotulo="Valor del servicio" valor={formatearPesos(servicio.precio_total)} />
            <Dato
              rotulo="Distancia estimada"
              valor={servicio.distancia_estimada_km ? `${servicio.distancia_estimada_km} km` : '—'}
            />
            <Dato rotulo="Peajes" valor={formatearPesos(servicio.peajes_estimados)} />
          </RejillaDatos>
        </AppCard>

        {soloLectura ? (
          <AppCard>
            <Text style={typography.subtitulo}>Observaciones</Text>
            <Text style={typography.cuerpo}>{servicio.observaciones ?? 'Sin observaciones'}</Text>
            <Text style={typography.ayuda}>
              Como administrador ves el servicio completo; el cambio de estado lo hace el conductor
              asignado.
            </Text>
          </AppCard>
        ) : (
          <AppCard>
            <View style={{ gap: 3 }}>
              <Text style={estilos.eyebrow}>Actualizar el viaje</Text>
              <Text style={typography.subtitulo}>¿En qué punto va el servicio?</Text>
            </View>

            <View style={estilos.opciones} accessibilityRole="radiogroup">
              {opciones.map((estado) => {
                const activo = elegido?.id_estado === estado.id_estado;
                const tono = tonoEstado(estado.nombre_estado);
                return (
                  <Pressable
                    key={estado.id_estado}
                    onPress={() => setElegido(activo ? null : estado)}
                    style={[estilos.opcion, activo && estilos.opcionActiva]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: activo }}
                  >
                    <View style={[estilos.radio, activo && estilos.radioActivo]}>
                      {activo && <View style={estilos.radioCentro} />}
                    </View>
                    <Text style={estilos.opcionTexto}>{estado.nombre_estado}</Text>
                    <View style={[estilos.opcionPunto, { backgroundColor: tono.texto }]} />
                  </Pressable>
                );
              })}
            </View>

            <AppInput
              etiqueta="Observaciones"
              valor={vm.observaciones}
              onCambio={vm.escribirObservaciones}
              placeholder="Novedades del viaje (opcional)"
              multilinea
            />

            <AppButton
              titulo={elegido ? `Guardar: ${elegido.nombre_estado}` : 'Elige un estado'}
              icono="ok"
              onPress={guardar}
              cargando={vm.guardando}
              deshabilitado={!elegido}
            />
            <Text style={typography.ayuda}>
              Al pasar el viaje a Finalizado se guarda automáticamente la hora real de llegada.
            </Text>
          </AppCard>
        )}
      </ScrollView>
    </Pantalla>
  );
};

const estilos = StyleSheet.create({
  contenido: { gap: 14, paddingBottom: spacing.xxl },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  volverTexto: { color: colors.rojo, fontWeight: '700', fontSize: 14 },
  ruta: { backgroundColor: colors.papel, borderRadius: radius.sm, padding: spacing.lg, gap: spacing.md },
  punto: { gap: 3 },
  lugar: { fontSize: 15, fontWeight: '700', color: colors.tinta },
  hora: { fontSize: 13, color: colors.muted },
  flecha: { alignSelf: 'center', transform: [{ rotate: '90deg' }] },
  eyebrow: { ...typography.rotulo, fontWeight: '800' },
  opciones: { gap: spacing.sm },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.linea,
    borderRadius: radius.sm,
    backgroundColor: colors.blanco
  },
  opcionActiva: { borderColor: colors.rojo, backgroundColor: colors.rojoSuave },
  opcionTexto: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.tinta },
  opcionPunto: { width: 8, height: 8, borderRadius: 4 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.muted2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioActivo: { borderColor: colors.rojo },
  radioCentro: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.rojo }
});
