-- =====================================================================
-- !!! OBSOLETO - NO EJECUTAR !!!
-- Este script mantenia un tercer rol "Cliente". El sistema ya no tiene
-- usuarios Cliente: usa sql/roles-2-niveles.sql en su lugar.
-- =====================================================================
-- CORRECCION DE LOS NIVELES DE PERMISO
-- Ejecutar en Supabase: panel del proyecto -> SQL Editor -> New query
-- =====================================================================
--
-- CONTEXTO
-- La API concede escritura (POST/PUT/DELETE) a partir de nivel_permiso >= 3.
-- En la base de datos habia roles duplicados con niveles contradictorios:
--
--   id_rol 6  Administrador  nivel 3   correcto
--   id_rol 7  Conductor      nivel 2   correcto
--   id_rol 8  Cliente        nivel 2   deberia ser 1
--   id_rol 9  Administrador  nivel 5   duplicado
--   id_rol 10 Conductor      nivel 3   PROBLEMA: escribia como administrador
--   id_rol 11 Cliente        nivel 1   duplicado
--
-- Escala correcta:  Administrador = 3   Conductor = 2   Cliente = 1


-- ---------------------------------------------------------------------
-- PASO 1 (URGENTE) - Cerrar el agujero de permisos
-- ---------------------------------------------------------------------
-- No cambia a que rol pertenece cada usuario: solo corrige el nivel de
-- cada rol. Es la parte imprescindible.

UPDATE public.roles SET nivel_permiso = 3 WHERE nombre_rol = 'Administrador';
UPDATE public.roles SET nivel_permiso = 2 WHERE nombre_rol = 'Conductor';
UPDATE public.roles SET nivel_permiso = 1 WHERE nombre_rol = 'Cliente';

-- Comprobacion: los 6 roles deben quedar en 3 / 2 / 1 segun su nombre.
SELECT id_rol, nombre_rol, nivel_permiso FROM public.roles ORDER BY id_rol;


-- ---------------------------------------------------------------------
-- PASO 2 (OPCIONAL) - Eliminar los roles duplicados
-- ---------------------------------------------------------------------
-- Deja un unico rol de cada tipo (se conservan los ids 6, 7 y 8) y mueve
-- a los usuarios que apuntaban a los duplicados. Revisa el resultado del
-- SELECT de abajo ANTES de ejecutar los DELETE.

BEGIN;

-- 2.1 Reasignar usuarios: 9 -> 6 (Admin), 10 -> 7 (Conductor), 11 -> 8 (Cliente)
UPDATE public.usuario SET id_rol = 6 WHERE id_rol = 9;
UPDATE public.usuario SET id_rol = 7 WHERE id_rol = 10;
UPDATE public.usuario SET id_rol = 8 WHERE id_rol = 11;

-- 2.2 La tabla conductor tambien referencia roles: se reasigna igual.
UPDATE public.conductor SET id_rol = 6 WHERE id_rol = 9;
UPDATE public.conductor SET id_rol = 7 WHERE id_rol = 10;
UPDATE public.conductor SET id_rol = 8 WHERE id_rol = 11;

-- 2.3 Verificar que ya nadie apunta a 9, 10 u 11. Debe devolver 0 filas.
SELECT 'usuario' AS tabla, id_rol, COUNT(*) FROM public.usuario
  WHERE id_rol IN (9, 10, 11) GROUP BY id_rol
UNION ALL
SELECT 'conductor', id_rol, COUNT(*) FROM public.conductor
  WHERE id_rol IN (9, 10, 11) GROUP BY id_rol;

-- 2.4 Si el SELECT anterior devolvio 0 filas, borrar los duplicados:
DELETE FROM public.roles WHERE id_rol IN (9, 10, 11);

-- Si algo no cuadra, ejecuta ROLLBACK; en lugar de COMMIT;
COMMIT;


-- ---------------------------------------------------------------------
-- PASO 3 - Evitar que vuelvan a duplicarse
-- ---------------------------------------------------------------------
-- Ejecutar solo despues del PASO 2 (con nombres repetidos, falla).

ALTER TABLE public.roles ADD CONSTRAINT roles_nombre_rol_unico UNIQUE (nombre_rol);
