# D' VIAJE — Sistema de Transporte

Backend Express + Supabase con autenticación por **cookie httpOnly**, y frontend React (Vite).

## Cómo se ejecuta

Se necesitan **dos terminales**, una para cada parte.

**Terminal 1 — Backend** (desde la raíz del proyecto):

```bash
npm install      # solo la primera vez
npm run dev      # http://localhost:3000
```

**Terminal 2 — Frontend**:

```bash
cd frontend-transporte
npm install      # solo la primera vez
npm run dev      # http://localhost:5173
```

## Configuración (.env)

Copia `.env.example` a `.env` y rellena los valores. Los datos de Supabase salen de
**Project Settings → API** en el panel de Supabase:

- `SUPABASE_URL`: la URL completa, `https://<ref>.supabase.co`
- `SUPABASE_KEY`: la clave **anon public** (un JWT largo que empieza por `eyJ`), *no* la contraseña de la base de datos

Si falta alguna variable obligatoria, el servidor no arranca y dice cuál falta.

---

## Los dos roles

El sistema tiene **exactamente dos roles**. No hay más, y no se pueden crear desde
la interfaz.

| Rol | Nivel | Qué puede hacer |
|---|---|---|
| **Administrador** | 3 | Todo: gestiona flota, servicios, conductores, clientes, reservas y alertas. |
| **Conductor** | 2 | Solo lo suyo: ver los servicios que le asignó el administrador, cambiar su estado, y consultar y reportar el vehículo que conduce. |

### Qué puede tocar exactamente un conductor

La regla vive en [`middleware/permisos.js`](middleware/permisos.js), en el **servidor**.
El frontend solo esconde botones; quien mande la petición a mano igualmente choca
con esta capa.

| Recurso | Conductor |
|---|---|
| `servicios` | Ve **solo los suyos**. Puede cambiar `id_estado`, `fecha_llegada_real` y `observaciones`. |
| `vehiculos` | Ve **solo los que conduce**. Puede cambiar `estado_operativo` y las dos fechas de mantenimiento. |
| `documentos-vehiculo`, `mantenimientos` | Solo lectura, y solo de sus vehículos. |
| `alertas` | Solo lectura, y solo las dirigidas a él. |
| `conductor` | Solo su propia ficha. |
| Catálogos (estados, destinos, tipos) | Solo lectura, para que la pantalla muestre nombres en vez de códigos. |
| `clientes`, `reservas`, `roles`, `clases-viaje`, `historial-conductores` | **403.** No los ve. |
| Crear (`POST`) y eliminar (`DELETE`) en cualquier tabla | **403.** Solo el administrador. |

### Registro con aprobación del administrador

Cualquiera puede pedir una cuenta desde la web o la app («Crear una cuenta»), pero
**no entra hasta que un administrador la apruebe**:

1. `POST /api/auth/register` crea, **apagadas** (`activo = false`), la cuenta en
   `usuario` y su ficha en `conductor` con el mismo correo. Siempre con rol Conductor:
   un administrador solo se crea con `npm run crear-admin`. Máximo 5 solicitudes por
   hora desde la misma conexión.
2. El login responde **403 «Tu cuenta todavía no está activa»** a esas cuentas. Lo
   comprueba después de la contraseña, para no revelar a un tercero si un correo tiene
   solicitud.
3. El administrador las gestiona en el panel web, en **Personas → Cuentas de acceso**,
   que usa `/api/cuentas` (solo administrador; nunca devuelve contraseñas):

| Acción | Ruta | Efecto |
|---|---|---|
| Listar | `GET /api/cuentas` | Todas las cuentas, con rol, documento y estado. |
| Aprobar / Reactivar | `PATCH /api/cuentas/:id/aprobar` | Enciende la cuenta y su ficha: ya puede entrar. |
| Desactivar | `PATCH /api/cuentas/:id/desactivar` | La apaga. No se permite sobre tu propia cuenta ni sobre el último administrador activo. |
| Rechazar | `DELETE /api/cuentas/:id` | Solo solicitudes pendientes. Borra la cuenta, y la ficha si no tiene servicios ni vehículos. |

