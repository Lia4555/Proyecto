import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Avatar, Badge, Dato, Pantalla } from '../components';
import { useFotoPerfil, useSesion } from '../hooks';
import { ApiConfig } from '../../Data/config/ApiConfig';
import { colors, spacing, TONOS, typography } from '../theme';
import { FotoPerfilModal } from './FotoPerfilModal';

/**
 * VISTA: datos de la cuenta y cierre de sesion.
 * Solo muestra lo que le sirve a la persona: nada de codigos internos
 * (ids, nivel de permiso), igual que en el panel web.
 */
export const PerfilView = () => {
  const { usuario, salir, esAdmin } = useSesion();
  const foto = useFotoPerfil(usuario?.id_usuario);
  const [cambiandoFoto, setCambiandoFoto] = useState(false);
  if (!usuario) return null;

  const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || 'Usuario';
  const iniciales = nombre
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  return (
    <Pantalla titulo="Mi perfil" subtitulo="Tu cuenta de trabajo en D' VIAJE.">
      <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
        <AppCard>
          <View style={estilos.encabezado}>
            <Pressable
              onPress={() => setCambiandoFoto(true)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil"
              style={({ pressed }) => pressed && estilos.presionado}
            >
              <Avatar foto={foto} iniciales={iniciales} tamano={64} editable />
            </Pressable>
            <View style={estilos.identidad}>
              <Text style={typography.subtitulo}>{nombre}</Text>
              <Badge texto={usuario.rol} tono={esAdmin ? TONOS.programado : TONOS.cancelado} />
              <Text style={typography.ayuda} onPress={() => setCambiandoFoto(true)}>
                {foto ? 'Cambiar foto' : 'Añadir foto de perfil'}
              </Text>
            </View>
          </View>
          <View style={estilos.separador} />
          <Dato rotulo="Correo" valor={usuario.correo} estilo={estilos.datoCompleto} />
          <Text style={typography.ayuda}>
            {esAdmin
              ? 'Desde la app apruebas cuentas, despachas servicios y envías alertas. Catálogos, flota, clientes y reservas se administran en el panel web.'
              : 'Aquí ves los servicios, el vehículo y las alertas que te asignó el administrador.'}
          </Text>
        </AppCard>

        <AppButton titulo="Cerrar sesión" icono="salir" variante="ghost" onPress={salir} />

        {/* Dato tecnico para quien desarrolla: en la app instalada para
            conductores (compilacion de produccion) no aparece. */}
        {__DEV__ && (
          <Text style={estilos.desarrollo}>Modo desarrollo · servidor {ApiConfig.baseUrl}</Text>
        )}
      </ScrollView>

      <FotoPerfilModal
        visible={cambiandoFoto}
        foto={foto}
        iniciales={iniciales}
        onCerrar={() => setCambiandoFoto(false)}
      />
    </Pantalla>
  );
};

const estilos = StyleSheet.create({
  contenido: { gap: 14, paddingBottom: spacing.xxl },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  presionado: { opacity: 0.75 },
  identidad: { gap: 6, flex: 1 },
  separador: { height: 1, backgroundColor: colors.linea2 },
  datoCompleto: { width: '100%' },
  desarrollo: { textAlign: 'center', fontSize: 11.5, color: colors.muted2 }
});
