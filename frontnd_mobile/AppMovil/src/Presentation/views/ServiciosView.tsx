import React from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  AppButton,
  AppCard,
  AvisoError,
  Badge,
  Cargando,
  Dato,
  Icono,
  Pantalla,
  RejillaDatos,
  SinDatos
} from '../components';
import { FiltroServicios, useServiciosViewModel, useSesion } from '../hooks';
import { Catalogos, Servicio, lugarDeServicio, nombreEstado, vaConRetraso } from '../../Domain/entities';
import { colors, formatearFechaHora, radius, spacing, TONOS, tonoEstado, typography } from '../theme';

interface Props {
  catalogos: Catalogos;
  onAbrirServicio: (idServicio: number) => void;
  nombreUsuario: string;
}

const FILTROS: { id: FiltroServicios; titulo: string }[] = [
  { id: 'todos', titulo: 'Todos' },
  { id: 'pendientes', titulo: 'Pendientes' },
  { id: 'retrasados', titulo: 'Retrasados' }
];

/** VISTA: lista de viajes asignados, con las fichas del panel web (.serv-card). */
export const ServiciosView = ({ catalogos, onAbrirServicio, nombreUsuario }: Props) => {
  const vm = useServiciosViewModel();
  const { esAdmin } = useSesion();

  const tarjeta = (servicio: Servicio) => {
    const estado = nombreEstado(catalogos, servicio.id_estado);
    const retrasado = vaConRetraso(servicio);

    return (
      <AppCard onPress={() => onAbrirServicio(servicio.id_servicio)}>
        <View style={estilos.top}>
          <Text style={estilos.codigo}>{servicio.codigo_servicio}</Text>
          <Badge texto={estado} tono={tonoEstado(estado)} />
        </View>

        <View style={estilos.ruta}>
          <View style={estilos.punto}>
            <Text style={typography.rotulo}>Salida</Text>
            <Text style={estilos.puntoLugar}>{lugarDeServicio(catalogos, servicio.origen, servicio.id_origen)}</Text>
            <Text style={estilos.puntoHora}>{formatearFechaHora(servicio.fecha_salida)}</Text>
          </View>
          <View style={estilos.flecha}>
            <Icono nombre="flechaLarga" tamano={22} color={colors.rojo} />
          </View>
          <View style={estilos.punto}>
            <Text style={typography.rotulo}>Llegada estimada</Text>
            <Text style={estilos.puntoLugar}>{lugarDeServicio(catalogos, servicio.destino, servicio.id_destino)}</Text>
            <Text style={estilos.puntoHora}>{formatearFechaHora(servicio.fecha_llegada_estimada)}</Text>
          </View>
        </View>

        <RejillaDatos>
          <Dato rotulo="Pasajeros" valor={String(servicio.numero_pasajeros ?? '—')} />
          <Dato rotulo="Tipo" valor={servicio.tipo_servicio || '—'} />
          <Dato rotulo="Llegada real" valor={formatearFechaHora(servicio.fecha_llegada_real)} />
        </RejillaDatos>

        {retrasado && <Badge texto="Fuera de horario" tono={TONOS.programado} />}

        {servicio.observaciones ? <Text style={estilos.obs}>{servicio.observaciones}</Text> : null}

        <AppButton
          titulo={esAdmin ? 'Ver detalle' : 'Actualizar estado'}
          icono={esAdmin ? 'derecha' : 'editar'}
          variante={esAdmin ? 'ghost' : 'primario'}
          pequeno
          onPress={() => onAbrirServicio(servicio.id_servicio)}
        />
      </AppCard>
    );
  };

  return (
    <Pantalla
      titulo="Mis servicios"
      subtitulo={`Hola, ${nombreUsuario}. Los viajes que te asignó el administrador.`}
    >
      <View style={estilos.filtros}>
        {FILTROS.map((f) => {
          const activo = vm.filtro === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => vm.cambiarFiltro(f.id)}
              style={[estilos.chip, activo && estilos.chipActivo]}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
            >
              <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>{f.titulo}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={estilos.conteo}>
        <Text style={estilos.conteoNumero}>{vm.servicios.length}</Text> de {vm.resumen.total} servicio
        {vm.resumen.total === 1 ? '' : 's'} · {vm.resumen.pendientes} pendientes ·{' '}
        {vm.resumen.retrasados} retrasados
      </Text>

      {vm.error && (
        <View style={estilos.aviso}>
          <AvisoError mensaje={vm.error} onReintentar={vm.reintentar} />
        </View>
      )}

      {vm.cargando ? (
        <Cargando texto="Consultando tus servicios…" />
      ) : (
        <FlatList
          data={vm.servicios}
          keyExtractor={(item: Servicio) => String(item.id_servicio)}
          renderItem={({ item }: ListRenderItemInfo<Servicio>) => tarjeta(item)}
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
            // Con error no se sabe si hay servicios: el aviso rojo ya lo explica,
            // y decir "no tienes servicios" seria falso.
            vm.error ? null : vm.filtro !== 'todos' && vm.resumen.total > 0 ? (
              <SinDatos
                titulo="Ningún servicio coincide con el filtro"
                detalle="Prueba con otro filtro para ver el resto de tus viajes."
                accion={
                  <AppButton titulo="Quitar filtro" variante="ghost" pequeno onPress={() => vm.cambiarFiltro('todos')} />
                }
              />
            ) : (
              <SinDatos
                titulo="Todavía no tienes servicios asignados"
                detalle="Cuando el administrador te asigne un viaje aparecerá aquí, con su ruta, su horario y el vehículo."
                accion={
                  <AppButton
                    titulo="Comprobar de nuevo"
                    icono="actualizar"
                    variante="ghost"
                    pequeno
                    onPress={vm.refrescar}
                  />
                }
              />
            )
          }
        />
      )}
    </Pantalla>
  );
};

const estilos = StyleSheet.create({
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea
  },
  chipActivo: { backgroundColor: colors.vino, borderColor: colors.vino },
  chipTexto: { color: colors.texto, fontSize: 13, fontWeight: '600' },
  chipTextoActivo: { color: colors.blanco },
  conteo: { fontSize: 13, color: colors.muted, marginBottom: spacing.md },
  conteoNumero: { fontSize: 15, fontWeight: '800', color: colors.tinta },
  aviso: { marginBottom: spacing.md },
  lista: { gap: 14, paddingBottom: spacing.xxl, flexGrow: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  codigo: { fontSize: 17, fontWeight: '800', color: colors.tinta, letterSpacing: 0.2, flexShrink: 1 },
  ruta: { backgroundColor: colors.papel, borderRadius: radius.sm, padding: spacing.lg, gap: spacing.md },
  punto: { gap: 3 },
  puntoLugar: { fontSize: 15, fontWeight: '700', color: colors.tinta },
  puntoHora: { fontSize: 13, color: colors.muted },
  // En el telefono la ruta va en vertical: la flecha apunta hacia abajo.
  flecha: { alignSelf: 'center', transform: [{ rotate: '90deg' }] },
  obs: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.salmon,
    backgroundColor: colors.rojoSuave,
    borderTopRightRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    fontSize: 14,
    color: colors.texto
  }
});
