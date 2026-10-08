

-- =========================================================================
-- BLOQUE 1: GESTIÓN Y RENDIMIENTO DE CONDUCTORES Y ROLES (Consultas 1 - 5)
-- =========================================================================

-- 1. Listar todos los conductores activos con su respectivo rol de sistema
SELECT 
    c."id_conductor", CONCAT(c."nombre", ' ', c."apellido") AS nombre_completo,
    c."email", COALESCE(c."telefono", 'No registrado') AS telefono,
    r."nombre" AS rol, c."fecha_registro"
FROM "Conductor" c
JOIN "Roles" r ON c."id_rol" = r."id_rol"
WHERE c."activo" = TRUE
ORDER BY c."fecha_registro" DESC;

-- 2. Conteo de conductores agrupados por su rol asignado
SELECT 
    r."nombre" AS rol, COUNT(c."id_conductor") AS total_conductores
FROM "Roles" r
LEFT JOIN "Conductor" c ON r."id_rol" = c."id_rol"
GROUP BY r."nombre"
ORDER BY total_conductores DESC;

-- 3. Historial detallado de asignación de vehículos a conductores (últimos movimientos)
SELECT 
    h."id_historial", CONCAT(c."nombre", ' ', c."apellido") AS conductor,
    v."placa" AS vehiculo_asignado, h."fecha_asignacion",
    COALESCE(h."observaciones", 'Sin observaciones') AS observaciones
FROM "HistorialConductores" h
JOIN "Conductor" c ON h."id_conductor" = c."id_conductor"
JOIN "Vehiculos" v ON h."id_vehiculo" = v."id_vehiculo"
ORDER BY h."fecha_asignacion" DESC;

-- 4. Conductores que actualmente tienen un vehículo asignado en el historial reciente
SELECT DISTINCT 
    CONCAT(c."nombre", ' ', c."apellido") AS conductor, c."email"
FROM "Conductor" c
JOIN "HistorialConductores" h ON c."id_conductor" = h."id_conductor"
WHERE c."activo" = TRUE;

-- 5. Listar conductores inactivos o suspendidos del sistema
SELECT 
    CONCAT(c."nombre", ' ', c."apellido") AS conductor_inactivo, c."email", c."telefono"
FROM "Conductor" c
WHERE c."activo" = FALSE;


-- =========================================================================
-- BLOQUE 2: FLOTA, VEHÍCULOS Y DOCUMENTACIÓN (Consultas 6 - 10)
-- =========================================================================

-- 6. Flota completa de vehículos activos ordenada por capacidad de pasajeros
SELECT 
    v."id_vehiculo", v."placa", v."marca", v."modelo", v."año",
    tv."nombre" AS tipo_vehiculo, tv."capacidad_pasajeros"
FROM "Vehiculos" v
JOIN "TiposVehiculo" tv ON v."id_tipo_vehiculo" = tv."id_tipo_vehiculo"
WHERE v."activo" = TRUE
ORDER BY tv."capacidad_pasajeros" DESC;

-- 7. Control de documentos de vehículos próximos a vencer o vencidos
SELECT 
    v."placa", v."marca", td."nombre" AS tipo_documento,
    dv."numero_documento", dv."fecha_vencimiento",
    CASE 
        WHEN dv."fecha_vencimiento" < CURRENT_DATE THEN 'Vencido'
        ELSE 'Vigente'
    END AS estado_vigencia
FROM "DocumentosVehiculo" dv
JOIN "Vehiculos" v ON dv."id_vehiculo" = v."id_vehiculo"
JOIN "TiposDocumentos" td ON dv."id_tipo_documento" = td."id_tipo_documento"
ORDER BY dv."fecha_vencimiento" ASC;

-- 8. Resumen de costos de mantenimiento acumulados por cada vehículo
SELECT 
    v."id_vehiculo", v."placa", v."marca", v."modelo",
    COUNT(m."id_mantenimiento") AS total_mantenimientos,
    COALESCE(SUM(m."costo"), 0.00) AS costo_total_mantenimiento
FROM "Vehiculos" v
LEFT JOIN "Mantenimientos" m ON v."id_vehiculo" = m."id_vehiculo"
GROUP BY v."id_vehiculo", v."placa", v."marca", v."modelo"
ORDER BY costo_total_mantenimiento DESC;

-- 9. Listado detallado de mantenimientos correctivos y preventivos recientes
SELECT 
    m."id_mantenimiento", v."placa", tm."nombre" AS tipo_mantenimiento,
    m."descripcion", m."costo", m."fecha_mantenimiento"
FROM "Mantenimientos" m
JOIN "Vehiculos" v ON m."id_vehiculo" = v."id_vehiculo"
JOIN "TiposMantenimiento" tm ON m."id_tipo_mantenimiento" = tm."id_tipo_mantenimiento"
ORDER BY m."fecha_mantenimiento" DESC;

-- 10. Vehículos que nunca han registrado un mantenimiento en el sistema
SELECT 
    v."id_vehiculo", v."placa", v."marca", v."modelo"
