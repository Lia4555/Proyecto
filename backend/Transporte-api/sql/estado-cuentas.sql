-- =====================================================================
-- D' VIAJE - DISTINGUIR CUENTAS PENDIENTES DE CUENTAS DESACTIVADAS
-- Ejecutar en Supabase: proyecto -> SQL Editor -> New query -> Run
-- =====================================================================
--
-- PROBLEMA
-- La tabla usuario solo tenia "activo" (si/no). Una solicitud que nadie ha
-- revisado y una cuenta que el administrador desactivo se veian iguales:
-- las dos salian como "Pendiente", con los botones Aprobar y Rechazar.
--
-- SOLUCION
-- Nueva columna aprobada_en (fecha de la primera aprobacion):
--   activo = true                         -> Activa
--   activo = false y aprobada_en con fecha -> Desactivada (se puede reactivar)
--   activo = false y aprobada_en vacia     -> Pendiente (solicitud sin revisar)
--
-- Se puede ejecutar mas de una vez sin romper nada.
-- =====================================================================

BEGIN;

ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS aprobada_en timestamptz;

-- Las cuentas que ya existian quedan como aprobadas:
--   * las activas, porque ya estaban en uso;
--   * todas las de Administrador, porque nunca vienen del registro publico
--     (solo se crean con "npm run crear-admin"), aunque esten desactivadas.
UPDATE public.usuario u
   SET aprobada_en = COALESCE(u.fecha_registro, now())
 WHERE u.aprobada_en IS NULL
   AND (
         u.activo = true
      OR u.id_rol IN (SELECT id_rol FROM public.roles WHERE nombre_rol = 'Administrador')
   );

COMMIT;

-- ---------------------------------------------------------------------
-- COMPROBACION: cuantas cuentas quedan en cada estado
-- ---------------------------------------------------------------------
SELECT CASE
         WHEN activo THEN 'Activa'
         WHEN aprobada_en IS NOT NULL THEN 'Desactivada'
         ELSE 'Pendiente'
       END AS estado,
       count(*) AS cuentas
  FROM public.usuario
 GROUP BY 1
 ORDER BY 1;
