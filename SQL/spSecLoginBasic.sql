SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ===========================================================
   SP: sec_LoginBasic
   Uso: valida credenciales (username O email) + contraseña.
   Hash: SHA2_512 con salt (1 pasada).
   Devuelve: Success, Message y datos básicos para emitir JWT.
   =========================================================== */
CREATE OR ALTER PROCEDURE dbo.sec_LoginBasic
    @Login     NVARCHAR(255),      -- username o email
    @Password  NVARCHAR(4000)      -- contraseña en texto plano (TLS)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE
        @AuthUserId   INT,
        @Username     NVARCHAR(100),
        @Salt         VARBINARY(32),
        @PasswordHash VARBINARY(64),
        @RoleId       INT,
        @UserId       INT,
        @EmployeeId   INT,
        @IsActive     BIT;

    /* 1) Localizar por Username o por Email (Users/Employees) */
    ;WITH CteCandidate AS
              (
                  SELECT AU.AuthUserId, AU.Username, AU.Salt, AU.PasswordHash,
                         AU.RoleId, AU.UserId, AU.EmployeeId, AU.IsActive
                  FROM dbo.AuthUsers AU
                  WHERE AU.Username = @Login

                  UNION ALL
                  SELECT AU.AuthUserId, AU.Username, AU.Salt, AU.PasswordHash,
                         AU.RoleId, AU.UserId, AU.EmployeeId, AU.IsActive
                  FROM dbo.Users U
                           INNER JOIN dbo.AuthUsers AU ON AU.UserId = U.UserId
                  WHERE U.Email = @Login

                  UNION ALL
                  SELECT AU.AuthUserId, AU.Username, AU.Salt, AU.PasswordHash,
                         AU.RoleId, AU.UserId, AU.EmployeeId, AU.IsActive
                  FROM dbo.Employees E
                           INNER JOIN dbo.AuthUsers AU ON AU.EmployeeId = E.EmployeeId
                  WHERE E.Email = @Login
              )
     SELECT TOP (1)
         @AuthUserId   = AuthUserId,
         @Username     = Username,
         @Salt         = Salt,
         @PasswordHash = PasswordHash,
         @RoleId       = RoleId,
         @UserId       = UserId,
         @EmployeeId   = EmployeeId,
         @IsActive     = IsActive
     FROM CteCandidate;

    IF @AuthUserId IS NULL OR @IsActive = 0
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'Usuario y/o clave incorrecta.' AS [Message];
            RETURN;
        END

    /* 2) Calcular hash: SHA2_512( salt + password ) */
    DECLARE @Calc VARBINARY(64) = HASHBYTES('SHA2_512', @Salt + CONVERT(VARBINARY(4000), @Password));

    IF @Calc <> @PasswordHash
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'Usuario y/o clave incorrecta.' AS [Message];
            RETURN;
        END

    /* 3) Actualizar último acceso y devolver payload */
    BEGIN TRY
        UPDATE dbo.AuthUsers
        SET LastLogin = SYSUTCDATETIME()
        WHERE AuthUserId = @AuthUserId;
    END TRY
    BEGIN CATCH
        -- No impedir login si falla la actualización de LastLogin
    END CATCH;

    SELECT
        CAST(1 AS BIT) AS Success,
        N'Login exitoso.' AS [Message],
        AU.AuthUserId,
        AU.Username,
        AU.RoleId,
        R.RoleName,
        R.MenuAccess,
        AU.UserId,
        AU.EmployeeId,
        COALESCE(U.Name, E.Name)   AS PersonName,
        COALESCE(U.Email, E.Email) AS Email,
        COALESCE(U.Phone, E.Phone) AS Phone,
        AU.LastLogin
    FROM dbo.AuthUsers AU
             LEFT JOIN dbo.Roles     R ON R.RoleId = AU.RoleId
             LEFT JOIN dbo.Users     U ON U.UserId = AU.UserId
             LEFT JOIN dbo.Employees E ON E.EmployeeId = AU.EmployeeId
    WHERE AU.AuthUserId = @AuthUserId;
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ===========================================================
   SP: sec_RegisterAuthUser
   Crea credenciales en AuthUsers para un usuario o empleado.
   - Reglas:
       * Username único.
       * Debe enviarse SOLO uno: @UserId o @EmployeeId.
       * RoleId debe existir y estar activo.
       * User/Employee (si se envía) debe existir y estar activo.
   - Seguridad:
       * Genera salt con CRYPT_GEN_RANDOM(32).
       * PasswordHash = SHA2_512( salt + password ).
   - Retorna:
       * Success, Message y datos creados.
   =========================================================== */
