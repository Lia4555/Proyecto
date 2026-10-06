import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppCard, Icono } from '../../components';
import { GRUPOS, TABLAS_VISIBLES, Tabla } from '../../../Domain/entities';
import { TablaView } from './TablaView';
import { colors, spacing, typography } from '../../theme';

// ============================================================
//  MENU DE GESTION (solo administrador)
// ------------------------------------------------------------
//  Da acceso a TODAS las tablas del sistema, agrupadas igual que
//  en el menu lateral del panel web. Al elegir una se abre la
//  pantalla generica de lista.
//
//  Quien puede entrar aqui lo decide el servidor: si un conductor
//  pidiera estas tablas recibiria un 403 (middleware/permisos.js).
//  Aqui solo se esconde el menu.
// ============================================================

export const GestionView = () => {
  const [abierta, setAbierta] = useState<Tabla | null>(null);

  if (abierta) {
    return <TablaView tabla={abierta} onVolver={() => setAbierta(null)} />;
  }

  return (
    <ScrollView contentContainerStyle={estilos.cuerpo}>
      <View>
        <Text style={typography.titulo}>Gestión</Text>
        <Text style={typography.ayuda}>
          Todas las tablas del sistema. Puedes consultar, crear, editar y eliminar.
        </Text>
      </View>

      {GRUPOS.map((grupo) => {
        const tablas = TABLAS_VISIBLES.filter((t) => t.grupo === grupo);
        if (tablas.length === 0) return null;

        return (
          <View key={grupo} style={{ gap: spacing.sm }}>
            <Text style={typography.eyebrow}>{grupo}</Text>
            {tablas.map((tabla) => (
              <Pressable
                key={tabla.key}
                onPress={() => setAbierta(tabla)}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${tabla.label}`}
              >
                <AppCard>
                  <View style={estilos.fila}>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.subtitulo}>{tabla.label}</Text>
                      <Text style={typography.ayuda}>{tabla.descripcion}</Text>
                    </View>
                    <Icono nombre="derecha" tamano={18} color={colors.muted} />
                  </View>
                </AppCard>
              </Pressable>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
};

const estilos = StyleSheet.create({
  cuerpo: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xl },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }
});