Cada cuenta tiene un **estado**:

- **pendiente**: solicitud sin revisar.
- **activa**: puede entrar.
- **desactivada**: ya estuvo aprobada y se apagó. Se puede reactivar, pero no rechazar.

Para distinguir pendiente de desactivada hay que ejecutar **una vez**
[`sql/estado-cuentas.sql`](sql/estado-cuentas.sql), que añade la columna
`usuario.aprobada_en`. Mientras no se ejecute, un conductor desactivado sigue saliendo como
pendiente. Los administradores ya se muestran bien sin el script, porque nunca vienen del
registro.

Al desactivar, una sesión ya abierta sigue válida hasta que caduca (máximo 8 horas).

### Cambios parciales del administrador

Un `PUT /api/<tabla>/:id` del administrador se valida con el esquema de Zod **en modo
parcial**: se revisa cada campo enviado y no se exigen los demás. El panel web sigue
mandando el registro entero y la app móvil manda solo lo que cambia (por ejemplo
`{ "id_conductor": "…" }` para reasignar). Un `PUT` sin ningún campo válido responde 400.

Las fechas con hora aceptan zona horaria (`2026-12-12T09:00:00+00:00`), que es como las
devuelve Postgres.

### Reporte semanal de servicios (Excel)

En el panel web, **Operación → Servicios → Reporte semanal**: se elige una semana
(lunes a domingo) y se descarga un `.xlsx`. Lo genera el backend con `exceljs` en
`GET /api/reportes/servicios-semanal?desde=AAAA-MM-DD` (solo administrador), tomando
los servicios cuya **fecha de salida** cae en esa semana, en hora de Colombia.

- Hoja **Resumen**: servicios, pasajeros, valor, peajes, km, puntualidad (llegada
  real frente a estimada) y cortes por día, por estado y por conductor.
- Hoja **Servicios**: una fila por servicio con nombres de conductor, vehículo,
  origen, destino y estado, minutos de retraso y una fila de totales.

### Foto de perfil

Cualquier usuario (administrador o conductor) pulsa su avatar en la cabecera del panel
web, o en *Mi perfil* dentro de la app móvil, y puede elegir una ilustración, subir una
imagen o tomarse una foto con la cámara. Las dos apps la dejan en un JPEG cuadrado de
256 × 256 px antes de enviarla (la web recorta al centro; el móvil usa el recorte nativo).

| Acción | Ruta |
|---|---|
| Ver la propia | `GET /api/perfil/foto` |
| Guardar / reemplazar | `PUT /api/perfil/foto` con `{ "foto": "data:image/jpeg;base64,…" }` |
| Quitar | `DELETE /api/perfil/foto` |

Siempre actúa sobre la cuenta de la sesión (el id sale del token). El backend acepta
solo JPG, PNG o WebP de hasta 150 KB y comprueba que el contenido sea de verdad una
imagen. Requiere ejecutar **una vez** [`sql/foto-perfil.sql`](sql/foto-perfil.sql), que
añade la columna `usuario.foto_perfil`; sin ella los avatares siguen con las iniciales
y guardar responde 503 con un aviso.

### Cortes pasajeros de Supabase

Si Supabase responde 502, 503 o 504 a una **lectura**, `config/supabase.js` la reintenta
hasta 2 veces. Las escrituras nunca se repiten. Si aun así falla, la API responde 503 con
«La base de datos tardó en responder…».

El login también limita los intentos: 20 cada 15 minutos por conexión.

### Cómo se une un conductor con su ficha

Son dos tablas distintas:

- **`usuario`** → con lo que se inicia sesión (`correo` + `contrasena`)
- **`conductor`** → la ficha a la que se le asignan los servicios (`email`)

El backend las une **por correo**: `usuario.correo = conductor.email`. Los dos
tienen que ser idénticos. Si un conductor inicia sesión y no tiene ficha con ese
correo, el login se lo dice con un mensaje claro en vez de dejarle un panel vacío.

