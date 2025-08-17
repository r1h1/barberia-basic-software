SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usr_Create
    @Name  NVARCHAR(150),
    @Email NVARCHAR(255) = NULL,
    @Phone NVARCHAR(30)  = NULL,
    @Role  NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF (@Name IS NULL OR LTRIM(RTRIM(@Name)) = N'')
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El nombre es obligatorio.' AS [Message]; RETURN; END;

    IF (@Email IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Users WHERE Email = @Email))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El email ya existe.' AS [Message]; RETURN; END;

    IF (@Phone IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Users WHERE Phone = @Phone))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El teléfono ya existe.' AS [Message]; RETURN; END;

    BEGIN TRY
        INSERT INTO dbo.Users (Name, Email, Phone, Role, IsActive)
        VALUES (@Name, @Email, @Phone, @Role, 1);

        DECLARE @NewId INT = SCOPE_IDENTITY();

        SELECT CAST(1 AS BIT) AS Success, N'Usuario creado.' AS [Message], *
        FROM dbo.Users WHERE UserId = @NewId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usr_Update
    @UserId INT,
    @Name   NVARCHAR(150),
    @Email  NVARCHAR(255) = NULL,
    @Phone  NVARCHAR(30)  = NULL,
    @Role   NVARCHAR(100) = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Users WHERE UserId = @UserId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Usuario no encontrado.' AS [Message]; RETURN; END;

    IF (@Email IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Users WHERE Email = @Email AND UserId <> @UserId))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El email ya está en uso por otro usuario.' AS [Message]; RETURN; END;

    IF (@Phone IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Users WHERE Phone = @Phone AND UserId <> @UserId))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El teléfono ya está en uso por otro usuario.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Users
        SET Name     = @Name,
            Email    = @Email,
            Phone    = @Phone,
            Role     = @Role,
            IsActive = @IsActive
        WHERE UserId   = @UserId;

        SELECT CAST(1 AS BIT) AS Success, N'Usuario actualizado.' AS [Message], *
        FROM dbo.Users WHERE UserId = @UserId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usr_DeleteSoft
@UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Users WHERE UserId = @UserId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Usuario no encontrado.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Users
        SET IsActive = 0
        WHERE UserId = @UserId;

        SELECT CAST(1 AS BIT) AS Success, N'Usuario desactivado.' AS [Message];
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usr_GetById
@UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.Users
    WHERE UserId = @UserId;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.usr_List
    @Search NVARCHAR(150) = NULL,  -- busca en Name, Email, Phone, Role
    @OnlyActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT U.*
    FROM dbo.Users U
    WHERE (@OnlyActive = 0 OR U.IsActive = 1)
      AND (
        @Search IS NULL
            OR U.Name  LIKE '%' + @Search + '%'
            OR U.Email LIKE '%' + @Search + '%'
            OR U.Phone LIKE '%' + @Search + '%'
            OR U.Role  LIKE '%' + @Search + '%'
        )
    ORDER BY U.UserId DESC;
END
GO
