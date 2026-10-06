import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AvisoError, Cargando, Icono, NombreIcono, Pantalla } from '../../components';
import { FiltroInicial, Pestana, useResumenAdminViewModel } from '../../hooks';
import { colors, radius, sombras, spacing, Tono, TONOS } from '../../theme';

interface Props {
  nombre: string;
  onIr: (pestana: Pestana, filtro?: FiltroInicial) => void;
  onNuevoServicio: () => void;
  onNuevaAlerta: () => void;
}

interface Mosaico {
  icono: NombreIcono;
  valor: number;
  titulo: string;
  tono: Tono;
  /** Solo se resalta si hay algo que atender. */
  urgente: boolean;
  /** Sin destino el mosaico solo informa (la flota se gestiona en el web). */
  destino?: Pestana;
  filtro?: string;
}

/** VISTA: lo que el administrador debe atender hoy, con acceso directo a cada lista. */
export const ResumenAdminView = ({ nombre, onIr, onNuevoServicio, onNuevaAlerta }: Props) => {
  const vm = useResumenAdminViewModel();
  const r = vm.resumen;

  const mosaicos: Mosaico[] = r
    ? [
        { icono: 'usuarios', valor: r.cuentasPendientes, titulo: 'Cuentas por aprobar', tono: TONOS.programado, urgente: r.cuentasPendientes > 0, destino: 'cuentas' },
        { icono: 'alerta', valor: r.serviciosRetrasados, titulo: 'Servicios retrasados', tono: TONOS.cancelado, urgente: r.serviciosRetrasados > 0, destino: 'servicios', filtro: 'retrasados' },
        { icono: 'ruta', valor: r.serviciosEnCurso, titulo: 'Servicios en curso', tono: TONOS.curso, urgente: false, destino: 'servicios', filtro: 'curso' },
        { icono: 'calendario', valor: r.serviciosHoy, titulo: 'Salen hoy', tono: TONOS.neutro, urgente: false, destino: 'servicios', filtro: 'hoy' },
        { icono: 'campana', valor: r.alertasSinResolver, titulo: 'Alertas sin resolver', tono: TONOS.cancelado, urgente: r.alertasSinResolver > 0, destino: 'alertas' },
        { icono: 'bus', valor: r.vehiculosFueraDeServicio, titulo: 'Vehículos fuera de servicio', tono: TONOS.programado, urgente: r.vehiculosFueraDeServicio > 0 }
      ]
    : [];

  return (
    <Pantalla titulo="Resumen" subtitulo={`Hola, ${nombre}. Esto es lo que necesita atención.`}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={vm.refrescando} onRefresh={vm.refrescar} colors={[colors.rojo]} tintColor={colors.rojo} />
        }
      >
        {vm.error && <AvisoError mensaje={vm.error} onReintentar={vm.reintentar} />}

        {vm.cargando ? (
          <View style={{ height: 240 }}>
            <Cargando texto="Calculando el resumen…" />
          </View>
        ) : (
          r && (
            <>
              <View style={estilos.rejilla}>
                {mosaicos.map((m) => (
                  <Pressable
                    key={m.titulo}
                    onPress={m.destino ? () => onIr(m.destino!, m.filtro ?? null) : undefined}
                    disabled={!m.destino}
                    style={({ pressed }) => [estilos.mosaico, m.urgente && { borderColor: m.tono.texto }, pressed && estilos.presionado]}
                    accessibilityRole={m.destino ? 'button' : 'text'}
                    accessibilityLabel={`${m.valor} ${m.titulo}`}
                  >
                    <View style={[estilos.icono, { backgroundColor: m.tono.fondo }]}>
                      <Icono nombre={m.icono} tamano={18} color={m.tono.texto} />
                    </View>
                    <Text style={[estilos.valor, m.urgente && { color: m.tono.texto }]}>{m.valor}</Text>
                    <Text style={estilos.titulo}>{m.titulo}</Text>
                  </Pressable>
                ))}
              </View>

              {(r.documentosVencidos > 0 || r.documentosPorVencer > 0) && (
                <View style={estilos.documentos}>
                  <Icono nombre="documento" tamano={20} color={colors.ambar} />
                  <Text style={estilos.documentosTexto}>
                    {r.documentosVencidos > 0 && (
                      <Text style={{ fontWeight: '800', color: colors.error }}>
                        {r.documentosVencidos} documento{r.documentosVencidos === 1 ? '' : 's'} vencido{r.documentosVencidos === 1 ? '' : 's'}
                      </Text>
                    )}
                    {r.documentosVencidos > 0 && r.documentosPorVencer > 0 ? ' · ' : ''}
                    {r.documentosPorVencer > 0 && `${r.documentosPorVencer} vence${r.documentosPorVencer === 1 ? '' : 'n'} en los próximos 30 días`}
                    {'. Se renuevan desde el panel web.'}
                  </Text>
                </View>
              )}

              <Text style={estilos.seccion}>Acciones rápidas</Text>
              <View style={estilos.acciones}>
                {([
                  ['ruta', 'Nuevo servicio', 'Asignar un viaje a un conductor', onNuevoServicio],
                  ['campana', 'Enviar alerta', 'Avisar algo a un conductor', onNuevaAlerta]
                ] as [NombreIcono, string, string, () => void][]).map(([icono, titulo, detalle, accion]) => (
                  <Pressable
                    key={titulo}
                    onPress={accion}
                    style={({ pressed }) => [estilos.accion, pressed && estilos.presionado]}
                    accessibilityRole="button"
                  >
                    <View style={estilos.accionIcono}>
                      <Icono nombre={icono} tamano={20} color={colors.blanco} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.accionTitulo}>{titulo}</Text>
                      <Text style={estilos.accionDetalle}>{detalle}</Text>
                    </View>
                    <Icono nombre="derecha" tamano={18} color={colors.muted2} />
                  </Pressable>
                ))}
              </View>

              <Text style={estilos.nota}>
                Catálogos, flota, clientes y reservas se administran desde el panel web.
              </Text>
            </>
          )
        )}
      </ScrollView>
    </Pantalla>
  );
};

const estilos = StyleSheet.create({
  contenido: { gap: 14, paddingBottom: spacing.xxl },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mosaico: {
    width: '47.8%',
    flexGrow: 1,
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 4,
    ...sombras.s1
  },
  presionado: { backgroundColor: '#fffdfd', borderColor: colors.salmon },
  icono: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  valor: { fontSize: 30, fontWeight: '800', color: colors.tinta, lineHeight: 34 },
  titulo: { fontSize: 13, fontWeight: '600', color: colors.muted },
  documentos: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.ambarSuave,
    borderRadius: radius.sm,
    padding: 14
  },
  documentosTexto: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.texto },
  seccion: { fontSize: 13, fontWeight: '800', color: colors.muted2, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 6 },
  acciones: { gap: 10 },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea,
    borderRadius: radius.md,
    padding: 14,
    ...sombras.s1
  },
  accionIcono: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.rojo, alignItems: 'center', justifyContent: 'center' },
  accionTitulo: { fontSize: 15.5, fontWeight: '800', color: colors.tinta },
  accionDetalle: { fontSize: 13, color: colors.muted },
  nota: { textAlign: 'center', fontSize: 12.5, color: colors.muted2, marginTop: 4 }
});