---

## Poner la base de datos en dos roles

En el **SQL Editor** de Supabase, en este orden:

1. [`sql/roles-2-niveles.sql`](sql/roles-2-niveles.sql) — deja solo Administrador
   y Conductor, une los duplicados y fija los niveles. Va dentro de una
   transacción: si algo no cuadra, no aplica nada y te dice qué falta.
2. [`sql/crear-cuentas-conductores.sql`](sql/crear-cuentas-conductores.sql) — crea
   la cuenta de acceso de cada ficha de conductor que no la tenga, con una
   contraseña temporal (`Conductor2026*`).

En el sistema **no hay usuarios Cliente**: el PASO 4 del primer script borra las cuentas
de acceso con ese rol (o con cualquier rol de prueba). La tabla `cliente`, con los pasajeros
de las reservas, no se toca.

`sql/corregir-roles.sql` es un intento anterior de tres niveles (con Cliente) y **no debe
ejecutarse**.

### Crear la primera cuenta de administrador

```bash
npm run crear-admin
```

Pide nombre, apellido, correo y contraseña por la terminal (la contraseña no se ve al
escribirla) y guarda la cuenta con el rol Administrador.

---

## Cómo funciona la autenticación con cookies

1. `POST /api/auth/login` valida el correo y la contraseña (bcrypt), firma un JWT
   y lo guarda en una cookie **httpOnly**. El token nunca viaja en el JSON de la
   respuesta ni se guarda en `localStorage`, así que el JavaScript de la página no
   puede leerlo: eso es lo que protege la sesión frente a ataques XSS.
2. El navegador manda esa cookie sola en cada petición siguiente. El frontend solo
   necesita `withCredentials: true` en axios (ya está en `src/api/api.js`).
3. `authMiddleware` lee la cookie, verifica el JWT y deja el usuario en `req.user`.
   Si el token está vencido o alterado, responde 401 **y borra la cookie**, para que
   el navegador no siga mandando una cookie muerta.
4. `POST /api/auth/logout` borra la cookie con exactamente los mismos atributos con
   los que se creó (requisito del navegador para que el borrado surta efecto).
5. Al abrir o recargar la página, el frontend llama a `GET /api/auth/me`: como la
   cookie es httpOnly, es la única forma de saber si la sesión sigue viva.

Todos los atributos de la cookie salen de un único archivo, `config/cookies.js`, para
que login y logout no puedan quedar desincronizados.

### Local vs. producción

| Escenario | Configuración |
|---|---|
| Local (`localhost:5173` → `localhost:3000`) | `CROSS_SITE_COOKIES=false` → `SameSite=Lax`. Funciona sin HTTPS: puertos distintos siguen siendo el mismo *site*. |
| Frontend y backend en dominios distintos | `CROSS_SITE_COOKIES=true` → `SameSite=None; Secure`. **Exige HTTPS en los dos lados**, si no el navegador descarta la cookie. |

Con cookies, el CORS no puede ser `*`: `FRONTEND_URL` debe listar el origen exacto
(o varios separados por coma) y `credentials` va en `true`.

---

## Estructura

```
server.js                  Arranque, CORS, registro de las 16 rutas
config/cookies.js          Atributos de la cookie de sesión (fuente única)
config/supabase.js         Cliente de Supabase
controllers/               authController (login/logout/me), cuentasController (registro
                           y aprobación de cuentas) y genericController (CRUD)
middleware/                authMiddleware, permisos, limitador, errorHandler
routers/                   authRouter, cuentasRouter y genericRouter
scripts/crear-admin.js     Crea una cuenta de administrador desde la terminal
schemas/                   Validación con Zod de cada tabla
sql/                       Scripts de migración de roles y cuentas
frontend-transporte/       Cliente React (Vite)
_legacy/                   Código antiguo archivado, ya no se usa
```

`_legacy/` guarda el backend duplicado que había antes (`Transporte-api/`) y los
controladores viejos que usaban tablas en PascalCase y token por header. No se
ejecutan; se pueden borrar cuando quieras.