FROM "Vehiculos" v
LEFT JOIN "Mantenimientos" m ON v."id_vehiculo" = v."id_vehiculo"
WHERE m."id_mantenimiento" IS NULL;


-- =========================================================================
-- BLOQUE 3: SERVICIOS, RUTAS Y DISPONIBILIDAD (Consultas 11 - 15)
-- =========================================================================

-- 11. Buscar servicios de viaje activos con cupos disponibles y fecha futura
SELECT 
    s."id_servicio", d_origen."ciudad" AS origen, d_destino."ciudad" AS destino,
    s."fecha_salida", cl."nombre" AS clase_viaje, s."precio_asiento", 
    s."cupos_disponibles", es."nombre" AS estado
FROM "Servicios" s
JOIN "Destinos" d_origen ON s."id_destino_origen" = d_origen."id_destino"
JOIN "Destinos" d_destino ON s."id_destino_final" = d_destino."id_destino"
JOIN "ClasesViaje" cl ON s."id_clase" = cl."id_clase"
JOIN "EstadosServicio" es ON s."id_estado" = es."id_estado"
WHERE s."cupos_disponibles" > 0 AND s."fecha_salida" >= CURRENT_TIMESTAMP
ORDER BY s."fecha_salida" ASC;

-- 12. Porcentaje de ocupación actual de los vehículos asignados a los servicios
SELECT 
    s."id_servicio", d_origen."ciudad" || ' -> ' || d_destino."ciudad" AS ruta,
    v."placa" AS vehiculo, tv."capacidad_pasajeros" AS capacidad_total,
    s."cupos_disponibles", (tv."capacidad_pasajeros" - s."cupos_disponibles") AS asientos_ocupados,
    ROUND(((tv."capacidad_pasajeros" - s."cupos_disponibles")::DECIMAL / tv."capacidad_pasajeros") * 100, 2) AS porcentaje_ocupacion
FROM "Servicios" s
JOIN "Vehiculos" v ON s."id_vehiculo" = v."id_vehiculo"
JOIN "TiposVehiculo" tv ON v."id_tipo_vehiculo" = tv."id_tipo_vehiculo"
JOIN "Destinos" d_origen ON s."id_destino_origen" = d_origen."id_destino"
JOIN "Destinos" d_destino ON s."id_destino_final" = d_destino."id_destino";

-- 13. Cantidad de servicios programados agrupados por su estado actual
SELECT 
    es."nombre" AS estado_servicio, COUNT(s."id_servicio") AS total_servicios
FROM "EstadosServicio" es
LEFT JOIN "Servicios" s ON es."id_estado" = s."id_estado"
GROUP BY es."nombre"
ORDER BY total_servicios DESC;

-- 14. Rutas más frecuentes (origen - destino) basadas en los servicios creados
SELECT 
    d_origen."ciudad" AS origen, d_destino."ciudad" AS destino,
    COUNT(s."id_servicio") AS total_viajes_programados
FROM "Servicios" s
JOIN "Destinos" d_origen ON s."id_destino_origen" = d_origen."id_destino"
JOIN "Destinos" d_destino ON s."id_destino_final" = d_destino."id_destino"
GROUP BY d_origen."ciudad", d_destino."ciudad"
ORDER BY total_viajes_programados DESC;

-- 15. Servicios que se realizan bajo una clase de viaje específica (ej. Ejecutiva / VIP)
SELECT 
    s."id_servicio", d_origen."ciudad" AS origen, d_destino."ciudad" AS destino,
    s."fecha_salida", s."precio_asiento", cl."nombre" AS clase_viaje
FROM "Servicios" s
JOIN "ClasesViaje" cl ON s."id_clase" = cl."id_clase"
JOIN "Destinos" d_origen ON s."id_destino_origen" = d_origen."id_destino"
JOIN "Destinos" d_destino ON s."id_destino_final" = d_destino."id_destino"
WHERE cl."nombre" ILIKE '%Ejecutiva%';


-- =========================================================================
-- BLOQUE 4: CLIENTES, RESERVAS Y TRANSACCIONES (Consultas 16 - 20)
-- =========================================================================

-- 16. Historial completo de reservas realizadas con datos del cliente y destino
SELECT 
    r."id_reserva", CONCAT(cl."nombre", ' ', cl."apellido") AS cliente,
    cl."email", d_origen."ciudad" AS origen, d_destino."ciudad" AS destino,
    s."fecha_salida", r."asientos_reservados", r."total_pago", r."fecha_reserva"
FROM "Reservas" r
JOIN "Cliente" cl ON r."id_cliente" = cl."id_cliente"
JOIN "Servicios" s ON r."id_servicio" = s."id_servicio"
JOIN "Destinos" d_origen ON s."id_destino_origen" = d_origen."id_destino"
JOIN "Destinos" d_destino ON s."id_destino_final" = d_destino."id_destino"
ORDER BY r."fecha_reserva" DESC;

