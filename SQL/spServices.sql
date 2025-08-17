SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.svc_Create
    @Name         NVARCHAR(120),
    @Description  NVARCHAR(500) = NULL,
    @BasePrice    DECIMAL(12,2),
    @DurationMin  INT
AS
BEGIN
    SET NOCOUNT ON;

    IF (@Name IS NULL OR LTRIM(RTRIM(@Name)) = N'')
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El nombre es obligatorio.' AS [Message]; RETURN; END;

    IF (@BasePrice IS NULL OR @BasePrice < 0)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El precio base debe ser >= 0.' AS [Message]; RETURN; END;

    IF (@DurationMin IS NULL OR @DurationMin <= 0)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'La duración (min) debe ser > 0.' AS [Message]; RETURN; END;

    -- Evitar nombre duplicado
    IF EXISTS(SELECT 1 FROM dbo.Services WHERE Name = @Name)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Ya existe un servicio con ese nombre.' AS [Message]; RETURN; END;

    BEGIN TRY
        INSERT INTO dbo.Services (Name, Description, BasePrice, DurationMin, IsActive)
        VALUES (@Name, @Description, @BasePrice, @DurationMin, 1);

        DECLARE @NewId INT = SCOPE_IDENTITY();

        SELECT CAST(1 AS BIT) AS Success, N'Servicio creado.' AS [Message], *
        FROM dbo.Services WHERE ServiceId = @NewId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.svc_Update
    @ServiceId    INT,
    @Name         NVARCHAR(120),
    @Description  NVARCHAR(500) = NULL,
    @BasePrice    DECIMAL(12,2),
    @DurationMin  INT,
    @IsActive     BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Services WHERE ServiceId = @ServiceId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Servicio no encontrado.' AS [Message]; RETURN; END;

    IF (@Name IS NULL OR LTRIM(RTRIM(@Name)) = N'')
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El nombre es obligatorio.' AS [Message]; RETURN; END;

    IF (@BasePrice IS NULL OR @BasePrice < 0)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El precio base debe ser >= 0.' AS [Message]; RETURN; END;

    IF (@DurationMin IS NULL OR @DurationMin <= 0)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'La duración (min) debe ser > 0.' AS [Message]; RETURN; END;

    -- Nombre duplicado en otro registro
    IF EXISTS(SELECT 1 FROM dbo.Services WHERE Name = @Name AND ServiceId <> @ServiceId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El nombre ya está en uso por otro servicio.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Services
        SET Name        = @Name,
            Description = @Description,
            BasePrice   = @BasePrice,
            DurationMin = @DurationMin,
            IsActive    = @IsActive
        WHERE ServiceId   = @ServiceId;

        SELECT CAST(1 AS BIT) AS Success, N'Servicio actualizado.' AS [Message], *
        FROM dbo.Services WHERE ServiceId = @ServiceId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.svc_DeleteSoft
@ServiceId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Services WHERE ServiceId = @ServiceId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Servicio no encontrado.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Services
        SET IsActive = 0
        WHERE ServiceId = @ServiceId;

        SELECT CAST(1 AS BIT) AS Success, N'Servicio desactivado.' AS [Message];
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.svc_GetById
@ServiceId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.Services
    WHERE ServiceId = @ServiceId;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.svc_List
    @Search NVARCHAR(150) = NULL,  -- busca por Name o Description
    @OnlyActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT S.*
    FROM dbo.Services S
    WHERE (@OnlyActive = 0 OR S.IsActive = 1)
      AND (
        @Search IS NULL
            OR S.Name        LIKE '%' + @Search + '%'
            OR S.Description LIKE '%' + @Search + '%'
        )
    ORDER BY S.ServiceId DESC;
END
GO
