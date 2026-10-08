-- =====================================================================
-- D' VIAJE - CREAR LA CUENTA DE ACCESO DE CADA CONDUCTOR
-- Ejecutar DESPUES de sql/roles-2-niveles.sql
-- =====================================================================
--
-- POR QUE HACE FALTA
-- En la base de datos hay DOS tablas distintas:
--   · usuario    -> con lo que se inicia sesion (correo + contrasena)
--   · conductor  -> la ficha a la que se le asignan los servicios
--
-- Hoy no coinciden: las 15 fichas de conductor (carlos.ramirez1@dviaje.com,
-- andres.gomez2@dviaje.com...) no tienen ninguna cuenta de usuario, asi que
-- ningun conductor puede entrar al panel. Este script crea la cuenta que
-- falta para cada ficha, con el MISMO correo, que es como el backend une
-- las dos tablas.
--
-- CONTRASENA TEMPORAL PARA TODOS:  Conductor2026*
-- Es un hash bcrypt, igual que el que genera el registro de la aplicacion.
-- Cambiala en cuanto cada conductor entre por primera vez.
-- =====================================================================

BEGIN;

INSERT INTO public.usuario (nombre, apellido, correo, contrasena, telefono, id_rol)
SELECT
  c.nombre,
  c.apellido,
  c.email,
  -- bcrypt de 'Conductor2026*' (12 rondas)
  '$2b$12$K30Z7.UwC67DPA1dHMKiJ.gVVgT2fxnVmo5GfX/908TbnQhrl/5Bu',
  c.telefono,
  (SELECT id_rol FROM public.roles WHERE nombre_rol = 'Conductor')
FROM public.conductor c
WHERE c.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.usuario u WHERE u.correo = c.email);

COMMIT;


-- ---------------------------------------------------------------------
-- COMPROBACION - todas las filas deben decir 'OK, ya puede entrar'
-- ---------------------------------------------------------------------
SELECT c.nombre, c.apellido, c.email,
       CASE WHEN u.id_usuario IS NULL
            THEN 'SIN CUENTA'
            ELSE 'OK, ya puede entrar' END AS estado
  FROM public.conductor c
  LEFT JOIN public.usuario u ON u.correo = c.email
 ORDER BY estado DESC, c.nombre;


-- =====================================================================
-- SI PREFIERES NO CREAR 15 CUENTAS
-- =====================================================================
-- Puedes hacer lo contrario: darle a una persona que YA tiene cuenta la
-- ficha de conductor, poniendole el mismo correo. Ejemplo con la cuenta
-- de 'samuel muñoz' (munoz123@gmail.com), que hoy ya tiene rol Conductor:
--
--   UPDATE public.conductor
--      SET email = 'munoz123@gmail.com'
--    WHERE email = 'carlos.ramirez1@dviaje.com';
--
-- A partir de ahi, samuel entra al panel y ve los servicios que estaban
-- asignados a esa ficha.
--
-- Y para crear un conductor nuevo desde cero, el orden es:
--   1. Crear su ficha en la tabla "conductor" (desde el panel de
--      administrador -> Personas -> Conductores).
--   2. Crear su cuenta en la tabla "usuario" con EL MISMO correo y el
--      rol Conductor:
--
--   INSERT INTO public.usuario (nombre, apellido, correo, contrasena, id_rol)
--   VALUES ('Nombre', 'Apellido', 'correo@dviaje.com',
--           '$2b$12$K30Z7.UwC67DPA1dHMKiJ.gVVgT2fxnVmo5GfX/908TbnQhrl/5Bu',
--           (SELECT id_rol FROM public.roles WHERE nombre_rol = 'Conductor'));
-- =====================================================================
