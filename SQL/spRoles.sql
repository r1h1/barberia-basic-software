SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.role_Create
    @RoleName   NVARCHAR(100),
    @MenuAccess NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF (@RoleName IS NULL OR LTRIM(RTRIM(@RoleName)) = N'')
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El nombre del rol es obligatorio.' AS [Message]; RETURN; END;

    IF EXISTS(SELECT 1 FROM dbo.Roles WHERE RoleName = @RoleName)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El rol ya existe.' AS [Message]; RETURN; END;

    BEGIN TRY
        INSERT INTO dbo.Roles (RoleName, MenuAccess, IsActive)
        VALUES (@RoleName, @MenuAccess, 1);

        DECLARE @NewId INT = SCOPE_IDENTITY();

        SELECT CAST(1 AS BIT) AS Success, N'Rol creado.' AS [Message], *
        FROM dbo.Roles WHERE RoleId = @NewId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.role_Update
    @RoleId     INT,
    @RoleName   NVARCHAR(100),
    @MenuAccess NVARCHAR(MAX) = NULL,
    @IsActive   BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Roles WHERE RoleId = @RoleId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Rol no encontrado.' AS [Message]; RETURN; END;

    IF EXISTS(SELECT 1 FROM dbo.Roles WHERE RoleName = @RoleName AND RoleId <> @RoleId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El nombre de rol ya está en uso por otro.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Roles
        SET RoleName   = @RoleName,
            MenuAccess = @MenuAccess,
            IsActive   = @IsActive
        WHERE RoleId     = @RoleId;

        SELECT CAST(1 AS BIT) AS Success, N'Rol actualizado.' AS [Message], *
        FROM dbo.Roles WHERE RoleId = @RoleId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.role_DeleteSoft
@RoleId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Roles WHERE RoleId = @RoleId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Rol no encontrado.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Roles
        SET IsActive = 0
        WHERE RoleId   = @RoleId;

        SELECT CAST(1 AS BIT) AS Success, N'Rol desactivado.' AS [Message];
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.role_GetById
@RoleId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.Roles
    WHERE RoleId = @RoleId;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.role_List
@OnlyActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.Roles
    WHERE (@OnlyActive = 0 OR IsActive = 1)
    ORDER BY RoleId DESC;
END
GO
