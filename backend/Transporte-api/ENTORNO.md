# Entorno de desarrollo — D' VIAJE

Cómo levantar las tres aplicaciones y qué hay instalado en el equipo.

---

## Arrancar las tres apps

### Forma rápida: doble clic en `iniciar.bat`

Está en la raíz del proyecto. Abre dos ventanas, una para el backend y otra
para la web. **Si alguno se cae, se reinicia solo en unos segundos**, así que
recargar la página (F5) siempre vuelve a funcionar. Para apagarlos, cierra sus
dos ventanas. La app móvil no se arranca aquí porque consume mucha memoria.

Si alguna vez ves «localhost rechazó la conexión», casi siempre es que una de
esas dos ventanas se cerró: vuelve a abrir `iniciar.bat`.

### A mano

Cada una en su propia terminal, desde la carpeta que se indica.

### 1. Backend (obligatorio, arráncalo primero)

```bash
cd dviaje-ultimos-cambios
npm start
```

Queda en `http://localhost:3000`. Al arrancar imprime las 16 rutas y comprueba
la conexión con Supabase. Si algo falla, el mensaje sale ahí.

### 2. Web (panel de administrador y de conductor)

```bash
cd dviaje-ultimos-cambios/frontend-transporte
npm run dev
```

Queda en `http://localhost:5173` y abre el navegador solo.

### 3. App móvil

```bash
cd dviaje-ultimos-cambios/AppMovil
npx expo start
```

Queda en `http://localhost:8081` y muestra un QR en la terminal.

Para verla en el teléfono:

1. Instala **Expo Go** desde Play Store
2. Conecta el móvil al **mismo wifi** que el PC
3. Escanea el QR

Todas las dependencias nativas del proyecto (`async-storage`, `expo-constants`,
`safe-area-context`, `svg`, `status-bar`, `system-ui`, `expo-asset`,
`expo-image-picker`, `expo-image-manipulator`, `expo-secure-store`) vienen incluidas en Expo
Go, así que **no hace falta compilar un build nativo** para probarla.

### Entrar

Hace falta una cuenta. Si todavía no hay ningún administrador:

```bash
cd dviaje-ultimos-cambios
npm run crear-admin
```

El registro público crea cuentas de **Conductor apagadas**, que no pueden entrar
hasta que un administrador las apruebe desde la pantalla "Cuentas de acceso".

---

## Cómo encuentra la app móvil el backend

No hay que tocar código ni configurar ninguna IP a mano.

`AppMovil/src/Data/config/ApiConfig.ts` resuelve la dirección en este orden:

1. `EXPO_PUBLIC_API_URL`, si está definida
2. La IP del PC que ejecuta Expo (la saca de `Constants.expoConfig.hostUri`)
3. `10.0.2.2` en emulador Android, `localhost` en iOS

Con el teléfono por wifi usa la opción 2: si el PC es `192.168.20.23`, la app
llama sola a `http://192.168.20.23:3000/api`.

> **Si cambias de wifi cambia tu IP.** Hay que reiniciar Expo para que la vuelva
> a detectar.

---

## Configuración de red (ya funcionando, no tocar sin motivo)

Las tres piezas tienen que coincidir. Hoy coinciden:

| Dónde | Variable | Valor |
|---|---|---|
| `.env` (raíz) | `PORT` | `3000` |
| `.env` (raíz) | `FRONTEND_URL` | `http://localhost:5173` |
| `frontend-transporte/.env` | `VITE_API_URL` | `http://localhost:3000/api` |
| `frontend-transporte/vite.config.js` | `server.port` | `5173` |

`FRONTEND_URL` es la lista de orígenes que el backend acepta por CORS. Como la
sesión viaja en una cookie, **no puede ser `*`**: tiene que ser el origen exacto.
Se pueden poner varios separados por coma.

### Abrir la web desde otro dispositivo

No funciona tal cual está, y es a propósito:

- Vite solo escucha en `localhost` (hay que arrancarlo con `--host`)
- El backend solo permite el origen `http://localhost:5173`

Si lo necesitas, hay que hacer **las dos cosas**: `npm run dev -- --host` y
añadir el origen de LAN (por ejemplo `http://192.168.20.23:5173`) a
`FRONTEND_URL`. Con una sola no basta.

---

## Qué hay instalado en el equipo

Instalado el 2026-09-15. **Nada de esto vive dentro del proyecto**, son
herramientas del sistema.

| Componente | Versión | Ruta |
|---|---|---|
| Microsoft OpenJDK | 17.0.20.1 LTS | `C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot` |
| Android SDK | — | `C:\Users\liama\AppData\Local\Android\Sdk` |
| platform-tools (`adb`) | 37.0.1 | dentro del SDK |
| platforms | android-35 | dentro del SDK |
| build-tools | 35.0.0 | dentro del SDK |
| cmdline-tools | latest | dentro del SDK |

