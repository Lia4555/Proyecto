import { StatusBar } from 'expo-status-bar';
import React, { ReactNode, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppInput, Degradado, Icono, Marca, NombreIcono } from '../components';
import {
  CIFRAS,
  EMPRESA,
  ENLACES,
  FLOTA,
  GARANTIAS,
  IMAGENES,
  SERVICIOS,
  SeccionInicio
} from '../contenido/empresa';
import { colors, radius, sombras, spacing, typography } from '../theme';
import { errorTelefono, limpiarTelefono } from '../../Domain/entities';

// ============================================================
// PAGINA PRINCIPAL (publica) · presentacion de la empresa
// ------------------------------------------------------------
// La misma portada del frontend web (Landing.jsx), adaptada al telefono:
// una sola columna, la flota en carrusel horizontal, enlaces que llaman
// o abren el correo, y el boton "Ingresar" siempre visible arriba.
// ============================================================

interface Props {
  onIngresar: () => void;
  /** Con la sesion abierta el boton vuelve al panel en vez de ir al login. */
  conSesion?: boolean;
}

const ALTO_NAV = 60;

export const InicioView = ({ onIngresar, conSesion = false }: Props) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const posiciones = useRef<Partial<Record<SeccionInicio, number>>>({});
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [conSombra, setConSombra] = useState(false);

  const textoIngresar = conSesion ? 'Ir a mi panel' : 'Ingresar';

  const alDesplazar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const separado = e.nativeEvent.contentOffset.y > 12;
    if (separado !== conSombra) setConSombra(separado);
  };

  const irA = (seccion: SeccionInicio | 'arriba') => {
    setMenuAbierto(false);
    const y = seccion === 'arriba' ? 0 : posiciones.current[seccion] ?? 0;
    scroll.current?.scrollTo({ y, animated: true });
  };

  const registrar = (seccion: SeccionInicio) => (y: number) => {
    posiciones.current[seccion] = y;
  };

  return (
    <View style={estilos.fondo}>
      <StatusBar style="dark" />

      {/* ---------------------------- BARRA SUPERIOR --------------------------- */}
      <View
        style={[
          estilos.nav,
          { paddingTop: insets.top },
          (conSombra || menuAbierto) && estilos.navConSombra
        ]}
      >
        <View style={estilos.navFila}>
          <Pressable onPress={() => irA('arriba')} style={estilos.navMarca} accessibilityRole="button">
            <Marca eslogan={width >= 400 ? EMPRESA.eslogan : undefined} />
          </Pressable>

          <View style={estilos.navAcciones}>
            <AppButton titulo={textoIngresar} pequeno onPress={onIngresar} />
            <Pressable
              onPress={() => setMenuAbierto((v) => !v)}
              style={({ pressed }) => [estilos.iconbtn, pressed && estilos.iconbtnPresionado]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              accessibilityState={{ expanded: menuAbierto }}
            >
              <Icono nombre={menuAbierto ? 'cerrar' : 'menu'} tamano={22} color={colors.vino} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scroll}
        onScroll={alDesplazar}
        scrollEventThrottle={32}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <Hero onIrA={irA} />
        <Empresa onPosicion={registrar('empresa')} />
        <Servicios onPosicion={registrar('servicios')} />
        <Flota onPosicion={registrar('flota')} anchoPantalla={width} />
        <Garantias />
        <Contacto onPosicion={registrar('contacto')} />
        <Cierre onIngresar={onIngresar} textoIngresar={conSesion ? 'Ir a mi panel' : 'Ingresar al panel'} />
        <Pie onIrA={irA} onIngresar={onIngresar} />
      </ScrollView>

      {/* El menu va encima de todo y fuera de la barra: en Android un toque
          fuera de los limites del padre no llega a sus hijos. */}
      {menuAbierto && (
        <>
          <Pressable
            style={[StyleSheet.absoluteFill, estilos.velo, { top: insets.top + ALTO_NAV }]}
            onPress={() => setMenuAbierto(false)}
            accessibilityLabel="Cerrar menú"
          />
          <View style={[estilos.menu, { top: insets.top + ALTO_NAV }]}>
            {ENLACES.map(([seccion, texto]) => (
              <Pressable
                key={seccion}
                onPress={() => irA(seccion)}
                style={({ pressed }) => [estilos.menuEnlace, pressed && { backgroundColor: colors.papel }]}
                accessibilityRole="link"
              >
                <Text style={estilos.menuTexto}>{texto}</Text>
                <Icono nombre="derecha" tamano={16} color={colors.muted2} />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

/* ================================ SECCIONES ================================ */

const Encabezado = ({
  eyebrow,
  titulo,
  lead,
  oscuro = false
}: {
  eyebrow: string;
  titulo: string;
  lead?: string;
  oscuro?: boolean;
}) => (
  <View style={estilos.encabezado}>
    <Text style={[typography.eyebrow, oscuro && { color: colors.salmon }]}>{eyebrow}</Text>
    <Text style={[estilos.h2, oscuro && { color: colors.blanco }]}>{titulo}</Text>
    {lead && <Text style={typography.lead}>{lead}</Text>}
  </View>
);

const Seccion = ({
  children,
  onPosicion,
  fondo = colors.blanco
}: {
  children: ReactNode;
  onPosicion?: (y: number) => void;
  fondo?: string;
}) => (
  <View
    style={[estilos.seccion, { backgroundColor: fondo }]}
    onLayout={onPosicion ? (e) => onPosicion(e.nativeEvent.layout.y) : undefined}
  >
    {children}
  </View>
);

const Hero = ({ onIrA }: { onIrA: (s: SeccionInicio) => void }) => (
  <View>
    <View style={estilos.hero}>
      <Degradado
        colores={[colors.heroTinte, colors.blanco]}
        brillos={[{ x: 0.9, y: 0, color: colors.salmon, opacidad: 0.35 }]}
      />

      <View style={estilos.heroMedia}>
        {/* La sombra va en un marco aparte: en Android, elevation sobre una
            Image con bordes redondeados pinta un recuadro gris borroso. */}
        <View style={estilos.heroMarco}>
          <View style={estilos.heroRecorte}>
            <Image
              source={IMAGENES.hero}
              style={estilos.heroImagen}
              resizeMode="cover"
              accessibilityLabel="Van ejecutiva negra de transporte especial estacionada en la vía"
            />
          </View>
        </View>
        <View style={estilos.heroTarjeta}>
          <Text style={estilos.heroTarjetaValor}>98,6 %</Text>
          <Text style={estilos.heroTarjetaTexto}>
            de los servicios salieron a tiempo el último trimestre
          </Text>
        </View>
      </View>

      <Text style={[typography.eyebrow, estilos.heroEyebrow]}>
        Transporte especial de pasajeros · {EMPRESA.ciudad}
      </Text>
      <Text style={estilos.h1}>
        Movemos personas con <Text style={{ color: colors.rojo }}>seguridad, puntualidad</Text> y
        control.
      </Text>
      <Text style={[typography.lead, estilos.heroLead]}>
        En {EMPRESA.nombre} llevamos {EMPRESA.anios} años transportando empleados, estudiantes y
        viajeros. Cada servicio queda registrado en nuestro sistema: vehículo, conductor, ruta y
        estado del viaje.
      </Text>

      <View style={estilos.heroBotones}>
        <AppButton titulo="Solicitar una cotización" onPress={() => onIrA('contacto')} />
        <AppButton titulo="Ver servicios" variante="ghost" onPress={() => onIrA('servicios')} />
      </View>

      <View style={estilos.heroChips}>
        {(
          [
            ['escudo', 'Vehículos con documentos al día'],
            ['gps', 'Monitoreo satelital'],
            ['reloj', 'Disponibilidad 24/7']
          ] as [NombreIcono, string][]
        ).map(([icono, texto]) => (
          <View key={texto} style={estilos.heroChip}>
            <Icono nombre={icono} tamano={16} color={colors.rojo} />
            <Text style={estilos.heroChipTexto}>{texto}</Text>
          </View>
        ))}
      </View>
    </View>

    <View style={estilos.cifras}>
      {CIFRAS.map((c) => (
        <View key={c.etiqueta} style={estilos.cifra}>
          <Text style={estilos.cifraValor}>{c.valor}</Text>
          <Text style={estilos.cifraEtiqueta}>{c.etiqueta}</Text>
        </View>
      ))}
    </View>
  </View>
);

const Empresa = ({ onPosicion }: { onPosicion: (y: number) => void }) => (
  <Seccion onPosicion={onPosicion}>
    <View style={estilos.marcoImagen}>
      <Image
        source={IMAGENES.empresa}
        style={estilos.imagenEmpresa}
        resizeMode="cover"
        accessibilityLabel="Van blanca de pasajeros lista para prestar el servicio"
      />
    </View>

    <Encabezado
      eyebrow="Quiénes somos"
      titulo="Una empresa de transporte especial, no un intermediario"
    />
    <Text style={typography.cuerpo}>
      {EMPRESA.nombre} es una empresa colombiana dedicada al transporte terrestre automotor
      especial. Operamos con flota propia, conductores vinculados y un sistema de gestión donde
      cada vehículo tiene su hoja de vida, sus documentos y su historial de mantenimientos.
    </Text>
    <Text style={[typography.cuerpo, { marginTop: spacing.md }]}>
      Trabajamos con colegios, empresas, operadores turísticos y familias que necesitan mover
      grupos con la tranquilidad de saber quién conduce, en qué vehículo viajan y a qué hora
      llegan.
    </Text>

    <View style={estilos.mision}>
      <View style={estilos.misionTarjeta}>
        <Text style={estilos.h3}>Misión</Text>
        <Text style={estilos.textoSuave}>
          Prestar un servicio de transporte especial seguro y puntual, apoyado en tecnología que
          permita controlar cada viaje de principio a fin.
        </Text>
      </View>
      <View style={estilos.misionTarjeta}>
        <Text style={estilos.h3}>Visión</Text>
        <Text style={estilos.textoSuave}>
          Ser en {new Date().getFullYear() + 5} la empresa de transporte especial de referencia en
          la región por su cumplimiento y su cultura de seguridad vial.
        </Text>
      </View>
    </View>
  </Seccion>
);

const Servicios = ({ onPosicion }: { onPosicion: (y: number) => void }) => (
  <Seccion onPosicion={onPosicion} fondo={colors.papel}>
    <Encabezado
      eyebrow="Qué hacemos"
      titulo="Servicios para cada tipo de viaje"
      lead="Todos incluyen conductor profesional, seguro de pasajeros y seguimiento del recorrido desde nuestra central."
    />
    <View style={estilos.lista}>
      {SERVICIOS.map((s) => (
        <View key={s.titulo} style={estilos.tarjeta}>
          <View style={estilos.tarjetaIcono}>
            <Icono nombre={s.icono} tamano={22} color={colors.rojo} />
          </View>
          <Text style={estilos.h3}>{s.titulo}</Text>
          <Text style={estilos.textoSuave}>{s.texto}</Text>
        </View>
      ))}
    </View>
  </Seccion>
);

const Flota = ({
  onPosicion,
  anchoPantalla
}: {
  onPosicion: (y: number) => void;
  anchoPantalla: number;
}) => {
  const [actual, setActual] = useState(0);
  const anchoTarjeta = Math.min(anchoPantalla * 0.8, 340);
  const paso = anchoTarjeta + spacing.lg;

  return (
    <Seccion onPosicion={onPosicion}>
      <Encabezado
        eyebrow="Nuestra flota"
        titulo="Vehículos para grupos de 4 a 45 pasajeros"
        lead="Modelos recientes, revisión antes de cada salida y capacidad suficiente para equipaje. Si necesitas más vehículos, coordinamos varios en el mismo servicio."
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={paso}
        decelerationRate="fast"
        style={estilos.carrusel}
        contentContainerStyle={estilos.carruselContenido}
        onMomentumScrollEnd={(e) =>
          setActual(Math.round(e.nativeEvent.contentOffset.x / paso))
        }
      >
        {FLOTA.map((v) => (
          <View key={v.titulo} style={[estilos.vehiculo, { width: anchoTarjeta }]}>
            <Image
              source={v.imagen}
              style={estilos.vehiculoImagen}
              resizeMode="cover"
              accessibilityLabel={`${v.titulo}: ${v.texto}`}
            />
            <View style={estilos.vehiculoTexto}>
              <View style={estilos.chip}>
                <Text style={estilos.chipTexto}>{v.capacidad}</Text>
              </View>
              <Text style={estilos.h3}>{v.titulo}</Text>
              <Text style={estilos.textoSuave}>{v.texto}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={estilos.puntos} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {FLOTA.map((v, i) => (
          <View key={v.titulo} style={[estilos.punto, i === actual && estilos.puntoActivo]} />
        ))}
      </View>
    </Seccion>
  );
};

const Garantias = () => (
  <View style={[estilos.seccion, estilos.oscura]}>
    <Degradado
      colores={[colors.vino, colors.vino2, colors.vino3]}
      direccion="diagonal"
      brillos={[{ x: 0.9, y: 0, color: colors.salmon, opacidad: 0.2 }]}
    />
    <Encabezado
      eyebrow="Por qué confiar en nosotros"
      titulo="La seguridad se controla, no se promete"
      oscuro
    />
    <View style={estilos.lista}>
      {GARANTIAS.map((g) => (
        <View key={g.titulo} style={estilos.garantia}>
          <View style={estilos.garantiaIcono}>
            <Icono nombre={g.icono} tamano={20} color={colors.blanco} />
          </View>
          <Text style={[estilos.h3, { color: colors.blanco }]}>{g.titulo}</Text>
          <Text style={[estilos.textoSuave, { color: colors.oscuraTexto }]}>{g.texto}</Text>
        </View>
      ))}
    </View>
  </View>
);

const abrir = (url: string) =>
  Linking.openURL(url).catch(() =>
    Alert.alert('No se pudo abrir', 'Este teléfono no tiene una aplicación para abrir este enlace.')
  );

const telefonoUrl = (numero: string) => `tel:${numero.replace(/\s/g, '')}`;

const Contacto = ({ onPosicion }: { onPosicion: (y: number) => void }) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [servicio, setServicio] = useState(SERVICIOS[0].titulo);
  const [fecha, setFecha] = useState('');
  const [pasajeros, setPasajeros] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errores, setErrores] = useState<{ nombre?: string; telefono?: string }>({});

  // Igual que en el web: se abre la app de correo con el mensaje ya escrito,
  // asi funciona de verdad sin necesitar un servidor de correo.
  const enviar = () => {
    const problemas = {
      nombre: nombre.trim() ? undefined : 'Escribe tu nombre o el de tu empresa.',
      telefono: (telefono.trim() ? errorTelefono(telefono) : 'Escribe un teléfono de contacto.') ?? undefined
    };
    setErrores(problemas);
    if (problemas.nombre || problemas.telefono) return;

    const asunto = `Cotización de transporte especial · ${nombre.trim()}`;
    const cuerpo = [
      `Nombre: ${nombre.trim()}`,
      `Teléfono: ${telefono.trim()}`,
      `Servicio: ${servicio}`,
      `Fecha del viaje: ${fecha.trim() || 'por definir'}`,
      `Pasajeros: ${pasajeros.trim() || 'por definir'}`,
      '',
      mensaje.trim()
    ].join('\n');

    abrir(
      `mailto:${EMPRESA.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
    );
  };

  const datos: { icono: NombreIcono; rotulo: string; contenido: ReactNode }[] = [
    { icono: 'ubicacion', rotulo: 'Dirección', contenido: <Text style={estilos.datoTexto}>{EMPRESA.direccion}</Text> },
    {
      icono: 'telefono',
      rotulo: 'Teléfono',
      contenido: (
        <Text style={estilos.datoTexto}>
          <Text style={estilos.datoEnlace} onPress={() => abrir(telefonoUrl(EMPRESA.telefono))}>
            {EMPRESA.telefono}
          </Text>
          {'  ·  '}
          <Text style={estilos.datoEnlace} onPress={() => abrir(telefonoUrl(EMPRESA.whatsapp))}>
            {EMPRESA.whatsapp}
          </Text>
        </Text>
      )
    },
    {
      icono: 'correo',
      rotulo: 'Correo',
      contenido: (
        <Text style={[estilos.datoTexto, estilos.datoEnlace]} onPress={() => abrir(`mailto:${EMPRESA.correo}`)}>
          {EMPRESA.correo}
        </Text>
      )
    },
    { icono: 'reloj', rotulo: 'Horario', contenido: <Text style={estilos.datoTexto}>{EMPRESA.horario}</Text> }
  ];

  return (
    <Seccion onPosicion={onPosicion}>
      <Encabezado
        eyebrow="Hablemos"
        titulo="Cuéntanos tu viaje y te cotizamos"
        lead="Respondemos el mismo día hábil. Si prefieres, escríbenos directamente por teléfono o correo."
      />

      <View style={estilos.datos}>
        {datos.map((d) => (
          <View key={d.rotulo} style={estilos.dato}>
            <Icono nombre={d.icono} tamano={18} color={colors.rojo} />
            <View style={{ flex: 1 }}>
              <Text style={estilos.datoRotulo}>{d.rotulo}</Text>
              {d.contenido}
            </View>
          </View>
        ))}
      </View>

      <View style={estilos.formulario}>
        <AppInput
          etiqueta="Nombre o empresa"
          valor={nombre}
          onCambio={setNombre}
          autoComplete="name"
          error={errores.nombre}
        />
        <AppInput
          etiqueta="Teléfono"
          valor={telefono}
          onCambio={(t) => setTelefono(limpiarTelefono(t))}
          placeholder="300 000 0000"
          tipoTeclado="phone-pad"
          autoComplete="tel"
          error={errores.telefono}
        />

        <View style={{ gap: 6 }}>
          <Text style={typography.etiqueta}>Servicio que necesitas</Text>
          <View style={estilos.opciones}>
            {SERVICIOS.map((s) => {
              const activo = s.titulo === servicio;
              return (
                <Pressable
                  key={s.titulo}
                  onPress={() => setServicio(s.titulo)}
                  style={[estilos.opcion, activo && estilos.opcionActiva]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: activo }}
                >
                  <Text style={[estilos.opcionTexto, activo && { color: colors.blanco }]}>
                    {s.titulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={estilos.dosCampos}>
          <View style={{ flex: 1 }}>
            <AppInput etiqueta="Fecha del viaje" valor={fecha} onCambio={setFecha} placeholder="DD/MM/AAAA" />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              etiqueta="N.º de pasajeros"
              valor={pasajeros}
              onCambio={(t) => setPasajeros(t.replace(/\D/g, ''))}
              tipoTeclado="number-pad"
            />
          </View>
        </View>

        <AppInput
          etiqueta="Cuéntanos el recorrido"
          valor={mensaje}
          onCambio={setMensaje}
          placeholder="Origen, destino y horario aproximado"
          multilinea
        />

        <AppButton titulo="Enviar solicitud" onPress={enviar} />
        <Text style={[typography.ayuda, { textAlign: 'center' }]}>
          Al enviar se abrirá tu aplicación de correo con el mensaje listo para {EMPRESA.correo}.
        </Text>
      </View>
    </Seccion>
  );
};

const Cierre = ({ onIngresar, textoIngresar }: { onIngresar: () => void; textoIngresar: string }) => (
  <View style={estilos.cta}>
    <Text style={[estilos.h2, { fontSize: 21 }]}>¿Eres cliente o parte del equipo?</Text>
    <Text style={[typography.ayuda, { fontSize: 14, marginTop: 6 }]}>
      Ingresa al panel para consultar servicios, reservas, vehículos y alertas en tiempo real.
    </Text>
    <AppButton titulo={textoIngresar} onPress={onIngresar} estilo={{ marginTop: spacing.lg }} />
  </View>
);

const Pie = ({
  onIrA,
  onIngresar
}: {
  onIrA: (s: SeccionInicio) => void;
  onIngresar: () => void;
}) => (
  <View style={estilos.pie}>
    <Marca sobre="oscura" eslogan={EMPRESA.eslogan} />
    <Text style={estilos.pieTexto}>
      {EMPRESA.direccion} · {EMPRESA.telefono} · {EMPRESA.correo}
    </Text>

    <View style={estilos.pieEnlaces}>
      {ENLACES.map(([seccion, texto]) => (
        <Text key={seccion} style={estilos.pieEnlace} onPress={() => onIrA(seccion)}>
          {texto}
        </Text>
      ))}
      <Text style={[estilos.pieEnlace, { color: colors.salmon, fontWeight: '700' }]} onPress={onIngresar}>
        Ingresar al panel
      </Text>
    </View>

    <View style={estilos.pieLegal}>
      <Text style={estilos.pieLegalTexto}>
        © {new Date().getFullYear()} {EMPRESA.nombre}. Proyecto académico.
      </Text>
      <Text style={estilos.pieLegalTexto}>
        Fotografías de Wikimedia Commons (CC BY-SA): Damian B Oh, Ethan Llamas, Felipe Restrepo
        Acosta y Atomic Taco.
      </Text>
    </View>
  </View>
);

/* ================================= ESTILOS ================================= */

const GUTTER = spacing.xl;

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.blanco },

  // Barra superior
  nav: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderBottomWidth: 1,
    borderBottomColor: colors.transparente,
    zIndex: 10
  },
  navConSombra: { borderBottomColor: colors.linea, ...sombras.s2 },
  navFila: {
    height: ALTO_NAV,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    gap: spacing.md
  },
  navMarca: { flexShrink: 1 },
  navAcciones: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconbtn: { padding: 7, borderRadius: radius.xs },
  iconbtnPresionado: { backgroundColor: 'rgba(22, 24, 29, 0.07)' },
  velo: { backgroundColor: 'rgba(22, 24, 29, 0.25)' },
  menu: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.blanco,
    paddingHorizontal: GUTTER,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.linea,
    ...sombras.s2
  },
  menuEnlace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.linea2
  },
  menuTexto: { fontSize: 15, fontWeight: '600', color: colors.texto },

  // Tipografia de la portada
  h1: { fontSize: 32, lineHeight: 37, fontWeight: '800', color: colors.tinta, letterSpacing: -0.3 },
  h2: { fontSize: 25, lineHeight: 31, fontWeight: '800', color: colors.tinta, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: '800', color: colors.tinta },
  textoSuave: { fontSize: 14, lineHeight: 22, color: colors.muted },

  // Hero
  hero: { paddingHorizontal: GUTTER, paddingTop: spacing.xl, paddingBottom: 40, overflow: 'hidden' },
  heroMedia: { marginBottom: 36 },
  heroMarco: { borderRadius: radius.lg, backgroundColor: colors.linea, ...sombras.s3 },
  heroRecorte: { borderRadius: radius.lg, overflow: 'hidden' },
  heroImagen: { width: '100%', height: 240 },
  heroTarjeta: {
    position: 'absolute',
    right: 12,
    bottom: -18,
    maxWidth: 210,
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...sombras.s2
  },
  heroTarjetaValor: { fontSize: 22, fontWeight: '800', color: colors.rojo },
  heroTarjetaTexto: { fontSize: 12, lineHeight: 16, color: colors.muted, marginTop: 2 },
  heroEyebrow: { marginBottom: 10 },
  heroLead: { marginTop: spacing.lg },
  heroBotones: { gap: spacing.md, marginTop: 26, marginBottom: 22 },
  heroChips: { gap: 10 },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroChipTexto: { fontSize: 14, fontWeight: '600', color: colors.muted },

  // Cifras
  cifras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: colors.linea,
    backgroundColor: colors.blanco,
    paddingVertical: spacing.xl,
    paddingHorizontal: GUTTER,
    rowGap: spacing.xl
  },
  cifra: { width: '50%', alignItems: 'center' },
  cifraValor: { fontSize: 28, fontWeight: '800', color: colors.vino, lineHeight: 32 },
  cifraEtiqueta: { fontSize: 13, color: colors.muted },

  // Secciones
  seccion: { paddingHorizontal: GUTTER, paddingVertical: 48 },
  encabezado: { gap: 10, marginBottom: 26 },
  lista: { gap: spacing.lg },

  marcoImagen: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 32,
    backgroundColor: colors.linea,
    ...sombras.s2
  },
  imagenEmpresa: { width: '100%', height: 220 },

  mision: { gap: spacing.lg, marginTop: 24 },
  misionTarjeta: {
    backgroundColor: colors.papel,
    borderLeftWidth: 3,
    borderLeftColor: colors.rojo,
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: 6
  },

  tarjeta: {
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea,
    borderRadius: radius.md,
    paddingVertical: 22,
    paddingHorizontal: spacing.xl,
    gap: 6,
    ...sombras.s1
  },
  tarjetaIcono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.rojoSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },

  // Flota
  carrusel: { marginHorizontal: -GUTTER },
  carruselContenido: { paddingHorizontal: GUTTER, gap: spacing.lg, paddingBottom: 6 },
  vehiculo: {
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...sombras.s1
  },
  vehiculoImagen: { width: '100%', height: 190 },
  vehiculoTexto: { paddingTop: 18, paddingHorizontal: spacing.xl, paddingBottom: 22, gap: 6 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.rojoSuave,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4
  },
  chipTexto: { fontSize: 12, fontWeight: '700', color: colors.rojo },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  punto: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.linea },
  puntoActivo: { width: 22, backgroundColor: colors.rojo },

  // Garantias
  oscura: { overflow: 'hidden' },
  garantia: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: 6
  },
  garantiaIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.rojo,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },

  // Contacto
  datos: { gap: 14, marginBottom: 28 },
  dato: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  datoRotulo: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: colors.muted,
    marginTop: 1
  },
  datoTexto: { fontSize: 15, color: colors.texto, lineHeight: 22 },
  datoEnlace: { color: colors.tinta, fontWeight: '600', textDecorationLine: 'underline' },
  formulario: {
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.linea,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: 14,
    ...sombras.s2
  },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  opcion: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.linea,
    backgroundColor: colors.blanco
  },
  opcionActiva: { backgroundColor: colors.vino, borderColor: colors.vino },
  opcionTexto: { fontSize: 13, fontWeight: '600', color: colors.texto },
  dosCampos: { flexDirection: 'row', gap: spacing.md },

  // Cierre y pie
  cta: {
    backgroundColor: colors.papel,
    borderTopWidth: 1,
    borderTopColor: colors.linea,
    paddingHorizontal: GUTTER,
    paddingVertical: 36
  },
  pie: { backgroundColor: colors.tinta, paddingHorizontal: GUTTER, paddingTop: 40, paddingBottom: 26 },
  pieTexto: { marginTop: spacing.md, fontSize: 13, lineHeight: 19, color: colors.muted2 },
  pieEnlaces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 18,
    rowGap: 10,
    marginTop: spacing.xl,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)'
  },
  pieEnlace: { fontSize: 14, color: colors.pieTexto, paddingVertical: 4 },
  pieLegal: { paddingTop: spacing.lg, gap: 8 },
  pieLegalTexto: { fontSize: 12, lineHeight: 17, color: colors.muted2 }
});
