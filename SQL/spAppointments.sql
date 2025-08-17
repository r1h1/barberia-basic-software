SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.appt_Create
    @ClientId   INT,
    @EmployeeId INT,
    @Date       DATE,
    @StartTime  TIME(0),
    @EndTime    TIME(0),
    @Notes      NVARCHAR(1000) = NULL,
    @Status     NVARCHAR(20)   = N'Pending'  -- Pending/Confirmed/Cancelled/Completed
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Clients WHERE ClientId = @ClientId AND IsActive = 1)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Cliente inválido.' AS [Message]; RETURN; END;

    IF NOT EXISTS(SELECT 1 FROM dbo.Employees WHERE EmployeeId = @EmployeeId AND IsActive = 1)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Empleado inválido.' AS [Message]; RETURN; END;

    BEGIN TRY
        INSERT INTO dbo.Appointments (ClientId, EmployeeId, Date, StartTime, EndTime, Notes, Status, IsActive)
        VALUES (@ClientId, @EmployeeId, @Date, @StartTime, @EndTime, @Notes, @Status, 1);

        DECLARE @NewId INT = SCOPE_IDENTITY();

        SELECT CAST(1 AS BIT) AS Success, N'Cita creada.' AS [Message], *
        FROM dbo.Appointments WHERE AppointmentId = @NewId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.appt_Update
    @AppointmentId INT,
    @ClientId      INT,
    @EmployeeId    INT,
    @Date          DATE,
    @StartTime     TIME(0),
    @EndTime       TIME(0),
    @Notes         NVARCHAR(1000) = NULL,
    @Status        NVARCHAR(20),
    @IsActive      BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Appointments WHERE AppointmentId = @AppointmentId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Cita no encontrada.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Appointments
        SET ClientId   = @ClientId,
            EmployeeId = @EmployeeId,
            Date       = @Date,
            StartTime  = @StartTime,
            EndTime    = @EndTime,
            Notes      = @Notes,
            Status     = @Status,
            IsActive   = @IsActive
        WHERE AppointmentId = @AppointmentId;

        SELECT CAST(1 AS BIT) AS Success, N'Cita actualizada.' AS [Message], *
        FROM dbo.Appointments WHERE AppointmentId = @AppointmentId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.appt_DeleteSoft
@AppointmentId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Appointments WHERE AppointmentId = @AppointmentId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Cita no encontrada.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Appointments
        SET IsActive = 0,
            Status   = N'Cancelled'
        WHERE AppointmentId = @AppointmentId;

        SELECT CAST(1 AS BIT) AS Success, N'Cita cancelada.' AS [Message];
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.appt_GetById
@AppointmentId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT A.*, C.Name AS ClientName, E.Name AS EmployeeName
    FROM dbo.Appointments A
             JOIN dbo.Clients   C ON C.ClientId   = A.ClientId
             JOIN dbo.Employees E ON E.EmployeeId = A.EmployeeId
    WHERE A.AppointmentId = @AppointmentId;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.appt_List
    @EmployeeId INT = NULL,
    @ClientId   INT = NULL,
    @Status     NVARCHAR(20) = NULL,
    @OnlyActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT A.*, C.Name AS ClientName, E.Name AS EmployeeName
    FROM dbo.Appointments A
             JOIN dbo.Clients   C ON C.ClientId   = A.ClientId
             JOIN dbo.Employees E ON E.EmployeeId = A.EmployeeId
    WHERE (@OnlyActive = 0 OR A.IsActive = 1)
      AND (@EmployeeId IS NULL OR A.EmployeeId = @EmployeeId)
      AND (@ClientId   IS NULL OR A.ClientId   = @ClientId)
      AND (@Status     IS NULL OR A.Status     = @Status)
    ORDER BY A.Date DESC, A.StartTime;
END
GO


