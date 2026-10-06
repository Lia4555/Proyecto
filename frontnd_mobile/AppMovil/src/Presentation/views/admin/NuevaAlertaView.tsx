import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AppButton, AppCard, AppInput, AvisoError, Chips, Icono, Pantalla, Selector } from '../../components';
import { Flota, useNuevaAlertaViewModel } from '../../hooks';
import { Catalogos, nombreConductor } from '../../../Domain/entities';
import { colors, mascaraFecha, spacing, typography } from '../../theme';

interface Props {
  catalogos: Catalogos;
  flota: Flota;
  onCerrar: () => void;
  onCreada: () => void;
}

/** VISTA: enviar una alerta a un conductor. */
export const NuevaAlertaView = ({ catalogos, flota, onCerrar, onCreada }: Props) => {
  const vm = useNuevaAlertaViewModel(catalogos);

  const enviar = async () => {
    if (await vm.crear()) onCreada();
  };

  const cerrar = (
    <Pressable onPress={onCerrar} style={estilos.volver} hitSlop={8} accessibilityRole="button">
      <Icono nombre="izquierda" tamano={16} color={colors.rojo} />
      <Text style={estilos.volverTexto}>Cancelar</Text>
    </Pressable>
  );

  return (
    <Pantalla titulo="Nueva alerta" subtitulo="La verá el conductor en su pestaña Alertas." arriba={cerrar}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AppCard>
            <Selector
              etiqueta="Para"
              valor={vm.idConductor}
              onElegir={vm.setIdConductor}
              error={vm.errores.id_usuario_destino}
              placeholder={flota.cargando ? 'Cargando conductores…' : 'Elegir conductor'}
              opciones={flota.conductores.map((c) => ({
                valor: c.id_conductor,
                etiqueta: nombreConductor(c),
                detalle: c.email
              }))}
            />

            <Chips
              etiqueta="Tipo de alerta"
              opciones={catalogos.tiposAlerta.map((t) => ({ valor: t.id_tipo_alerta, texto: t.nombre_tipo }))}
              valor={vm.idTipo}
              onElegir={vm.elegirTipo}
              error={vm.errores.id_tipo_alerta}
            />
            {catalogos.tiposAlerta.length === 0 && (
              <Text style={typography.ayuda}>No se pudieron cargar los tipos de alerta. Vuelve a abrir el formulario.</Text>
            )}

            <Chips
              etiqueta="Prioridad (5 = más urgente)"
              opciones={[1, 2, 3, 4, 5].map((n) => ({ valor: n, texto: String(n) }))}
              valor={vm.prioridad}
              onElegir={vm.setPrioridad}
              error={vm.errores.prioridad}
            />

            <AppInput
              etiqueta="Mensaje"
              valor={vm.descripcion}
              onCambio={vm.setDescripcion}
              placeholder="Ej.: El SOAT del vehículo vence el viernes, pásalo por la oficina."
              multilinea
              error={vm.errores.descripcion}
            />

            <AppInput
              etiqueta="Fecha límite (opcional)"
              valor={vm.fechaLimite}
              onCambio={(t) => vm.setFechaLimite(mascaraFecha(t))}
              placeholder="DD/MM/AAAA"
              tipoTeclado="number-pad"
              error={vm.errores.fecha_limite}
            />
          </AppCard>

          {vm.error && <AvisoError mensaje={vm.error} />}
          <AppButton titulo="Enviar alerta" icono="campana" onPress={enviar} cargando={vm.guardando} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
};

const estilos = StyleSheet.create({
  contenido: { gap: 14, paddingBottom: spacing.xxl },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  volverTexto: { color: colors.rojo, fontWeight: '700', fontSize: 14 }
});
