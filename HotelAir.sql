-- HotelAir SQL Schema

-- Superclass: Person (Generalized)
CREATE TABLE Person (
  PersonID INT PRIMARY KEY IDENTITY(1,1),
  FullName VARCHAR(100) NOT NULL,
  Email VARCHAR(100),
  Phone VARCHAR(20),
  Country VARCHAR(50),
  PersonType VARCHAR(20) NOT NULL CHECK (PersonType IN ('Guest', 'Staff')),
  CreatedAt DATETIME DEFAULT GETDATE(),
  UpdatedAt DATETIME NULL
);

-- Subclass: Guest
CREATE TABLE Guest (
  GuestID INT PRIMARY KEY,
  FOREIGN KEY (GuestID) REFERENCES Person(PersonID) ON DELETE CASCADE
);

-- Subclass: Staff
CREATE TABLE Staff (
  StaffID INT PRIMARY KEY,
  Role VARCHAR(50) NOT NULL,
  FOREIGN KEY (StaffID) REFERENCES Person(PersonID) ON DELETE CASCADE
);

-- Lookup table: RoomType
CREATE TABLE RoomType (
  TypeID INT PRIMARY KEY IDENTITY(1,1),
  Name VARCHAR(50) UNIQUE NOT NULL,
  Description VARCHAR(255)
);

-- Table: Room
CREATE TABLE Room (
  RoomID INT PRIMARY KEY IDENTITY(1,1),
  RoomNumber VARCHAR(10) UNIQUE NOT NULL,
  TypeID INT NOT NULL,
  Capacity INT NOT NULL,
  Price DECIMAL(10,2) NOT NULL,
  Status VARCHAR(20) NOT NULL CHECK (Status IN ('available', 'booked', 'maintenance')),
  Description VARCHAR(255),
  FOREIGN KEY (TypeID) REFERENCES RoomType(TypeID)
);

-- Table: Booking
CREATE TABLE Booking (
  BookingID INT PRIMARY KEY IDENTITY(1,1),
  GuestID INT NOT NULL,
  RoomID INT NOT NULL,
  CheckIn DATE NOT NULL,
  CheckOut DATE NOT NULL,
  Status VARCHAR(30) NOT NULL CHECK (Status IN ('confirmed', 'checked-in', 'checked-out', 'cancelled')),
  CreatedAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (GuestID) REFERENCES Guest(GuestID),
  FOREIGN KEY (RoomID) REFERENCES Room(RoomID)
);

-- Table: Payment
CREATE TABLE Payment (
  PaymentID INT PRIMARY KEY IDENTITY(1,1),
  GuestID INT NOT NULL,
  Amount DECIMAL(10,2) NOT NULL,
  Method VARCHAR(30) NOT NULL CHECK (Method IN ('cash', 'card', 'online')),
  Date DATE NOT NULL,
  Note VARCHAR(255),
  FOREIGN KEY (GuestID) REFERENCES Guest(GuestID)
);

-- Table: UserAccount (linked optionally to Staff)
CREATE TABLE UserAccount (
  UserID INT PRIMARY KEY IDENTITY(1,1),
  Username VARCHAR(50) UNIQUE NOT NULL,
  PasswordHash VARCHAR(255) NOT NULL,
  Role VARCHAR(30) NOT NULL CHECK (Role IN ('admin', 'manager', 'staff')),
  StaffID INT NULL,
  FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
);

-- Notifications table
CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NULL,
    Title NVARCHAR(100) NOT NULL,
    Message NVARCHAR(255) NOT NULL,
    Type NVARCHAR(30) NOT NULL,
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);

-- AuditLog table
CREATE TABLE AuditLog (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NULL,
    Action NVARCHAR(100) NOT NULL,
    Entity NVARCHAR(50),
    EntityID INT NULL,
    Details NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);

-- ----------------------------------------------------------
-- 👇 Sample Inserts: Professional Grade Data Integrity Setup
-- ----------------------------------------------------------

