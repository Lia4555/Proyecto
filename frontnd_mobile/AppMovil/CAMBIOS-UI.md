# Cambios en la app móvil: la interfaz del frontend web llevada al teléfono

Este documento recoge **todos** los cambios hechos en `AppMovil/` para que la app se vea y
se recorra igual que el frontend web (`frontend-transporte/`), y para arreglar el inicio de
sesión, que no funcionaba.

Solo cambió la capa de **Presentación**, además de dos archivos de otras capas que
explican por qué fallaba el login (sección 2). Los ViewModels (`hooks/`), los repositorios
y los casos de uso de datos no se tocaron.

> **Sesión del 16 de septiembre de 2026 (secciones 23 a 35):** cambios en el backend, el
> panel web y la app. Incluye el reporte semanal en Excel, la foto de perfil, la sesión
> cifrada en la app y la validación de nombres y teléfonos. Ver
> [Sesión del 16 de septiembre de 2026](#sesión-del-16-de-septiembre-de-2026) al final del
> documento.

---

## Índice

1. [Dependencias nuevas](#1-dependencias-nuevas)
2. [Arreglo del inicio de sesión](#2-arreglo-del-inicio-de-sesión)
3. [Tema: colores, formas y tipografía del web](#3-tema-colores-formas-y-tipografía-del-web)
4. [Componentes compartidos](#4-componentes-compartidos)
5. [Contenido de la empresa](#5-contenido-de-la-empresa)
6. [Pantalla de arranque](#6-pantalla-de-arranque)
7. [Página principal (portada)](#7-página-principal-portada)
8. [Pantalla de inicio de sesión](#8-pantalla-de-inicio-de-sesión)
9. [Navegación y vista raíz](#9-navegación-y-vista-raíz)
10. [Panel: Mis servicios](#10-panel-mis-servicios)
11. [Panel: Detalle del servicio](#11-panel-detalle-del-servicio)
12. [Panel: Mi vehículo](#12-panel-mi-vehículo)
13. [Panel: Mis alertas](#13-panel-mis-alertas)
14. [Panel: Mi perfil](#14-panel-mi-perfil)
15. [Configuración de la app (`App.tsx` y `app.json`)](#15-configuración-de-la-app-apptsx-y-appjson)
16. [Imágenes](#16-imágenes)
17. [Verificación realizada](#17-verificación-realizada)
18. [Pendientes conocidos](#18-pendientes-conocidos)

---

## 1. Dependencias nuevas

Se instalaron con `npx expo install`, que elige las versiones compatibles con Expo SDK 57:

| Paquete | Versión | Para qué se usa |
|---|---|---|
| `react-native-svg` | 15.15.4 | Dibujar los mismos iconos de línea del web y los degradados de fondo. |
| `react-native-safe-area-context` | ~5.7.0 | Respetar la muesca, la barra de estado y la barra de gestos del teléfono. |
| `expo-constants` | ~57.0.18 | Leer la IP del computador que ejecuta Expo (ver sección 2). |

> Son módulos **nativos**. Expo Go ya los trae. Si se usa la compilación propia
> (`npm run android`), hay que **recompilar** la app una vez; recargar el JavaScript no basta.

---

## 2. Arreglo del inicio de sesión

Había dos causas por las que no se podía entrar.

### 2.1 Dirección del servidor — `src/Data/config/ApiConfig.ts`

**Antes:** la app llamaba siempre a `10.0.2.2:3000` en Android (así llama el *emulador* al
computador) o a `localhost:3000` en iOS. Desde un **teléfono real** ninguna de las dos
apunta al computador, así que la petición nunca llegaba. Existía una IP fija
(`192.168.1.10`) en `baseUrlDispositivoFisico`, pero nada la usaba.

**Ahora** la dirección se decide sola, en este orden:

1. `EXPO_PUBLIC_API_URL`, si está definida (por ejemplo en un `.env` de `AppMovil`):
   `EXPO_PUBLIC_API_URL=http://192.168.1.15:3000/api`
2. La IP del computador que ejecuta Expo, tomada de `Constants.expoConfig.hostUri`. Es la
   misma IP desde la que el teléfono descarga la app, así que sirve igual por wifi y en el
   emulador. Si esa IP es `localhost` dentro del emulador de Android, se cambia por `10.0.2.2`.
3. Si no hay nada de lo anterior: `10.0.2.2` en Android y `localhost` en iOS.

Se eliminaron `IP_EN_RED_LOCAL` y `baseUrlDispositivoFisico`.

### 2.2 Validación del login — `src/Domain/useCases/auth/IniciarSesion.ts`

**Antes:** el caso de uso pasaba el correo a minúsculas y rechazaba contraseñas de menos de
6 caracteres. El backend compara el correo **tal cual está guardado**, así que una cuenta
guardada con mayúsculas, o con una contraseña corta, no podía entrar nunca.

**Ahora** aplica las mismas reglas que el login web: correo y contraseña obligatorios, y
formato de correo válido. Nada más.

---

## 3. Tema: colores, formas y tipografía del web

Carpeta `src/Presentation/theme/`. La app pasó de un tema oscuro azul a la marca de D' VIAJE,
con los mismos valores que `frontend-transporte/src/index.css`.

### 3.1 `colors.ts` (reescrito)

- Paleta con los nombres del web:
  - **Marca:** `rojo #d81e24`, `rojoHover`, `rojoSuave`, `vino #7a1113`, `vino2`, `vino3`, `salmon`.
  - **Estados:** `verde`, `ambar`, `azul`, `error` y sus variantes suaves.
  - **Neutros:** `tinta`, `texto`, `muted`, `muted2`, `linea`, `linea2`, `fondoInput`, `papel`, `blanco`.
- **`TONOS`:** pares fondo/texto para las pastillas de estado (`programado`, `curso`,
  `hecho`, `cancelado`, `neutro`), idénticos a `.estado.*` del web.
- **`tonoEstado(nombre)`** reemplaza a `colorEstado`. Reconoce el estado por palabras clave
  sin importar tildes ("En tránsito" → curso, "Finalizado" → hecho…), igual que
  `claseEstado` en `MisServicios.jsx`.

### 3.2 `spacing.ts`

- `radius` con los radios del web: `xs 8`, `sm 10`, `md 14`, `lg 20`, `full`.
- `sombras` nuevo: `s1`, `s2`, `s3` y `rojo`, equivalentes a `--sombra-1/2/3` (en Android
  se aplican con `elevation`).
- `spacing.xl` pasa de 24 a 20.

### 3.3 `typography.ts`

- Títulos en peso 800 y color `tinta`, como en el web.
- Estilos nuevos:
  - `lead`: párrafo destacado en gris.
  - `eyebrow`: antetítulo en mayúsculas y rojo.
  - `rotulo`: el `<dt>` de las fichas, del tipo "SALIDA".
  - `valor`: el `<dd>` de las fichas.

---

## 4. Componentes compartidos

Carpeta `src/Presentation/components/`.

| Componente | Estado | Qué hace / qué cambió |
|---|---|---|
| `Icono.tsx` | **Nuevo** | Los iconos de `Icons.jsx` del web (ruta, bus, campana, escudo, ojo, etc.) dibujados con SVG. Uso: `<Icono nombre="bus" tamano={20} color={...} />`. |
| `Degradado.tsx` | **Nuevo** | Fondo con degradado lineal y brillos radiales, para replicar los `linear-gradient` + `radial-gradient` del CSS. |
| `Marca.tsx` | **Nuevo** | Círculo rojo "DV" + "D' VIAJE" + eslogan, en versión clara u oscura. También exporta `SelloMarca` (solo el círculo). |
| `Dato.tsx` | **Nuevo** | `Dato`: par rótulo/valor. `RejillaDatos`: los ordena en dos columnas. |
| `BarraSuperior.tsx` | **Nuevo** | Cabecera color vino del panel (`.cond-topbar`): marca, botón a la portada y avatar con iniciales que abre el perfil. |
| `AppButton.tsx` | Reescrito | Variantes `primario` (rojo), `ghost` (blanco con borde), `peligro` y `translucido`. Admite icono y tamaño `pequeno`. Cambia de color al presionar y tiene atributos de accesibilidad. |
| `AppInput.tsx` | Reescrito | Campo blanco con borde rojo al enfocar, borde rojo y mensaje debajo si hay `error`, y texto de `ayuda`. Si es contraseña, trae botón para mostrarla u ocultarla. Admite `ref`, tecla de retorno y envío con el teclado. |
| `AppCard.tsx` | Reescrito | Tarjeta blanca con borde, radio 14 y sombra suave. Al presionarla, el borde se pone salmón. |
| `Badge.tsx` | Reescrito | Pastilla con fondo de color y punto delante (`.estado`). Recibe `tono` en vez de `color`. |
| `MensajeEstado.tsx` | Reescrito | `Cargando` con rueda roja. `AvisoError` con el estilo de `.alert.error`, icono y enlace "Reintentar". `AvisoExito` es nuevo. `SinDatos` ahora es una caja punteada con icono, admite botón de acción y variante `positivo` (círculo verde). |
| `Pantalla.tsx` | Reescrito | Encabezado de sección (`.cond-head`): título grande y subtítulo sobre fondo `papel`. Admite `arriba`, por ejemplo para el enlace "volver". La barra de estado ya no la maneja aquí. |
| `BarraNavegacion.tsx` | Reescrito | Pestañas inferiores con iconos SVG en vez de texto ("RUTA", "BUS"…). La activa se marca en rojo con una línea arriba, y Alertas lleva un contador rojo. Respeta la barra de gestos. |
| `index.ts` | Actualizado | Exporta los componentes nuevos. |

---

## 5. Contenido de la empresa

**Nuevo:** `src/Presentation/contenido/empresa.ts`.

Tiene los mismos datos y textos de `Landing.jsx`: `EMPRESA` (nombre, dirección, teléfonos,
correo, horario), `CIFRAS`, `SERVICIOS`, `GARANTIAS`, `FLOTA` (con sus fotos), `IMAGENES` y
`ENLACES`. Si la empresa cambia un dato, hay que cambiarlo aquí **y** en el web.

---

## 6. Pantalla de arranque

**Nuevo:** `src/Presentation/views/ArranqueView.tsx`.

Reemplaza la rueda de carga sobre fondo oscuro. Muestra el sello "DV", el texto
"Comprobando tu sesión…" y una barra roja animada, igual que `.arranque` del web. Se ve
mientras se revisa si hay una sesión guardada.

---

## 7. Página principal (portada)

**Nuevo:** `src/Presentation/views/InicioView.tsx`.

Es la portada del web adaptada a una sola columna. Secciones, en orden:

1. **Barra superior fija:**
   - Marca a la izquierda. El eslogan se oculta en pantallas de menos de 400 px.
   - Botón rojo **Ingresar** y botón de menú.
   - El menú despliega La empresa, Servicios, Flota y Contacto; al tocar uno, la página se
     desplaza a esa sección.
   - La barra gana sombra al bajar, como en el web.
   - El menú se dibuja como capa encima de la página (con velo oscuro) y no dentro de la
     barra, porque en Android un toque fuera de los límites del padre no llega a sus hijos.
2. **Hero:**
   - Fondo con degradado rosado y la foto de la van con la tarjeta flotante "98,6 %".
     La sombra de la foto va en un marco aparte y no sobre la `Image`: en Android,
     `elevation` sobre una imagen con bordes redondeados pintaba un recuadro gris borroso
     y la foto no se veía. Se detectó al probar en el emulador; lo mismo se aplicó a la foto
     de "La empresa".
   - Antetítulo, titular con "seguridad, puntualidad" en rojo y párrafo.
   - Botones "Solicitar una cotización" (baja a Contacto) y "Ver servicios".
   - Tres ventajas con icono.
3. **Cifras:** 12 años, 45 vehículos, 30 mil viajes, 15 ciudades, en rejilla de 2×2.
4. **La empresa:** foto, "Quiénes somos", dos párrafos y las tarjetas Misión y Visión.
5. **Servicios:** fondo gris claro y seis tarjetas con icono en recuadro rojo suave.
6. **Flota:** **carrusel horizontal** que se ajusta tarjeta a tarjeta, con puntos
   indicadores (en el web era una rejilla).
7. **Garantías:** banda oscura con degradado vino y cuatro tarjetas translúcidas con icono
   en círculo rojo.
8. **Contacto:**
   - Dirección, teléfonos, correo y horario. Los teléfonos abren el marcador y el correo
     abre la app de correo.
   - Formulario de cotización con los mismos campos del web. El servicio se elige con
     pastillas en vez de lista desplegable.
   - Nombre y teléfono son obligatorios, con mensaje de error.
   - "Enviar solicitud" abre la app de correo con asunto y cuerpo ya escritos, igual que el
     web. Si no hay app de correo, avisa.
9. **Cierre:** "¿Eres cliente o parte del equipo?" con botón para ingresar.
10. **Pie:** fondo tinta, marca, datos de contacto, enlaces a secciones y créditos de las fotos.

Con la sesión abierta, la misma portada muestra **"Ir a mi panel"** en lugar de "Ingresar".

---

## 8. Pantalla de inicio de sesión

**Reescrito:** `src/Presentation/views/LoginView.tsx`.

Es la pantalla `AuthLayout` + `Login.jsx` del web, puesta en vertical:

- **Arriba, panel de marca color vino con degradado:**
  - Botón "Volver a la página principal".
  - Marca y frase "Gestiona tu flota, tus viajes y tus reservas desde un solo panel."
  - Las tres ventajas con punto rojo.
- **Encima, tarjeta blanca:**
  - Título "Iniciar sesión" y subtítulo "Entra con la cuenta de trabajo que te entregó la
    empresa."
  - Campo **Correo** con teclado de correo; la tecla "siguiente" salta a la contraseña.
  - Campo **Contraseña** con botón de ojo y tecla "ir" para entrar.
  - Cada campo se valida con mensaje debajo, y el error se borra al escribir.
  - Aviso rojo con el error que devuelve el servidor.
  - Botón **Entrar** ("Entrando…" mientras espera) y el texto "¿No tienes acceso? Solicítalo
    al administrador de la flota."

La lógica sigue en `useSesion`. La vista recibe `onVolver` para regresar a la portada.

---

## 9. Navegación y vista raíz

**Reescrito:** `src/Presentation/views/PrincipalView.tsx`. **Actualizado:** `views/index.ts`.

El recorrido ahora es el mismo del web:

```
Arranque ──► sin sesión ──► Portada ──(Ingresar)──► Login ──(Entrar)──► Panel
                              ▲                        │
                              └────(Volver)────────────┘

Panel ──(icono casa)──► Portada ("Ir a mi panel") ──► Panel
Panel ──(Cerrar sesión)──► Portada
```

- Al entrar o salir se limpia la pantalla pública. **Después de cerrar sesión se vuelve a la
  portada**, no al formulario.
- **Botón "atrás" de Android:**
  - En el login → vuelve a la portada.
  - En la portada con sesión → vuelve al panel.
  - En el detalle de un servicio → vuelve a la lista.
  - En Vehículo, Alertas o Perfil → vuelve a Servicios.
  - En Servicios → comportamiento normal del sistema (sale de la app).
- El panel tiene ahora la `BarraSuperior` vino. El subtítulo dice "Panel del conductor" o
  "Consulta del administrador", y las iniciales salen del nombre y apellido.

---

## 10. Panel: Mis servicios

**Reescrito:** `src/Presentation/views/ServiciosView.tsx`.

Cada viaje usa la ficha `.serv-card` del web:

- **Ficha de cada viaje:**
  - Código del servicio y pastilla de estado con su color.
  - Bloque de **ruta** sobre fondo gris: Salida (lugar y hora), flecha roja hacia abajo y
    Llegada estimada.
  - Rejilla con Pasajeros, Tipo y Llegada real.
  - Pastilla ámbar "Fuera de horario" si va con retraso.
  - Observaciones en bloque rosado con borde salmón.
  - Botón **"Actualizar estado"** (conductor) o **"Ver detalle"** (administrador).
- **Filtros** Todos / Pendientes / Retrasados con pastillas; la activa va en vino.
- **Contador** "N de M servicios · X pendientes · Y retrasados".
- **Lista vacía,** con dos mensajes distintos:
  - Si hay un filtro puesto: "Ningún servicio coincide" y botón "Quitar filtro".
  - Si no hay nada asignado: "Todavía no tienes servicios asignados" y botón "Comprobar de
    nuevo".
- Deslizar hacia abajo para actualizar, con indicador rojo.

---

## 11. Panel: Detalle del servicio

**Reescrito:** `src/Presentation/views/ServicioDetalleView.tsx`.

- Enlace rojo **"‹ Mis servicios"** encima del título, en lugar del botón gris "Volver".
- Tarjeta con estado, bloque de ruta y rejilla con Llegada real, Pasajeros, Valor, Distancia
  y Peajes.
- **Cambio de estado (antes y ahora):**
  - **Antes:** había un botón por cada estado que guardaba al instante, y *todos* mostraban
    la rueda de carga a la vez.
  - **Ahora:** los estados se muestran como **opciones de selección** (radio, con el punto
    de color de cada estado), con el campo Observaciones debajo. Un único botón
    **"Guardar: <estado>"** confirma el cambio y queda desactivado mientras no se elija
    nada. Así se evitan cambios por un toque accidental.
- Aviso verde al guardar y aviso rojo si falla.
- El administrador sigue viendo el servicio en solo lectura.

---

## 12. Panel: Mi vehículo

**Reescrito:** `src/Presentation/views/VehiculoView.tsx`.

- **Ficha `.veh-card`:**
  - Icono de bus en recuadro rosado, placa grande y "marca · línea · modelo".
  - Pastilla "Operativo" (verde) o "Fuera de servicio" (roja).
  - Rejilla con Capacidad, N.º interno, Color, Último mantenimiento y Próximo mantenimiento.
  - Botón "Reportar fuera de servicio" o "Marcar como operativo".
- **Bloque Documentos:** icono de documento, filas separadas por línea y pastilla de
  vigencia: "Vigente" (verde), "Vence en N d" (ámbar, a 30 días o menos) o "Vencido" (roja).
- **Bloque Mantenimientos recientes:** icono de herramienta, fecha y taller, y ahora
  también el **costo** a la derecha.
- Estado vacío con icono de bus: "Sin vehículo asignado".

---

## 13. Panel: Mis alertas

**Reescrito:** `src/Presentation/views/AlertasView.tsx`.

- **Tarjeta `.alerta-card`:**
  - Borde izquierdo rojo, o verde si está resuelta (entonces se ve más tenue).
  - Icono de campana en círculo rosado, o check verde si está resuelta.
  - Tipo, pastilla "Prioridad alta/media/baja" o "Resuelta", y descripción.
  - Fecha límite con icono de calendario.
- Subtítulo en lenguaje natural: "2 avisos sin resolver." o "No tienes avisos sin resolver."
- Lista vacía con círculo verde: "Todo en orden".

---

## 14. Panel: Mi perfil

**Reescrito:** `src/Presentation/views/PerfilView.tsx`.

- **Datos de la cuenta:**
  - Avatar vino con las iniciales, nombre completo y pastilla con el rol.
  - Correo y una frase que explica qué puede hacer ese rol.
- Botón **"Cerrar sesión"** con icono. Pasó a estilo `ghost`, como el botón "Salir" del web.
- **Sin datos internos.** Una primera versión mostraba el nivel de permiso, el id (UUID) de
  la ficha de conductor y un bloque "Conexión" con instrucciones técnicas. Se quitaron: a un
  conductor no le sirven, y el web tampoco enseña códigos internos.
- La dirección del servidor queda solo como una línea gris al final, **"Modo desarrollo ·
  servidor …"**, que se muestra únicamente en compilaciones de desarrollo (`__DEV__`). En la
  app compilada para producción no aparece.

> **Web, relacionado:** el botón "Volver a la página principal" del login y del registro
> (`.auth-volver`, en `AuthLayout.jsx`) no tenía ningún estilo y se veía como un botón
> gris del navegador. Se añadió en `frontend-transporte/src/index.css`: texto gris con
> flecha, y al pasar el ratón fondo rosado, texto vino y la flecha se desplaza.

---

## 15. Configuración de la app (`App.tsx` y `app.json`)

### `App.tsx`

- Se envolvió todo en `SafeAreaProvider`, que necesitan las barras superior e inferior.
- Se quitó el `StatusBar` global. Ahora cada pantalla fija el suyo: **claro** sobre las
  cabeceras vino (login y panel) y **oscuro** sobre fondos blancos (portada y arranque).

### `app.json`

| Clave | Antes | Ahora |
|---|---|---|
| `name` | `Transporte` | `D' VIAJE` |
| `userInterfaceStyle` | `dark` | `light` |
| `backgroundColor` | `#0F172A` | `#f5f6f9` (color `papel`) |
| `android.adaptiveIcon.backgroundColor` | `#0F172A` | `#7a1113` (color `vino`) |

---

## 16. Imágenes

Se copiaron desde `frontend-transporte/public/img/` a **`AppMovil/assets/img/`**:

- `hero-van.jpg`, `van-blanca.jpg`, `van-frontal.jpg`, `buseta-escolar.jpg`,
  `interior-bus.jpg` (unos 2,7 MB en total)
- `CREDITOS.md` (licencias de Wikimedia Commons; los créditos también salen en el pie de la
  portada)

---

## 17. Verificación realizada

| Prueba | Resultado |
|---|---|
| `npx tsc --noEmit` (tipos en modo estricto) | Sin errores. |
| `npx expo export --platform android` (empaquetado completo) | Correcto: 777 módulos, las 5 imágenes resueltas. |
| Backend, `GET /health` por la IP de la red local | `{"status":"UP"}` |
| Backend, `POST /api/auth/login` con un correo inexistente y `X-Client: mobile` | `401 "El correo o la contrasena son incorrectos."`: el servidor responde y consulta Supabase. |

### Recompilación y prueba en emulador

| Paso | Resultado |
|---|---|
| `npx expo run:android` en el emulador `Pixel_4` | `BUILD SUCCESSFUL in 2m 51s`: la app se instaló con los tres módulos nativos nuevos. |
| Portada en el emulador | Se ve con los colores y tipografía del web. Tras corregir la sombra del hero (sección 7), la foto aparece bien. |
| Botón **Ingresar** | Abre el login con el panel vino y la tarjeta blanca. |
| Login con un correo inexistente desde la app | Muestra el aviso rojo con el mensaje del backend ("El correo o la contrasena son incorrectos."): **la app ya llega al servidor**. |

Falta por verificar: un login con una cuenta real y las pantallas del panel con datos.

### Cómo recompilar de nuevo

```bash
# 1. Backend (desde C:\Proyectos\Backend)
npm run dev

# 2. App (desde C:\Proyectos\Backend\AppMovil), con el emulador abierto o un teléfono conectado
npm run android      # compila, instala y abre la app (solo hace falta al cambiar módulos nativos)
npx expo start --dev-client   # para cambios solo de JavaScript, sin recompilar
```

> No lanzar `npm run android` con la variable `CI=1`: en ese modo Metro no recarga los cambios.

---

## 18. Pendientes conocidos

Son cosas que **no** se cambiaron en esta tanda:

- **Firewall de Windows:** para que un teléfono real llegue al backend, el firewall debe
  permitir conexiones entrantes al puerto 3000.
- **Sesión vencida:** cuando el token de 8 horas expira, las pantallas muestran error en vez
  de volver solas al login.
- **Token sin cifrar:** la sesión se guarda en AsyncStorage sin cifrar. Lo recomendable es
  `expo-secure-store`.
- **Detalle del servicio:** sigue pidiendo la lista completa de servicios para mostrar uno
  solo, y la lista no se refresca sola al volver después de guardar.
- **`README.md` y `PASOS-FINALES.md`:** siguen describiendo el tema oscuro y la IP fija.

---

## 19. Registro de cuentas con aprobación

Se reemplazó el texto "¿No tienes acceso? Solicítalo al administrador de la flota." por la
opción de **crear una cuenta**, en la web y en la app. La cuenta nace como **Conductor
apagado** y no puede entrar hasta que un administrador la aprueba (detalle del backend en
el `README.md` de la raíz, sección «Registro con aprobación del administrador»).

### En la app

| Capa | Archivo | Cambio |
|---|---|---|
| Dominio | `Domain/entities/SolicitudCuenta.ts` | **Nuevo.** Datos de la solicitud, `TIPOS_DOCUMENTO` (CC, CE, PA) y `ErrorValidacion`, que lleva los errores por campo. |
| Dominio | `Domain/repositories/AuthRepository.ts` | Nuevo método `registrarCuenta`. |
| Dominio | `Domain/useCases/auth/RegistrarCuenta.ts` | **Nuevo.** Mismas reglas que el backend: nombre y apellido; documento de 5 a 20 letras o números; teléfono; correo; contraseña de 8 a 72 caracteres que se repite igual. |
| Datos | `Data/api/HttpClient.ts` | `ApiError` guarda los `detalles` por campo que manda el servidor. |
| Datos | `Data/sources/AuthApiSource.ts` | Nuevo `registrar()` → `POST /auth/register`. |
| Datos | `Data/repositories/AuthRepositoryImpl.ts` | Convierte los errores por campo del servidor en `ErrorValidacion`. |
| Datos | `Data/di/Container.ts` | Registra el caso de uso `registrarCuenta`. |
| Presentación | `hooks/useRegistroViewModel.ts` | **Nuevo.** Valores del formulario, errores por campo y estado "enviada". |
| Presentación | `views/RegistroView.tsx` | **Nueva pantalla** con el mismo marco del login (cabecera vino + tarjeta). Pide nombre, apellido, tipo de documento (pastillas), número de documento, teléfono, correo, contraseña y confirmación. Al enviar muestra **"Solicitud enviada"** y explica que falta la aprobación. |
| Presentación | `views/LoginView.tsx` | El pie ahora dice **"¿No tienes cuenta? Crear una cuenta"**. |
| Presentación | `views/PrincipalView.tsx` | Nueva pantalla pública `registro`. El botón atrás de Android va de registro a login y de login a portada. |

Si alguien intenta entrar con una cuenta pendiente, el login muestra el aviso del servidor:
*"Tu cuenta todavía no está activa. Un administrador debe aprobarla antes de que puedas entrar."*

### En la web (`frontend-transporte/`)

- `components/Registro.jsx` (**nuevo**): formulario de registro con la misma validación y
  pantalla de éxito.
- `components/Login.jsx`: enlace **"Crear una cuenta"**.
- `App.jsx`: nueva ruta pública `registro`.
- `components/Cuentas.jsx` (**nuevo**): sección **Personas → Cuentas de acceso** del
  administrador.
  - Filtros Pendientes / Activas / Todas.
  - Botones **Aprobar**, **Rechazar** y **Desactivar**, con confirmación.
  - Marca las cuentas de conductor que no tienen ficha.
- `components/Dashboard.jsx`: añade esa sección al menú y a las rutas (`SECCIONES_ADMIN`).
- `index.css`: estilos de los filtros y la pastilla ámbar "Pendiente".
- `demo/main.jsx`: la demo simula el registro y las cuentas.
- `tests/pruebas.jsx`: pruebas nuevas del registro, el enlace del login y la sección de
  cuentas.

### Verificación

| Prueba | Resultado |
|---|---|
| `npm test` en `frontend-transporte` | Todas las pruebas pasaron. |
| `npx vite build` | Correcto. |
| `npx tsc --noEmit` en `AppMovil` | Sin errores. |
| Prueba de punta a punta contra el backend real (18 comprobaciones) | Todas correctas: datos inválidos (400), correo repetido (409), cuenta y ficha creadas apagadas con contraseña cifrada, login pendiente (403), `/cuentas` sin sesión (401) y sin contraseñas, aprobar → login OK, desactivar → 403, rechazar borra cuenta y ficha. La cuenta de prueba se borró al terminar. |

---

## 20. Errores "Gateway Timeout" de Supabase

**Síntoma:** al abrir Vehículo o tocar "Comprobar de nuevo" en Servicios aparecía a veces
el aviso rojo **"Gateway Timeout"**.

**Causa:** el mensaje venía de **Supabase**, no de la app. Supabase responde a veces con un
504 aunque las consultas tardan entre 150 y 480 ms. Suele ser su grupo de conexiones
saturado un instante, algo habitual en el plan gratuito. El backend pasaba ese texto tal cual.

**Cambios:**

| Dónde | Cambio |
|---|---|
| `config/supabase.js` (backend) | Las **lecturas** que reciben 502, 503 o 504, o que no obtienen respuesta, se reintentan hasta 2 veces (esperas de 300 y 900 ms). Cada intento tiene un límite de 12 s. Las **escrituras nunca se repiten**, para no guardar nada dos veces. |
| `middleware/errorHandler.js` (backend) | Si aun así falla, responde 503 con *"La base de datos tardó en responder. Inténtalo de nuevo en unos segundos."* |
| `views/ServiciosView.tsx`, `views/AlertasView.tsx` | Con un error ya no se muestra además "Todavía no tienes servicios asignados" ni "Todo en orden", que eran falsos. Solo queda el aviso rojo con "Reintentar". |

**Verificación:** con un servidor falso que responde 504 a propósito:
- una lectura que falla dos veces y luego funciona termina bien;
- una lectura que sigue fallando se rinde al tercer intento;
- una escritura no se reintenta;
- el mensaje se traduce;
- una consulta real a Supabase sigue funcionando.

---

## 21. Funciones de administrador en la app

Antes, el administrador veía las pantallas del conductor en solo lectura. Ahora tiene
**su propio panel**, con pestañas **Resumen · Servicios · Cuentas · Alertas · Perfil**. El
conductor conserva su panel sin cambios.

Queda **solo en la web** lo que es trabajo de escritorio: catálogos, vehículos,
documentos, mantenimientos, clientes y reservas.

### 21.1 Pantallas nuevas (`src/Presentation/views/admin/`)

| Pantalla | Qué hace |
|---|---|
| `ResumenAdminView` | Seis mosaicos: cuentas por aprobar, servicios retrasados, en curso, que salen hoy, alertas sin resolver y vehículos fuera de servicio. Los urgentes se resaltan en color, y al tocarlos se abre la lista ya filtrada. Además: aviso ámbar con documentos vencidos o por vencer, y accesos rápidos "Nuevo servicio" y "Enviar alerta". |
| `AdminServiciosView` | Todos los servicios con conductor y placa. Filtros **Todos / Hoy / En curso / Retrasados** con contador. Marca "Fuera de horario" y "Vehículo fuera de servicio". Botón **Nuevo**. |
| `AdminServicioDetalleView` | Detalle del viaje y bloque **Despacho**: estado (pastillas), conductor y vehículo (listas con buscador) y observaciones. Avisa si el vehículo no tiene capacidad para los pasajeros. "Guardar cambios" solo se activa si algo cambió, y **manda solo lo que cambió**. Pasar a Finalizado registra la llegada real. |
| `NuevoServicioView` | Formulario completo: código (sugiere el siguiente `SVC-00NN`), tipo, origen, destino, salida y llegada (fecha `DD/MM/AAAA` y hora `HH:MM` con máscara), pasajeros, valor, conductor, vehículo, estado inicial y observaciones. Valida que la llegada sea después de la salida y que origen y destino sean distintos. |
| `CuentasView` | Solicitudes y cuentas activas, igual que «Cuentas de acceso» del web. Filtros **Pendientes / Activas / Todas**. **Aprobar**, **Rechazar** y **Desactivar**; rechazar y desactivar piden confirmación. La pestaña muestra el número de pendientes y se refresca al abrirla. |
| `AdminAlertasView` | Todas las alertas con el conductor que las recibe. Filtros **Sin resolver / Resueltas / Todas** y botón **"Marcar como resuelta"**. |
| `NuevaAlertaView` | Para quién (conductor), tipo (del catálogo), prioridad 1–5 (toma la del tipo por defecto), mensaje y fecha límite opcional. |

### 21.2 Componentes nuevos

- `Selector.tsx`: campo que abre una hoja inferior con buscador (reemplaza al `<select>`
  del web) y admite avisos como "Fuera de servicio" o "Inactivo".
- `Chips.tsx`: grupo de pastillas de elección única con contador opcional.
  - Con `desplazable`, las pastillas quedan en **una sola fila que se desliza de lado** y
    llega al borde de la pantalla.
  - Se usa en los filtros de Cuentas, Servicios y Alertas: con cuatro filtros, en un
    teléfono estrecho se partían en dos filas descuadradas.
  - Los chips de los formularios (estado, tipo, prioridad) siguen en varias filas.
  - En el resumen **no** se añadió un mosaico de cuentas desactivadas. Los mosaicos son
    para lo que requiere acción, y una desactivación es una decisión ya tomada: sigue a un
    toque en Cuentas → Desactivadas.
- `BarraNavegacion.tsx`: recibe la lista de pestañas (`PESTANAS_CONDUCTOR` o
  `PESTANAS_ADMIN`) y contadores por pestaña.

### 21.3 Lógica (dominio, datos y ViewModels)

- **Dominio**
  - `entities/Admin.ts`: `ConductorResumen`, `CuentaAcceso`, `TipoAlerta`, `NuevoServicio`,
    `NuevaAlerta`, `ResumenAdmin` y `TIPOS_SERVICIO`.
  - Casos de uso en `useCases/admin/`: `ObtenerResumenAdmin`, `ListarCuentas`,
    `GestionarCuenta`, `ListarConductores`, `CrearServicio`, `EditarServicio`, `CrearAlerta` y
    `ResolverAlerta`.
- **Datos**
  - `AdminRepository` e `AdminRepositoryImpl` (nuevos).
  - `ServicioRepository.crear`, `AlertaRepository.crear` y `resolver`.
  - `HttpClient` con `patch()` y `delete()`.
  - Los catálogos incluyen ahora los tipos de alerta.
- **ViewModels**
  - `hooks/useAdmin.ts`: resumen, flota (conductores y vehículos), cuentas, servicios y
    alertas.
  - `hooks/useFormulariosAdmin.ts`: detalle y edición, nuevo servicio y nueva alerta.
- **Navegación**
  - `useNavegacion` admite pestaña inicial, formularios a pantalla completa y filtro inicial.
  - El botón atrás de Android cierra el formulario o el detalle y luego vuelve a la pestaña
    inicial.
- **Fechas**
  - Arreglo: `formatearFecha` y `diasRestantes` mostraban un día menos las fechas sin hora
    (`2026-10-04`) por la zona horaria de Colombia.
  - Nuevas funciones de máscara y lectura de fechas en `theme/formato.ts`.

### 21.4 Backend

- `controllers/genericController.js`: el `PUT` del administrador valida **en parcial**, así
  la app puede mandar solo lo que cambia. Un `PUT` vacío responde 400.
- `schemas/genericSchema.js`: las fechas con hora aceptan zona horaria (`+00:00`), como las
  devuelve Postgres. Antes, reenviar una fecha tal cual llegaba de la base daba error 400.

### 21.5 Verificación

| Prueba | Resultado |
|---|---|
| `npx tsc --noEmit` | Sin errores. |
| Backend real, 10 comprobaciones con datos de prueba (borrados al final) | Crear servicio (201), reasignar conductor y vehículo con cambio parcial (200), finalizar con llegada real (200), reenviar fecha `+00:00` (200), cambio inválido (400), `PUT` vacío (400), crear alerta (201), resolver sin borrar los demás campos (200) y lista de cuentas (200). |
| Emulador, sesión de administrador | Resumen con datos reales (10 retrasados, 3 en curso, 10 alertas, 13 documentos vencidos), lista de Servicios con filtros y contadores, y detalle con el bloque Despacho. |

Falta probar desde la pantalla: guardar una reasignación, crear un servicio o una alerta y
aprobar una cuenta.

---

## 22. Cuentas desactivadas que aparecían como "Pendiente"

**Síntoma:** al desactivar la cuenta `antonio@gmail.com` (administrador), pasó a
**Pendientes** con los botones Aprobar y Rechazar. "Rechazar" habría borrado una cuenta que
ya estaba en uso.

**Causa:** la tabla `usuario` solo tenía `activo` (sí/no), así que una solicitud sin
revisar y una cuenta desactivada eran indistinguibles.

**Solución: tres estados**

| Estado | Significado | Acciones |
|---|---|---|
| Pendiente | Solicitud del registro sin revisar | Aprobar · Rechazar |
| Activa | Puede entrar | Desactivar |
| Desactivada | Ya estuvo aprobada y el administrador la apagó | **Reactivar** |

**Cambios:**

- **Base de datos** (`sql/estado-cuentas.sql`, **hay que ejecutarlo en Supabase**)
  - Añade `usuario.aprobada_en`, la fecha de la primera aprobación.
  - Marca como aprobadas las cuentas activas y todas las de administrador.
  - Se puede ejecutar varias veces.
- **Backend** (`controllers/cuentasController.js`)
  - Devuelve `estado` en cada cuenta.
  - Aprobar guarda `aprobada_en` y responde "reactivada" si la cuenta ya lo había estado.
  - Rechazar solo acepta solicitudes pendientes: nunca una desactivada ni un administrador.
  - **Nuevo:** no deja desactivar al último administrador activo.
  - Funciona antes y después de ejecutar el SQL: detecta la columna sola, sin reiniciar.
- **App**
  - `CuentaAcceso.estado` y filtros **Pendientes / Activas / Desactivadas / Todas**.
  - Pastilla gris "Desactivada" y botón **Reactivar**.
  - El contador de la pestaña Cuentas y el resumen solo cuentan las pendientes.
- **Web** (`Cuentas.jsx`): los mismos estados, filtros y el botón Reactivar. La demo también.

**Verificación (sin modificar datos):**
- `tsc` sin errores y `npm test` del web sin fallos.
- Contra la base real, antonio aparece como **Desactivada**.
- El servidor rechaza con 400:
  - rechazarlo;
  - desactivar una cuenta ya desactivada;
  - aprobar una cuenta ya activa.


---
---

# Sesión del 16 de septiembre de 2026

Esta parte del documento recoge **todo lo que se cambió en esta sesión**, en las tres
partes del proyecto:

| Carpeta | Qué es |
|---|---|
| raíz (`dviaje-ultimos-cambios/`) | **Backend**: Express + Supabase, puerto 3000 |
| `frontend-transporte/` | **Panel web**: React + Vite, puerto 5173 |
| `AppMovil/` | **App móvil**: React Native + Expo |

A diferencia de las secciones anteriores, aquí hay cambios en las tres carpetas, no solo en
la app. Cada sección explica **qué problema había o qué se pidió**, **qué se hizo**, **en qué
archivos** y **cómo se comprobó**.

## Resumen en una tabla

| # | Cambio | Backend | Web | App | ¿Requiere un paso manual? |
|---|---|:-:|:-:|:-:|---|
| 23 | Arreglo: la web decía «No se pudo conectar con el servidor» | ✔ | | | Arrancar el backend desde la carpeta correcta |
| 24 | Arreglo: el backend se reiniciaba solo cada pocos segundos | ✔ | | | No |
| 25 | Arreglo: la web se abría en el puerto 5174 y el login fallaba | | ✔ | | No |
| 26 | Nuevo: reporte semanal de servicios en Excel | ✔ | ✔ | | No |
| 27 | Nuevo: foto de perfil (base de datos y backend) | ✔ | | | **Sí: ejecutar `sql/foto-perfil.sql`** |
| 28 | Nuevo: foto de perfil en el panel web | | ✔ | | No |
| 29 | Nuevo: foto de perfil en la app móvil | | | ✔ | Regenerar el build nativo si se usa |
| 30 | Seguridad: la sesión de la app se guarda cifrada | | | ✔ | Regenerar el build nativo si se usa |
| 31 | Nuevo: nombres sin números y teléfonos sin letras | ✔ | ✔ | ✔ | No |

## Índice de esta sesión

23. [Arreglo: la web no conectaba con el backend (backend antiguo)](#23-arreglo-la-web-no-conectaba-con-el-backend-backend-antiguo)
24. [Arreglo: el backend se reiniciaba solo](#24-arreglo-el-backend-se-reiniciaba-solo)
25. [Arreglo: la web se abría en el puerto 5174](#25-arreglo-la-web-se-abría-en-el-puerto-5174)
26. [Reporte semanal de servicios en Excel](#26-reporte-semanal-de-servicios-en-excel)
27. [Foto de perfil: base de datos y backend](#27-foto-de-perfil-base-de-datos-y-backend)
28. [Foto de perfil: panel web](#28-foto-de-perfil-panel-web)
29. [Foto de perfil: app móvil](#29-foto-de-perfil-app-móvil)
30. [Sesión cifrada en la app móvil](#30-sesión-cifrada-en-la-app-móvil)
31. [Validación de nombres y teléfonos](#31-validación-de-nombres-y-teléfonos)
32. [Mapa de carpetas y archivos tocados](#32-mapa-de-carpetas-y-archivos-tocados)
33. [Verificación realizada en esta sesión](#33-verificación-realizada-en-esta-sesión)
34. [Cómo arrancar todo](#34-cómo-arrancar-todo)
35. [Pendientes y recomendaciones](#35-pendientes-y-recomendaciones)

---

## 23. Arreglo: la web no conectaba con el backend (backend antiguo)

**Síntoma.** Al pulsar «Entrar» en la web aparecía *«No se pudo conectar con el servidor.
Revisa que el backend esté encendido»*, aunque el backend sí estaba encendido.

**Causa.** En el puerto 3000 no estaba corriendo el backend del proyecto, sino **una copia
antigua** que vive en la carpeta `Transporte-api/`. Se arrancaba porque la terminal estaba
situada dentro de esa carpeta al escribir `npm run dev`.

Esa copia antigua tiene `app.use(cors())` sin configurar, así que responde con la cabecera
`Access-Control-Allow-Origin: *`. La web envía el login **con cookies**
(`withCredentials: true`), y los navegadores **prohíben** leer una respuesta con cookies
cuando el servidor contesta `*`. El navegador bloquea la respuesta, axios la recibe como
«sin respuesta» y la web muestra el mensaje de «no se pudo conectar».

**Cómo se reconoce.** Si al arrancar el backend aparece la palabra **`[nodemon]`**, es el
antiguo. El backend correcto usa `node --watch` y al arrancar muestra:

```
 Servidor corriendo en: http://localhost:3000
 CORS permitido para: http://localhost:5173
 Cookies: httpOnly, sameSite=lax, secure=false
 Conexion exitosa con Supabase
```

**Solución.** Cerrar el backend antiguo (`Ctrl+C`) y arrancar el correcto **desde la carpeta
raíz**:

```powershell
cd C:\Users\liama\OneDrive\Documentos\dviaje-ultimos-cambios
npm run dev
```

**Pendiente.** Para que no se pueda volver a arrancar por error, la carpeta `Transporte-api/`
debe moverse a `_legacy/` (la carpeta `_legacy/` ya está creada y está en el `.gitignore`).
No se pudo mover porque Windows la tiene bloqueada: hay una terminal `cmd.exe` abierta
**dentro** de esa carpeta. Hay que cerrar esa terminal (o escribir `cd ..` en ella) y después
mover la carpeta.

---

## 24. Arreglo: el backend se reiniciaba solo

**Síntoma.** El backend se reiniciaba cada pocos segundos sin que nadie tocara el código.
Si un inicio de sesión coincidía con un reinicio, volvía a salir el error de conexión.

**Causa.** El script `dev` era `node --watch server.js`. Ese modo vigila **todos** los
archivos que carga el servidor, incluida la carpeta `node_modules`. Como el proyecto está
dentro de **OneDrive**, la sincronización toca esos archivos y Node lo interpretaba como un
cambio de código.

**Solución.** En `package.json` (raíz) el script ahora vigila solo las carpetas del
código propio:

```json
"dev": "node --watch-path=server.js --watch-path=.env --watch-path=config --watch-path=controllers --watch-path=middleware --watch-path=routers --watch-path=schemas server.js"
```

Si se edita un archivo de esas carpetas, el servidor sigue recargándose solo, como antes.

**Comprobación.** Con el cambio, el servidor estuvo 20 segundos sin reiniciarse (antes se
reiniciaba varias veces en ese tiempo).

> Si se crea una carpeta nueva de código en el backend, hay que añadir otro
> `--watch-path=<carpeta>` a ese script.

---

## 25. Arreglo: la web se abría en el puerto 5174

**Síntoma.** Con el backend correcto encendido, el login seguía fallando con el mismo mensaje.

**Causa.** Había **dos** servidores web abiertos. El primero ocupaba el puerto 5173 y, al
lanzar el segundo, Vite se movió **sin avisar** al 5174. El backend solo acepta peticiones
del origen configurado en `FRONTEND_URL` (`http://localhost:5173`) y rechaza el 5174 con
un 403 de CORS.

**Solución.** En `frontend-transporte/vite.config.js` se añadió `strictPort: true`. Ahora, si
el 5173 está ocupado, Vite **se detiene con un mensaje claro** en lugar de abrir en otro
puerto. En ese caso hay que cerrar el otro servidor web antes de lanzar uno nuevo.

---

## 26. Reporte semanal de servicios en Excel

**Qué se pidió.** Poder generar un reporte semanal de los servicios y descargarlo en Excel.

### Cómo se usa

1. Entrar al panel web como **administrador**.
2. Ir a **Operación → Servicios**.
3. Pulsar el botón **«Reporte semanal»** (junto a «Actualizar»).
4. Elegir la semana: con las flechas ‹ › o eligiendo cualquier día en el calendario (se toma
   su semana completa, de **lunes a domingo**).
5. Pulsar **«Descargar Excel»**. Se descarga un archivo con nombre como
   `reporte-servicios_2026-09-14_a_2026-09-20.xlsx` y un aviso indica cuántos servicios trae.

### Qué contiene el Excel

Entran los servicios cuya **fecha de salida** cae en esa semana, en **hora de Colombia**
(UTC−5), sin importar la zona horaria del servidor.

**Hoja «Resumen»**
- Título, rango de la semana y fecha de generación.
- **Indicadores:** servicios programados, pasajeros, valor total, peajes estimados, distancia
  estimada, servicios con llegada registrada, llegadas a tiempo, llegadas con retraso y
  porcentaje de puntualidad (llegada real frente a la estimada).
- **Tabla por día:** los 7 días siempre aparecen, aunque alguno no tenga servicios.
- **Tabla por estado** y **tabla por conductor** (servicios, pasajeros, valor y km).

**Hoja «Servicios»**
- Una fila por servicio con **nombres** (no códigos internos): conductor, vehículo (placa ·
  marca · línea), origen, destino y estado.
- Fechas con hora, minutos de retraso (en rojo si llegó tarde), pasajeros, precio,
  distancia, peajes y observaciones.
- Encabezado fijo al desplazarse, filtros en cada columna y una fila de **TOTAL** al final.

> **A tener en cuenta:** el «valor total» suma el precio de **todos** los servicios de la
> semana, incluidos los cancelados. La tabla «Por estado» muestra cuánto corresponde a cada
> estado.

### Por qué se genera en el backend

- Solo el administrador puede pedirlo (lo exige el servidor, no solo la pantalla).
- La base de datos filtra por semana: no se descarga la tabla completa de servicios.
- Los códigos se traducen a nombres en el servidor, en una sola consulta por tabla.

### Archivos

| Archivo | Tipo | Qué hace |
|---|---|---|
| `controllers/reportesController.js` | **Nuevo** | Lee los servicios de la semana y los catálogos, calcula totales y arma el Excel con `exceljs`. |
| `routers/reportesRouter.js` | **Nuevo** | Ruta `GET /api/reportes/servicios-semanal?desde=AAAA-MM-DD`, protegida con sesión y `soloAdmin`. |
| `server.js` | Modificado | Registra `/api/reportes`. En CORS añade `exposedHeaders` (`Content-Disposition`, `X-Total-Servicios`) para que el navegador pueda leer el nombre del archivo y el total. |
| `package.json` (raíz) | Modificado | Nueva dependencia **`exceljs` ^4.4.0**. |
| `frontend-transporte/src/components/ReporteSemanal.jsx` | **Nuevo** | Botón, selector de semana y descarga del archivo. Si el servidor responde con error, lee el mensaje aunque la respuesta venga como archivo. |
| `frontend-transporte/src/components/DataTable.jsx` | Modificado | Nueva propiedad `acciones`: botones propios de una sección, junto a «Actualizar». |
| `frontend-transporte/src/components/Dashboard.jsx` | Modificado | Pasa `<ReporteSemanal />` solo a la sección Servicios. |
| `frontend-transporte/src/index.css` | Modificado | Estilos del menú del reporte (`.reporte-menu`, `.reporte-semana`, `.reporte-rango`). |
| `README.md` (raíz) | Modificado | Sección «Reporte semanal de servicios (Excel)». |

### Comprobación

- Se generaron reportes con **datos reales** de las semanas del 23/02/2026 (3 servicios) y
  del 14/09/2026 (2 servicios): días, nombres y totales correctos.
- Una semana sin servicios produce un Excel válido con «Sin datos en esta semana».
- Una fecha imposible (`2026-02-30`) o un texto (`hola`) se rechazan con 400.
- Sin sesión, la ruta responde 401. La web compila y sus pruebas pasan.

---

## 27. Foto de perfil: base de datos y backend

**Qué se pidió.** Que cada usuario pueda poner una foto de perfil, con opciones parecidas a
las de Google: elegir una ilustración, subir desde el dispositivo o tomar una foto.

### Dónde se guarda la foto

En una **columna nueva** de la tabla `usuario`: `foto_perfil`. Se guarda como *data URL*
(`data:image/jpeg;base64,...`). Antes de enviarla, tanto la web como la app la **recortan en
cuadrado y la reducen a 256 × 256 px** en JPEG, así que cada foto pesa unos 20–40 KB.
No hace falta configurar el almacenamiento de archivos de Supabase.

### ⚠️ Paso manual obligatorio

La columna la crea el script **`sql/foto-perfil.sql`**, que hay que ejecutar **una vez** en
Supabase → SQL Editor → New query → pegar → Run. Al final debe mostrar una fila
`foto_perfil | text`.

Mientras no se ejecute:
- los avatares siguen mostrando las iniciales (no aparece ningún error);
- al intentar guardar una foto, el servidor responde 503 con el mensaje
  *«La base de datos aún no admite fotos de perfil. Un administrador debe ejecutar
  sql/foto-perfil.sql en Supabase.»*

El script se puede ejecutar más de una vez sin romper nada. Además de la columna, añade una
regla en la base (`CHECK`) que solo acepta imágenes JPEG/PNG/WebP de hasta 200.000
caracteres, como segunda barrera.

### Rutas nuevas

| Método y ruta | Qué hace |
|---|---|
| `GET /api/perfil/foto` | Devuelve `{ foto }` (o `null`) de la cuenta con sesión. |
| `PUT /api/perfil/foto` | Guarda o reemplaza la foto. Cuerpo: `{ "foto": "data:image/jpeg;base64,..." }`. |
| `DELETE /api/perfil/foto` | Quita la foto. |

Sirven para **cualquier rol**, pero siempre sobre **la propia cuenta**: el id del usuario sale
del token de sesión, nunca de la URL. Nadie puede cambiar la foto de otra persona.

### Qué comprueba el servidor antes de guardar

1. Que sea texto con el formato `data:image/(jpeg|png|webp);base64,...`.
2. Que no pase de **150 KB**.
3. Que el contenido sea **de verdad** una imagen del tipo declarado: se revisan los primeros
   bytes del archivo (la «firma» de JPEG, PNG o WebP). Así se rechazan un SVG, un HTML
   disfrazado de imagen o un PNG declarado como JPEG.

### Archivos

| Archivo | Tipo | Qué hace |
|---|---|---|
| `sql/foto-perfil.sql` | **Nuevo** | Crea `usuario.foto_perfil` y su regla de validación. |
| `controllers/perfilController.js` | **Nuevo** | Leer, guardar y quitar la foto, con las validaciones de arriba. Detecta si falta la columna. |
| `routers/perfilRouter.js` | **Nuevo** | Las tres rutas. Primero exige sesión y después lee el cuerpo con un límite propio de 250 KB. |
| `server.js` | Modificado | Monta `/api/perfil` **antes** del `express.json()` general, porque ese tiene un límite de 100 KB y una foto en base64 lo supera. |
| `middleware/errorHandler.js` | Modificado | Si el cuerpo es demasiado grande responde 413 con *«Los datos enviados son demasiado grandes.»* (antes salía un mensaje en inglés). |
| `README.md` (raíz) | Modificado | Sección «Foto de perfil». |

### Comprobación

Con un usuario inexistente (para no modificar ninguna cuenta real):

| Caso enviado | Respuesta |
|---|---|
| PNG real | Aceptado por la validación (503 porque aún no existe la columna) |
| PNG declarado como JPEG | 400 «El archivo no es una imagen válida.» |
| SVG | 400 «La foto debe ser una imagen JPG, PNG o WebP.» |
| HTML disfrazado de PNG | 400 «El archivo no es una imagen válida.» |
| Imagen de más de 150 KB | 400 «La imagen es demasiado grande (máximo 150 KB).» |
| Un número | 400 «Envía la foto como una imagen.» |
| URL externa | 400 «La foto debe ser una imagen JPG, PNG o WebP.» |
| Sin sesión | 401 |

---

## 28. Foto de perfil: panel web

### Cómo se usa

1. Pulsar el **avatar** (el círculo con las iniciales, arriba a la derecha). Ahora tiene un
   pequeño icono de cámara.
2. Se abre el diálogo **«Foto de perfil»** con:
   - **Explorar ilustraciones:** 12 dibujos con temas de viaje.
   - **Subir desde el dispositivo:** JPG, PNG o WebP (respeta la orientación de las fotos
     del móvil).
   - **Toma una foto:** abre la cámara del computador dentro del diálogo; si el navegador no
     lo permite (por ejemplo en un celular), abre la cámara del sistema.
   - **Quitar foto:** solo aparece si ya hay una.
3. La imagen elegida se ve en el círculo grande con un borde rojo. **Solo se guarda** al
   pulsar **«Guardar foto de perfil»**; «Elegir otra» la descarta.

Funciona igual para administradores y conductores. La foto se **olvida al cerrar sesión**:
si otra persona entra en la misma pestaña, no ve la foto anterior.

### Las 12 ilustraciones

Estrellas fugaces, Atardecer en la vía, Montañas, Bus de viaje, Brújula, Destino, Luna,
Ciudad de noche, Mar, Volante, Bosque y Globo aerostático. Están dibujadas en SVG dentro del
código (no dependen de imágenes externas) y, al elegirlas, se convierten a JPEG de 256 px
igual que una foto subida.

### Archivos

| Archivo | Tipo | Qué hace |
|---|---|---|
| `src/components/perfil/BotonAvatar.jsx` | **Nuevo** | El avatar de la cabecera: muestra la foto o las iniciales y abre el diálogo. El diálogo se dibuja con un *portal* fuera de la barra superior para no heredar sus colores claros. |
| `src/components/perfil/FotoPerfilDialog.jsx` | **Nuevo** | El diálogo completo: opciones, galería de ilustraciones, cámara y vista previa. La cámara se apaga al salir de su vista. |
| `src/lib/fotoPerfil.js` | **Nuevo** | Estado **compartido** de la foto (el avatar y el diálogo leen lo mismo) y llamadas a `/api/perfil/foto`. Va ligado al id del usuario. |
| `src/hooks/useFotoPerfil.js` | **Nuevo** | Hook para leer la foto desde cualquier componente. |
| `src/lib/imagen.js` | **Nuevo** | Convierte un archivo, un fotograma de la cámara o un SVG en un JPEG cuadrado de 256 px (recorte al centro, fondo blanco, calidad ajustada para no pasar del límite). |
| `src/lib/ilustraciones.js` | **Nuevo** | Los 12 dibujos en SVG. |
| `src/components/ui/Icons.jsx` | Modificado | Iconos nuevos `IconCamara` e `IconImagen`. |
| `src/components/Dashboard.jsx` | Modificado | Usa `BotonAvatar` en la cabecera del administrador. |
| `src/components/conductor/PanelConductor.jsx` | Modificado | Usa `BotonAvatar` en la cabecera del conductor. |
| `src/App.jsx` | Modificado | Llama a `olvidarFoto()` al cerrar sesión y cuando la sesión caduca. |
| `src/index.css` | Modificado | Estilos del avatar como botón (`.avatar-btn`, `.avatar-camara`) y del diálogo (`.foto-*`). |
| `src/conductor.css` | Modificado | En pantallas pequeñas antes se ocultaba todo el bloque del usuario; ahora solo se oculta el nombre, para que el avatar siga visible en el celular. |

### Comprobación

- Capturas del diálogo en Chrome (sin foto y con foto) y de las 12 ilustraciones.
- La conversión de ilustración a JPEG funciona (la captura «con foto» muestra la imagen ya
  convertida).
- La web compila y sus pruebas pasan.

---

## 29. Foto de perfil: app móvil

### Cómo se usa

1. Ir a la pestaña **Mi perfil** y **tocar el avatar** (tiene un icono de cámara) o el texto
   «Añadir foto de perfil» / «Cambiar foto».
2. Se abre una pantalla con las mismas opciones que la web: **Explorar ilustraciones**,
   **Subir desde el dispositivo**, **Toma una foto** y **Quitar foto**.
3. **Diferencia con la web:** galería y cámara abren el **recorte cuadrado nativo** del
   teléfono, así que la persona elige qué parte de la foto queda.
4. La foto se ve en grande y se guarda con **«Guardar foto de perfil»**.

La foto guardada aparece también en el avatar de la **barra superior** de todas las
pantallas. Como la web y la app usan el mismo backend, **la foto que se pone en una se ve en
la otra**.

### Dependencias nuevas (instaladas con `npx expo install`)

| Paquete | Versión | Para qué se usa |
|---|---|---|
| `expo-image-picker` | ~57.0.18 | Abrir la galería y la cámara, con recorte cuadrado. |
| `expo-image-manipulator` | ~57.0.18 | Recortar y reducir la imagen a un JPEG de 256 px. |
| `expo-asset` | ~57.0.17 | Leer las ilustraciones incluidas en la app. |

Las tres vienen incluidas en **Expo Go**. Si se usa un build nativo (carpeta `android/`),
hay que regenerarlo con `npm run android:limpiar`.

### Archivos, por capa

La función sigue la arquitectura de la app (Domain → Data → Presentation).

**Domain** (reglas, sin depender de la API ni de React)

| Archivo | Tipo | Qué hace |
|---|---|---|
| `src/Domain/repositories/PerfilRepository.ts` | **Nuevo** | Contrato: obtener, guardar y quitar la foto. |
| `src/Domain/useCases/perfil/GestionFotoPerfil.ts` | **Nuevo** | Casos de uso `ObtenerFotoPerfil`, `GuardarFotoPerfil` (valida el formato antes de enviar) y `QuitarFotoPerfil`. |
| `src/Domain/repositories/index.ts`, `src/Domain/useCases/index.ts` | Modificados | Exportan lo nuevo. |

**Data** (cómo se obtienen los datos)

| Archivo | Tipo | Qué hace |
|---|---|---|
| `src/Data/sources/PerfilApiSource.ts` | **Nuevo** | Llama a `/api/perfil/foto`. |
| `src/Data/repositories/PerfilRepositoryImpl.ts` | **Nuevo** | Implementa el contrato con esa fuente. |
| `src/Data/device/SelectorImagen.ts` | **Nuevo** | Galería, cámara (pide permiso y avisa si se niega) e ilustraciones; todo termina en un JPEG cuadrado de 256 px. Si la persona cancela, devuelve `null`. |
| `src/Data/di/Container.ts` | Modificado | Registra los casos de uso nuevos y exporta `selectorImagen`. |
| `src/Data/repositories/index.ts` | Modificado | Exporta el repositorio nuevo. |

**Presentation** (pantallas)

| Archivo | Tipo | Qué hace |
|---|---|---|
| `src/Presentation/views/FotoPerfilModal.tsx` | **Nuevo** | La pantalla de foto de perfil. El botón «atrás» de Android vuelve de la galería a las opciones. |
| `src/Presentation/components/Avatar.tsx` | **Nuevo** | Círculo con la foto o las iniciales, con sello de cámara opcional. |
| `src/Presentation/hooks/fotoPerfilStore.ts` | **Nuevo** | Estado compartido de la foto (mismo diseño que en la web). |
| `src/Presentation/hooks/useFotoPerfil.ts` | **Nuevo** | `useFotoPerfil` (leer la foto) y `useCambiarFotoViewModel` (elegir, guardar, quitar, descartar). |
| `src/Presentation/contenido/ilustraciones.ts` | **Nuevo** | Lista de las 12 ilustraciones. |
| `assets/ilustraciones/*.png` | **Nuevos (12)** | Las ilustraciones de la web exportadas a PNG de 256 px. **Si se cambia un dibujo en la web, hay que volver a exportarlo aquí.** |
| `src/Presentation/views/PerfilView.tsx` | Modificado | Avatar tocable, texto «Añadir foto / Cambiar foto» y el modal. |
| `src/Presentation/components/BarraSuperior.tsx` | Modificado | Recibe `foto` y la muestra con `Avatar`. |
| `src/Presentation/views/PrincipalView.tsx` | Modificado | Pasa la foto a la barra superior en los paneles de conductor y administrador. |
| `src/Presentation/hooks/useSesion.tsx` | Modificado | Al cerrar sesión olvida la foto. |
| `src/Presentation/components/Icono.tsx` | Modificado | Iconos nuevos `camara`, `imagen` y `eliminar`. |
| `src/Presentation/components/index.ts`, `hooks/index.ts` | Modificados | Exportan lo nuevo. |

**Configuración** — `app.json`
- Permiso de Android `android.permission.CAMERA`.
- Plugin `expo-image-picker` con los mensajes de permiso en español
  (*«D' VIAJE usa la cámara para que te tomes la foto de perfil»*, etc.).
- `microphonePermission: false`: el plugin **elimina** el permiso de micrófono, que la app
  no necesita.

### Comprobación

- `tsc` sin errores.
- `npx expo export --platform android` genera el paquete con las 12 ilustraciones.
- La configuración de Expo aplica el permiso de cámara y quita el de micrófono.
- **No se probó en un teléfono ni emulador** (cámara, galería y guardado).

---

## 30. Sesión cifrada en la app móvil

**Problema.** El token de sesión (la «llave» de la cuenta durante 8 horas) se guardaba en
`AsyncStorage`, que **no está cifrado**. Además, la app tenía activadas las copias de
seguridad de Android (`allowBackup="true"`). El token podía terminar en la copia de Google
o extraerse conectando el teléfono por USB. El README de la app decía, por error, que se
guardaba «cifrado».

### Qué se hizo

- El **token** se guarda ahora en el almacén cifrado del sistema con **`expo-secure-store`**
  (~57.0.4): Keystore en Android, Keychain en iOS. Solo se puede leer con el teléfono
  desbloqueado y no se copia a otro dispositivo.
- Los **datos del usuario** (nombre, rol) siguen en `AsyncStorage`, porque no son secretos.
- **Migración automática:** quien ya tenía la sesión abierta **no tiene que volver a
  entrar**. La primera vez que abre la app actualizada, su sesión pasa al almacén cifrado y
  la copia antigua sin cifrar se borra.
- Si falta una de las dos partes o un dato está dañado, se descarta sin romper el arranque.
- En la versión **web** de Expo no existe almacén cifrado: ahí se sigue usando
  `AsyncStorage`, como antes.
- `app.json`: **`"allowBackup": false`**. Nada de la app sale del teléfono en las copias.

### Archivos

| Archivo | Tipo | Qué hace |
|---|---|---|
| `AppMovil/src/Data/local/SessionStorage.ts` | Reescrito | Token en almacén cifrado, usuario en `AsyncStorage`, migración de la sesión antigua. El resto de la app no cambió. |
| `AppMovil/app.json` | Modificado | `allowBackup: false` y plugin `expo-secure-store`. |
| `AppMovil/package.json` | Modificado | Dependencia `expo-secure-store`. |
| `AppMovil/README.md` | Modificado | Explica cómo se guarda realmente la sesión. |
| `ENTORNO.md` | Modificado | Lista de dependencias incluidas en Expo Go. |

### Comprobación

10 pruebas con almacenes simulados, todas correctas: la sesión antigua se migra sin pedir
login; el token queda solo en el almacén cifrado; la copia sin cifrar se borra; guardar,
leer y cerrar sesión funcionan; los datos incompletos o dañados se descartan; en web se usa
`AsyncStorage`. Además: `tsc` sin errores, el paquete de Android se genera y el manifiesto
queda con `allowBackup=false`.

---

## 31. Validación de nombres y teléfonos

**Qué se pidió.** Que en **nombre** y **apellido** no se puedan escribir números, y que en
**teléfono** no se puedan escribir letras.

### Las reglas

| Campo | Se permite | Longitud | Ejemplos válidos | Ejemplos rechazados |
|---|---|---|---|---|
| Nombre / Apellido | Letras (con tildes, ñ, ü), espacios, apóstrofo (`'`) y guion (`-`) | 2 a 60 caracteres | `María José`, `O'Connor`, `Pérez-Gómez`, `Núñez` | `Juan2`, `456`, `Ana_`, `A` |
| Teléfono | Números, espacios y un `+` **solo al principio** | 7 a 15 dígitos | `3001234567`, `+57 300 123 4567`, `601 000 0000` | `300abc4567`, `123452` (6 dígitos), `300-123-4567`, `57+300` |

### Cómo funciona

1. **Al escribir:** lo que no está permitido **no aparece** en el campo. Si se teclea un
   número en «Nombre», simplemente no se escribe. Los espacios repetidos se juntan en uno.
   En el celular, el campo de teléfono abre el teclado numérico.
2. **Al enviar:** si algo no cumple (por ejemplo, un teléfono de 6 dígitos), aparece un
   mensaje debajo del campo.
3. **En el servidor:** el backend vuelve a comprobarlo todo, así que las reglas se cumplen
   aunque alguien envíe los datos saltándose la pantalla. Si llegan espacios de más
   (`"  Ana   María "`), los corrige a `"Ana María"` en vez de rechazarlos.

### Dónde se aplica

| Lugar | Nombre / Apellido | Teléfono |
|---|:-:|:-:|
| Web: formulario de **Conductor** (panel de administrador) | ✔ | ✔ (obligatorio) |
| Web: formulario de **Cliente** | ✔ | ✔ (opcional) |
| Web: **Crear una cuenta** | ✔ | ✔ |
| Web: formulario de **contacto** de la portada | — ¹ | ✔ |
| App: **Crear una cuenta** | ✔ | ✔ |
| App: formulario de **contacto** de la portada | — ¹ | ✔ |
| Backend: registro, conductor, cliente, esquema `usuario` | ✔ | ✔ |
| Backend: `npm run crear-admin` | ✔ | ✔ (opcional) |

¹ El campo se llama «Nombre **o empresa**» y hay empresas con números en su nombre
(por ejemplo «Transportes 2000 S.A.S.»), así que ahí no se bloquean los números.

### Archivos

Las reglas están escritas **una vez por plataforma**, y cada formulario las reutiliza.

**Backend**

| Archivo | Tipo | Qué hace |
|---|---|---|
| `schemas/reglas.js` | **Nuevo** | Reglas de Zod `nombrePersona(campo)` y `telefono(campo)` con sus mensajes. |
| `schemas/genericSchema.js` | Modificado | `conductor`, `cliente` y `usuario` usan esas reglas. |
| `controllers/cuentasController.js` | Modificado | El registro público usa esas reglas (se quitó el antiguo ayudante `texto()`, que ya no se usaba). |
| `scripts/crear-admin.js` | Modificado | Valida nombre, apellido y teléfono con las mismas reglas antes de crear el administrador. |

**Web** (`frontend-transporte/`)

| Archivo | Tipo | Qué hace |
|---|---|---|
| `src/lib/validaciones.js` | **Nuevo** | `limpiarNombre`, `limpiarTelefono` (al escribir) y `errorNombre`, `errorTelefono` (al enviar). |
| `src/entities.js` | Modificado | Los campos de Conductor y Cliente llevan `format: 'nombre'` o `format: 'telefono'`. |
| `src/lib/form.js` | Modificado | `validateValues` aplica esos formatos; `buildPayload` junta los espacios repetidos del nombre. |
| `src/components/EntityForm.jsx` | Modificado | Filtra lo escrito según el formato y usa teclado de teléfono. |
| `src/components/Registro.jsx` | Modificado | Filtra al escribir y valida con las reglas nuevas. |
| `src/components/Landing.jsx` | Modificado | Teléfono del formulario de contacto: filtro, patrón y ayuda. |
| `tests/pruebas.jsx` | Modificado | 13 pruebas nuevas de estas reglas. |

**App** (`AppMovil/`)

| Archivo | Tipo | Qué hace |
|---|---|---|
| `src/Domain/entities/Validaciones.ts` | **Nuevo** | Las mismas funciones que la web, en TypeScript. Los rangos de letras se escriben a mano para no depender del soporte Unicode del motor de JavaScript del teléfono. |
| `src/Domain/entities/index.ts` | Modificado | Exporta las reglas. |
| `src/Domain/useCases/auth/RegistrarCuenta.ts` | Modificado | Valida con las reglas y envía el nombre sin espacios de más. |
| `src/Presentation/hooks/useRegistroViewModel.ts` | Modificado | Filtra nombre, apellido y teléfono al escribir. |
| `src/Presentation/views/InicioView.tsx` | Modificado | Teléfono del formulario de contacto: filtro y validación. |

### Comprobación

- **Backend:** 24 casos de las reglas y un registro real contra el servidor en marcha:
  rechazó `Juan2` y `300abc4567` y aceptó `Pérez Núñez`. No se creó nada en la base.
- **Web:** 13 pruebas nuevas; toda la suite pasa.
- **App:** `tsc` sin errores y 10 pruebas de la lógica, todas correctas.

### Datos existentes que no cumplen las reglas

Se revisaron las tablas `conductor` (19 filas), `cliente` (22) y `usuario` (13):

- Una **ficha y una cuenta de prueba** con el nombre **«456 777»**. Al editar esa ficha, el
  formulario pedirá corregir el nombre antes de guardar.
- La cuenta **liarcila@gmail.com** tiene el teléfono **«123452»** (6 dígitos). No bloquea
  nada, porque el panel no edita cuentas de acceso.

---

## 32. Mapa de carpetas y archivos tocados

Leyenda: **[N]** archivo nuevo · **[M]** archivo modificado · **[R]** reescrito.
Entre paréntesis, la sección que lo explica.

```
dviaje-ultimos-cambios/
├── package.json ................................ [M] exceljs, script dev (24, 26)
├── server.js ................................... [M] rutas /api/reportes y /api/perfil, CORS (26, 27)
├── README.md ................................... [M] reporte, foto de perfil (26, 27)
├── ENTORNO.md .................................. [M] dependencias de Expo Go (29, 30)
├── _legacy/ .................................... [N] carpeta vacía, destino de Transporte-api (23)
├── controllers/
│   ├── reportesController.js ................... [N] (26)
│   ├── perfilController.js ..................... [N] (27)
│   └── cuentasController.js .................... [M] reglas de nombre y teléfono (31)
├── routers/
│   ├── reportesRouter.js ....................... [N] (26)
│   └── perfilRouter.js ......................... [N] (27)
├── middleware/
│   └── errorHandler.js ......................... [M] error 413 en español (27)
├── schemas/
│   ├── reglas.js ............................... [N] (31)
│   └── genericSchema.js ........................ [M] (31)
├── scripts/
│   └── crear-admin.js .......................... [M] (31)
├── sql/
│   └── foto-perfil.sql ......................... [N] ⚠ ejecutar en Supabase (27)
│
├── frontend-transporte/
│   ├── vite.config.js .......................... [M] strictPort (25)
│   ├── tests/pruebas.jsx ....................... [M] (31)
│   └── src/
│       ├── App.jsx ............................. [M] olvidar foto al salir (28)
│       ├── entities.js ......................... [M] formatos (31)
│       ├── index.css ........................... [M] (26, 28)
│       ├── conductor.css ....................... [M] (28)
│       ├── components/
│       │   ├── ReporteSemanal.jsx .............. [N] (26)
│       │   ├── DataTable.jsx ................... [M] propiedad acciones (26)
│       │   ├── Dashboard.jsx ................... [M] (26, 28)
│       │   ├── EntityForm.jsx .................. [M] (31)
│       │   ├── Registro.jsx .................... [M] (31)
│       │   ├── Landing.jsx ..................... [M] (31)
│       │   ├── conductor/PanelConductor.jsx .... [M] (28)
│       │   ├── perfil/BotonAvatar.jsx .......... [N] (28)
│       │   ├── perfil/FotoPerfilDialog.jsx ..... [N] (28)
│       │   └── ui/Icons.jsx .................... [M] (28)
│       ├── hooks/
│       │   └── useFotoPerfil.js ................ [N] (28)
│       └── lib/
│           ├── fotoPerfil.js ................... [N] (28)
│           ├── imagen.js ....................... [N] (28)
│           ├── ilustraciones.js ................ [N] (28)
│           ├── validaciones.js ................. [N] (31)
│           └── form.js ......................... [M] (31)
│
└── AppMovil/
    ├── package.json ............................ [M] 4 dependencias nuevas (29, 30)
    ├── app.json ................................ [M] permisos, plugins, allowBackup (29, 30)
    ├── README.md ............................... [M] (29, 30)
    ├── CAMBIOS-UI.md ........................... [M] este documento
    ├── assets/ilustraciones/ ................... [N] 12 imágenes PNG (29)
    └── src/
        ├── Domain/
        │   ├── entities/Validaciones.ts ........ [N] (31)
        │   ├── entities/index.ts ............... [M] (31)
        │   ├── repositories/PerfilRepository.ts  [N] (29)
        │   ├── repositories/index.ts ........... [M] (29)
        │   ├── useCases/perfil/GestionFotoPerfil.ts [N] (29)
        │   ├── useCases/auth/RegistrarCuenta.ts  [M] (31)
        │   └── useCases/index.ts ............... [M] (29)
        ├── Data/
        │   ├── device/SelectorImagen.ts ........ [N] (29)
        │   ├── sources/PerfilApiSource.ts ...... [N] (29)
        │   ├── repositories/PerfilRepositoryImpl.ts [N] (29)
        │   ├── repositories/index.ts ........... [M] (29)
        │   ├── local/SessionStorage.ts ......... [R] sesión cifrada (30)
        │   └── di/Container.ts ................. [M] (29)
        └── Presentation/
            ├── views/FotoPerfilModal.tsx ....... [N] (29)
            ├── views/PerfilView.tsx ............ [M] (29)
            ├── views/PrincipalView.tsx ......... [M] (29)
            ├── views/InicioView.tsx ............ [M] (31)
            ├── components/Avatar.tsx ........... [N] (29)
            ├── components/BarraSuperior.tsx .... [M] (29)
            ├── components/Icono.tsx ............ [M] (29)
            ├── components/index.ts ............. [M] (29)
            ├── contenido/ilustraciones.ts ...... [N] (29)
            ├── hooks/fotoPerfilStore.ts ........ [N] (29)
            ├── hooks/useFotoPerfil.ts .......... [N] (29)
            ├── hooks/useRegistroViewModel.ts ... [M] (31)
            ├── hooks/useSesion.tsx ............. [M] (29)
            └── hooks/index.ts .................. [M] (29)
```

También cambiaron `package-lock.json` (raíz) y `AppMovil/package-lock.json` al instalar las
dependencias nuevas. No se borró ningún archivo.

---

## 33. Verificación realizada en esta sesión

| Qué | Resultado |
|---|---|
| Backend: reporte semanal con datos reales (2 semanas con servicios y 1 vacía) | Correcto |
| Backend: fechas inválidas en el reporte | 400 |
| Backend: rutas nuevas sin sesión | 401 |
| Backend: 8 casos de validación de la foto de perfil | Correctos |
| Backend: 24 casos de las reglas de nombre y teléfono | Correctos |
| Backend: registro real con datos inválidos | Rechazado campo por campo, sin crear nada |
| Backend: sin reinicios automáticos durante 20 s | Correcto |
| Web: compilación (`vite build`) | Correcta |
| Web: suite de pruebas (`npm test`), con 13 pruebas nuevas | Todas pasan |
| Web: capturas del diálogo de foto y de las ilustraciones | Correctas |
| App: `tsc --noEmit` | Sin errores |
| App: paquete de Android (`expo export`) | Se genera |
| App: 10 pruebas de la sesión cifrada | Todas pasan |
| App: 10 pruebas de las reglas de nombre y teléfono | Todas pasan |
| App: permisos del manifiesto (cámara sí, micrófono no, `allowBackup=false`) | Correctos |

**No se probó:**
- Guardar una foto de verdad, porque aún no existe la columna (falta el script SQL).
- La cámara, la galería y la sesión cifrada en un teléfono o emulador real.
- Hacer clic en el botón del reporte con una sesión real de administrador en el navegador.

---

## 34. Cómo arrancar todo

Tres terminales, en este orden.

**1. Backend**
```powershell
cd C:\Users\liama\OneDrive\Documentos\dviaje-ultimos-cambios
npm run dev
```
Debe mostrar `Conexion exitosa con Supabase` y **no** debe aparecer `[nodemon]`.

**2. Web**
```powershell
cd C:\Users\liama\OneDrive\Documentos\dviaje-ultimos-cambios\frontend-transporte
npm run dev
```
Abrir `http://localhost:5173`. Si dice que el puerto está ocupado, cerrar el otro servidor web.

**3. App (Android)**
```powershell
cd C:\Users\liama\OneDrive\Documentos\dviaje-ultimos-cambios\AppMovil
npx expo start
```
- **Teléfono:** instalar Expo Go, conectarse a la misma wifi que el PC y escanear el QR.
- **Emulador:** abrirlo desde Android Studio y pulsar `a` en la terminal de Expo.
- **Build nativo:** después de esta sesión hay que regenerarlo con `npm run android:limpiar`.

**Problemas frecuentes**

| Síntoma | Causa | Solución |
|---|---|---|
| Aparece `[nodemon]` al arrancar el backend | La terminal está en `Transporte-api` | `Ctrl+C`, `cd` a la carpeta raíz y `npm run dev` |
| «No se pudo conectar con el servidor» en la web | Backend apagado, backend antiguo o web en el puerto 5174 | Revisar los tres puntos anteriores |
| `EADDRINUSE` en el puerto 3000 | Ya hay otro backend encendido | Cerrarlo antes de arrancar otro |
| El teléfono no conecta con el servidor | Firewall de Windows o distinta wifi | Permitir Node en redes privadas y usar la misma wifi |

---

## 35. Pendientes y recomendaciones

### Pasos manuales pendientes

1. **Ejecutar `sql/foto-perfil.sql` en Supabase** (sección 27). Sin él no se pueden guardar
   fotos.
2. **Mover `Transporte-api/` a `_legacy/`** (sección 23), después de cerrar la terminal que
   está dentro de esa carpeta.
3. **Regenerar el build nativo** de la app con `npm run android:limpiar`, si se usa.
4. **Corregir los datos** que no cumplen las reglas nuevas (sección 31).

### Recomendaciones del análisis del código hecho al inicio de la sesión

Estos puntos se detectaron al revisar el proyecto y **todavía no se han cambiado**:

| Prioridad | Tema | Detalle |
|---|---|---|
| Alta | **Control de versiones** | La carpeta del proyecto no está en ningún repositorio git: el único repositorio es uno accidental que abarca toda la carpeta del usuario (`C:\Users\liama`). Conviene hacer `git init` dentro del proyecto. |
| Alta | **Cambio de contraseña** | No existe forma de cambiar ni recuperar la contraseña. El script `sql/crear-cuentas-conductores.sql` crea 15 cuentas con la misma contraseña temporal, escrita en el propio archivo. |
| Alta | **Cuentas desactivadas o borradas** | Siguen funcionando hasta 8 horas, porque el servidor no vuelve a consultar la base al validar el token. |
| Alta | **Sesión caducada en la app** | Cuando el token caduca, la app muestra «Error 401» en todas las pantallas en lugar de volver al login. |
| Alta | **Dirección del servidor en la app compilada** | Un APK de producción no tiene configurada la URL del backend (`EXPO_PUBLIC_API_URL`) y la app usa HTTP sin cifrar (`usesCleartextTraffic`). |
| Media | **Autodesactivación del administrador** | Enviando el propio id en mayúsculas se salta la protección que impide desactivar o rechazar la propia cuenta. |
| Media | **Mensaje de error de la app** | Muestra al usuario la IP interna del servidor y una ruta de código. |
| Media | **Caché de la web al cerrar sesión** | Las listas de referencia (nombres, correos, placas) de la sesión anterior siguen visibles si otra persona entra en la misma pestaña. |
| Media | **CSRF** | Si la web y el backend se publican en dominios distintos, la cookie pasa a `SameSite=None` y no hay protección contra peticiones falsificadas. |
| Media | **Paginación** | Ninguna tabla pagina en el servidor: la web descarga cada tabla completa. |
| Por verificar | **RLS en Supabase** | El backend usa la clave `anon`. Si la seguridad a nivel de fila (RLS) está desactivada en Supabase, quien obtenga esa clave puede leer y escribir toda la base saltándose los permisos del backend. |
