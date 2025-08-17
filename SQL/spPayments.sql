SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.pay_Create
    @AppointmentId      INT,
    @ClientId           INT,
    @PaymentType        NVARCHAR(20),      -- Cash/Transfer/Card/Other
    @AuthorizationNumber NVARCHAR(50) = NULL,
    @TransactionNumber   NVARCHAR(50) = NULL,
    @TotalAmount        DECIMAL(12,2),
    @Status             NVARCHAR(20) = NULL  -- Paid/Pending/Voided, etc. (libre)
AS
BEGIN
    SET NOCOUNT ON;

    -- Validaciones básicas
    IF NOT EXISTS (SELECT 1 FROM dbo.Appointments WHERE AppointmentId = @AppointmentId AND IsActive = 1)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Cita inválida o inactiva.' AS [Message]; RETURN; END;

    IF NOT EXISTS (SELECT 1 FROM dbo.Clients WHERE ClientId = @ClientId AND IsActive = 1)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Cliente inválido o inactivo.' AS [Message]; RETURN; END;

    IF (@TotalAmount IS NULL OR @TotalAmount < 0)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El monto debe ser >= 0.' AS [Message]; RETURN; END;

    IF (@PaymentType IS NULL OR LTRIM(RTRIM(@PaymentType)) = N'')
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El tipo de pago es obligatorio.' AS [Message]; RETURN; END;

    BEGIN TRY
        INSERT INTO dbo.Payments
        (AppointmentId, ClientId, PaymentType, AuthorizationNumber, TransactionNumber,
         TotalAmount, PaymentDate, Status, IsActive)
        VALUES
            (@AppointmentId, @ClientId, @PaymentType, @AuthorizationNumber, @TransactionNumber,
             @TotalAmount, SYSUTCDATETIME(), @Status, 1);

        DECLARE @NewId INT = SCOPE_IDENTITY();

        SELECT CAST(1 AS BIT) AS Success, N'Pago registrado.' AS [Message], *
        FROM dbo.Payments WHERE PaymentId = @NewId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.pay_Update
    @PaymentId          INT,
    @PaymentType        NVARCHAR(20),
    @AuthorizationNumber NVARCHAR(50) = NULL,
    @TransactionNumber   NVARCHAR(50) = NULL,
    @TotalAmount        DECIMAL(12,2),
    @Status             NVARCHAR(20) = NULL,
    @IsActive           BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Payments WHERE PaymentId = @PaymentId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Pago no encontrado.' AS [Message]; RETURN; END;

    IF (@TotalAmount IS NULL OR @TotalAmount < 0)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El monto debe ser >= 0.' AS [Message]; RETURN; END;

    IF (@PaymentType IS NULL OR LTRIM(RTRIM(@PaymentType)) = N'')
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El tipo de pago es obligatorio.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Payments
        SET PaymentType        = @PaymentType,
            AuthorizationNumber= @AuthorizationNumber,
            TransactionNumber  = @TransactionNumber,
            TotalAmount        = @TotalAmount,
            Status             = @Status,
            IsActive           = @IsActive
        WHERE PaymentId          = @PaymentId;

        SELECT CAST(1 AS BIT) AS Success, N'Pago actualizado.' AS [Message], *
        FROM dbo.Payments WHERE PaymentId = @PaymentId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.pay_DeleteSoft
@PaymentId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Payments WHERE PaymentId = @PaymentId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'Pago no encontrado.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.Payments
        SET IsActive = 0,
            Status   = COALESCE(Status, N'Voided')
        WHERE PaymentId = @PaymentId;

        SELECT CAST(1 AS BIT) AS Success, N'Pago anulado/desactivado.' AS [Message];
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.pay_GetById
@PaymentId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT P.*, A.Date, A.StartTime, A.EndTime, A.Status AS AppointmentStatus,
           C.Name AS ClientName
    FROM dbo.Payments P
             JOIN dbo.Appointments A ON A.AppointmentId = P.AppointmentId
             JOIN dbo.Clients      C ON C.ClientId      = P.ClientId
    WHERE P.PaymentId = @PaymentId;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.pay_List
    @AppointmentId INT = NULL,
    @ClientId      INT = NULL,
    @PaymentType   NVARCHAR(20) = NULL,
    @Status        NVARCHAR(20) = NULL,
    @OnlyActive    BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT P.*, A.Date, A.StartTime, A.EndTime, A.Status AS AppointmentStatus,
           C.Name AS ClientName
    FROM dbo.Payments P
             JOIN dbo.Appointments A ON A.AppointmentId = P.AppointmentId
             JOIN dbo.Clients      C ON C.ClientId      = P.ClientId
    WHERE (@OnlyActive = 0 OR P.IsActive = 1)
      AND (@AppointmentId IS NULL OR P.AppointmentId = @AppointmentId)
      AND (@ClientId   IS NULL OR P.ClientId   = @ClientId)
      AND (@PaymentType IS NULL OR P.PaymentType = @PaymentType)
      AND (@Status     IS NULL OR P.Status      = @Status)
    ORDER BY P.PaymentDate DESC, P.PaymentId DESC;
END
GO

