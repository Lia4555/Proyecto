import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput, AvisoError, Icono, Selector } from '../../components';
import { AYUDA_ENMASCARADO, CampoTabla, Fila } from '../../../Domain/entities';
import { TablaViewModel } from '../../hooks/useTablaViewModel';
import { colors, spacing, typography } from '../../theme';

// ============================================================
//  FORMULARIO GENERICO: crear o editar una fila de cualquier tabla
// ------------------------------------------------------------
//  Los campos salen de la configuracion de la tabla, asi que esta
//  pantalla no sabe (ni necesita saber) si esta editando un
//  vehiculo o una reserva.
// ============================================================

interface Props {
  vm: TablaViewModel;
  /** Fila a editar; null para crear una nueva. */
  fila: Fila | null;
  onCerrar: () => void;
}

/** Teclado adecuado para cada tipo de campo. */
const tecladoDe = (campo: CampoTabla) => {
  if (campo.type === 'number') return 'decimal-pad' as const;
  if (campo.type === 'email') return 'email-address' as const;
  return 'default' as const;
};

const ayudaDe = (campo: CampoTabla, esEdicion: boolean): string | undefined => {
  // Datos delicados: la API no los devuelve completos (o no los devuelve).
  if (esEdicion && campo.privado === 'enmascarado') return AYUDA_ENMASCARADO;
  if (esEdicion && campo.privado === 'oculto') {
    return 'Oculto por seguridad. Déjalo vacío para conservar el dato guardado.';
  }
  if (campo.hint) return campo.hint;
  if (campo.type === 'date') return 'Formato: AAAA-MM-DD';
  if (campo.type === 'datetime') return 'Formato: AAAA-MM-DDTHH:MM';
  return undefined;
};

export const FormularioTablaView = ({ vm, fila, onCerrar }: Props) => {
  const [valores, setValores] = useState<Fila>(() => vm.iniciales(fila));
  const esEdicion = Boolean(fila);

  const fijar = (nombre: string, valor: unknown) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
    // Al corregir un campo desaparece su error: no tiene sentido
    // seguir marcandolo en rojo mientras se escribe.
    if (vm.erroresCampo[nombre]) {
      const copia = { ...vm.erroresCampo };
      delete copia[nombre];
      vm.setErroresCampo(copia);
    }
  };

  const guardar = async () => {
    const ok = await vm.guardar(valores, fila);
    if (ok) onCerrar();
  };

  const pintarCampo = (campo: CampoTabla) => {
    const error = vm.erroresCampo[campo.name] ?? null;
    const valor = valores[campo.name];

    // --- Casilla si/no ---
    if (campo.type === 'checkbox') {
      const marcada = Boolean(valor);
      return (
        <Pressable
          key={campo.name}
          onPress={() => fijar(campo.name, !marcada)}
          style={estilos.casilla}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: marcada }}
          accessibilityLabel={campo.label}
        >
          <View style={[estilos.marca, marcada && estilos.marcaActiva]}>
            {marcada && <Icono nombre="ok" tamano={14} color={colors.blanco} />}
          </View>
          <Text style={typography.cuerpo}>{campo.label}</Text>
        </Pressable>
      );
    }

    // --- Clave foranea: se elige por NOMBRE, nunca por id ---
    if (campo.ref) {
      const opciones = vm.referencias[campo.ref] ?? [];
      if (opciones.length === 0) {
        return (
          <View key={campo.name} style={{ gap: spacing.xs }}>
            <Text style={typography.etiqueta}>{campo.label}</Text>
            <AvisoError
              mensaje={`No se pudo cargar la lista de «${campo.label}».`}
              onReintentar={vm.refrescar}
            />
          </View>
        );
      }
      return (
        <Selector
          key={campo.name}
          etiqueta={campo.required ? `${campo.label} *` : campo.label}
          valor={valor ? String(valor) : null}
          opciones={opciones}
          onElegir={(v) => fijar(campo.name, v)}
          placeholder="— Selecciona —"
          error={error}
        />
      );
    }

    // --- Lista de opciones fijas ---
    if (campo.type === 'select') {
      return (
        <Selector
          key={campo.name}
          etiqueta={campo.required ? `${campo.label} *` : campo.label}
          valor={valor ? String(valor) : null}
          opciones={(campo.options ?? []).map((o) => ({ valor: o, etiqueta: o }))}
          onElegir={(v) => fijar(campo.name, v)}
          placeholder="— Selecciona —"
          error={error}
        />
      );
    }

    // --- Texto, numero, fecha... ---
    return (
      <AppInput
        key={campo.name}
        etiqueta={campo.required ? `${campo.label} *` : campo.label}
        valor={valor === null || valor === undefined ? '' : String(valor)}
        onCambio={(t) => fijar(campo.name, t)}
        multilinea={campo.type === 'textarea'}
        tipoTeclado={tecladoDe(campo)}
        error={error}
        ayuda={ayudaDe(campo, esEdicion)}
        autoComplete="off"
      />
    );
  };

  return (
    <View style={estilos.contenedor}>
      <ScrollView
        contentContainerStyle={estilos.cuerpo}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={typography.titulo}>
          {esEdicion ? 'Editar' : 'Nuevo'} · {vm.tabla.label}
        </Text>
        <Text style={typography.ayuda}>
          Los campos con <Text style={estilos.obligatorio}>*</Text> son obligatorios.
        </Text>

        {vm.error && <AvisoError mensaje={vm.error} />}

        {vm.tabla.fields.map(pintarCampo)}
      </ScrollView>

      <View style={estilos.acciones}>
        <AppButton
          titulo="Cancelar"
          variante="ghost"
          onPress={onCerrar}
          deshabilitado={vm.guardando}
          estilo={{ flex: 1 }}
        />
        <AppButton
          titulo={esEdicion ? 'Guardar cambios' : 'Crear registro'}
          icono="ok"
          onPress={guardar}
          cargando={vm.guardando}
          estilo={{ flex: 1 }}
        />
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colors.papel },
  cuerpo: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  obligatorio: { color: colors.error },
  casilla: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  marca: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.linea,
    alignItems: 'center',
    justifyContent: 'center'
  },
  marcaActiva: { backgroundColor: colors.rojo, borderColor: colors.rojo },
  acciones: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.linea,
    backgroundColor: colors.blanco
  }
});
