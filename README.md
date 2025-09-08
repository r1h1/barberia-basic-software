# Barbería Software API

Sistema de gestión para barberías y salones de belleza.  
Incluye módulos de **usuarios, empleados, clientes, citas, servicios, pagos, roles, anuncios y seguridad**.

---

## 🚀 Arquitectura

- **Base de Datos:** SQL Server
- **Backend:** ASP.NET Core Web API
- **Documentación:** Swagger (`/swagger/index.html`)
- **Autenticación:** `AuthUsers` con `PasswordHash + Salt` y roles (`Roles`).

---

## 📂 Módulos principales

### 1. Roles
Tabla: `Roles`  
Gestiona los perfiles de acceso.

Endpoints:
- `GET /api/v1/Roles`
- `POST /api/v1/Roles`
- `PUT /api/v1/Roles`
- `GET /api/v1/Roles/{id}`
- `DELETE /api/v1/Roles/{id}`

---

### 2. Users (Usuarios del sistema)
Tabla: `Users`  
Representan usuarios administrativos (no necesariamente barberos).

Endpoints:
- `GET /api/v1/Users`
- `POST /api/v1/Users`
- `PUT /api/v1/Users`
- `GET /api/v1/Users/{id}`
- `DELETE /api/v1/Users/{id}`

> ⚠️ **Nota sobre Email/Phone:** son únicos pero aceptan `NULL`. SQL Server solo permite **un NULL por índice único**.  
Opciones:
- Exigir siempre Email/Phone.
- Usar índices únicos filtrados (`WHERE Email IS NOT NULL`).

---

### 3. Employees (Empleados)
Tabla: `Employees`  
Contiene barberos y personal de servicio.

Endpoints:
- `GET /api/v1/Employees`
- `POST /api/v1/Employees`
- `PUT /api/v1/Employees`
- `GET /api/v1/Employees/{id}`
- `DELETE /api/v1/Employees/{id}`

---

### 4. Schedules (Horarios)
Tabla: `Schedules`  
Define la disponibilidad de cada barbero.

Endpoints:
- `GET /api/v1/Schedules/by-employee/{employeeId}`
- `GET /api/v1/Schedules/by-day/{dayOfWeek}`
- `POST /api/v1/Schedules`
- `PUT /api/v1/Schedules`
- `GET /api/v1/Schedules/{id}`
- `DELETE /api/v1/Schedules/{id}`

> Validaciones:
- Sin solapes por empleado/día.
- `StartTime < EndTime`.

---

### 5. Services (Servicios)
Tabla: `Services`  
Catálogo de cortes, barba, tintes, etc.

Endpoints:
- `GET /api/v1/Services`
- `POST /api/v1/Services`
- `PUT /api/v1/Services`
- `GET /api/v1/Services/{id}`
- `DELETE /api/v1/Services/{id}`

---

### 6. Clients (Clientes)
Tabla: `Clients`  
Registra clientes y sus datos de contacto.

Endpoints:
- `GET /api/v1/Clients`
- `POST /api/v1/Clients`
- `PUT /api/v1/Clients`
- `GET /api/v1/Clients/{id}`
- `DELETE /api/v1/Clients/{id}`

---

### 7. Appointments (Citas)
Tablas: `Appointments`, `AppointmentServices`  
Gestión de citas y los servicios asociados.

Endpoints:
- `GET /api/v1/Appointments`
- `POST /api/v1/Appointments`
- `PUT /api/v1/Appointments`
- `GET /api/v1/Appointments/{id}`
- `DELETE /api/v1/Appointments/{id}`

Detalle de servicios de cita:
- `GET /api/v1/AppointmentServices/by-appointment/{appointmentId}`
- `POST /api/v1/AppointmentServices`
- `PUT /api/v1/AppointmentServices`
- `GET /api/v1/AppointmentServices/{id}`
- `DELETE /api/v1/AppointmentServices/{id}`

Estados soportados:  
`Pending → Confirmed → Completed` (o `Cancelled` en cualquier momento).

---

### 8. Payments (Pagos)
Tabla: `Payments`  
Registro de cobros por cita.

Endpoints:
- `GET /api/v1/Payments`
- `POST /api/v1/Payments`
- `PUT /api/v1/Payments`
- `GET /api/v1/Payments/{id}`
- `DELETE /api/v1/Payments/{id}`

Métodos de pago: `Cash | Transfer | Card | Other`.

---

### 9. Announcements (Anuncios)
Tabla: `Announcements`  
Publicaciones y comunicados internos.

Endpoints:
- `GET /api/v1/Announcements`
- `POST /api/v1/Announcements`
- `PUT /api/v1/Announcements`
- `GET /api/v1/Announcements/{id}`
- `DELETE /api/v1/Announcements/{id}`

---

## 🔄 Flujo típico

1. **Registrar cliente** → `/Clients`
2. **Consultar disponibilidad** → `/Schedules` y `/Appointments`
3. **Crear cita** → `/Appointments`
4. **Agregar servicios a la cita** → `/AppointmentServices`
5. **Confirmar cita** → `PUT /Appointments`
6. **Cobrar cita** → `/Payments`
7. **Marcar cita como completada** → `PUT /Appointments (Status=Completed)`

---

## ✅ Validaciones clave

- **Horarios**: no solapes por empleado/día.
- **Citas**: no solapes por empleado y dentro de horario válido.
- **Pagos**: monto total = suma de servicios.
- **Email/Phone únicos**: decide si exiges valor o aplicas índice único filtrado.
- **UTC**: todas las fechas/horas se almacenan en UTC (`SYSUTCDATETIME()`).

---

## 🔐 Seguridad

- **Credenciales**: `AuthUsers` con `PasswordHash` + `Salt`.
- **Roles**: asociación `AuthUsers.RoleId` → permisos definidos en `Roles`.
- **JWT (futuro)**: proteger endpoints con `[Authorize(Roles="...")]`.

---

## 📊 Ejemplo de operación end-to-end

1. Cliente se registra (`POST /Clients`).
2. Se consulta disponibilidad (`GET /Schedules/by-employee/3`).
3. Se crea cita (`POST /Appointments`).
4. Se agregan servicios (`POST /AppointmentServices`).
5. Se confirma cita (`PUT /Appointments` con `Status=Confirmed`).
6. Se registra pago (`POST /Payments`).
7. Cita pasa a `Completed`.

---

## 🛠️ Mejoras futuras

- Endpoint `GET /availability` para devolver **slots libres**.
- Transacciones en operaciones compuestas (cita + servicios + pago).