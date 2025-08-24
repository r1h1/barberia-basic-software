SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sch_Create
    @EmployeeId INT,
    @DayOfWeek  TINYINT,   -- 1..7 (1=Lunes, 7=Domingo)
    @StartTime  TIME(0),
    @EndTime    TIME(0)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Employees WHERE EmployeeId = @EmployeeId AND IsActive = 1)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Empleado inválido o inactivo.' AS [Message]; RETURN; END;

    IF (@DayOfWeek < 1 OR @DayOfWeek > 7)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'DayOfWeek debe estar entre 1 y 7.' AS [Message]; RETURN; END;

    IF (@StartTime IS NULL OR @EndTime IS NULL OR @StartTime >= @EndTime)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Rango de hora inválido.' AS [Message]; RETURN; END;

    -- Validación simple: evitar franjas idénticas repetidas (mismo día/mismo rango)
    IF EXISTS (
        SELECT 1
        FROM dbo.Schedules
        WHERE EmployeeId = @EmployeeId
          AND DayOfWeek  = @DayOfWeek
          AND StartTime  = @StartTime
          AND EndTime    = @EndTime
          AND IsActive   = 1
    )
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Ya existe un horario idéntico para ese día.' AS [Message]; RETURN; END;

    BEGIN TRY
        INSERT INTO dbo.Schedules (EmployeeId, DayOfWeek, StartTime, EndTime, IsActive)
        VALUES (@EmployeeId, @DayOfWeek, @StartTime, @EndTime, 1);

        DECLARE @NewId INT = SCOPE_IDENTITY();

        SELECT CAST(1 AS BIT) AS Success, N'Horario creado.' AS [Message], *
        FROM dbo.Schedules WHERE ScheduleId = @NewId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sch_Update
    @ScheduleId INT,
    @DayOfWeek  TINYINT,
    @StartTime  TIME(0),
    @EndTime    TIME(0),
    @IsActive   BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Schedules WHERE ScheduleId = @ScheduleId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Horario no encontrado.' AS [Message]; RETURN; END;

    IF (@DayOfWeek < 1 OR @DayOfWeek > 7)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'DayOfWeek debe estar entre 1 y 7.' AS [Message]; RETURN; END;

    IF (@StartTime IS NULL OR @EndTime IS NULL OR @StartTime >= @EndTime)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Rango de hora inválido.' AS [Message]; RETURN; END;

    -- Evitar duplicado idéntico en otro registro del mismo empleado
    DECLARE @EmpId INT = (SELECT EmployeeId FROM dbo.Schedules WHERE ScheduleId = @ScheduleId);
    IF EXISTS (
        SELECT 1
        FROM dbo.Schedules
        WHERE EmployeeId = @EmpId
          AND DayOfWeek  = @DayOfWeek
          AND StartTime  = @StartTime
          AND EndTime    = @EndTime
          AND ScheduleId <> @ScheduleId
          AND IsActive   = 1
    )
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Existe otro horario idéntico para ese día.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Schedules
        SET DayOfWeek = @DayOfWeek,
            StartTime = @StartTime,
            EndTime   = @EndTime,
            IsActive  = @IsActive
        WHERE ScheduleId = @ScheduleId;

        SELECT CAST(1 AS BIT) AS Success, N'Horario actualizado.' AS [Message], *
        FROM dbo.Schedules WHERE ScheduleId = @ScheduleId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sch_DeleteSoft
@ScheduleId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.Schedules WHERE ScheduleId = @ScheduleId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Horario no encontrado.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Schedules
        SET IsActive = 0
        WHERE ScheduleId = @ScheduleId;

        SELECT CAST(1 AS BIT) AS Success, N'Horario desactivado.' AS [Message];
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sch_GetById
@ScheduleId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.Schedules
    WHERE ScheduleId = @ScheduleId;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sch_ListByEmployee
    @EmployeeId INT,
    @OnlyActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT S.*
    FROM dbo.Schedules S
    WHERE S.EmployeeId = @EmployeeId
      AND (@OnlyActive = 0 OR S.IsActive = 1)
    ORDER BY S.DayOfWeek, S.StartTime;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sch_ListByDay
    @DayOfWeek  TINYINT,
    @OnlyActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT S.*
    FROM dbo.Schedules S
    WHERE S.DayOfWeek = @DayOfWeek
      AND (@OnlyActive = 0 OR S.IsActive = 1)
    ORDER BY S.EmployeeId, S.StartTime;
END
GO


CREATE OR ALTER PROCEDURE dbo.sch_List
@OnlyActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.Schedules
    WHERE (@OnlyActive = 0 OR IsActive = 1)
    ORDER BY EmployeeId, DayOfWeek, StartTime;
END

