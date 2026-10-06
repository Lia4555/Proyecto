# AppMovil — Transporte (MVVM)

App móvil Android del proyecto de transporte. Se conecta al backend de este
mismo repositorio (`server.js`, puerto 3000) y está pensada para el rol
**Conductor** (un Administrador también puede entrar, en modo lectura).

Sin librerías raras: **Expo + React Native + TypeScript**. La navegación es
propia (`src/Presentation/hooks/useNavegacion.ts`), no hay React Navigation ni
Redux. La única dependencia añadida al proyecto base es
`@react-native-async-storage/async-storage`, para no pedir la contraseña cada
vez que se abre la app.

---

## 1. Arquitectura MVVM

```
src/
├── Domain/                MODELO (el negocio, sin React ni HTTP)
│   ├── entities/          Usuario, Servicio, Vehiculo, Alerta, Catalogo
│   ├── repositories/      contratos (interfaces) que el dominio exige
│   └── useCases/          acciones con sus reglas: IniciarSesion, etc.
│
├── Data/                  implementa los contratos del dominio
│   ├── config/ApiConfig   ← dirección del servidor (se edita aquí)
│   ├── api/HttpClient     fetch + token + timeout + errores
│   ├── local/             sesión guardada en el teléfono
│   ├── sources/           llamadas crudas a /api/...
│   ├── repositories/      *RepositoryImpl
│   └── di/Container       arma todo y expone `casosDeUso`
│
└── Presentation/
    ├── views/             VISTA: solo pinta y recoge eventos
    ├── components/        piezas reutilizables (botón, tarjeta, badge...)
    ├── hooks/             VIEWMODEL: estado + acciones de cada pantalla
    └── theme/             colores, espaciados, tipografía y formatos
```

**Regla que se cumple en todo el código:** una vista nunca llama a la API.
Llama a su ViewModel → el ViewModel llama a un caso de uso → el caso de uso
trabaja contra un contrato del dominio → la capa Data decide si eso es HTTP,
caché o almacenamiento local.

| Capa MVVM | Dónde está |
|---|---|
| **Model** | `src/Domain` + `src/Data` |
| **View** | `src/Presentation/views` y `components` |
| **ViewModel** | `src/Presentation/hooks/use*ViewModel.ts` |

---

## 2. Pantallas

| Pantalla | Archivo | Qué hace |
|---|---|---|
| Login | `views/LoginView.tsx` | Entra con el correo asignado por el admin |
| Servicios | `views/ServiciosView.tsx` | Viajes asignados, con filtros y "deslizar para actualizar" |
| Detalle | `views/ServicioDetalleView.tsx` | Cambia el estado del viaje y registra la llegada real |
| Vehículo | `views/VehiculoView.tsx` | Ficha, documentos (avisa si vencen) y mantenimientos |
| Alertas | `views/AlertasView.tsx` | Avisos ordenados por prioridad |
| Perfil | `views/PerfilView.tsx` | Datos de la cuenta, foto de perfil y cerrar sesión |
| Foto de perfil | `views/FotoPerfilModal.tsx` | Ilustraciones, galería o cámara (con recorte cuadrado) |

Los permisos reales los aplica el servidor (`middleware/permisos.js`): un
conductor solo recibe sus servicios y su vehículo, aunque pida la lista
completa.

---

## 3. Cómo ejecutarla en Android Studio

### Requisitos
- Android Studio instalado (ya trae el JDK y el SDK).
- Un emulador creado en Android Studio (*Device Manager → Create device*), o un
  teléfono con **Depuración USB** activada.

### Paso 1 — Levantar el backend
```bash
cd ..              # el backend es la carpeta padre: Backend/
npm install
npm run dev        # queda en http://localhost:3000
```

### Paso 2 — Revisar la dirección del servidor
Se decide sola en **`src/Data/config/ApiConfig.ts`**, en este orden:

1. **`EXPO_PUBLIC_API_URL`**, si la defines (por ejemplo en un `.env` de esta carpeta):
   `EXPO_PUBLIC_API_URL=http://192.168.1.15:3000/api`.
2. **La IP del computador que ejecuta Expo.** Sirve igual en el emulador que en un
   teléfono físico, siempre que estén en la misma wifi y el firewall de Windows
   permita el puerto 3000.
3. Si no hay nada de lo anterior: `10.0.2.2:3000` en el emulador (así ve el emulador
   el `localhost` del computador).

### Paso 3 — Generar el proyecto nativo y ejecutar
```bash
npm install
npm run android      # genera android/ si falta, compila e instala la app
```

Para abrirlo **dentro de Android Studio**: *File → Open* y selecciona la
carpeta **`Backend/AppMovil/android`**. Espera a que Gradle sincronice y dale al botón
verde ▶ con el emulador arrancado.

> La carpeta `android/` la genera Expo (`npm run prebuild`). Si algo se rompe,
> `npm run android:limpiar` la regenera desde cero a partir de `app.json`.

---

## 4. Notas técnicas

- **Sesión:** el backend guarda el token en una cookie httpOnly, que en una app
  nativa no existe. Por eso `login` devuelve también el token en el JSON
  **solo** cuando el cliente manda la cabecera `X-Client: mobile`
  (`controllers/authController.js`). La app lo guarda en el almacén cifrado del
  sistema (`expo-secure-store`: Keystore en Android, Keychain en iOS) y lo envía
  como `Authorization: Bearer ...`, que el servidor ya aceptaba. Los datos del
  usuario (nombre, rol) van en `AsyncStorage`, que no es cifrado, porque no son
  secretos (`Data/local/SessionStorage.ts`). `app.json` desactiva las copias de
  seguridad de Android (`allowBackup: false`) para que nada de la app salga del
  teléfono.
- **HTTP en claro:** Android 9+ bloquea `http://` por defecto; `app.json` activa
  `usesCleartextTraffic` para poder hablar con el servidor local. En producción
  se pone la URL con HTTPS y se quita esa línea.
- **Foto de perfil:** se abre tocando el avatar en *Mi perfil*. Galería y cámara
  usan `expo-image-picker` con el recorte cuadrado nativo; `expo-image-manipulator`
  la deja en un JPEG de 256 px (`Data/device/SelectorImagen.ts`), igual que el panel
  web, y se envía a `/api/perfil/foto`. Las ilustraciones de
  `assets/ilustraciones/` son las del panel web exportadas a PNG. Tras añadir estas
  librerías, un build nativo existente debe regenerarse con `npm run android:limpiar`.
- **Errores:** todo pasa por `HttpClient`, que corta a los 15 s y traduce el
  fallo a un mensaje en pantalla con botón de reintentar.
