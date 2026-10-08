

-- 1. Obtener datos relacionados (origen y destino) usando subconsultas en el SELECT
SELECT 
    s."id_servicio",
    s."fecha_salida",
    s."precio_asiento",
    (SELECT d."ciudad" FROM "Destinos" d WHERE d."id_destino" = s."id_destino_origen") AS ciudad_origen,
    (SELECT d."ciudad" FROM "Destinos" d WHERE d."id_destino" = s."id_destino_final") AS ciudad_destino
FROM "Servicios" s;


-- 2. Conteo de reservas por cliente mediante subconsulta escalar correlacionada
SELECT 
    cl."id_cliente",
    cl."nombre",
    cl."apellido",
    cl."email",
    (SELECT COUNT(*) FROM "Reservas" r WHERE r."id_cliente" = cl."id_cliente") AS total_reservas
FROM "Cliente" cl;


-- 3. Conteo de mantenimientos por vehículo con subconsulta escalar
SELECT 
    v."id_vehiculo",
    v."placa",
    v."marca",
    (SELECT COUNT(*) FROM "Mantenimientos" m WHERE m."id_vehiculo" = v."id_vehiculo") AS total_mantenimientos
FROM "Vehiculos" v;


-- 4. Conductores que tienen al menos una asignación histórica usando EXISTS
SELECT 
    c."id_conductor",
    c."nombre",
    c."apellido",
    c."email"
FROM "Conductor" c
WHERE EXISTS (
    SELECT 1 
    FROM "HistorialConductores" h 
    WHERE h."id_conductor" = c."id_conductor"
);


-- 5. Vehículos que NUNCA han recibido mantenimiento usando NOT EXISTS
SELECT 
    v."id_vehiculo",
    v."placa",
    v."marca",
    v."modelo"
FROM "Vehiculos" v
WHERE NOT EXISTS (
    SELECT 1 
    FROM "Mantenimientos" m 
    WHERE m."id_vehiculo" = v."id_vehiculo"
);


-- 6. Reservas cuyo costo es superior al promedio general de pagos
SELECT 
    r."id_reserva",
    r."id_cliente",
    r."asientos_reservados",
    r."total_pago"
FROM "Reservas" r
WHERE r."total_pago" > (
    SELECT AVG("total_pago") 
    FROM "Reservas"
);


-- 7. Servicios de viaje con el precio de asiento más alto registrado
SELECT 
    s."id_servicio",
    s."fecha_salida",
    s."precio_asiento"
FROM "Servicios" s
WHERE s."precio_asiento" = (
    SELECT MAX("precio_asiento") 
    FROM "Servicios"
);


-- 8. Clientes que han realizado al menos una reserva usando IN
SELECT 
    cl."id_cliente",
    cl."nombre",
    cl."apellido",
    cl."email"
FROM "Cliente" cl
WHERE cl."id_cliente" IN (
    SELECT r."id_cliente" 
    FROM "Reservas" r
    WHERE r."id_cliente" IS NOT NULL
);


-- 9. Clientes que NO han realizado ninguna reserva usando NOT IN
SELECT 
    cl."id_cliente",
    cl."nombre",
    cl."apellido",
    cl."email"
FROM "Cliente" cl
WHERE cl."id_cliente" NOT IN (
    SELECT r."id_cliente" 
    FROM "Reservas" r
    WHERE r."id_cliente" IS NOT NULL
);


-- 10. Vehículos pertenecientes al tipo con mayor capacidad de pasajeros (subconsultas anidadas)
SELECT 
    v."id_vehiculo",
    v."placa",
    v."marca"
FROM "Vehiculos" v
WHERE v."id_tipo_vehiculo" IN (
    SELECT tv."id_tipo_vehiculo"
    FROM "TiposVehiculo" tv
    WHERE tv."capacidad_pasajeros" = (
        SELECT MAX("capacidad_pasajeros") 
        FROM "TiposVehiculo"
    )
);

-- 11. Servicios cuyo precio por asiento es mayor al promedio general de todos los servicios
SELECT 
    "id_servicio",
    "fecha_salida",
    "precio_asiento"
FROM "Servicios"
WHERE "precio_asiento" > (
    SELECT AVG("precio_asiento") 
    FROM "Servicios"
);


-- 12. Vehículos cuyo año de fabricación es superior al promedio de la flota
SELECT 
    "id_vehiculo",
    "placa",
    "marca",
    "año"
FROM "Vehiculos"
WHERE "año" > (
    SELECT AVG("año") 
    FROM "Vehiculos"
);


-- 13. Clientes que han realizado más de una reserva (usando IN con GROUP BY y HAVING)
SELECT 
    "id_cliente",
    "nombre",
    "apellido",
    "email"
FROM "Cliente"
WHERE "id_cliente" IN (
    SELECT "id_cliente" 
    FROM "Reservas" 
    GROUP BY "id_cliente" 
    HAVING COUNT(*) > 1
);


-- 14. Servicios de viaje que tienen al menos una reserva registrada (EXISTS)
SELECT 
    "id_servicio",
    "fecha_salida",
    "precio_asiento",
    "cupos_disponibles"
FROM "Servicios" s
WHERE EXISTS (
    SELECT 1 
    FROM "Reservas" r 
    WHERE r."id_servicio" = s."id_servicio"
);


-- 15. Servicios de viaje que NO tienen ninguna reserva registrada (NOT EXISTS)
SELECT 
    "id_servicio",
    "fecha_salida",
    "precio_asiento",
    "cupos_disponibles"
FROM "Servicios" s
WHERE NOT EXISTS (
    SELECT 1 
    FROM "Reservas" r 
    WHERE r."id_servicio" = s."id_servicio"
);


-- 16. Listado de vehículos mostrando el nombre de su tipo mediante subconsulta en el SELECT
SELECT 
    "id_vehiculo",
    "placa",
    "marca",
    "modelo",
    (
        SELECT tv."nombre" 
        FROM "TiposVehiculo" tv 
        WHERE tv."id_tipo_vehiculo" = "Vehiculos"."id_tipo_vehiculo"
    ) AS nombre_tipo_vehiculo
FROM "Vehiculos";


-- 17. Listado de conductores mostrando el nombre de su rol mediante subconsulta en el SELECT
SELECT 
    "id_conductor",
    "nombre",
    "apellido",
    "email",
    (
        SELECT r."nombre" 
        FROM "Roles" r 
        WHERE r."id_rol" = "Conductor"."id_rol"
    ) AS nombre_rol
FROM "Conductor";


-- 18. Destinos que NUNCA han sido seleccionados como punto final de llegada (NOT IN)
SELECT 
    "id_destino",
    "ciudad",
    "departamento"
FROM "Destinos"
WHERE "id_destino" NOT IN (
    SELECT "id_destino_final" 
    FROM "Servicios" 
    WHERE "id_destino_final" IS NOT NULL
);


-- 19. Mantenimientos cuyo costo supera el costo promedio de todas las intervenciones
SELECT 
    "id_mantenimiento",
    "id_vehiculo",
    "costo",
    "fecha_mantenimiento"
FROM "Mantenimientos"
WHERE "costo" > (
    SELECT AVG("costo") 
    FROM "Mantenimientos"
);


-- 20. Alertas registradas únicamente en servicios que superan el precio promedio de pasajes
SELECT 
    "id_alerta",
    "id_servicio",
    "descripcion",
    "fecha_alerta"
FROM "Alertas"
WHERE "id_servicio" IN (
    SELECT "id_servicio" 
    FROM "Servicios" 
    WHERE "precio_asiento" > (
        SELECT AVG("precio_asiento") 
        FROM "Servicios"
    )
);