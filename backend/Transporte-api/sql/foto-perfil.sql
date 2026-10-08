-- =====================================================================
-- D' VIAJE - FOTO DE PERFIL
-- Ejecutar en Supabase: proyecto -> SQL Editor -> New query -> Run
-- =====================================================================
--
-- Añade usuario.foto_perfil. Guarda la imagen ya recortada y reducida por
-- el panel (256 x 256 px) como data URL: "data:image/jpeg;base64,...".
-- No hace falta configurar Supabase Storage.
--
-- El limite de tamaño (200.000 caracteres, unos 150 KB) es una segunda
-- barrera: el backend ya rechaza imagenes mas grandes antes de guardar.
--
-- Se puede ejecutar mas de una vez sin romper nada.
-- =====================================================================

BEGIN;

ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS foto_perfil text;

ALTER TABLE public.usuario
  DROP CONSTRAINT IF EXISTS usuario_foto_perfil_valida;

ALTER TABLE public.usuario
  ADD CONSTRAINT usuario_foto_perfil_valida CHECK (
    foto_perfil IS NULL
    OR (
      foto_perfil ~ '^data:image/(jpeg|png|webp);base64,'
      AND length(foto_perfil) <= 200000
    )
  );

COMMIT;

-- Comprobacion: debe devolver una fila con foto_perfil / text
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'usuario' AND column_name = 'foto_perfil';
