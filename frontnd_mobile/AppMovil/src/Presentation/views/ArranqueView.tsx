import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SelloMarca } from '../components';
import { colors } from '../theme';

/** Pantalla mientras se revisa la sesion guardada (.arranque del web). */
export const ArranqueView = () => {
  const avance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bucle = Animated.loop(
      Animated.timing(avance, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    );
    bucle.start();
    return () => bucle.stop();
  }, [avance]);

  return (
    <View style={estilos.fondo} accessibilityRole="progressbar" accessibilityLabel="Comprobando tu sesión">
      <StatusBar style="dark" />
      <SelloMarca tamano={64} />
      <Text style={estilos.texto}>Comprobando tu sesión…</Text>
      <View style={estilos.barra}>
        <Animated.View
          style={[
            estilos.relleno,
            { transform: [{ translateX: avance.interpolate({ inputRange: [0, 1], outputRange: [-60, 160] }) }] }
          ]}
        />
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: colors.papel,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18
  },
  texto: { fontSize: 15, color: colors.muted, fontWeight: '600' },
  barra: {
    width: 160,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.linea,
    overflow: 'hidden'
  },
  relleno: { width: 60, height: 4, borderRadius: 2, backgroundColor: colors.rojo }
});
