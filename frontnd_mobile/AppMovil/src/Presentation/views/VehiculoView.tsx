import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppCard,
  AvisoError,
  Badge,
  Cargando,
  Dato,
  Icono,
  NombreIcono,
  Pantalla,
  RejillaDatos,
  SinDatos
} from '../components';
import { useVehiculoViewModel } from '../hooks';
import { documentoVencido } from '../../Domain/entities';
import {
  colors,
  diasRestantes,
  formatearFecha,
  formatearPesos,
  radius,
  spacing,
  TONOS
} from '../theme';

const TituloBloque = ({ icono, texto }: { icono: NombreIcono; texto: string }) => (
  <View style={estilos.bloqueTitulo}>
    <Icono nombre={icono} tamano={18} color={colors.rojo} />
    <Text style={estilos.bloqueTituloTexto}>{texto}</Text>
  </View>
);

/** VISTA: ficha del vehiculo, sus papeles y el reporte de estado (.veh-card del web). */
export const VehiculoView = ({ soloLectura }: { soloLectura: boolean }) => {
  const vm = useVehiculoViewModel();

  if (vm.cargando) {
    return (
      <Pantalla titulo="Mi vehículo">
        <Cargando texto="Consultando el vehículo…" />
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo="Mi vehículo" subtitulo="Ficha, documentos y mantenimientos.">
      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={vm.refrescando}
            onRefresh={vm.refrescar}
            colors={[colors.rojo]}
            tintColor={colors.rojo}
          />
        }
      >
        {vm.error && <AvisoError mensaje={vm.error} onReintentar={vm.reintentar} />}

        {vm.vehiculos.length === 0 && !vm.error && (
          <SinDatos
            icono="bus"
            titulo="Sin vehículo asignado"
            detalle="El administrador todavía no te asignó un vehículo."
          />
        )}

        {vm.vehiculos.map(({ vehiculo, documentos, mantenimientos }) => (
          <View key={vehiculo.id_vehiculo} style={estilos.grupo}>
            <AppCard>
              <View style={estilos.top}>
                <View style={estilos.icono}>
                  <Icono nombre="bus" tamano={26} color={colors.vino} />
                </View>
                <View style={estilos.identidad}>
                  <Text style={estilos.placa}>{vehiculo.placa}</Text>
                  <Text style={estilos.modelo}>
                    {[vehiculo.marca, vehiculo.linea, vehiculo.modelo].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </View>
              <Badge
                texto={vehiculo.estado_operativo ? 'Operativo' : 'Fuera de servicio'}
                tono={vehiculo.estado_operativo ? TONOS.hecho : TONOS.cancelado}
              />

              <View style={estilos.separador} />
              <RejillaDatos>
                <Dato rotulo="Capacidad" valor={`${vehiculo.capacidad_pasajeros} pasajeros`} />
                <Dato rotulo="N.º interno" valor={vehiculo.numero_interno ?? '—'} />
                <Dato rotulo="Color" valor={vehiculo.color ?? '—'} />
                <Dato rotulo="Último mantenimiento" valor={formatearFecha(vehiculo.fecha_ultimo_mantenimiento)} />
                <Dato rotulo="Próximo mantenimiento" valor={formatearFecha(vehiculo.fecha_proximo_mantenimiento)} />
              </RejillaDatos>

              {!soloLectura && (
                <AppButton
                  titulo={vehiculo.estado_operativo ? 'Reportar fuera de servicio' : 'Marcar como operativo'}
                  icono={vehiculo.estado_operativo ? 'alerta' : 'ok'}
                  variante={vehiculo.estado_operativo ? 'ghost' : 'primario'}
                  cargando={vm.reportando === vehiculo.id_vehiculo}
                  onPress={() => vm.reportarEstado(vehiculo.id_vehiculo, !vehiculo.estado_operativo)}
                />
              )}
            </AppCard>

            <AppCard estilo={estilos.bloque}>
              <TituloBloque icono="documento" texto="Documentos" />
              {documentos.length === 0 && <Text style={estilos.vacio}>Sin documentos registrados.</Text>}
              {documentos.map((documento, i) => {
                const vencido = documentoVencido(documento);
                const dias = diasRestantes(documento.fecha_vencimiento);
                const porVencer = !vencido && dias !== null && dias <= 30;

                return (
                  <View
                    key={documento.id_documento}
                    style={[estilos.item, i === documentos.length - 1 && estilos.itemUltimo]}
                  >
                    <View style={estilos.itemTextos}>
                      <Text style={estilos.itemTitulo}>{documento.tipo_documento_legal}</Text>
                      <Text style={estilos.itemSub}>
                        N.º {documento.numero_documento} · Vence {formatearFecha(documento.fecha_vencimiento)}
                      </Text>
                    </View>
                    <Badge
                      conPunto={false}
                      texto={vencido ? 'Vencido' : porVencer ? `Vence en ${dias} d` : 'Vigente'}
                      tono={vencido ? TONOS.cancelado : porVencer ? TONOS.programado : TONOS.hecho}
                    />
                  </View>
                );
              })}
            </AppCard>

            <AppCard estilo={estilos.bloque}>
              <TituloBloque icono="herramienta" texto="Mantenimientos recientes" />
              {mantenimientos.length === 0 && (
                <Text style={estilos.vacio}>Sin mantenimientos registrados.</Text>
              )}
              {mantenimientos.slice(0, 5).map((m, i, lista) => (
                <View
                  key={m.id_mantenimiento}
                  style={[estilos.item, i === lista.length - 1 && estilos.itemUltimo]}
                >
                  <View style={estilos.itemTextos}>
                    <Text style={estilos.itemTitulo}>{m.tipo_mantenimiento}</Text>
                    <Text style={estilos.itemSub}>
                      {formatearFecha(m.fecha_mantenimiento)}
                      {m.taller_responsable ? ` · ${m.taller_responsable}` : ''}
                    </Text>
                  </View>
                  <Text style={estilos.costo}>{formatearPesos(m.costo)}</Text>
                </View>
              ))}
            </AppCard>
          </View>
        ))}
      </ScrollView>
    </Pantalla>
  );
};

const estilos = StyleSheet.create({
  contenido: { gap: 14, paddingBottom: spacing.xxl, flexGrow: 1 },
  grupo: { gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icono: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.rojoSuave,
    alignItems: 'center',
    justifyContent: 'center'
  },
  identidad: { flex: 1 },
  placa: { fontSize: 24, fontWeight: '800', color: colors.tinta, letterSpacing: 1.4 },
  modelo: { fontSize: 14, color: colors.muted },
  separador: { height: 1, backgroundColor: colors.linea2 },
  bloque: { gap: 0, padding: 18 },
  bloqueTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  bloqueTituloTexto: { fontSize: 15.5, fontWeight: '800', color: colors.tinta },
  vacio: { fontSize: 14, color: colors.muted, paddingTop: 6 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.linea2
  },
  itemUltimo: { borderBottomWidth: 0, paddingBottom: 0 },
  itemTextos: { flex: 1 },
  itemTitulo: { fontSize: 14.5, fontWeight: '700', color: colors.tinta },
  itemSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  costo: { fontSize: 14, fontWeight: '700', color: colors.tinta }
});
