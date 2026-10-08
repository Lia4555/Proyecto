// DOCUMENTACION DE LA API (OpenAPI 3 / Swagger)


import { zodToJsonSchema } from 'zod-to-json-schema';
import { schemas } from '../schemas/genericSchema.js';

// Nombres legibles para el menu de Swagger.
const ETIQUETAS = {
  roles: 'Catálogos',
  tipos_documentos: 'Catálogos',
  estados_servicio: 'Catálogos',
  tipos_alerta: 'Catálogos',
  destinos: 'Catálogos',
  clases_viaje: 'Catálogos',
  tipos_vehiculo: 'Catálogos',
  conductor: 'Personas',
  cliente: 'Personas',
  vehiculos: 'Flota',
  documentos_vehiculo: 'Flota',
  historial_conductores: 'Flota',
  mantenimientos: 'Flota',
  servicios: 'Operación',
  reservas: 'Operación',
  alertas: 'Operación'
};

// Datos personales que la API nunca devuelve completos (middleware/datosSensibles.js).
const NOTA_SENSIBLES = {
  conductor:
    ' **Datos delicados:** `fecha_nacimiento`, `direccion` y `ultimo_acceso` no se devuelven; `numero_documento` y `licencia_conduccion` llegan enmascarados (`••••5678`), también para el administrador. Se pueden enviar al crear o editar; si al editar se reenvía el valor enmascarado, se ignora.',
  cliente:
    ' **Datos delicados:** `fecha_nacimiento` y `direccion` no se devuelven; `numero_documento` llega enmascarado (`••••5678`), también para el administrador.'
};

const tipoDeId = (pk) =>
  pk === 'id_conductor' || pk === 'id_cliente'
    ? { type: 'string', format: 'uuid' }
    : { type: 'integer' };


const SEGURIDAD = [{ tokenBearer: [] }];

// Quien puede usar cada endpoint.
const SOLO_ADMIN = 'Solo administrador';
const CON_SESION = 'Requiere sesión';
const PUBLICO = 'Público';

const respuesta = (descripcion, ejemplo) => ({
  description: descripcion,
  content: { 'application/json': { schema: { type: 'object' }, example: ejemplo } }
});

// Respuestas de error que puede dar cualquier endpoint protegido.
const ERRORES_COMUNES = {
  400: respuesta('Datos inválidos. `detalles` dice qué campo falla.', {
    error: 'Error de validación de datos',
    detalles: [{ campo: 'correo', mensaje: 'El correo no tiene un formato válido.' }]
  }),
  401: respuesta('No hay sesión, o caducó.', { error: 'No hay sesion activa. Inicia sesion.' }),
  403: respuesta('Hay sesión, pero el rol no alcanza.', {
    error: 'Tu rol no tiene acceso a esta informacion.'
  }),
  404: respuesta('No existe (o está fuera de tu alcance).', { error: 'Registro no encontrado' }),
  409: respuesta('Choca con un valor que no se puede repetir.', {
    error: 'Ya existe un registro con esa placa (ABC123).',
    detalles: [{ campo: 'placa', mensaje: 'Ya existe un registro con esa placa (ABC123).' }]
  }),
  429: respuesta('Demasiados intentos desde esta conexión.', {
    error: 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo en 12 min.'
  }),
  503: respuesta('La base de datos tardó en responder.', {
    error: 'La base de datos tardó en responder. Inténtalo de nuevo en unos segundos.'
  })
};

const errores = (...codigos) =>
  Object.fromEntries(codigos.map((c) => [c, ERRORES_COMUNES[c]]));
//comprueba que los datos esten bien
function cuerpoDe(tabla, { parcial = false } = {}) {
  const esquema = schemas[tabla];
  if (!esquema) return undefined;
  const json = zodToJsonSchema(parcial ? esquema.partial() : esquema, { target: 'openApi3' });
  delete json.$schema;
  return { required: true, content: { 'application/json': { schema: json } } };
}

