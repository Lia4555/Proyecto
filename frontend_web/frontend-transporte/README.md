# D' VIAJE · Panel de administración (frontend)

Interfaz web en **React + Vite** para administrar las 16 tablas del backend
(Express + Supabase, en la carpeta padre `Backend/`): flota, conductores, clientes,
servicios, reservas, alertas, catálogos y cuentas de acceso.

---

## Puesta en marcha

```bash
# 1. Backend (en otra terminal): es la carpeta padre, Backend/.
#    No uses ../Transporte-api: es una copia antigua sin cookies ni permisos.
cd ..
npm install
npm run dev            # http://localhost:3000

# 2. Frontend
npm install
cp .env.example .env   # ajusta VITE_API_URL si tu backend usa otro puerto
npm run dev            # http://localhost:5173
```

| Script            | Qué hace                                                    |
| ----------------- | ----------------------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con recarga en caliente               |
| `npm run build`   | Compila a `dist/` para producción                            |
| `npm run preview` | Sirve el `dist/` compilado                                   |
| `npm test`        | Suite de pruebas (render de pantallas + lógica), sin navegador |
| `npm run demo`    | Modo demostración: la app con datos de ejemplo, sin backend   |

### Ver la aplicación sin backend

Si el backend o Supabase no están disponibles, puedes recorrer todo el panel con
datos de ejemplo:

```bash
npm run demo       # abre http://localhost:5173/demo.html
```

Entra con **cualquier correo** y una contraseña de **6 o más caracteres**. Las 16
tablas traen registros de ejemplo (137 vehículos, 213 reservas, 84 servicios…) y
crear, editar y eliminar funcionan en memoria. El modo demo vive en `src/demo/`
y **no entra en `npm run build`**.

---

## Qué incluye la interfaz

**Página principal pública (lo primero que se ve)**
- Presentación de la empresa: portada, cifras, quiénes somos, misión y visión.
- Seis servicios (empresarial, escolar, turismo, aeropuerto, eventos, por horas).
- Galería de la flota con fotos y capacidad de cada tipo de vehículo.
- Banda de garantías (documentos vigentes, conductores certificados, monitoreo,
  mantenimiento) y formulario de contacto que abre el correo con el mensaje listo.
- Desde ahí se entra al panel con **Ingresar al panel**; el login tiene un
  enlace para volver a la portada. No hay registro público: las cuentas las
  crea el administrador.

### Personalizar la portada

| Qué cambiar                    | Dónde                                                   |
| ------------------------------ | ------------------------------------------------------- |
| Nombre, dirección, teléfonos, correo, horario | objeto `EMPRESA` en `src/components/Landing.jsx` |
| Cifras, servicios, flota       | listas `CIFRAS`, `SERVICIOS`, `FLOTA` del mismo archivo  |
| Fotos                          | `public/img/` (ver `public/img/CREDITOS.md`)             |
| Colores y tipografía           | tokens de `src/index.css` · estilos en `src/landing.css` |

**Sesión y permisos (dos roles)**
- El token vive en una cookie httpOnly que el navegador manda sola; el
  JavaScript de la página no puede leerlo. Al abrir o recargar se pregunta
  `GET /api/auth/me` para saber quién eres.
- **Administrador** → panel completo con las 15 tablas.
  **Conductor** → un panel propio con sus servicios, su vehículo y sus alertas.
- Si la sesión vence —o el backend la rechaza— se vuelve al login **sin
  recargar la página**, avisando con un mensaje.

**Navegación**
- Cada pantalla tiene su dirección (`#/vehiculos`, `#/mis-servicios`): funcionan
  las flechas Atrás/Adelante del navegador, se puede recargar sin perder el sitio
  y el enlace de una pantalla se puede compartir.
- Flechas **Atrás / Adelante** en la barra superior, apagadas cuando no hay a
  dónde ir, y un pie con la **sección anterior y la siguiente**.

**Nada de códigos internos**
- Las listas desplegables y las tablas muestran siempre el **nombre** (o la
  placa), nunca el id. Las columnas de código y las llaves primarias no se
  pintan.

**Tablas (una sola pantalla genérica para las 16 entidades)**
- Búsqueda instantánea sobre las columnas visibles (ignora mayúsculas y tildes).
- Orden ascendente/descendente al hacer clic en cualquier encabezado.
- Selector de **columnas visibles** por tabla, recordado en el navegador.
- Exportación a **CSV** de lo que hay filtrado (compatible con Excel).
- Estados claros: cargando (esqueleto), vacío, sin resultados y error con reintento.
- Columna de acciones fija a la derecha al desplazarse en horizontal.

