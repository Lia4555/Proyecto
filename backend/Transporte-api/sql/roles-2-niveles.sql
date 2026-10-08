-- =====================================================================
-- D' VIAJE - DEJAR SOLO DOS ROLES
-- Ejecutar en Supabase: proyecto -> SQL Editor -> New query -> Run
-- =====================================================================
--
-- ESTADO FINAL AL QUE LLEGA ESTE SCRIPT
--
--   Administrador   nivel_permiso = 3   Acceso total a toda la informacion.
--   Conductor       nivel_permiso = 2   Solo ve los servicios que el
--                                       administrador le asigno, puede
--                                       cambiar el estado de esos servicios
--                                       y la informacion operativa del
--                                       vehiculo que conduce. Nada mas.
--
-- Cualquier otro rol (Cliente, duplicados, roles de prueba) desaparece.
--
-- IMPORTANTE - COMO SE VINCULA UN CONDUCTOR CON SU FICHA
-- El login usa la tabla "usuario" y los servicios usan la tabla "conductor".
-- El backend las une por CORREO: usuario.correo = conductor.email.
-- Los dos correos deben ser identicos (el PASO 5 avisa si alguno no cuadra).
--
-- Todo va dentro de una transaccion: si algo falla, no se aplica nada.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- PASO 1 - Asegurar que los dos roles existen
-- ---------------------------------------------------------------------
INSERT INTO public.roles (nombre_rol, descripcion, nivel_permiso)
SELECT 'Administrador', 'Acceso total: gestiona flota, servicios, clientes y usuarios.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE nombre_rol = 'Administrador');

INSERT INTO public.roles (nombre_rol, descripcion, nivel_permiso)
SELECT 'Conductor', 'Consulta sus servicios asignados, cambia su estado y reporta el vehiculo.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE nombre_rol = 'Conductor');


-- ---------------------------------------------------------------------
-- PASO 2 - Unificar los duplicados de cada rol
-- ---------------------------------------------------------------------
-- Si hay varios roles llamados "Administrador" (o "Conductor"), se conserva
-- el de id mas bajo y todos los usuarios se mueven a el.
--
-- Las variables llevan el prefijo "v_": la tabla conductor tiene una columna
-- llamada id_conductor, y con el mismo nombre Postgres no sabria cual es cual
-- (error 42702 "column reference is ambiguous").
DO $$
DECLARE
  v_rol_admin     integer;
  v_rol_conductor integer;
BEGIN
  SELECT min(id_rol) INTO v_rol_admin     FROM public.roles WHERE nombre_rol = 'Administrador';
  SELECT min(id_rol) INTO v_rol_conductor FROM public.roles WHERE nombre_rol = 'Conductor';

  UPDATE public.usuario SET id_rol = v_rol_admin
   WHERE id_rol IN (SELECT id_rol FROM public.roles WHERE nombre_rol = 'Administrador');
  UPDATE public.conductor SET id_rol = v_rol_admin
   WHERE id_rol IN (SELECT id_rol FROM public.roles WHERE nombre_rol = 'Administrador');

  UPDATE public.usuario SET id_rol = v_rol_conductor
   WHERE id_rol IN (SELECT id_rol FROM public.roles WHERE nombre_rol = 'Conductor');
  UPDATE public.conductor SET id_rol = v_rol_conductor
   WHERE id_rol IN (SELECT id_rol FROM public.roles WHERE nombre_rol = 'Conductor');

  -- Toda ficha de la tabla "conductor" es, por definicion, un conductor.
  UPDATE public.conductor SET id_rol = v_rol_conductor WHERE id_rol <> v_rol_admin;
END $$;


-- ---------------------------------------------------------------------
-- PASO 3 - Fijar los niveles de permiso
-- ---------------------------------------------------------------------
-- El backend concede acceso total a partir de nivel_permiso >= 3.
UPDATE public.roles
   SET nivel_permiso = 3,
       descripcion   = 'Acceso total: gestiona flota, servicios, clientes y usuarios.'
 WHERE nombre_rol = 'Administrador';

UPDATE public.roles
   SET nivel_permiso = 2,
       descripcion   = 'Consulta sus servicios asignados, cambia su estado y reporta el vehiculo.'
 WHERE nombre_rol = 'Conductor';