-- Room Types
INSERT INTO RoomType (Name, Description) VALUES
('Deluxe Suite', 'Spacious suite with premium amenities'),
('Standard Double', 'Basic room with double bed'),
('Family Room', 'Large room suitable for families');

-- People (Guests & Staff in superclass Person)
INSERT INTO Person (FullName, Email, Phone, Country, PersonType)
VALUES
('Alice Carter', 'alice@example.com', '+123456789', 'USA', 'Guest'),
('David Chen', 'david@example.com', '+198765432', 'Canada', 'Guest'),
('Sarah Manager', 'sarah.manager@example.com', '+112233445', 'UK', 'Staff');

-- Guests (subclass with FK to Person)
INSERT INTO Guest (GuestID)
SELECT PersonID FROM Person WHERE FullName IN ('Alice Carter', 'David Chen');

-- Staff (subclass)
INSERT INTO Staff (StaffID, Role)
SELECT PersonID, 'Manager' FROM Person WHERE FullName = 'Sarah Manager';

-- Rooms
INSERT INTO Room (RoomNumber, TypeID, Capacity, Price, Status, Description)
VALUES
('101', 1, 2, 180.00, 'available', 'Ocean view, king-size bed'),
('102', 2, 2, 110.00, 'booked', 'Balcony, street view'),
('103', 3, 4, 200.00, 'maintenance', '2 queen beds, kids friendly');

-- Bookings
INSERT INTO Booking (GuestID, RoomID, CheckIn, CheckOut, Status)
VALUES
(1, 1, '2025-06-22', '2025-06-25', 'confirmed'),
(2, 3, '2025-06-18', '2025-06-20', 'checked-out');

-- Payments
INSERT INTO Payment (GuestID, Amount, Method, Date, Note)
VALUES
(1, 350.00, 'card', '2025-06-20', 'Advance payment'),
(2, 200.00, 'cash', '2025-06-19', 'Paid in full');

-- Users
INSERT INTO UserAccount (Username, PasswordHash, Role)
VALUES
('Superadmin', 'admin123', 'admin');

select * from guest;
truncate table guest;

CREATE TABLE UserPreferences (
    UserID INT,
    SettingKey VARCHAR(50),
    SettingValue NVARCHAR(MAX),
    PRIMARY KEY (UserID, SettingKey),
    FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);
select * from UserPreferences;

CREATE TABLE AppSettings (
    SettingKey VARCHAR(50) PRIMARY KEY,
    SettingValue NVARCHAR(MAX)
);
select * from AppSettings;
-- Add new settings if not present
IF NOT EXISTS (SELECT 1 FROM AppSettings WHERE SettingKey = 'currency')
    INSERT INTO AppSettings (SettingKey, SettingValue) VALUES ('currency', 'PKR');

IF NOT EXISTS (SELECT 1 FROM AppSettings WHERE SettingKey = 'timezone')
    INSERT INTO AppSettings (SettingKey, SettingValue) VALUES ('timezone', 'GMT+5');

IF NOT EXISTS (SELECT 1 FROM AppSettings WHERE SettingKey = 'dateFormat')
    INSERT INTO AppSettings (SettingKey, SettingValue) VALUES ('dateFormat', 'YYYY-MM-DD');

-- To update a setting (example for PKR)
UPDATE AppSettings SET SettingValue = 'PKR' WHERE SettingKey = 'currency';
UPDATE AppSettings SET SettingValue = 'GMT+5' WHERE SettingKey = 'timezone';

CREATE TABLE HotelInfo (
    HotelID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(30),
    Email NVARCHAR(100),
    LogoUrl NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE AdminProfile (
    AdminID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    Role NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
select * from AdminProfile;
-- Notifications table
CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NULL,
    Title NVARCHAR(100) NOT NULL,
    Message NVARCHAR(255) NOT NULL,
    Type NVARCHAR(30) NOT NULL,
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);

-- AuditLog table
CREATE TABLE AuditLog (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NULL,
    Action NVARCHAR(100) NOT NULL,
    Entity NVARCHAR(50),
    EntityID INT NULL,
    Details NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
);
