
DROP DATABASE IF EXISTS hms_db;
CREATE DATABASE hms_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE hms_db;

SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';


-- Role 
CREATE TABLE role (
  roleId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;
-- Seed roles (you can adjust names as your app expects)
INSERT INTO role(name) VALUES ('admin'),('receptionist'),('customer'),('maintenance');

-- Users 
CREATE TABLE users (
  userId INT AUTO_INCREMENT PRIMARY KEY,
  roleId INT NOT NULL,
  mobilePhone VARCHAR(20) NULL,
  firstName VARCHAR(50) NOT NULL,
  middleName VARCHAR(50) NULL,
  lastName VARCHAR(50) NOT NULL,
  birthday DATE NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  isBlackList BOOLEAN NOT NULL DEFAULT FALSE,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url VARCHAR(500) NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_users_role
    FOREIGN KEY (roleId) REFERENCES role(roleId),

  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_mobile UNIQUE (mobilePhone)
) ENGINE=InnoDB;

-- Category 
CREATE TABLE category (
  categoryId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500) NULL,
  imgUrl VARCHAR(255) NULL,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- RoomStatus 
CREATE TABLE room_status (
  statusId INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO room_status(name)
VALUES ('Available'),('Occupied'),('Cleaning'),('Maintenance'),('Reserved'),('OutOfService');


-- room
CREATE TABLE room (
  roomId INT AUTO_INCREMENT PRIMARY KEY,

  -- Recommended by SRS UI: Room Number unique identifier
  roomNumber VARCHAR(20) NOT NULL UNIQUE,

  categoryId INT NOT NULL,
  statusId INT NOT NULL,

  -- SRS: price + capacity
  price DECIMAL(12,2) NOT NULL,
  capacity INT NOT NULL,

  -- Extra fields from UI requirements (optional but useful)
  floor INT NULL,
  size_m2 DECIMAL(8,2) NULL,
  bedConfiguration VARCHAR(100) NULL,
  cancellationPolicy VARCHAR(300) NULL,

  description VARCHAR(500) NULL,
  imgUrl VARCHAR(255) NULL,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_room_category
    FOREIGN KEY (categoryId) REFERENCES category(categoryId),

  CONSTRAINT fk_room_status
    FOREIGN KEY (statusId) REFERENCES room_status(statusId)
) ENGINE=InnoDB;

-- booking

CREATE TABLE booking (
  bookingId INT AUTO_INCREMENT PRIMARY KEY,

  userId INT NOT NULL,       -- customer
  roomId INT NOT NULL,
  receptionistId INT NULL,   -- staff xử lý

  -- Guest info (from UI requirements)
  guestName VARCHAR(100) NULL,
  guestEmail VARCHAR(100) NULL,
  guestPhone VARCHAR(20) NULL,
  guestIdNumber VARCHAR(20) NULL,
  guestNationality VARCHAR(80) NULL,
  guestAddress VARCHAR(255) NULL,

  guestCount INT NOT NULL DEFAULT 1,
  specialRequest VARCHAR(500) NULL,

  earlyCheckin BOOLEAN NOT NULL DEFAULT FALSE,
  lateCheckout BOOLEAN NOT NULL DEFAULT FALSE,

  checkinTime DATETIME NOT NULL,
  checkoutTime DATETIME NOT NULL,

  status ENUM('Pending','Confirmed','Checked-in','Checked-out','Cancelled') NOT NULL DEFAULT 'Pending',

  totalPrice DECIMAL(12,2) NOT NULL DEFAULT 0,

  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_booking_user
    FOREIGN KEY (userId) REFERENCES users(userId),

  CONSTRAINT fk_booking_room
    FOREIGN KEY (roomId) REFERENCES room(roomId),

  CONSTRAINT fk_booking_receptionist
    FOREIGN KEY (receptionistId) REFERENCES users(userId),

  CONSTRAINT chk_booking_dates CHECK (checkinTime < checkoutTime)
) ENGINE=InnoDB;

-- MaintenancRequest
CREATE TABLE maintenance_request (
  requestId INT AUTO_INCREMENT PRIMARY KEY,
  bookingId INT NOT NULL,
  userId INT NOT NULL, -- người tạo (customer/frontdesk)

  requestType VARCHAR(50) NULL,  -- Plumbing/Electrical/...
  title VARCHAR(255) NULL,
  description VARCHAR(1000) NULL,
  photoUrl VARCHAR(500) NULL,

  priority ENUM('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Low',
  status ENUM('New','In Progress','On Hold','Completed','Rejected') NOT NULL DEFAULT 'New',

  assignedTo INT NULL, -- maintenance userId
  notes VARCHAR(1000) NULL,

  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_mr_booking
    FOREIGN KEY (bookingId) REFERENCES booking(bookingId) ON DELETE CASCADE,

  CONSTRAINT fk_mr_user
    FOREIGN KEY (userId) REFERENCES users(userId),

  CONSTRAINT fk_mr_assigned
    FOREIGN KEY (assignedTo) REFERENCES users(userId)
) ENGINE=InnoDB;

-- invoice

CREATE TABLE invoice (
  invoiceId INT AUTO_INCREMENT PRIMARY KEY,
  bookingId INT NOT NULL,

  invoiceCode VARCHAR(30) NULL UNIQUE, -- INV-YYYYMMDD-####
  invoiceType ENUM('Booking','Service','Final') NOT NULL DEFAULT 'Booking',
  status ENUM('Draft','Issued','Partially Paid','Fully Paid','Cancelled') NOT NULL DEFAULT 'Draft',

  totalRoomCost DECIMAL(12,2) NOT NULL DEFAULT 0,
  maintenanceCost DECIMAL(12,2) NOT NULL DEFAULT 0,
  taxAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
  totalAmount DECIMAL(12,2) NOT NULL DEFAULT 0,

  depositApplied DECIMAL(12,2) NOT NULL DEFAULT 0,
  amountDue DECIMAL(12,2) NOT NULL DEFAULT 0,

  issuedDate DATETIME NULL,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_invoice_booking
    FOREIGN KEY (bookingId) REFERENCES booking(bookingId) ON DELETE CASCADE
) ENGINE=InnoDB;

-- invoiceItem
CREATE TABLE invoice_item (
  invoiceItemId INT AUTO_INCREMENT PRIMARY KEY,
  invoiceId INT NOT NULL,

  itemType ENUM('Room','Service','Fee','Tax','Damage','Other') NOT NULL DEFAULT 'Other',
  description VARCHAR(255) NOT NULL,

  quantity INT NOT NULL DEFAULT 1,
  unitPrice DECIMAL(12,2) NOT NULL DEFAULT 0,
  taxRate DECIMAL(5,2) NOT NULL DEFAULT 0,

  lineTotal DECIMAL(12,2) NOT NULL DEFAULT 0,

  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_invoiceItem_invoice
    FOREIGN KEY (invoiceId) REFERENCES invoice(invoiceId) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Payment
CREATE TABLE payment (
  paymentId INT AUTO_INCREMENT PRIMARY KEY,
  invoiceId INT NOT NULL,

  amount DECIMAL(12,2) NOT NULL,
  method ENUM('Cash','BankTransfer','PaymentGateway','CreditCard','EWallet') NOT NULL,
  status ENUM('Pending','Completed','Failed') NOT NULL DEFAULT 'Pending',

  transactionTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Optional detail fields (match UI Method Specifics)
  bankName VARCHAR(100) NULL,
  bankAccount VARCHAR(50) NULL,
  bankReference VARCHAR(100) NULL,
  cardType VARCHAR(30) NULL,
  cardLast4 VARCHAR(4) NULL,
  authCode VARCHAR(50) NULL,
  walletProvider VARCHAR(50) NULL,
  walletTransactionId VARCHAR(100) NULL,

  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_payment_invoice
    FOREIGN KEY (invoiceId) REFERENCES invoice(invoiceId) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Feedback
CREATE TABLE feedback (
  feedbackId INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  bookingId INT NOT NULL,

  rating INT NOT NULL,
  content VARCHAR(1000) NULL,

  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_feedback_user
    FOREIGN KEY (userId) REFERENCES users(userId),

  CONSTRAINT fk_feedback_booking
    FOREIGN KEY (bookingId) REFERENCES booking(bookingId) ON DELETE CASCADE,

  CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- AuditLog
CREATE TABLE audit_log (
  historyId BIGINT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  bookingId INT NULL,

  action VARCHAR(100) NOT NULL,      -- e.g., LOGIN, BOOKING_UPDATE, INVOICE_ADJUST, PAYMENT_PROCESS
  entityType VARCHAR(50) NULL,       -- Booking/Invoice/Payment/Room/...
  entityId VARCHAR(50) NULL,

  oldValue JSON NULL,
  newValue JSON NULL,

  ipAddress VARCHAR(45) NULL,
  userAgent VARCHAR(255) NULL,

  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_user
    FOREIGN KEY (userId) REFERENCES users(userId),

  CONSTRAINT fk_audit_booking
    FOREIGN KEY (bookingId) REFERENCES booking(bookingId) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Indexes 
CREATE INDEX idx_users_roleId ON users(roleId);
CREATE INDEX idx_booking_userId ON booking(userId);
CREATE INDEX idx_booking_roomId ON booking(roomId);
CREATE INDEX idx_booking_status ON booking(status);
CREATE INDEX idx_invoice_bookingId ON invoice(bookingId);
CREATE INDEX idx_payment_invoiceId ON payment(invoiceId);
CREATE INDEX idx_mr_bookingId ON maintenance_request(bookingId);
CREATE INDEX idx_mr_status_priority ON maintenance_request(status, priority);
CREATE INDEX idx_feedback_bookingId ON feedback(bookingId);
CREATE INDEX idx_audit_userId_createdAt ON audit_log(userId, createdAt);