-- ---------------------------------------------------------------------
-- PASO 4 - Borrar las cuentas que NO son admin ni conductor
-- ---------------------------------------------------------------------
-- Decision tomada: en el sistema NO hay usuarios Cliente. Sus cuentas de
-- acceso (tabla "usuario") se borran, igual que las de cualquier rol de
-- prueba. La tabla "cliente" (los pasajeros a los que se hacen reservas)
-- NO se toca: esos datos los sigue gestionando el administrador.
--
-- Para ver ANTES de ejecutar a quienes afecta:
--
--   SELECT u.correo, r.nombre_rol
--     FROM public.usuario u JOIN public.roles r USING (id_rol)
--    WHERE r.nombre_rol NOT IN ('Administrador', 'Conductor');
--
-- Si otra tabla todavia apunta a alguna de estas cuentas, el DELETE falla,
-- la transaccion se cancela y no se borra nada.
DELETE FROM public.usuario
 WHERE id_rol IN (SELECT id_rol FROM public.roles
                   WHERE nombre_rol NOT IN ('Administrador', 'Conductor'));


-- ---------------------------------------------------------------------
-- PASO 5 - Comprobaciones antes de borrar nada
-- ---------------------------------------------------------------------
-- Si la comprobacion falla, la transaccion se cancela y la base queda intacta.
DO $$
DECLARE
  pendientes integer;
  sin_ficha  integer;
BEGIN
  -- 5.1 Nadie puede quedar apuntando a un rol que vamos a borrar.
  SELECT count(*) INTO pendientes
    FROM public.usuario u
    JOIN public.roles r ON r.id_rol = u.id_rol
   WHERE r.nombre_rol NOT IN ('Administrador', 'Conductor');

  IF pendientes > 0 THEN
    RAISE EXCEPTION
      'Siguen quedando % usuario(s) con un rol distinto de Administrador/Conductor despues del PASO 4.', pendientes;
  END IF;

  -- 5.2 Aviso (no bloquea): conductores que no podran iniciar sesion porque
  --     su correo de usuario no coincide con ninguna ficha de conductor.
  SELECT count(*) INTO sin_ficha
    FROM public.usuario u
    JOIN public.roles r ON r.id_rol = u.id_rol
   WHERE r.nombre_rol = 'Conductor'
     AND NOT EXISTS (SELECT 1 FROM public.conductor c WHERE c.email = u.correo);

  IF sin_ficha > 0 THEN
    RAISE WARNING
      '% cuenta(s) de conductor no tienen ficha en la tabla "conductor" con el mismo correo: no podran iniciar sesion hasta que se la crees.', sin_ficha;
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- PASO 6 - Borrar todos los roles sobrantes
-- ---------------------------------------------------------------------
DELETE FROM public.roles
 WHERE nombre_rol NOT IN ('Administrador', 'Conductor')
    OR id_rol NOT IN (
         SELECT min(id_rol)
           FROM public.roles
          WHERE nombre_rol IN ('Administrador', 'Conductor')
          GROUP BY nombre_rol
       );


-- ---------------------------------------------------------------------
-- PASO 7 - Impedir que vuelvan a duplicarse
-- ---------------------------------------------------------------------
ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_nombre_rol_unico;
ALTER TABLE public.roles ADD  CONSTRAINT roles_nombre_rol_unico UNIQUE (nombre_rol);

COMMIT;


-- ---------------------------------------------------------------------
-- COMPROBACION FINAL
-- ---------------------------------------------------------------------
-- Debe devolver exactamente 2 filas: Administrador (3) y Conductor (2).
SELECT id_rol, nombre_rol, nivel_permiso
  FROM public.roles
 ORDER BY nivel_permiso DESC;

-- Cuantos usuarios quedaron en cada rol:
SELECT r.nombre_rol, count(*) AS usuarios
  FROM public.usuario u JOIN public.roles r USING (id_rol)
 GROUP BY r.nombre_rol
 ORDER BY r.nombre_rol;

-- Conductores listos para entrar (cuenta + ficha con el mismo correo):
SELECT u.correo,
       CASE WHEN c.id_conductor IS NULL
            THEN 'FALTA su ficha en la tabla conductor'
            ELSE 'OK' END AS estado
  FROM public.usuario u
  JOIN public.roles r ON r.id_rol = u.id_rol
  LEFT JOIN public.conductor c ON c.email = u.correo
 WHERE r.nombre_rol = 'Conductor'
 ORDER BY estado, u.correo;
