SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.cli_Create
    @Name  NVARCHAR(150),
    @Phone NVARCHAR(30)  = NULL,
    @Email NVARCHAR(255) = NULL,
    @Gender NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validaciones simples
    IF (@Name IS NULL OR LTRIM(RTRIM(@Name)) = N'')
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'El nombre es obligatorio.' AS [Message];
            RETURN;
        END;

    -- Evitar duplicados básicos por email o teléfono (si vienen)
    IF (@Email IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Clients WHERE Email = @Email))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El email ya existe.' AS [Message]; RETURN; END;
    IF (@Phone IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Clients WHERE Phone = @Phone))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El teléfono ya existe.' AS [Message]; RETURN; END;

    BEGIN TRY
        INSERT INTO dbo.Clients (Name, Phone, Email, Gender, IsActive)
        VALUES (@Name, @Phone, @Email, @Gender, 1);

        DECLARE @NewId INT = SCOPE_IDENTITY();

        SELECT CAST(1 AS BIT) AS Success, N'Cliente creado.' AS [Message], *
        FROM dbo.Clients WHERE ClientId = @NewId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.cli_Update
    @ClientId INT,
    @Name     NVARCHAR(150),
    @Phone    NVARCHAR(30)  = NULL,
    @Email    NVARCHAR(255) = NULL,
    @Gender   NVARCHAR(20)  = NULL,
    @IsActive BIT           = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Clients WHERE ClientId = @ClientId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Cliente no encontrado.' AS [Message]; RETURN; END;

    -- Chequeos de duplicado si cambian email/phone
    IF (@Email IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Clients WHERE Email = @Email AND ClientId <> @ClientId))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El email ya está en uso por otro cliente.' AS [Message]; RETURN; END;

    IF (@Phone IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Clients WHERE Phone = @Phone AND ClientId <> @ClientId))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El teléfono ya está en uso por otro cliente.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Clients
        SET Name = @Name,
            Phone = @Phone,
            Email = @Email,
            Gender = @Gender,
            IsActive = @IsActive
        WHERE ClientId = @ClientId;

        SELECT CAST(1 AS BIT) AS Success, N'Cliente actualizado.' AS [Message], *
        FROM dbo.Clients WHERE ClientId = @ClientId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.cli_DeleteSoft
@ClientId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Clients WHERE ClientId = @ClientId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Cliente no encontrado.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Clients
        SET IsActive = 0
        WHERE ClientId = @ClientId;

        SELECT CAST(1 AS BIT) AS Success, N'Cliente desactivado.' AS [Message];
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.cli_GetById
@ClientId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.Clients
    WHERE ClientId = @ClientId;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.cli_List
    @Search   NVARCHAR(150) = NULL,  -- busca en Name, Email, Phone
    @OnlyActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT C.*
    FROM dbo.Clients C
    WHERE (@OnlyActive = 0 OR C.IsActive = 1)
      AND (
        @Search IS NULL
            OR C.Name  LIKE '%' + @Search + '%'
            OR C.Email LIKE '%' + @Search + '%'
            OR C.Phone LIKE '%' + @Search + '%'
        )
    ORDER BY C.ClientId DESC;
END
GO


