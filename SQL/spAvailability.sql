-- EMPLEADOS DISPONIBLES
CREATE OR ALTER PROCEDURE dbo.GetAvailableEmployees
@Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.EmployeeId,
        e.Name,
        e.Specialty,
        -- Calcular horarios disponibles
        dbo.GetAvailableSlots(e.EmployeeId, @Date) AS AvailableSlots
    FROM dbo.Employees e
    WHERE e.IsActive = 1
      AND EXISTS (
        SELECT 1 FROM dbo.Schedules s
        WHERE s.EmployeeId = e.EmployeeId
          AND s.DayOfWeek = DATEPART(WEEKDAY, @Date)
          AND s.IsActive = 1
    )
    ORDER BY e.Name;
END
GO


-- SLOTS DE CITAS DISPONIBLES
CREATE OR ALTER PROCEDURE dbo.GetAvailableEmployees
@Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.EmployeeId,
        e.Name,
        e.Specialty,
        -- Calcular horarios disponibles
        dbo.GetAvailableSlots(e.EmployeeId, @Date) AS AvailableSlots
    FROM dbo.Employees e
    WHERE e.IsActive = 1
      AND EXISTS (
        SELECT 1 FROM dbo.Schedules s
        WHERE s.EmployeeId = e.EmployeeId
          AND s.DayOfWeek = DATEPART(WEEKDAY, @Date)
          AND s.IsActive = 1
    )
    ORDER BY e.Name;
END
GO


-- VERIFICAR DISPONIBILIDAD
CREATE OR ALTER PROCEDURE dbo.CheckEmployeeAvailability
    @EmployeeId INT,
    @Date DATE,
    @StartTime TIME(0)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EndTime TIME = DATEADD(MINUTE, 30, @StartTime); -- Duración fija de 30 minutos
    DECLARE @DayOfWeek TINYINT = DATEPART(WEEKDAY, @Date);

    -- Verificar si el empleado trabaja ese día
    IF NOT EXISTS (
        SELECT 1 FROM dbo.Schedules
        WHERE EmployeeId = @EmployeeId
          AND DayOfWeek = @DayOfWeek
          AND IsActive = 1
          AND StartTime <= @StartTime
          AND EndTime >= @EndTime
    )
        BEGIN
            SELECT 'NotAvailable' AS Status, 'El empleado no trabaja en este horario' AS Message;
            RETURN;
        END

    -- Verificar si hay citas que se superponen
    IF EXISTS (
        SELECT 1 FROM dbo.Appointments
        WHERE EmployeeId = @EmployeeId
          AND Date = @Date
          AND IsActive = 1
          AND Status IN ('Pending', 'Confirmed')
          AND (StartTime < @EndTime AND EndTime > @StartTime)
    )
        BEGIN
            SELECT 'NotAvailable' AS Status, 'Horario ya ocupado por una cita' AS Message;
            RETURN;
        END

    SELECT 'Available' AS Status, 'Horario disponible' AS Message;
END
GO


-- CREAR CITA SEGÚN DISPONIBILIDADES
CREATE OR ALTER PROCEDURE dbo.CreateAppointment
    @ClientId INT,
    @EmployeeId INT,
    @Date DATE,
    @StartTime TIME(0),
    @ServiceId INT,
    @Notes NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Duración fija de 30 minutos para todas las citas
        DECLARE @EndTime TIME = DATEADD(MINUTE, 30, @StartTime);
        DECLARE @DayOfWeek TINYINT = DATEPART(WEEKDAY, @Date);

        -- Verificar si el empleado trabaja ese día
        IF NOT EXISTS (
            SELECT 1 FROM dbo.Schedules
            WHERE EmployeeId = @EmployeeId
              AND DayOfWeek = @DayOfWeek
              AND IsActive = 1
              AND StartTime <= @StartTime
              AND EndTime >= @EndTime
        )
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT 'NotAvailable' AS Result, 'El empleado no trabaja en este horario' AS Message, NULL AS AppointmentId;
                RETURN;
            END

        -- Verificar si hay citas que se superponen
        IF EXISTS (
            SELECT 1 FROM dbo.Appointments
            WHERE EmployeeId = @EmployeeId
              AND Date = @Date
              AND IsActive = 1
              AND Status IN ('Pending', 'Confirmed')
              AND (StartTime < @EndTime AND EndTime > @StartTime)
        )
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT 'NotAvailable' AS Result, 'Horario ya ocupado por una cita' AS Message, NULL AS AppointmentId;
                RETURN;
            END

        -- Crear la cita
        INSERT INTO dbo.Appointments (ClientId, EmployeeId, Date, StartTime, EndTime, Notes, Status, IsActive)
        VALUES (@ClientId, @EmployeeId, @Date, @StartTime, @EndTime, @Notes, 'Pending', 1);

        DECLARE @AppointmentId INT = SCOPE_IDENTITY();

        -- Agregar servicio a la cita
        DECLARE @AppliedPrice DECIMAL(12,2);
        SELECT @AppliedPrice = BasePrice FROM dbo.Services WHERE ServiceId = @ServiceId;

        INSERT INTO dbo.AppointmentServices (AppointmentId, ServiceId, AppliedPrice, Status, IsActive)
        VALUES (@AppointmentId, @ServiceId, @AppliedPrice, 'Pending', 1);

        COMMIT TRANSACTION;

        SELECT 'Success' AS Result, 'Cita creada exitosamente' AS Message, @AppointmentId AS AppointmentId;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SELECT 'Error' AS Result, ERROR_MESSAGE() AS Message, NULL AS AppointmentId;
    END CATCH
END
GO


-- OBTENER CITAS DE UN EMPLEADO
CREATE OR ALTER PROCEDURE dbo.GetEmployeeAppointments
    @EmployeeId INT,
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.AppointmentId,
        a.ClientId,
        c.Name AS ClientName,
        a.Date,
        a.StartTime,
        a.EndTime,
        a.Status,
        s.Name AS ServiceName,
        s.DurationMin
    FROM dbo.Appointments a
             INNER JOIN dbo.Clients c ON a.ClientId = c.ClientId
             INNER JOIN dbo.AppointmentServices aps ON a.AppointmentId = aps.AppointmentId
             INNER JOIN dbo.Services s ON aps.ServiceId = s.ServiceId
    WHERE a.EmployeeId = @EmployeeId
      AND a.Date = @Date
      AND a.IsActive = 1
      AND a.Status IN ('Pending', 'Confirmed')
    ORDER BY a.StartTime;
END
GO


-- OBTENER TODOS LOS SERVICIOS DISPONIBLES
CREATE OR ALTER PROCEDURE dbo.GetAllServices
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ServiceId,
        Name,
        Description,
        BasePrice,
        DurationMin
    FROM dbo.Services
    WHERE IsActive = 1
    ORDER BY Name;
END
GO