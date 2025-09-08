SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.role_Create
    @RoleName     NVARCHAR(100),
    @MenuAccess   NVARCHAR(MAX) = NULL,
    @NewRoleId    INT OUTPUT,
    @Success      BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Defaults
    SET @NewRoleId = NULL;
    SET @Success   = 0;

    IF (@RoleName IS NULL OR LTRIM(RTRIM(@RoleName)) = N'')
        BEGIN
            RETURN; -- @Success=0, @NewRoleId=NULL
        END;

    IF EXISTS(SELECT 1 FROM dbo.Roles WHERE RoleName = @RoleName)
        BEGIN
            RETURN; -- @Success=0
        END;

    BEGIN TRY
        INSERT INTO dbo.Roles (RoleName, MenuAccess, IsActive)
        VALUES (@RoleName, @MenuAccess, 1);

        SET @NewRoleId = SCOPE_IDENTITY();
        SET @Success   = 1;
    END TRY
    BEGIN CATCH
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
    @IsActive   BIT = 1,
    @Success    BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @Success = 0;

    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleId = @RoleId)
        RETURN;

    IF EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = @RoleName AND RoleId <> @RoleId)
        RETURN;

    BEGIN TRY
        UPDATE dbo.Roles
        SET RoleName   = @RoleName,
            MenuAccess = @MenuAccess,
            IsActive   = @IsActive
        WHERE RoleId   = @RoleId;

        -- Marca éxito si realmente afectó una fila
        IF @@ROWCOUNT > 0 SET @Success = 1;
    END TRY
    BEGIN CATCH
        -- deja @Success = 0
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.role_DeleteSoft
    @RoleId  INT,
    @Success BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Success = 0;

    IF NOT EXISTS(SELECT 1 FROM dbo.Roles WHERE RoleId = @RoleId)
        RETURN; -- @Success = 0

    BEGIN TRY
        UPDATE dbo.Roles
        SET IsActive = 0
        WHERE RoleId = @RoleId;

        IF @@ROWCOUNT > 0 SET @Success = 1;
    END TRY
    BEGIN CATCH
        -- deja @Success = 0
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.role_GetAll
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.Roles;
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
