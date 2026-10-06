import React from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  AppButton,
  AppCard,
  AvisoError,
  AvisoExito,
  Badge,
  Cargando,
  Chips,
  Dato,
  Pantalla,
  RejillaDatos,
  SinDatos
} from '../../components';
import { CuentasViewModel, FiltroCuentas } from '../../hooks';
import { AccionCuenta, CuentaAcceso, EstadoCuenta } from '../../../Domain/entities';
import { colors, formatearFecha, spacing, Tono, TONOS, typography } from '../../theme';

const nombre = (c: CuentaAcceso) => [c.nombre, c.apellido].filter(Boolean).join(' ') || c.correo;

const ESTADOS: Record<EstadoCuenta, { texto: string; tono: Tono }> = {
  pendiente: { texto: 'Pendiente', tono: TONOS.programado },
  activa: { texto: 'Activa', tono: TONOS.hecho },
  desactivada: { texto: 'Desactivada', tono: TONOS.neutro }
};

/** VISTA: solicitudes de cuenta y cuentas activas (la seccion «Cuentas de acceso» del web). */
export const CuentasView = ({ vm }: { vm: CuentasViewModel }) => {
  // Rechazar y desactivar piden confirmacion; aprobar no, porque se deshace desactivando.
  const confirmar = (cuenta: CuentaAcceso, accion: Exclude<AccionCuenta, 'aprobar'>) => {
    const rechazo = accion === 'rechazar';
    Alert.alert(
      rechazo ? '¿Rechazar la solicitud?' : '¿Desactivar la cuenta?',
      rechazo
        ? `Se eliminará la cuenta de ${nombre(cuenta)} (${cuenta.correo}). Su ficha de conductor también se borra si no tiene servicios ni vehículos.`
        : `${nombre(cuenta)} no podrá iniciar sesión hasta que la reactives. Una sesión ya abierta sigue activa hasta que caduque (máximo 8 horas).`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: rechazo ? 'Rechazar' : 'Desactivar', style: 'destructive', onPress: () => vm.ejecutar(cuenta, accion) }
      ]
    );
  };

  // Dar permiso de administrador si pide confirmacion: no se deshace solo
  // desactivando, porque esa cuenta ya podria haber cambiado otras cosas.
  const confirmarAdmin = (cuenta: CuentaAcceso) => {
    Alert.alert(
      '¿Dar permiso de administrador?',
      `${nombre(cuenta)} tendrá acceso total: podrá ver y editar todas las tablas, y aprobar o desactivar otras cuentas, incluida la tuya.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, hacer administrador',
          style: 'destructive',
          onPress: () => vm.ejecutar(cuenta, 'aprobar', 'Administrador')
        }
      ]
    );
  };

  const tarjeta = (c: CuentaAcceso) => {
    const ocupada = vm.procesando === c.id_usuario;
    return (
      <AppCard>
        <View style={estilos.top}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={typography.subtitulo}>
              {nombre(c)}
              {c.es_tu_cuenta ? <Text style={estilos.tu}>  (tú)</Text> : null}
            </Text>
            <Text style={typography.ayuda}>{c.correo}</Text>
          </View>
          <Badge texto={ESTADOS[c.estado].texto} tono={ESTADOS[c.estado].tono} />
        </View>

        <RejillaDatos>
          <Dato rotulo="Rol" valor={c.rol ?? '—'} />
          <Dato rotulo="Registro" valor={formatearFecha(c.fecha_registro)} />
          <Dato rotulo="Documento" valor={c.numero_documento ? `${c.tipo_documento} ${c.numero_documento}` : '—'} />
          <Dato rotulo="Teléfono" valor={c.telefono ?? '—'} />
        </RejillaDatos>

        {c.rol === 'Conductor' && !c.tiene_ficha && (
          <Badge texto="Sin ficha de conductor: no podrá entrar" tono={TONOS.programado} conPunto={false} />
        )}

        {c.estado === 'pendiente' && (
          // Aprobar exige elegir el permiso: son dos botones, no un "Aprobar"
          // a secas. Asi la decision es explicita y queda a la vista.
          <>
            <Text style={typography.ayuda}>Aprobar como:</Text>
            <View style={estilos.botones}>
              <AppButton
                titulo="Conductor"
                icono="ok"
                pequeno
                cargando={ocupada}
                onPress={() => vm.ejecutar(c, 'aprobar', 'Conductor')}
                estilo={{ flex: 1 }}
              />
              <AppButton
                titulo="Administrador"
                variante="ghost"
                pequeno
                deshabilitado={ocupada}
                onPress={() => confirmarAdmin(c)}
                estilo={{ flex: 1 }}
              />
            </View>
            <AppButton
              titulo="Rechazar"
              variante="ghost"
              pequeno
              deshabilitado={ocupada}
              onPress={() => confirmar(c, 'rechazar')}
            />
          </>
        )}
        {c.estado === 'activa' && !c.es_tu_cuenta && (
          <AppButton titulo="Desactivar" variante="ghost" pequeno cargando={ocupada} onPress={() => confirmar(c, 'desactivar')} />
        )}
        {c.estado === 'desactivada' && (
          <AppButton titulo="Reactivar" icono="actualizar" pequeno cargando={ocupada} onPress={() => vm.ejecutar(c, 'aprobar')} />
        )}
      </AppCard>
    );
  };

  const FILTROS: { valor: FiltroCuentas; texto: string; cantidad?: number }[] = [
    { valor: 'pendientes', texto: 'Pendientes', cantidad: vm.conteos.pendientes },
    { valor: 'activas', texto: 'Activas', cantidad: vm.conteos.activas },
    { valor: 'desactivadas', texto: 'Desactivadas', cantidad: vm.conteos.desactivadas },
    { valor: 'todas', texto: 'Todas', cantidad: vm.conteos.todas }
  ];

  return (
    <Pantalla titulo="Cuentas de acceso" subtitulo="Aprueba las solicitudes del registro.">
      <View style={{ marginBottom: spacing.md }}>
        <Chips
          opciones={FILTROS.map((f) => ({ ...f, cantidad: vm.cargando ? undefined : f.cantidad }))}
          valor={vm.filtro}
          onElegir={vm.setFiltro}
          desplazable
        />
      </View>

      {(vm.error || vm.aviso) && (
        <View style={{ marginBottom: spacing.md }}>
          {vm.error ? <AvisoError mensaje={vm.error} onReintentar={vm.reintentar} /> : <AvisoExito mensaje={vm.aviso!} />}
        </View>
      )}

      {vm.cargando ? (
        <Cargando texto="Consultando cuentas…" />
      ) : (
        <FlatList
          data={vm.visibles}
          keyExtractor={(c) => c.id_usuario}
          renderItem={({ item }) => tarjeta(item)}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={vm.refrescando} onRefresh={vm.refrescar} colors={[colors.rojo]} tintColor={colors.rojo} />}
          ListEmptyComponent={
            vm.error ? null : vm.filtro === 'pendientes' ? (
              <SinDatos positivo titulo="No hay solicitudes pendientes" detalle="Cuando alguien se registre desde la web o la app, aparecerá aquí." />
            ) : (
              <SinDatos titulo="No hay cuentas en esta vista" />
            )
          }
        />
      )}
    </Pantalla>
  );
};

const estilos = StyleSheet.create({
  lista: { gap: 14, paddingBottom: spacing.xxl, flexGrow: 1 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  tu: { fontSize: 14, fontWeight: '600', color: colors.muted },
  botones: { flexDirection: 'row', gap: spacing.sm }
});