CREATE OR ALTER PROCEDURE dbo.sec_RegisterAuthUser
    @Username     NVARCHAR(100),
    @Password     NVARCHAR(4000),
    @RoleId       INT,
    @UserId       INT = NULL,
    @EmployeeId   INT = NULL,
    @IsActive     BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    -- Validaciones de parámetros
    IF (@UserId IS NULL AND @EmployeeId IS NULL)
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'Debe vincular UserId o EmployeeId.' AS [Message];
            RETURN;
        END;
    IF (@UserId IS NOT NULL AND @EmployeeId IS NOT NULL)
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'No puede enviar UserId y EmployeeId a la vez.' AS [Message];
            RETURN;
        END;

    -- Verificar rol
    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleId = @RoleId AND IsActive = 1)
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'RoleId inválido o inactivo.' AS [Message];
            RETURN;
        END;

    -- Verificar entidad vinculada
    IF (@UserId IS NOT NULL) AND NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = @UserId AND IsActive = 1)
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'UserId inexistente o inactivo.' AS [Message];
            RETURN;
        END;
    IF (@EmployeeId IS NOT NULL) AND NOT EXISTS (SELECT 1 FROM dbo.Employees WHERE EmployeeId = @EmployeeId AND IsActive = 1)
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'EmployeeId inexistente o inactivo.' AS [Message];
            RETURN;
        END;

    -- Verificar unicidad de Username
    IF EXISTS (SELECT 1 FROM dbo.AuthUsers WHERE Username = @Username)
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'El Username ya está en uso.' AS [Message];
            RETURN;
        END;

    BEGIN TRY
        BEGIN TRAN;

        DECLARE @Salt VARBINARY(32) = CRYPT_GEN_RANDOM(32);
        DECLARE @PasswordHash VARBINARY(64) = HASHBYTES('SHA2_512', @Salt + CONVERT(VARBINARY(4000), @Password));

        INSERT INTO dbo.AuthUsers
        (Username, PasswordHash, Salt, RoleId, UserId, EmployeeId, IsActive, CreatedAt, LastLogin)
        VALUES
            (@Username, @PasswordHash, @Salt, @RoleId, @UserId, @EmployeeId, @IsActive, SYSUTCDATETIME(), NULL);

        DECLARE @NewId INT = SCOPE_IDENTITY();

        COMMIT;

        SELECT
            CAST(1 AS BIT) AS Success,
            N'Credenciales creadas.' AS [Message],
            AU.AuthUserId,
            AU.Username,
            AU.RoleId,
            R.RoleName,
            R.MenuAccess,
            AU.UserId,
            AU.EmployeeId,
            COALESCE(U.Name, E.Name)     AS PersonName,
            COALESCE(U.Email, E.Email)   AS Email,
            COALESCE(U.Phone, E.Phone)   AS Phone,
            AU.IsActive,
            AU.CreatedAt,
            AU.LastLogin
        FROM dbo.AuthUsers AU
                 LEFT JOIN dbo.Roles     R ON R.RoleId = AU.RoleId
                 LEFT JOIN dbo.Users     U ON U.UserId = AU.UserId
                 LEFT JOIN dbo.Employees E ON E.EmployeeId = AU.EmployeeId
        WHERE AU.AuthUserId = @NewId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SELECT CAST(0 AS BIT) AS Success,
               CONCAT(N'Error al registrar: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ===========================================================
   SP: sec_ChangePasswordBasic
   Cambia la contraseña del usuario autenticado.
   - Identificación: por @AuthUserId o @Username (uno obligatorio).
   - Verifica contraseña actual.
   - Genera salt nuevo y recalcula hash con SHA2_512(salt+pwd).
   - Reglas mínimas de demo: longitud >= 8.
   =========================================================== */
CREATE OR ALTER PROCEDURE dbo.sec_ChangePasswordBasic
    @AuthUserId       INT            = NULL,
    @Username         NVARCHAR(100)  = NULL,
    @CurrentPassword  NVARCHAR(4000),
    @NewPassword      NVARCHAR(4000)
AS
BEGIN
    SET NOCOUNT ON;

    IF (@AuthUserId IS NULL AND @Username IS NULL)
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'Debe enviar AuthUserId o Username.' AS [Message];
            RETURN;
        END;

    IF (LEN(@NewPassword) < 8)
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'La nueva contraseña debe tener al menos 8 caracteres.' AS [Message];
            RETURN;
        END;

    DECLARE
        @Id           INT,
        @Salt         VARBINARY(32),
        @PasswordHash VARBINARY(64),
        @IsActive     BIT;

    /* 1) Resolver usuario destino */
    SELECT TOP (1)
        @Id           = AU.AuthUserId,
        @Salt         = AU.Salt,
        @PasswordHash = AU.PasswordHash,
        @IsActive     = AU.IsActive
    FROM dbo.AuthUsers AU
    WHERE (@AuthUserId IS NOT NULL AND AU.AuthUserId = @AuthUserId)
       OR (@Username   IS NOT NULL AND AU.Username   = @Username);

    IF @Id IS NULL
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'Usuario no encontrado.' AS [Message];
            RETURN;
        END;

    IF @IsActive = 0
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'Usuario desactivado.' AS [Message];
            RETURN;
        END;

    /* 2) Validar contraseña actual */
    DECLARE @Calc VARBINARY(64) = HASHBYTES('SHA2_512', @Salt + CONVERT(VARBINARY(4000), @CurrentPassword));
    IF @Calc <> @PasswordHash
        BEGIN
            SELECT CAST(0 AS BIT) AS Success, N'La contraseña actual es incorrecta.' AS [Message];
            RETURN;
        END;

    /* 3) Actualizar con salt nuevo + hash nuevo */
    BEGIN TRY
        DECLARE @NewSalt VARBINARY(32) = CRYPT_GEN_RANDOM(32);
        DECLARE @NewHash VARBINARY(64) = HASHBYTES('SHA2_512', @NewSalt + CONVERT(VARBINARY(4000), @NewPassword));

        UPDATE dbo.AuthUsers
        SET Salt         = @NewSalt,
            PasswordHash = @NewHash
        WHERE AuthUserId  = @Id;

        SELECT CAST(1 AS BIT) AS Success, N'Contraseña actualizada.' AS [Message];
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success,
               CONCAT(N'Error al actualizar contraseña: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO



SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ===========================================================
   SP: auth_Update
   Actualiza datos de AuthUsers (sin cambiar contraseña).
   =========================================================== */
CREATE OR ALTER PROCEDURE dbo.auth_Update
    @AuthUserId INT,
    @Username   NVARCHAR(100),
    @RoleId     INT,
    @UserId     INT = NULL,
    @EmployeeId INT = NULL,
    @IsActive   BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS(SELECT 1 FROM dbo.AuthUsers WHERE AuthUserId = @AuthUserId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'AuthUser no encontrado.' AS [Message]; RETURN; END;

    IF EXISTS(SELECT 1 FROM dbo.AuthUsers WHERE Username = @Username AND AuthUserId <> @AuthUserId)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'El Username ya está en uso por otro usuario.' AS [Message]; RETURN; END;

    IF NOT EXISTS(SELECT 1 FROM dbo.Roles WHERE RoleId = @RoleId AND IsActive = 1)
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'RoleId inválido o inactivo.' AS [Message]; RETURN; END;

    IF (@UserId IS NOT NULL AND NOT EXISTS(SELECT 1 FROM dbo.Users WHERE UserId = @UserId AND IsActive = 1))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'UserId inválido o inactivo.' AS [Message]; RETURN; END;

    IF (@EmployeeId IS NOT NULL AND NOT EXISTS(SELECT 1 FROM dbo.Employees WHERE EmployeeId = @EmployeeId AND IsActive = 1))
        BEGIN SELECT CAST(0 AS BIT) AS Success, N'EmployeeId inválido o inactivo.' AS [Message]; RETURN; END;

    BEGIN TRY
        UPDATE dbo.AuthUsers
        SET Username   = @Username,
            RoleId     = @RoleId,
            UserId     = @UserId,
            EmployeeId = @EmployeeId,
            IsActive   = @IsActive
        WHERE AuthUserId = @AuthUserId;

        SELECT CAST(1 AS BIT) AS Success, N'AuthUser actualizado.' AS [Message], *
        FROM dbo.AuthUsers WHERE AuthUserId = @AuthUserId;
    END TRY
    BEGIN CATCH
        SELECT CAST(0 AS BIT) AS Success, CONCAT(N'Error: ', ERROR_MESSAGE()) AS [Message];
    END CATCH
END
GO