-- 17. Ranking de clientes con mayor gasto acumulado en el sistema (Top Pasajeros)
SELECT 
    cl."id_cliente", CONCAT(cl."nombre", ' ', cl."apellido") AS cliente,
    cl."email", COUNT(r."id_reserva") AS total_reservas,
    SUM(r."asientos_reservados") AS total_asientos,
    SUM(r."total_pago") AS dinero_total_gastado
FROM "Cliente" cl
JOIN "Reservas" r ON cl."id_cliente" = r."id_cliente"
GROUP BY cl."id_cliente", cl."nombre", cl."apellido", cl."email"
ORDER BY dinero_total_gastado DESC;

-- 18. Ingresos totales generados por cada servicio/viaje ofrecido
SELECT 
    s."id_servicio", d_origen."ciudad" || ' -> ' || d_destino."ciudad" AS ruta,
    s."fecha_salida", SUM(r."asientos_reservados") AS total_asientos_vendidos,
    COALESCE(SUM(r."total_pago"), 0.00) AS ingreso_total_recaudado
FROM "Servicios" s
LEFT JOIN "Reservas" r ON s."id_servicio" = r."id_servicio"
JOIN "Destinos" d_origen ON s."id_destino_origen" = d_origen."id_destino"
JOIN "Destinos" d_destino ON s."id_destino_final" = d_destino."id_destino"
GROUP BY s."id_servicio", d_origen."ciudad", d_destino."ciudad", s."fecha_salida"
ORDER BY ingreso_total_recaudado DESC;

-- 19. Clientes que se registraron pero que aún no han hecho ninguna reserva
SELECT 
    cl."id_cliente", CONCAT(cl."nombre", ' ', cl."apellido") AS cliente, cl."email", cl."telefono"
FROM "Cliente" cl
LEFT JOIN "Reservas" r ON cl."id_cliente" = r."id_cliente"
WHERE r."id_reserva" IS NULL;

-- 20. Total de ingresos globales de la plataforma de transporte
SELECT 
    COUNT(r."id_reserva") AS cantidad_total_reservas,
    COALESCE(SUM(r."asientos_reservados"), 0) AS total_asientos_vendidos_historico,
    COALESCE(SUM(r."total_pago"), 0.00) AS ingresos_totales_globales
FROM "Reservas" r;


-- =========================================================================
-- BLOQUE 5: SEGURIDAD, ALERTAS Y MONITOREO (Consultas 21 - 25)
-- =========================================================================

-- 21. Monitoreo de alertas de gravedad alta o crítica en los servicios
SELECT 
    a."id_alerta", ta."nombre" AS tipo_alerta, ta."gravedad",
    a."descripcion" AS detalle, s."id_servicio",
    d_origen."ciudad" AS origen, d_destino."ciudad" AS destino, a."fecha_alerta"
FROM "Alertas" a
JOIN "TiposAlerta" ta ON a."id_tipo_alerta" = ta."id_tipo_alerta"
JOIN "Servicios" s ON a."id_servicio" = s."id_servicio"
LEFT JOIN "Destinos" d_origen ON s."id_destino_origen" = d_origen."id_destino"
LEFT JOIN "Destinos" d_destino ON s."id_destino_final" = d_destino."id_destino"
WHERE ta."gravedad" IN ('Alta', 'Crítica')
ORDER BY a."fecha_alerta" DESC;

-- 22. Conteo de alertas registradas agrupadas por el nivel de gravedad
SELECT 
    ta."gravedad", COUNT(a."id_alerta") AS total_alertas
FROM "TiposAlerta" ta
LEFT JOIN "Alertas" a ON ta."id_tipo_alerta" = a."id_tipo_alerta"
GROUP BY ta."gravedad"
ORDER BY total_alertas DESC;

-- 23. Listado de todos los tipos de alertas configurados en el sistema
SELECT 
    "id_tipo_alerta", "nombre", "gravedad", "descripcion"
FROM "TiposAlerta"
ORDER BY "gravedad" ASC;

-- 24. Auditoría general de servicios que tuvieron alertas asociadas
SELECT DISTINCT 
    s."id_servicio", d_origen."ciudad" AS origen, d_destino."ciudad" AS destino, s."fecha_salida"
FROM "Servicios" s
JOIN "Alertas" a ON s."id_servicio" = a."id_servicio"
JOIN "Destinos" d_origen ON s."id_destino_origen" = d_origen."id_destino"
JOIN "Destinos" d_destino ON s."id_destino_final" = d_destino."id_destino";

-- 25. Reporte consolidado de destinos más concurridos como puntos de llegada
SELECT 
    d."ciudad", d."departamento", COUNT(s."id_servicio") AS total_llegadas_programadas
FROM "Destinos" d
LEFT JOIN "Servicios" s ON d."id_destino" = s."id_destino_final"
GROUP BY d."id_destino", d."ciudad", d."departamento"
ORDER BY total_llegadas_programadas DESC;