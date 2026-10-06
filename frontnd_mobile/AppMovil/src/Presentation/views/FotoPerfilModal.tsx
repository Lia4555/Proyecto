import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, Avatar, AvisoError, Icono, NombreIcono } from '../components';
import { ILUSTRACIONES } from '../contenido/ilustraciones';
import { OrigenFoto, useCambiarFotoViewModel } from '../hooks';
import { colors, radius, spacing, typography } from '../theme';

/**
 * VISTA: cambiar la foto de perfil (mismas opciones que el panel web).
 *   inicio        -> foto grande y opciones
 *   ilustraciones -> galeria de dibujos incluidos en la app
 * Galeria y camara abren las pantallas nativas del telefono, con su
 * recorte cuadrado.
 */
interface Props {
  visible: boolean;
  foto: string | null;
  iniciales: string;
  onCerrar: () => void;
}

type Vista = 'inicio' | 'ilustraciones';

const Opcion = ({
  icono,
  miniatura,
  texto,
  peligro = false,
  deshabilitada,
  onPress
}: {
  icono?: NombreIcono;
  miniatura?: number;
  texto: string;
  peligro?: boolean;
  deshabilitada: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    disabled={deshabilitada}
    accessibilityRole="button"
    style={({ pressed }) => [
      estilos.opcion,
      pressed && estilos.opcionPresionada,
      deshabilitada && estilos.inactiva
    ]}
  >
    {miniatura !== undefined ? (
      <Image source={miniatura} style={estilos.miniatura} />
    ) : (
      icono && <Icono nombre={icono} tamano={22} color={peligro ? colors.error : colors.tinta} />
    )}
    <Text style={[estilos.opcionTexto, peligro && { color: colors.error }]}>{texto}</Text>
  </Pressable>
);

export const FotoPerfilModal = ({ visible, foto, iniciales, onCerrar }: Props) => {
  const [vista, setVista] = useState<Vista>('inicio');

  const cerrar = useCallback(() => {
    setVista('inicio');
    onCerrar();
  }, [onCerrar]);

  const vm = useCambiarFotoViewModel(cerrar);
  const ocupado = vm.preparando || vm.guardando;
  const mostrada = vm.pendiente ?? foto;

  const salir = () => {
    if (vm.guardando) return;
    vm.descartar();
    cerrar();
  };

  // Atras del sistema: desde la galeria vuelve a las opciones.
  const atras = () => {
    if (vista === 'ilustraciones') setVista('inicio');
    else salir();
  };

  const elegir = async (origen: OrigenFoto) => {
    if (await vm.elegir(origen)) setVista('inicio');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={atras} statusBarTranslucent>
      <SafeAreaView style={estilos.pantalla}>
        <View style={estilos.cabecera}>
          {vista === 'ilustraciones' ? (
            <Pressable onPress={atras} hitSlop={8} accessibilityRole="button" accessibilityLabel="Volver">
              <Icono nombre="izquierda" tamano={24} color={colors.tinta} />
            </Pressable>
          ) : (
            <View style={estilos.hueco} />
          )}
          <Text style={estilos.titulo}>
            {vista === 'ilustraciones' ? 'Elige una ilustración' : 'Foto de perfil'}
          </Text>
          <Pressable
            onPress={salir}
            hitSlop={8}
            disabled={vm.guardando}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <Icono nombre="cerrar" tamano={24} color={colors.tinta} />
          </Pressable>
        </View>

        {vista === 'inicio' ? (
          <ScrollView contentContainerStyle={estilos.contenido}>
            <View style={[estilos.marco, vm.pendiente ? estilos.marcoNuevo : null]}>
              <Avatar foto={mostrada} iniciales={iniciales} tamano={176} />
              {vm.preparando && (
                <View style={estilos.cargando}>
                  <ActivityIndicator color={colors.blanco} />
                </View>
              )}
            </View>

            {vm.error && <AvisoError mensaje={vm.error} />}

            {vm.pendiente ? (
              <View style={estilos.grupo}>
                <Text style={[typography.ayuda, estilos.centrado]}>Así se verá tu nueva foto de perfil.</Text>
                <AppButton titulo="Guardar foto de perfil" onPress={vm.guardar} cargando={vm.guardando} />
                <AppButton
                  titulo="Elegir otra"
                  variante="ghost"
                  onPress={vm.descartar}
                  deshabilitado={vm.guardando}
                />
              </View>
            ) : (
              <View style={estilos.grupo}>
                <Opcion
                  miniatura={ILUSTRACIONES[1].imagen}
                  texto="Explorar ilustraciones"
                  deshabilitada={ocupado}
                  onPress={() => setVista('ilustraciones')}
                />
                <Opcion
                  icono="imagen"
                  texto="Subir desde el dispositivo"
                  deshabilitada={ocupado}
                  onPress={() => elegir('galeria')}
                />
                <Opcion
                  icono="camara"
                  texto="Toma una foto"
                  deshabilitada={ocupado}
                  onPress={() => elegir('camara')}
                />
                {foto && (
                  <Opcion
                    icono="eliminar"
                    texto={vm.guardando ? 'Quitando…' : 'Quitar foto'}
                    peligro
                    deshabilitada={ocupado}
                    onPress={vm.quitar}
                  />
                )}
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={estilos.galeria}>
            {ILUSTRACIONES.map((ilustracion) => (
              <Pressable
                key={ilustracion.clave}
                onPress={() => elegir({ recurso: ilustracion.imagen })}
                disabled={vm.preparando}
                accessibilityRole="button"
                accessibilityLabel={ilustracion.nombre}
                style={({ pressed }) => [estilos.celda, pressed && estilos.celdaPresionada]}
              >
                <Image source={ilustracion.imagen} style={estilos.celdaImagen} />
              </Pressable>
            ))}
            {vm.preparando && (
              <View style={estilos.galeriaCargando}>
                <ActivityIndicator color={colors.rojo} />
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.blanco },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.linea2
  },
  hueco: { width: 24 },
  titulo: { fontSize: 17, fontWeight: '800', color: colors.tinta },
  contenido: { padding: spacing.xl, gap: spacing.xl },
  marco: {
    alignSelf: 'center',
    padding: 6,
    borderRadius: 999,
    backgroundColor: colors.linea2
  },
  marcoNuevo: { backgroundColor: colors.rojo },
  cargando: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(22, 24, 29, 0.55)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  grupo: { gap: spacing.sm },
  centrado: { textAlign: 'center' },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.linea,
    borderRadius: radius.sm,
    backgroundColor: colors.blanco
  },
  opcionPresionada: { backgroundColor: colors.papel },
  inactiva: { opacity: 0.55 },
  opcionTexto: { fontSize: 15.5, fontWeight: '600', color: colors.tinta },
  miniatura: { width: 24, height: 24, borderRadius: 12 },
  galeria: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.lg,
    padding: spacing.xl
  },
  celda: { width: '30%', aspectRatio: 1, borderRadius: 999, overflow: 'hidden' },
  celdaPresionada: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  celdaImagen: { width: '100%', height: '100%' },
  galeriaCargando: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)'
  }
});
