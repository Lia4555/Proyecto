-- =====================================================================
-- D' VIAJE - ORIGEN Y DESTINO ESCRITOS A MANO, RESERVAS SIN SERVICIO
-- Ejecutar en Supabase: proyecto -> SQL Editor -> New query -> Run
-- =====================================================================
--
-- QUE CAMBIA
--   1. Los servicios guardan el origen y el destino como TEXTO libre
--      (columnas nuevas servicios.origen y servicios.destino). Ya no
--      dependen de la tabla "destinos".
--   2. id_origen / id_destino dejan de ser obligatorios. NO se borran:
--      la app movil todavia los manda, y los servicios antiguos los
--      conservan. El servidor rellena el texto a partir de ellos.
--   3. reservas.id_servicio deja de ser obligatorio: una reserva ya no
--      tiene por que pertenecer a un servicio.
--
-- ES SEGURO EJECUTARLO MAS DE UNA VEZ (usa IF NOT EXISTS y no borra datos).
--
-- ANTES DE EJECUTARLO todo sigue funcionando como hasta ahora; lo unico
-- que no se puede es crear un servicio escribiendo el origen a mano.
-- El servidor detecta solo que ya se ejecuto (en menos de un minuto),
-- sin reiniciar.
-- =====================================================================

begin;

-- 1. Columnas de texto --------------------------------------------------
alter table servicios add column if not exists origen  text;
alter table servicios add column if not exists destino text;

-- Los servicios que ya existen reciben el nombre de su destino, para que
-- nadie vea el campo vacio: "Terminal Salitre (Bogota)".
update servicios s
   set origen = case when d.ciudad is not null and d.ciudad <> d.nombre_destino
                     then d.nombre_destino || ' (' || d.ciudad || ')'
                     else d.nombre_destino end
  from destinos d
 where d.id_destino = s.id_origen
   and s.origen is null;

update servicios s
   set destino = case when d.ciudad is not null and d.ciudad <> d.nombre_destino
                      then d.nombre_destino || ' (' || d.ciudad || ')'
                      else d.nombre_destino end
  from destinos d
 where d.id_destino = s.id_destino
   and s.destino is null;

-- 2. Los ids de destino pasan a ser opcionales ------------------------
alter table servicios alter column id_origen  drop not null;
alter table servicios alter column id_destino drop not null;

-- 3. Una reserva ya no exige servicio ----------------------------------
alter table reservas alter column id_servicio drop not null;

commit;

-- COMPROBACION (opcional): no deberia quedar ningun servicio sin texto.
-- select count(*) as sin_origen from servicios where origen is null or destino is null;
