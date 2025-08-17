SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.emp_Create
    @Name       NVARCHAR(150),
    @Email      NVARCHAR(255) = NULL,
    @Phone      NVARCHAR(30)  = NULL,
    @CUI        NVARCHAR(30)  = NULL,
    @Specialty  NVARCHAR(120) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF (@Name IS NULL OR LTRIM(RTRIM(@Name)) = N'')
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El nombre es obligatorio.' AS [Message]; RETURN; END;

    -- Duplicados básicos
    IF (@Email IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Employees WHERE Email = @Email))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El email ya existe.' AS [Message]; RETURN; END;

    IF (@Phone IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Employees WHERE Phone = @Phone))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El teléfono ya existe.' AS [Message]; RETURN; END;

    IF (@CUI IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Employees WHERE CUI = @CUI))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El CUI ya existe.' AS [Message]; RETURN; END;

    BEGIN TRY
        INSERT INTO dbo.Employees (Name, Email, Phone, CUI, Specialty, IsActive)
        VALUES (@Name, @Email, @Phone, @CUI, @Specialty, 1);

        DECLARE @NewId INT = SCOPE_IDENTITY();

        SELECT CAST(1 AS BIT) AS Success, N'Empleado creado.' AS [Message], *
        FROM dbo.Employees WHERE EmployeeId = @NewId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.emp_Update
    @EmployeeId INT,
    @Name       NVARCHAR(150),
    @Email      NVARCHAR(255) = NULL,
    @Phone      NVARCHAR(30)  = NULL,
    @CUI        NVARCHAR(30)  = NULL,
    @Specialty  NVARCHAR(120) = NULL,
    @IsActive   BIT           = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Employees WHERE EmployeeId = @EmployeeId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Empleado no encontrado.' AS [Message]; RETURN; END;

    -- Duplicados contra otros registros
    IF (@Email IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Employees WHERE Email = @Email AND EmployeeId <> @EmployeeId))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El email ya está en uso por otro empleado.' AS [Message]; RETURN; END;

    IF (@Phone IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Employees WHERE Phone = @Phone AND EmployeeId <> @EmployeeId))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El teléfono ya está en uso por otro empleado.' AS [Message]; RETURN; END;

    IF (@CUI IS NOT NULL AND EXISTS(SELECT 1 FROM dbo.Employees WHERE CUI = @CUI AND EmployeeId <> @EmployeeId))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El CUI ya está en uso por otro empleado.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Employees
        SET Name = @Name,
            Email = @Email,
            Phone = @Phone,
            CUI = @CUI,
            Specialty = @Specialty,
            IsActive = @IsActive
        WHERE EmployeeId = @EmployeeId;

        SELECT CAST(1 AS BIT) AS Success, N'Empleado actualizado.' AS [Message], *
        FROM dbo.Employees WHERE EmployeeId = @EmployeeId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.emp_DeleteSoft
@EmployeeId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Employees WHERE EmployeeId = @EmployeeId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Empleado no encontrado.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Employees
        SET IsActive = 0
        WHERE EmployeeId = @EmployeeId;

        SELECT CAST(1 AS BIT) AS Success, N'Empleado desactivado.' AS [Message];
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.emp_GetById
@EmployeeId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.Employees
    WHERE EmployeeId = @EmployeeId;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.emp_List
    @Search NVARCHAR(150) = NULL,  -- busca en Name, Email, Phone, CUI, Specialty
    @OnlyActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT E.*
    FROM dbo.Employees E
    WHERE (@OnlyActive = 0 OR E.IsActive = 1)
      AND (
        @Search IS NULL
            OR E.Name      LIKE '%' + @Search + '%'
            OR E.Email     LIKE '%' + @Search + '%'
            OR E.Phone     LIKE '%' + @Search + '%'
            OR E.CUI       LIKE '%' + @Search + '%'
            OR E.Specialty LIKE '%' + @Search + '%'
        )
    ORDER BY E.EmployeeId DESC;
END
GO