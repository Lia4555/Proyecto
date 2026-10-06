# Pasos finales (2 comandos)

El código de la app está **terminado**. Falta solo instalar dependencias y
generar el proyecto Android, que depende de la descarga desde internet.

## Importante: no trabajes desde la USB

La carpeta `D:` es una **memoria USB con formato FAT32**. Instalar
`node_modules` ahí da errores de extracción (`TAR_ENTRY_ERROR`) y compilar con
Gradle desde ahí no funciona bien.

Ya dejé una copia del código en **`C:\Proyectos\AppMovil`**, y ahí es donde
hay que trabajar. La USB queda como respaldo del código fuente.

## Comandos

```bash
cd C:\Proyectos\AppMovil

npm install                 # 1. dependencias (ya quedó corriendo; si se cortó, repítelo)
npx expo install @react-native-async-storage/async-storage   # 2. guardar la sesión
npm run android             # 3. genera android/ , compila e instala en el emulador
```

Para abrirlo **dentro de Android Studio**: *File → Open* → carpeta
**`C:\Proyectos\AppMovil\android`**, esperar a que sincronice Gradle y darle al
botón verde ▶.

> Si `npm install` se queda mucho rato sin avanzar, no está colgado: la
> conexión está descargando paquetes a ~2 minutos cada uno. Déjalo terminar.

## Antes de abrir la app

1. Levantar el backend, desde la carpeta del proyecto:
   ```bash
   npm run dev        # http://localhost:3000
   ```
2. Revisar la dirección del servidor en
   `src/Data/config/ApiConfig.ts`:
   - **Emulador de Android Studio:** ya está listo (`10.0.2.2:3000`).
   - **Teléfono real:** poner en `IP_EN_RED_LOCAL` la IP del PC (`ipconfig` →
     *Dirección IPv4*) y estar en la misma wifi.
3. Entrar con un correo de conductor que ya exista en la base de datos.

## Cuando termines: devolver el código a la USB

```bash
robocopy C:\Proyectos\AppMovil "D:\PROYECTO DE VIAJE TRANSPORTE\AppMovil" /E /XD node_modules android .expo
```

(No copies `node_modules` ni `android` a la USB: se regeneran con
`npm install` y `npm run prebuild`.)
