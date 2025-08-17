SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ROLES
CREATE TABLE dbo.Roles
(
    RoleId     INT IDENTITY(1,1) PRIMARY KEY,
    RoleName   NVARCHAR(100) NOT NULL UNIQUE,
    MenuAccess NVARCHAR(MAX) NULL,
    IsActive   BIT NOT NULL DEFAULT (1)
);
GO

-- USERS
CREATE TABLE dbo.Users
(
    UserId   INT IDENTITY(1,1) PRIMARY KEY,
    Name     NVARCHAR(150) NOT NULL,
    Email    NVARCHAR(255) NULL UNIQUE,
    Phone    NVARCHAR(30)  NULL UNIQUE,
    Role     NVARCHAR(100) NULL,
    IsActive BIT NOT NULL DEFAULT (1)
);
GO

-- CLIENTS
CREATE TABLE dbo.Clients
(
    ClientId         INT IDENTITY(1,1) PRIMARY KEY,
    Name             NVARCHAR(150) NOT NULL,
    Phone            NVARCHAR(30)  NULL UNIQUE,
    Email            NVARCHAR(255) NULL UNIQUE,
    Gender           NVARCHAR(20)  NULL,
    RegistrationDate DATE NOT NULL DEFAULT (CAST(SYSUTCDATETIME() AS DATE)),
    IsActive         BIT NOT NULL DEFAULT (1)
);
GO

-- EMPLOYEES
CREATE TABLE dbo.Employees
(
    EmployeeId INT IDENTITY(1,1) PRIMARY KEY,
    Name       NVARCHAR(150) NOT NULL,
    Email      NVARCHAR(255) NULL UNIQUE,
    Phone      NVARCHAR(30)  NULL UNIQUE,
    CUI        NVARCHAR(30)  NULL UNIQUE,
    Specialty  NVARCHAR(120) NULL,
    IsActive   BIT NOT NULL DEFAULT (1)
);
GO

-- SERVICES
CREATE TABLE dbo.Services
(
    ServiceId    INT IDENTITY(1,1) PRIMARY KEY,
    Name         NVARCHAR(120) NOT NULL,
    Description  NVARCHAR(500) NULL,
    BasePrice    DECIMAL(12,2) NOT NULL,
    DurationMin  INT NOT NULL,
    IsActive     BIT NOT NULL DEFAULT (1)
);
GO

-- SCHEDULES
CREATE TABLE dbo.Schedules
(
    ScheduleId INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeId INT NOT NULL,
    DayOfWeek  TINYINT NOT NULL,  -- 1..7
    StartTime  TIME(0) NOT NULL,
    EndTime    TIME(0) NOT NULL,
    IsActive   BIT NOT NULL DEFAULT (1),
    CONSTRAINT FK_Schedules_Employee
        FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees(EmployeeId)
);
GO

-- APPOINTMENTS
CREATE TABLE dbo.Appointments
(
    AppointmentId   INT IDENTITY(1,1) PRIMARY KEY,
    ClientId        INT NOT NULL,
    EmployeeId      INT NOT NULL,
    Date            DATE NOT NULL,
    StartTime       TIME(0) NOT NULL,
    EndTime         TIME(0) NOT NULL,
    Notes           NVARCHAR(1000) NULL,
    Status          NVARCHAR(20) NOT NULL,  -- Pending/Confirmed/Cancelled/Completed (libre)
    IsActive        BIT NOT NULL DEFAULT (1),
    CONSTRAINT FK_Appointments_Client
        FOREIGN KEY (ClientId)  REFERENCES dbo.Clients(ClientId),
    CONSTRAINT FK_Appointments_Employee
        FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees(EmployeeId)
);
GO

-- APPOINTMENTS SERVICES (APPOINTMENTS DETAILS)
CREATE TABLE dbo.AppointmentServices
(
    AppointmentServiceId INT IDENTITY(1,1) PRIMARY KEY,
    AppointmentId        INT NOT NULL,
    ServiceId            INT NOT NULL,
    AppliedPrice         DECIMAL(12,2) NOT NULL,
    Status               NVARCHAR(20) NULL,
    IsActive             BIT NOT NULL DEFAULT (1),
    CONSTRAINT FK_AppSrv_Appointment
        FOREIGN KEY (AppointmentId) REFERENCES dbo.Appointments(AppointmentId),
    CONSTRAINT FK_AppSrv_Service
        FOREIGN KEY (ServiceId)     REFERENCES dbo.Services(ServiceId)
);
GO

-- PAYMENTS
CREATE TABLE dbo.Payments
(
    PaymentId         INT IDENTITY(1,1) PRIMARY KEY,
    AppointmentId     INT NOT NULL,
    ClientId          INT NOT NULL,
    PaymentType       NVARCHAR(20) NOT NULL,   -- Cash/Transfer/Card/Other
    AuthorizationNumber NVARCHAR(50) NULL,
    TransactionNumber   NVARCHAR(50) NULL,
    TotalAmount       DECIMAL(12,2) NOT NULL,
    PaymentDate       DATETIME2(0) NOT NULL DEFAULT (SYSUTCDATETIME()),
    Status            NVARCHAR(20) NULL,
    IsActive          BIT NOT NULL DEFAULT (1),
    CONSTRAINT FK_Payments_Appointment
        FOREIGN KEY (AppointmentId) REFERENCES dbo.Appointments(AppointmentId),
    CONSTRAINT FK_Payments_Client
        FOREIGN KEY (ClientId)      REFERENCES dbo.Clients(ClientId)
);
GO

-- ANNOUNCEMENTS
CREATE TABLE dbo.Announcements
(
    AnnouncementId INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeId     INT NOT NULL,
    Title          NVARCHAR(200) NOT NULL,
    Content        NVARCHAR(MAX) NULL,
    PublishedDate  DATETIME2(0) NOT NULL DEFAULT (SYSUTCDATETIME()),
    IsActive       BIT NOT NULL DEFAULT (1),
    CONSTRAINT FK_Announcements_Employee
        FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees(EmployeeId)
);
GO

-- AUTH USERS (CREDENTIALS)
CREATE TABLE dbo.AuthUsers
(
    AuthUserId INT IDENTITY(1,1) PRIMARY KEY,
    Username   NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARBINARY(64) NOT NULL,
    Salt         VARBINARY(32) NOT NULL,
    RoleId     INT NOT NULL,
    UserId     INT NULL,
    EmployeeId INT NULL,
    IsActive   BIT NOT NULL DEFAULT (1),
    CreatedAt  DATETIME2(0) NOT NULL DEFAULT (SYSUTCDATETIME()),
    LastLogin  DATETIME2(0) NULL,
    CONSTRAINT FK_AuthUsers_Role
        FOREIGN KEY (RoleId)     REFERENCES dbo.Roles(RoleId),
    CONSTRAINT FK_AuthUsers_User
        FOREIGN KEY (UserId)     REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_AuthUsers_Employee
        FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees(EmployeeId)
);
GO