SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.ann_Create
    @EmployeeId INT,
    @Title      NVARCHAR(200),
    @Content    NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validaciones
    IF NOT EXISTS(SELECT 1 FROM dbo.Employees WHERE EmployeeId = @EmployeeId AND IsActive = 1)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Empleado inválido o inactivo.' AS [Message]; RETURN; END;

    IF (@Title IS NULL OR LTRIM(RTRIM(@Title)) = N'')
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El título es obligatorio.' AS [Message]; RETURN; END;

    BEGIN TRY
        INSERT INTO dbo.Announcements (EmployeeId, Title, Content, PublishedDate, IsActive)
        VALUES (@EmployeeId, @Title, @Content, SYSUTCDATETIME(), 1);

        DECLARE @NewId INT = SCOPE_IDENTITY();

        SELECT CAST(1 AS BIT) AS Success, N'Anuncio creado.' AS [Message], *
        FROM dbo.Announcements WHERE AnnouncementId = @NewId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.ann_Update
    @AnnouncementId INT,
    @Title          NVARCHAR(200),
    @Content        NVARCHAR(MAX) = NULL,
    @IsActive       BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Announcements WHERE AnnouncementId = @AnnouncementId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Anuncio no encontrado.' AS [Message]; RETURN; END;

    IF (@Title IS NULL OR LTRIM(RTRIM(@Title)) = N'')
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El título es obligatorio.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Announcements
        SET Title     = @Title,
            Content   = @Content,
            IsActive  = @IsActive
        WHERE AnnouncementId = @AnnouncementId;

        SELECT CAST(1 AS BIT) AS Success, N'Anuncio actualizado.' AS [Message], *
        FROM dbo.Announcements WHERE AnnouncementId = @AnnouncementId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.ann_DeleteSoft
@AnnouncementId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Announcements WHERE AnnouncementId = @AnnouncementId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Anuncio no encontrado.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Announcements
        SET IsActive = 0
        WHERE AnnouncementId = @AnnouncementId;

        SELECT CAST(1 AS BIT) AS Success, N'Anuncio desactivado.' AS [Message];
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.ann_GetById
@AnnouncementId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT A.*, E.Name AS EmployeeName
    FROM dbo.Announcements A
             JOIN dbo.Employees E ON E.EmployeeId = A.EmployeeId
    WHERE A.AnnouncementId = @AnnouncementId;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.ann_List
@OnlyActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT A.*, E.Name AS EmployeeName
    FROM dbo.Announcements A
             JOIN dbo.Employees E ON E.EmployeeId = A.EmployeeId
    WHERE (@OnlyActive = 0 OR A.IsActive = 1)
    ORDER BY A.PublishedDate DESC;
END
GO
