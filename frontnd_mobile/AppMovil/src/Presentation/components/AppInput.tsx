import React, { forwardRef, useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  ReturnKeyTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Icono } from './Icono';

interface Props {
  etiqueta: string;
  valor: string;
  onCambio: (texto: string) => void;
  placeholder?: string;
  secreto?: boolean;
  tipoTeclado?: KeyboardTypeOptions;
  multilinea?: boolean;
  editable?: boolean;
  error?: string | null;
  ayuda?: string;
  autoComplete?: TextInputProps['autoComplete'];
  teclaRetorno?: ReturnKeyTypeOptions;
  onEnviar?: () => void;
}

/** Campo con etiqueta, como .field del web: borde rojo al enfocar y mensaje de error debajo. */
export const AppInput = forwardRef<TextInput, Props>(
  (
    {
      etiqueta,
      valor,
      onCambio,
      placeholder,
      secreto = false,
      tipoTeclado = 'default',
      multilinea = false,
      editable = true,
      error,
      ayuda,
      autoComplete,
      teclaRetorno,
      onEnviar
    },
    ref
  ) => {
    const [enfocado, setEnfocado] = useState(false);
    const [verTexto, setVerTexto] = useState(false);

    return (
      <View style={estilos.contenedor}>
        <Text style={typography.etiqueta}>{etiqueta}</Text>
        <View>
          <TextInput
            ref={ref}
            value={valor}
            onChangeText={onCambio}
            placeholder={placeholder}
            placeholderTextColor={colors.muted2}
            secureTextEntry={secreto && !verTexto}
            keyboardType={tipoTeclado}
            autoCapitalize={tipoTeclado === 'email-address' || secreto ? 'none' : 'sentences'}
            autoCorrect={false}
            autoComplete={autoComplete}
            editable={editable}
            multiline={multilinea}
            returnKeyType={teclaRetorno}
            onSubmitEditing={onEnviar}
            submitBehavior={onEnviar && !multilinea ? 'submit' : undefined}
            onFocus={() => setEnfocado(true)}
            onBlur={() => setEnfocado(false)}
            accessibilityLabel={etiqueta}
            style={[
              estilos.campo,
              multilinea && estilos.campoAlto,
              secreto && estilos.conBoton,
              enfocado && estilos.enfocado,
              !!error && estilos.conError,
              !editable && estilos.bloqueado
            ]}
          />
          {secreto && (
            <Pressable
              onPress={() => setVerTexto((v) => !v)}
              style={estilos.ojo}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={verTexto ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <Icono nombre={verTexto ? 'ojoCerrado' : 'ojo'} tamano={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
        {error ? (
          <Text style={estilos.error}>{error}</Text>
        ) : (
          ayuda && <Text style={estilos.ayuda}>{ayuda}</Text>
        )}
      </View>
    );
  }
);

const estilos = StyleSheet.create({
  contenedor: { gap: 6 },
  campo: {
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    minHeight: 48,
    color: colors.texto,
    fontSize: 15
  },
  campoAlto: { minHeight: 92, textAlignVertical: 'top', paddingTop: spacing.md },
  conBoton: { paddingRight: 48 },
  enfocado: { borderColor: colors.rojo },
  conError: { borderColor: colors.error, backgroundColor: colors.errorFondoCampo },
  bloqueado: { backgroundColor: colors.fondoInput, color: colors.muted },
  ojo: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    width: 38,
    alignItems: 'center',
    justifyContent: 'center'
  },
  error: { fontSize: 12.5, fontWeight: '600', color: colors.error },
  ayuda: { fontSize: 12.5, color: colors.muted }
});