// Endpoints de una tabla (crud)
function rutasDeTabla({ endpoint, tabla, pk }) {
  const etiqueta = ETIQUETAS[tabla] ?? 'Tablas';
  const nombre = endpoint.replace(/-/g, ' ');
  const idEnRuta = {
    name: 'id',
    in: 'path',
    required: true,
    schema: tipoDeId(pk),
    description: `Valor de ${pk}`
  };

  return {
    [`/api/${endpoint}`]: {
      get: {
        tags: [etiqueta],
        security: SEGURIDAD,
        summary: `${CON_SESION} · Listar ${nombre}`,
        description:
          'El administrador ve todas las filas. Un conductor recibe solo las suyas: el recorte se hace en la consulta, no en el navegador.' +
          (NOTA_SENSIBLES[tabla] ?? ''),
        responses: {
          200: { description: 'Lista de registros', content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } },
          ...errores(401, 403, 503)
        }
      },
      post: {
        tags: [etiqueta],
        security: SEGURIDAD,
        summary: `${SOLO_ADMIN} · Crear en ${nombre}`,
        description: 'Solo administrador. Los consecutivos (código, número interno) se generan solos si no se envían.',
        requestBody: cuerpoDe(tabla),
        responses: {
          201: respuesta('Creado', { success: true, message: `Registro creado en ${tabla}`, data: {} }),
          ...errores(400, 401, 403, 409, 503)
        }
      }
    },
    [`/api/${endpoint}/{id}`]: {
      get: {
        tags: [etiqueta],
        security: SEGURIDAD,
        summary: `${CON_SESION} · Ver un registro de ${nombre}`,
        description:
          'Fuera de tu alcance responde 404 (no 403), para no revelar que el registro existe.' + (NOTA_SENSIBLES[tabla] ?? ''),
        parameters: [idEnRuta],
        responses: {
          200: { description: 'El registro', content: { 'application/json': { schema: { type: 'object' } } } },
          ...errores(401, 403, 404, 503)
        }
      },
      put: {
        tags: [etiqueta],
        security: SEGURIDAD,
        summary: `${CON_SESION} · Editar un registro de ${nombre}`,
        description:
          'Admite cambios parciales. La clave primaria y los campos desconocidos se descartan. Un conductor solo puede tocar las columnas que le permite middleware/permisos.js (por ejemplo, el estado de sus servicios).',
        parameters: [idEnRuta],
        requestBody: cuerpoDe(tabla, { parcial: true }),
        responses: {
          200: respuesta('Actualizado', { success: true, data: {} }),
          ...errores(400, 401, 403, 404, 409, 503)
        }
      },
      delete: {
        tags: [etiqueta],
        security: SEGURIDAD,
        summary: `${SOLO_ADMIN} · Eliminar un registro de ${nombre}`,
        description: 'Solo administrador.',
        parameters: [idEnRuta],
        responses: {
          200: respuesta('Eliminado', { success: true, message: 'Registro eliminado exitosamente' }),
          ...errores(401, 403, 404, 503)
        }
      }
    }
  };
}