**Paginación**
- Texto explícito: *«Mostrando 61–70 de 137 registros»*.
- Selector de filas por página (10 / 25 / 50 / 100), recordado entre sesiones.
- Primera · Anterior · números con `…` · Siguiente · Última.
- La página actual se marca con `aria-current="page"`; en móvil los números se
  reemplazan por *«Página 3 de 14»*.
- Si un filtro deja menos páginas, nunca te quedas en una página inexistente.

**Listas desplegables en vez de ids**
- Los campos que apuntan a otra tabla (vehículo, conductor, cliente, destino,
  estado…) se eligen por **nombre** en una lista desplegable; el sistema guarda
  el id que espera el backend.
- La tabla, la búsqueda, el orden y el CSV también muestran esos nombres
  (el id queda en el tooltip de la celda).
- Las listas se descargan una sola vez y se comparten entre pantallas; si una
  no se puede cargar, el campo vuelve a ser de texto para no bloquear el trabajo.
- Se define con `ref: <clave de la tabla>` en `src/entities.js`, y cada tabla
  indica con `mostrar` con qué texto se identifica una fila.

**Formularios (crear / editar / ver)**
- Panel lateral generado desde `src/entities.js`: un solo componente sirve
  para las 16 tablas.
- Validación en el navegador (obligatorios, correo, número entero, mínimo,
  UUID, fechas coherentes) **y** los errores de Zod del backend pintados
  debajo del campo que los produjo.
- Aviso antes de salir si hay cambios sin guardar.

**Accesibilidad y detalles de front**
- Diálogos con `role="dialog"`, foco atrapado, cierre con `Escape` y retorno
  del foco al elemento que los abrió.
- Etiquetas `<label>` asociadas, `aria-invalid`, `aria-describedby`, `aria-sort`,
  enlace «Ir al contenido» y foco visible en todos los controles.
- Diseño responsive (menú lateral deslizable en móvil) y respeto por
  `prefers-reduced-motion`.

---

## Estructura

```
src/
  demo/                 Backend simulado del modo demostración
  api/api.js            Cliente axios: token, cierre de sesión y errores legibles
  components/
    Landing.jsx         Página principal pública (presentación de la empresa)
    AuthLayout.jsx      Marco visual del inicio de sesión
    Login.jsx           Inicio de sesión
    Dashboard.jsx       Panel del ADMINISTRADOR: menú, barra y tabla activa
    DataTable.jsx       Búsqueda, orden, columnas, paginación y CRUD
    EntityForm.jsx      Panel lateral de crear / editar / ver detalle
    conductor/          Panel del CONDUCTOR (servicios, vehículo, alertas)
    ui/                 Pagination, ConfirmDialog, Toast, Navegador, Icons
  hooks/
    useDialog.js        Foco atrapado + Escape + bloqueo de scroll
    useNavegacion.js    Direcciones por pantalla e historial (flechas)
    useDatosConductor.js  Carga de los datos del panel del conductor
  lib/
    session.js          Rol del usuario y permisos de escritura
    form.js             Valores iniciales, validación y payload para Zod
    format.js           Formato de celdas, orden y exportación CSV
    referencias.js      Listas desplegables de las tablas relacionadas
  entities.js           Definición de las 16 tablas y sus campos
  index.css             Sistema de estilos del panel (tokens, componentes)
  landing.css           Estilos de la página principal pública
  navegacion.css        Flechas de historial y paso entre secciones
  conductor.css         Estilos del panel del conductor
public/img/             Fotografías de la portada (reemplazables)
tests/pruebas.jsx       Suite ejecutada por `npm test`
```

### Agregar una tabla nueva

Basta con añadir un objeto a `entities` en `src/entities.js`
(`key`, `label`, `endpoint`, `pk`, `group`, `fields` y opcionalmente `columnas`).
La pantalla, el formulario, la búsqueda y la paginación salen solos.

---

## Notas sobre roles

Solo existen dos roles: **Administrador** y **Conductor**. No hay registro
público, así que las cuentas las crea el administrador en Supabase (o con los
scripts de `sql/`). Un conductor necesita **dos cosas**: su cuenta en la tabla
`usuario` y su ficha en la tabla `conductor`, ambas con el **mismo correo**.

El detalle de qué puede tocar cada rol está en el README de la raíz del
proyecto y, como regla ejecutable, en `middleware/permisos.js`.
