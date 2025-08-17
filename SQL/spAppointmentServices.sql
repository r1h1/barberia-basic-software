SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.appsvc_Create
    @AppointmentId INT,
    @ServiceId     INT,
    @AppliedPrice  DECIMAL(12,2) = NULL, -- si viene NULL, usa Services.BasePrice
    @Status        NVARCHAR(20)   = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Appointments WHERE AppointmentId = @AppointmentId AND IsActive = 1)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Cita inválida o inactiva.' AS [Message]; RETURN; END;

    IF NOT EXISTS (SELECT 1 FROM dbo.Services WHERE ServiceId = @ServiceId AND IsActive = 1)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Servicio inválido o inactivo.' AS [Message]; RETURN; END;

    IF (@AppliedPrice IS NULL)
        SELECT @AppliedPrice = BasePrice FROM dbo.Services WHERE ServiceId = @ServiceId;

    IF (@AppliedPrice < 0)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El precio aplicado debe ser >= 0.' AS [Message]; RETURN; END;

    BEGIN TRY
        INSERT INTO dbo.AppointmentServices (AppointmentId, ServiceId, AppliedPrice, Status, IsActive)
        VALUES (@AppointmentId, @ServiceId, @AppliedPrice, @Status, 1);

        DECLARE @NewId INT = SCOPE_IDENTITY();

        SELECT CAST(1 AS BIT) AS Success, N'Detalle agregado.' AS [Message], *
        FROM dbo.AppointmentServices WHERE AppointmentServiceId = @NewId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.appsvc_Update
    @AppointmentServiceId INT,
    @ServiceId            INT,
    @AppliedPrice         DECIMAL(12,2) = NULL, -- si NULL, toma BasePrice del servicio
    @Status               NVARCHAR(20)   = NULL,
    @IsActive             BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentServices WHERE AppointmentServiceId = @AppointmentServiceId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Detalle no encontrado.' AS [Message]; RETURN; END;

    IF NOT EXISTS (SELECT 1 FROM dbo.Services WHERE ServiceId = @ServiceId AND IsActive = 1)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Servicio inválido o inactivo.' AS [Message]; RETURN; END;

    IF (@AppliedPrice IS NULL)
        SELECT @AppliedPrice = BasePrice FROM dbo.Services WHERE ServiceId = @ServiceId;

    IF (@AppliedPrice < 0)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El precio aplicado debe ser >= 0.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.AppointmentServices
        SET ServiceId    = @ServiceId,
            AppliedPrice = @AppliedPrice,
            Status       = @Status,
            IsActive     = @IsActive
        WHERE AppointmentServiceId = @AppointmentServiceId;

        SELECT CAST(1 AS BIT) AS Success, N'Detalle actualizado.' AS [Message], *
        FROM dbo.AppointmentServices WHERE AppointmentServiceId = @AppointmentServiceId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.appsvc_DeleteSoft
@AppointmentServiceId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentServices WHERE AppointmentServiceId = @AppointmentServiceId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Detalle no encontrado.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.AppointmentServices
        SET IsActive = 0
        WHERE AppointmentServiceId = @AppointmentServiceId;

        SELECT CAST(1 AS BIT) AS Success, N'Detalle desactivado.' AS [Message];
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.appsvc_GetById
@AppointmentServiceId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT ASV.*, S.Name AS ServiceName, S.DurationMin, S.BasePrice
    FROM dbo.AppointmentServices ASV
             JOIN dbo.Services S ON S.ServiceId = ASV.ServiceId
    WHERE ASV.AppointmentServiceId = @AppointmentServiceId;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.appsvc_ListByAppointment
    @AppointmentId INT,
    @OnlyActive    BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT ASV.*, S.Name AS ServiceName, S.DurationMin, S.BasePrice
    FROM dbo.AppointmentServices ASV
             JOIN dbo.Services S ON S.ServiceId = ASV.ServiceId
    WHERE ASV.AppointmentId = @AppointmentId
      AND (@OnlyActive = 0 OR ASV.IsActive = 1)
    ORDER BY ASV.AppointmentServiceId DESC;
END
GO