// Endpoints escritos a mano 
const RUTAS_PROPIAS = {
  '/health': {
    get: {
      tags: ['Servidor'],
      summary: `${PUBLICO} · Comprobar que el servidor responde`,
      security: [],
      responses: { 200: respuesta('Vivo', { status: 'UP', timestamp: '2026-09-21T19:41:05.148Z' }) }
    }
  },

  '/api/auth/register': {
    post: {
      tags: ['Autenticación'],
      summary: `${PUBLICO} · Registro público`,
      description:
        'Crea la cuenta APAGADA y como Conductor. No da acceso a nada hasta que un administrador la apruebe. Máximo 5 por hora y por conexión.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['nombre', 'apellido', 'tipo_documento', 'numero_documento', 'telefono', 'correo', 'contrasena'],
              properties: {
                nombre: { type: 'string', example: 'Ana' },
                apellido: { type: 'string', example: 'Ruiz' },
                tipo_documento: { type: 'string', enum: ['CC', 'CE', 'PA'] },
                numero_documento: { type: 'string', example: '1023456789', description: 'CC y CE: solo números. PA admite letras.' },
                telefono: { type: 'string', example: '3001234567' },
                correo: { type: 'string', format: 'email' },
                contrasena: { type: 'string', minLength: 8, maxLength: 72 }
              }
            }
          }
        }
      },
      responses: {
        201: respuesta('Solicitud enviada', {
          message: 'Solicitud enviada. Un administrador debe aprobar tu cuenta antes de que puedas iniciar sesión.'
        }),
        ...errores(400, 409, 429)
      }
    }
  },

  '/api/auth/login': {
    post: {
      tags: ['Autenticación'],
      summary: `${PUBLICO} · Iniciar sesión`,
      description:
        'El token viaja en una cookie httpOnly, que el JavaScript de la página no puede leer. La app móvil manda la cabecera `X-Client: mobile` y entonces el token también vuelve en el JSON.',
      security: [],
      parameters: [
        {
          name: 'X-Client',
          in: 'header',
          required: false,
          schema: { type: 'string', enum: ['mobile'], example: 'mobile' },
          description:
            'Escribe `mobile` para que la respuesta incluya el `token`, y así poder pegarlo en ' +
            'el botón **Authorize** (tokenBearer). El panel web no manda esta cabecera: le basta la cookie.'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['correo', 'contrasena'],
              properties: {
                correo: { type: 'string', format: 'email' },
                contrasena: { type: 'string', format: 'password' }
              }
            }
          }
        }
      },
      responses: {
        200: respuesta('Sesión iniciada. La cookie ya queda puesta; `token` solo aparece si mandaste `X-Client: mobile`.', {
          message: 'Login exitoso',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…  ← cópialo en Authorize',
          user: { nombre: 'Ana', correo: 'ana@dviaje.com', rol: 'Administrador', nivel_permiso: 3 }
        }),
        401: respuesta('Credenciales incorrectas', { error: 'El correo o la contrasena son incorrectos.' }),
        403: respuesta('Cuenta sin aprobar, sin rol válido o conductor sin ficha', {
          error: 'Tu cuenta todavía no está activa. Un administrador debe aprobarla antes de que puedas entrar.'
        }),
        ...errores(400, 429)
      }
    }
  },

  '/api/auth/logout': {
    post: {
      tags: ['Autenticación'],
      summary: `${PUBLICO} · Cerrar sesión`,
      description: 'Borra la cookie con los mismos atributos con los que se creó.',
      security: [],
      responses: { 200: respuesta('Sesión cerrada', { message: 'Sesion cerrada' }) }
    }
  },

  '/api/auth/me': {
    get: {
      tags: ['Autenticación'],
      summary: `${CON_SESION} · Quién soy`,
      security: SEGURIDAD,
      description: 'Lo que llama el panel al abrir o recargar: como el token está en una cookie httpOnly, el navegador no puede leerlo por su cuenta.',
      responses: {
        200: respuesta('Usuario de la sesión', {
          user: { id_usuario: 'uuid', nombre: 'Ana', correo: 'ana@dviaje.com', rol: 'Administrador', nivel_permiso: 3 }
        }),
        ...errores(401)
      }
    }
  },

  '/api/auth/recuperar': {
    post: {
      tags: ['Autenticación'],
      summary: 'Retirado · Recuperar la contraseña',
      deprecated: true,
      description:
        'Retirado por seguridad: con solo el correo y el teléfono (datos que no son secretos) cualquiera podía cambiar la contraseña de otra cuenta. Ahora un administrador la restablece con `PATCH /api/cuentas/{id}/contrasena`, y cada usuario cambia la suya con `PUT /api/perfil/contrasena`. Esta ruta solo responde 410.',
      security: [],
      responses: {
        410: respuesta('Retirado', {
          error: 'La recuperación con correo y teléfono se retiró por seguridad. Pide a un administrador que restablezca tu contraseña.'
        })
      }
    }
  },

  '/api/cuentas': {
    get: {
      tags: ['Cuentas de acceso'],
      summary: `${SOLO_ADMIN} · Listar cuentas`,
      security: SEGURIDAD,
      description: 'Solo administrador. Nunca devuelve la columna `contrasena`.',
      responses: {
        200: respuesta('Cuentas con su estado', [
          {
            id_usuario: 'uuid',
            nombre: 'Ana',
            correo: 'ana@dviaje.com',
            estado: 'pendiente',
            rol: 'Conductor',
            tiene_ficha: true,
            es_tu_cuenta: false
          }
        ]),
        ...errores(401, 403)
      }
    }
  },

  '/api/cuentas/{id}/aprobar': {
    patch: {
      tags: ['Cuentas de acceso'],
      summary: `${SOLO_ADMIN} · Aprobar (y delegar el permiso)`,
      security: SEGURIDAD,
      description:
        'Aquí el administrador decide con qué rol entra la cuenta. Aprobar como Administrador da acceso total; como Conductor, solo a sus servicios y su vehículo. Sin `rol` se conserva el que ya tenía (caso de una reactivación).',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { rol: { type: 'string', enum: ['Administrador', 'Conductor'] } }
            }
          }
        }
      },
      responses: {
        200: respuesta('Aprobada', {
          success: true,
          rol: 'Conductor',
          advertencia: null,
          message: 'Cuenta ana@dviaje.com aprobada como Conductor.'
        }),
        ...errores(400, 401, 403, 404)
      }
    }
  },

  '/api/cuentas/{id}/desactivar': {
    patch: {
      tags: ['Cuentas de acceso'],
      summary: `${SOLO_ADMIN} · Desactivar una cuenta`,
      security: SEGURIDAD,
      description:
        'No se puede desactivar la propia cuenta ni al último administrador activo. Las sesiones que esa cuenta tenga abiertas dejan de servir al momento.',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: respuesta('Desactivada', { success: true, message: 'Cuenta ana@dviaje.com desactivada.' }),
        ...errores(400, 401, 403, 404)
      }
    }
  },

  '/api/cuentas/{id}/contrasena': {
    patch: {
      tags: ['Cuentas de acceso'],
      summary: `${SOLO_ADMIN} · Restablecer la contraseña de una cuenta`,
      security: SEGURIDAD,
      description:
        'Sustituye a la antigua recuperación pública. El administrador pone una contraseña temporal y se la entrega a la persona por un canal seguro; las sesiones abiertas de esa cuenta se cierran.',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['contrasena'],
              properties: { contrasena: { type: 'string', minLength: 8, maxLength: 72, description: 'La nueva contraseña.' } }
            }
          }
        }
      },
      responses: {
        200: respuesta('Restablecida', {
          success: true,
          message: 'Contraseña de ana@dviaje.com restablecida. Entrégasela por un canal seguro y pídele que la cambie al entrar.'
        }),
        ...errores(400, 401, 403, 404)
      }
    }
  },

  '/api/cuentas/{id}': {
    delete: {
      tags: ['Cuentas de acceso'],
      summary: `${SOLO_ADMIN} · Rechazar una solicitud`,
      security: SEGURIDAD,
      description:
        'Solo sirve con cuentas pendientes. Su ficha de conductor se borra únicamente si no tiene servicios ni vehículos asignados.',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: respuesta('Rechazada', { success: true, message: 'Solicitud de ana@dviaje.com rechazada y eliminada.' }),
        ...errores(400, 401, 403, 404)
      }
    }
  },

  '/api/perfil/foto': {
    get: {
      tags: ['Perfil'],
      summary: `${CON_SESION} · Ver mi foto`,
      security: SEGURIDAD,
      description: 'Siempre la de la propia cuenta: el id sale del token, nunca de la URL.',
      responses: {
        200: respuesta('Foto (o null)', { foto: 'data:image/jpeg;base64,...', disponible: true }),
        ...errores(401)
      }
    },
    put: {
      tags: ['Perfil'],
      summary: `${CON_SESION} · Guardar mi foto`,
      security: SEGURIDAD,
      description:
        'La imagen llega ya recortada y reducida (256 x 256) como data URL. Este endpoint admite hasta 250 KB de cuerpo, más que el resto de la API.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['foto'],
              properties: {
                foto: {
                  type: 'string',
                  description: 'data:image/jpeg;base64,… (también png o webp)',
                  example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...'
                }
              }
            }
          }
        }
      },
      responses: { 200: respuesta('Guardada', { foto: 'data:image/jpeg;base64,...' }), ...errores(400, 401, 404) }
    },
    delete: {
      tags: ['Perfil'],
      summary: `${CON_SESION} · Quitar mi foto`,
      security: SEGURIDAD,
      responses: { 200: respuesta('Quitada', { foto: null }), ...errores(401, 404) }
    }
  },

  '/api/perfil/contrasena': {
    put: {
      tags: ['Perfil'],
      summary: `${CON_SESION} · Cambiar mi contraseña`,
      security: SEGURIDAD,
      description:
        'Siempre la de la propia cuenta (el id sale del token). Pide la contraseña actual. Máximo 5 intentos cada 15 minutos.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['actual', 'nueva'],
              properties: {
                actual: { type: 'string', format: 'password' },
                nueva: { type: 'string', format: 'password', minLength: 8, maxLength: 72 }
              }
            }
          }
        }
      },
      responses: {
        200: respuesta('Cambiada', { success: true, message: 'Tu contraseña se cambió.' }),
        ...errores(400, 401, 429)
      }
    }
  },

  '/api/reportes/servicios-semanal': {
    get: {
      tags: ['Reportes'],
      summary: `${SOLO_ADMIN} · Reporte semanal de servicios (Excel)`,
      security: SEGURIDAD,
      description: 'Solo administrador. Devuelve un archivo .xlsx, no JSON.',
      parameters: [
        { name: 'desde', in: 'query', required: false, schema: { type: 'string', format: 'date' }, description: 'AAAA-MM-DD' },
        { name: 'hasta', in: 'query', required: false, schema: { type: 'string', format: 'date' }, description: 'AAAA-MM-DD' }
      ],
      responses: {
        200: {
          description: 'Archivo de Excel',
          content: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
              schema: { type: 'string', format: 'binary' }
            }
          }
        },
        ...errores(400, 401, 403)
      }
    }
  }
};


