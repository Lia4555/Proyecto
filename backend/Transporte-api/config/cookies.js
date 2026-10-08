export const COOKIE_NAME = 'token';

//el token que de dura 8 h despues de esas horas se caduca
export const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000;


const crossSite = process.env.CROSS_SITE_COOKIES === 'true';

const baseOptions = {
  httpOnly: true,                                        // JS del navegador no puede leerla -> protege contra XSS
  secure: crossSite || process.env.NODE_ENV === 'production', // solo por HTTPS
  sameSite: crossSite ? 'none' : 'lax',                  
  path: '/'                                           
};

// Opciones para CREAR la cookie (incluyen la caducidad).
export const cookieOptions = {
  ...baseOptions,
  maxAge: COOKIE_MAX_AGE_MS
};

// Opciones para BORRAR la cookie: las mismas, pero SIN maxAge.
export const clearCookieOptions = { ...baseOptions };
