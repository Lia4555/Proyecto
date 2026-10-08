This workspace contains the REST API for a transportation management platform (TransporteAPI). It covers the full lifecycle of a transport service, organized into 17 collections that map to the core entities of the system:

- **Users & Roles:** USUARIO, ROLES — manage user accounts and access permissions.
- **Clients & Drivers:** CLIENTE, CONDUCTORES, HISTORIAL_CONDUCTOR — handle client profiles, driver records, and driver history.
- **Fleet Management:** VEHÍCULO, TIPOS_VEHÍCULOS, DOCUMENTOS_VEHICULOS, MANTENIMIENTO — register and maintain vehicles, their types, associated documents, and maintenance records.
- **Trip Operations:** SERVICIOS, RESERVAS, CLASE_VIAJE, ESTADOS_SERVICIO, DESTINO — manage transport services, bookings, travel classes, service statuses, and destinations.
- **Monitoring & Alerts:** ALERTAS, TIPO_DE_ALERTA — track operational alerts and their categories.

All collections target a local development server (`http://localhost:3000/api`) and follow standard CRUD operations (GET, POST, PUT, DELETE). The workspace uses the **TransporteAPI** environment for variable management.