export function construirOpenApi(tablas) {
  const rutasTablas = tablas.reduce((acc, t) => ({ ...acc, ...rutasDeTabla(t) }), {});

  return {
    openapi: '3.0.3',
    info: {
      title: "D' VIAJE · API de transporte",
      version: '1.0.0',
      description: 'API del sistema de transporte. La usan el panel web y la app móvil.'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Desarrollo' },
      { url: '/', description: 'El mismo servidor que sirve esta página' }
    ],
    tags: [
      { name: 'Autenticación', description: 'Entrar, salir y saber quién soy.' },
      { name: 'Cuentas de acceso', description: 'Aprobar, desactivar, rechazar cuentas y restablecer contraseñas. Solo administrador.' },
      { name: 'Perfil', description: 'La foto y la contraseña de la propia cuenta.' },
      { name: 'Reportes', description: 'Descargas en Excel. Solo administrador.' },
      { name: 'Catálogos', description: 'Listas de apoyo: tipos, estados, clases.' },
      { name: 'Personas', description: 'Conductores y clientes.' },
      { name: 'Flota', description: 'Vehículos, documentos, mantenimientos e historial.' },
      { name: 'Operación', description: 'Servicios, reservas y alertas.' },
      { name: 'Servidor', description: 'Estado del servicio.' }
    ],
    components: {
      securitySchemes: {
        tokenBearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Pega aquí el token (solo el texto largo, sin escribir "Bearer"). Para conseguirlo: ' +
            'abre `POST /api/auth/login`, pulsa **Try it out**, escribe `mobile` en la cabecera ' +
            '`X-Client`, ejecuta, y copia el valor de `token` de la respuesta. Dura 8 horas. ' +
            'En cada petición se comprueba además que la cuenta siga activa: si un administrador ' +
            'la desactiva, el token deja de servir al momento.'
        }
      }
    },
    // Por defecto todo pide sesión; los endpoints públicos lo anulan con `security: []`.
    security: [{ tokenBearer: [] }],
    paths: { ...RUTAS_PROPIAS, ...rutasTablas }
  };
}