Variables de entorno fijadas a nivel de usuario: `JAVA_HOME`, `ANDROID_HOME`,
`ANDROID_SDK_ROOT`.

Estas versiones no son arbitrarias: las exige el proyecto. `compileSdk` y
`targetSdk` 35, `buildTools` 35.0.0 y `minSdk` 24 salen del plugin de Expo
(`expo-modules-autolinking/.../ExpoRootProjectPlugin.kt`), y Gradle 9.3.1
(`AppMovil/android/gradle/wrapper/gradle-wrapper.properties`) necesita JDK 17 o
superior.

### Build nativo de Android

Con lo instalado, `npx expo run:android` ya funcionaría **si conectas un móvil
por USB** con la depuración USB activada.

**No se instaló el emulador** (imagen del sistema, ~1,5 GB) porque este equipo no
da para ello:

```
CPU: AMD Athlon Silver 3050U  ->  2 nucleos / 2 hilos
RAM: 5,9 GB totales           ->  ~0,9 GB libres con las 3 apps corriendo
```

Un emulador pide unos 2 GB de RAM por su cuenta, y el build de Gradle ya está
configurado con `-Xmx2048m` en `AppMovil/android/gradle.properties`. Para probar
la app, **Expo Go sobre el teléfono real es la vía práctica en esta máquina**.

> Con tan poca RAM libre, si Metro se cae mientras compila, cierra la web
> (`:5173`) para darle aire.

---

## Comprobaciones hechas el 2026-09-15

Todas pasaron:

| Comprobación | Resultado |
|---|---|
| `GET /health` | `{"status":"UP"}` |
| Conexión con Supabase al arrancar | `Conexion exitosa` |
| Preflight CORS desde `localhost:5173` | `204` + `Allow-Origin` correcto + `Allow-Credentials: true` |
| `POST /api/auth/login` con credenciales falsas | `401` JSON (no error de red) |
| `GET /api/auth/me` sin cookie | `401` |
| Backend por LAN `192.168.20.23:3000` | `200` |
| Login con cabecera `X-Client: mobile` por LAN | `401` JSON |
| Bundle Android de Metro | `200`, 4,8 MB, JavaScript válido, 92 s |
| `npm test` (frontend) | Todas las pruebas pasaron |
| `npx tsc --noEmit` (AppMovil) | Sin errores |

---

## Pendiente: migración de servicios (ejecutar una vez)

`sql/servicios-texto-libre.sql` — en Supabase: SQL Editor → pegar → Run.

Hace que el origen y el destino de un servicio se escriban a mano (ya no
salen de la tabla `destinos`) y que una reserva no necesite servicio. Rellena
el texto de los servicios que ya existen, así que nadie ve campos vacíos.

**Mientras no se ejecute, todo sigue funcionando como antes**, con una sola
excepción: crear un servicio desde la web avisa de que falta este script. La
app móvil no se ve afectada en ningún caso. El servidor detecta solo que ya se
ejecutó (en menos de un minuto), sin reiniciar.

---

## Pendiente: dos problemas de seguridad

Ninguno se ha corregido todavía.

### 1. RLS desactivado en Supabase (crítico)

`SUPABASE_KEY` es la clave **anon**, y no hay ninguna política RLS en `sql/`.
Comprobado: esa clave lee la tabla `usuario` entera, con los hashes de
contraseña incluidos.

En Supabase la clave anon está pensada para ser pública, y lo que la hace segura
es precisamente RLS. Sin RLS, toda la autorización de `middleware/permisos.js`
se puede saltar llamando directo a la API REST de Supabase.

**Arreglo:** activar RLS en todas las tablas con políticas `USING (false)` para
anon, y pasar el servidor a la clave `service_role` (que salta RLS por diseño y
es la correcta para un backend de confianza).

### 2. El repositorio git es toda la carpeta personal

```
git rev-parse --show-toplevel  ->  C:/Users/liama
git ls-files                   ->  0 archivos
```

El repo abarca `C:\Users\liama` entera y no hay nada versionado. Un `git add .`
desde ahí arrastraría Documentos, Descargas y OneDrive completos. Además, este
proyecto no tiene historial ni copia de seguridad.

**Arreglo:** `git init` dentro de `dviaje-ultimos-cambios`, comprobar que
`.gitignore` cubre los `.env` y hacer el primer commit. Después, rotar la clave
de Supabase y `JWT_SECRET`.

> Hay **tres** archivos `.env` con credenciales reales: la raíz,
> `Transporte-api/.env` y `frontend-transporte/.env`. `Transporte-api/` es una
> copia antigua del backend que el README da por archivada en `_legacy/`, pero
> está en la raíz y sin ignorar.
