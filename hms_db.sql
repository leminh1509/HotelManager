DROP DATABASE IF EXISTS hms_db;
CREATE DATABASE hms_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE hms_db;

SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- Role 
CREATE TABLE role (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO role(name, description) VALUES 
('admin', 'System Administrator'),
('receptionist', 'Hotel Receptionist'),
('customer', 'Hotel Customer'),
('maintenance', 'Maintenance Staff'),
('maintenance_manager', 'Maintenance and Housekeeping Manager');

-- Users 
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,

  -- Thông tin cơ bản
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50) NULL,
  last_name VARCHAR(50) NOT NULL,
  mobile_phone VARCHAR(20) NULL,
  birthday DATE NULL,
  avatar_url VARCHAR(500) NULL,
  
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_black_list BOOLEAN NOT NULL DEFAULT FALSE,
  
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT NULL,
  
  CONSTRAINT fk_users_role 
    FOREIGN KEY (role_id) REFERENCES role(role_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  
  CONSTRAINT fk_users_deleted_by 
    FOREIGN KEY (deleted_by) REFERENCES users(user_id)
    ON DELETE SET NULL,
    
  CONSTRAINT fk_users_created_by 
    FOREIGN KEY (created_by) REFERENCES users(user_id)
    ON DELETE SET NULL,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_mobile UNIQUE (mobile_phone),
  CONSTRAINT chk_users_email_format CHECK (email LIKE '%@%.%'),
  CONSTRAINT chk_users_password_length CHECK (CHAR_LENGTH(password) >= 60),
  CONSTRAINT chk_users_mobile_format CHECK (
    mobile_phone IS NULL OR 
    mobile_phone REGEXP '^[0-9]{10,20}$'
  )
) ENGINE=InnoDB;


-- Category 
CREATE TABLE category (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500) NULL,
  img_url VARCHAR(255) NULL,
  
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- RoomStatus 
CREATE TABLE room_status (
  status_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO room_status(name)
VALUES ('Available'),('Occupied'),('Cleaning'),('Maintenance'),('Reserved'),('OutOfService');

-- Room
CREATE TABLE room (
  room_id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL UNIQUE,
  category_id INT NOT NULL,
  status_id INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  capacity INT NOT NULL,
  floor INT NULL,
  size_m2 DECIMAL(8,2) NULL,
  bed_configuration VARCHAR(100) NULL,
  cancellation_policy VARCHAR(300) NULL,
  description VARCHAR(500) NULL,
  img_url VARCHAR(255) NULL,
  
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_room_category
    FOREIGN KEY (category_id) REFERENCES category(category_id),

  CONSTRAINT fk_room_status
    FOREIGN KEY (status_id) REFERENCES room_status(status_id)
) ENGINE=InnoDB;

-- Booking
CREATE TABLE booking (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,        
  room_id INT NOT NULL,
  receptionist_id INT NULL,    

  guest_name VARCHAR(100) NULL,
  guest_email VARCHAR(100) NULL,
  guest_phone VARCHAR(20) NULL,
  guest_id_number VARCHAR(20) NULL,
  guest_nationality VARCHAR(80) NULL,
  guest_address VARCHAR(255) NULL,

  guest_count INT NOT NULL DEFAULT 1,
  special_request VARCHAR(500) NULL,

  early_checkin BOOLEAN NOT NULL DEFAULT FALSE,
  late_checkout BOOLEAN NOT NULL DEFAULT FALSE,

  checkin_time DATE NOT NULL,
  checkout_time DATE NOT NULL,

  status ENUM('Pending','Confirmed','Checked-in','Checked-out','Cancelled') NOT NULL DEFAULT 'Pending',
  total_price DECIMAL(12,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_booking_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),

  CONSTRAINT fk_booking_room
    FOREIGN KEY (room_id) REFERENCES room(room_id),

  CONSTRAINT fk_booking_receptionist
    FOREIGN KEY (receptionist_id) REFERENCES users(user_id),

  CONSTRAINT chk_booking_dates CHECK (checkin_time < checkout_time)
) ENGINE=InnoDB;

-- MaintenanceRequest
CREATE TABLE maintenance_request (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  user_id INT NOT NULL, 

  request_type VARCHAR(50) NULL,
  title VARCHAR(255) NULL,
  description VARCHAR(1000) NULL,
  photo_url VARCHAR(500) NULL,

  priority ENUM('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Low',
  status ENUM('New','In Progress','On Hold','Completed','Rejected','Cancelled') NOT NULL DEFAULT 'New',

  assigned_to INT NULL, 
  notes VARCHAR(1000) NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_mr_booking
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE,

  CONSTRAINT fk_mr_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),

  CONSTRAINT fk_mr_assigned
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- Invoice
CREATE TABLE invoice (
  invoice_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,

  invoice_code VARCHAR(30) NULL UNIQUE,
  invoice_type ENUM('Booking','Service','Final') NOT NULL DEFAULT 'Booking',
  status ENUM('Draft','Issued','Partially Paid','Fully Paid','Cancelled') NOT NULL DEFAULT 'Draft',

  total_room_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  maintenance_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,

  deposit_applied DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_due DECIMAL(12,2) NOT NULL DEFAULT 0,

  issued_date DATETIME NULL,
  
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_invoice_booking
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- InvoiceItem
CREATE TABLE invoice_item (
  invoice_item_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,

  item_type ENUM('Room','Service','Fee','Tax','Damage','Other') NOT NULL DEFAULT 'Other',
  description VARCHAR(255) NOT NULL,

  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,

  line_total DECIMAL(12,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_invoiceItem_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoice(invoice_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Payment
CREATE TABLE payment (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,

  amount DECIMAL(12,2) NOT NULL,
  method ENUM('Cash','BankTransfer','PaymentGateway','CreditCard','EWallet') NOT NULL,
  status ENUM('Pending','Completed','Failed') NOT NULL DEFAULT 'Pending',

  transaction_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  bank_name VARCHAR(100) NULL,
  bank_account VARCHAR(50) NULL,
  bank_reference VARCHAR(100) NULL,
  card_type VARCHAR(30) NULL,
  card_last4 VARCHAR(4) NULL,
  auth_code VARCHAR(50) NULL,
  wallet_provider VARCHAR(50) NULL,
  wallet_transaction_id VARCHAR(100) NULL,

  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_payment_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoice(invoice_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Feedback
CREATE TABLE feedback (
  feedback_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  booking_id INT NOT NULL,

  rating INT NOT NULL,
  content VARCHAR(1000) NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_feedback_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),

  CONSTRAINT fk_feedback_booking
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE,

  CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- AuditLog
CREATE TABLE audit_log (
  history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  booking_id INT NULL,

  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id VARCHAR(50) NULL,

  old_value JSON NULL,
  new_value JSON NULL,

  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),

  CONSTRAINT fk_audit_booking
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Indexes 
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile_phone ON users(mobile_phone);
CREATE INDEX idx_users_role_active ON users(role_id, is_active);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_booking_user_id ON booking(user_id);
CREATE INDEX idx_booking_room_id ON booking(room_id);
CREATE INDEX idx_booking_status ON booking(status);
CREATE INDEX idx_invoice_booking_id ON invoice(booking_id);
CREATE INDEX idx_payment_invoice_id ON payment(invoice_id);
CREATE INDEX idx_mr_booking_id ON maintenance_request(booking_id);
CREATE INDEX idx_mr_status_priority ON maintenance_request(status, priority);
CREATE INDEX idx_feedback_booking_id ON feedback(booking_id);

USE hms_db;
-- Password: Admin@2026
INSERT INTO users (role_id, email, password, first_name, last_name, mobile_phone, is_active, created_at) VALUES
(1, 'admin@36hotel.com', '$2a$10$CBLOTC7g68Hx78ad6aZ2n.Ru5o4ePh0jV2bgo9F4Uo/4/Bt9MM6gi', 'System', 'Admin', '0909998888', TRUE, NOW());
-- Password: Customer@2026
INSERT INTO users (role_id, email, password, first_name, last_name, mobile_phone, birthday, is_active, created_at) VALUES
(3, 'customer1@example.com', '$2a$10$usfqGcSqeif9RNY13yQB0.T37Q2G5UZx8ay6yukl3/2ruxwDskoPm', 'Nguyen', 'An', '0901234567', '2002-05-14', TRUE, NOW());
-- Password: Receptionist@2026
INSERT INTO users (role_id, email, password, first_name, last_name, mobile_phone, is_active, created_at) VALUES
(2, 'receptionist@36hotel.com', '$2a$10$tgr.xM5F2kmyzu8UOROnv.IZClNiPo952L0rQTgbkk1m46t9QCfem', 'Nguyen', 'Binh', '0901239876', TRUE, NOW());
-- Password: Maintenance@2026
INSERT INTO users (role_id, email, password, first_name, last_name, mobile_phone, is_active, created_at) VALUES
(4, 'maintenance@36hotel.com', '$2a$10$Ab9Papng2muU9q.YWMkkieEZ6Ni6/TCM0l1325W6uaKaBoqfmTYWa', 'Le', 'Banh', '0901234578', TRUE, NOW());
INSERT INTO category (name, description, img_url) VALUES 
('Standard Single', 'Phòng đơn tiêu chuẩn từ tầng 3-6', 'https://example.com/std-single.jpg'),
('Standard Double', 'Phòng đôi tiêu chuẩn từ tầng 3-6', 'https://example.com/std-double.jpg'),
('Deluxe Single', 'Phòng đơn sang trọng từ tầng 7-9', 'https://example.com/del-single.jpg'),
('Deluxe Double', 'Phòng đôi sang trọng từ tầng 7-9', 'https://example.com/del-double.jpg'),
('President Suite', 'Phòng tổng thống tầng 10', 'https://example.com/pres-suite.jpg');
    -- TẦNG 3
INSERT INTO room (room_number, category_id, status_id, price, capacity, floor, size_m2, bed_configuration, cancellation_policy, description, img_url) VALUES
('P.301', 1, 1, 600000, 1, 3, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 3', 'url_p301'),
('P.302', 1, 1, 600000, 1, 3, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 3', 'url_p302'),
('P.303', 1, 1, 600000, 1, 3, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 3', 'url_p303'),
('P.304', 1, 1, 600000, 1, 3, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 3', 'url_p304'),
('P.305', 1, 1, 600000, 1, 3, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 3', 'url_p305'),
('P.306', 1, 1, 600000, 1, 3, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 3', 'url_p306'),
('P.307', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p307'),
('P.308', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p308'),
('P.309', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p309'),
('P.310', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p310'),
('P.311', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p311'),
('P.312', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p312'),
('P.313', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p313'),
('P.314', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p314'),
('P.315', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p315'),
('P.316', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p316'),
('P.317', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p317'),
('P.318', 2, 1, 900000, 2, 3, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 3', 'url_p318');

-- TẦNG 4
INSERT INTO room (room_number, category_id, status_id, price, capacity, floor, size_m2, bed_configuration, cancellation_policy, description, img_url) VALUES
('P.401', 1, 1, 600000, 1, 4, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 4', 'url_p401'),
('P.402', 1, 1, 600000, 1, 4, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 4', 'url_p402'),
('P.403', 1, 1, 600000, 1, 4, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 4', 'url_p403'),
('P.404', 1, 1, 600000, 1, 4, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 4', 'url_p404'),
('P.405', 1, 1, 600000, 1, 4, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 4', 'url_p405'),
('P.406', 1, 1, 600000, 1, 4, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 4', 'url_p406'),
('P.407', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p407'),
('P.408', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p408'),
('P.409', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p409'),
('P.410', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p410'),
('P.411', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p411'),
('P.412', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p412'),
('P.413', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p413'),
('P.414', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p414'),
('P.415', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p415'),
('P.416', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p416'),
('P.417', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p417'),
('P.418', 2, 1, 900000, 2, 4, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 4', 'url_p418');

-- TẦNG 5
INSERT INTO room (room_number, category_id, status_id, price, capacity, floor, size_m2, bed_configuration, cancellation_policy, description, img_url) VALUES
('P.501', 1, 1, 600000, 1, 5, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 5', 'url_p501'),
('P.502', 1, 1, 600000, 1, 5, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 5', 'url_p502'),
('P.503', 1, 1, 600000, 1, 5, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 5', 'url_p503'),
('P.504', 1, 1, 600000, 1, 5, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 5', 'url_p504'),
('P.505', 1, 1, 600000, 1, 5, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 5', 'url_p505'),
('P.506', 1, 1, 600000, 1, 5, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 5', 'url_p506'),
('P.507', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p507'),
('P.508', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p508'),
('P.509', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p509'),
('P.510', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p510'),
('P.511', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p511'),
('P.512', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p512'),
('P.513', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p513'),
('P.514', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p514'),
('P.515', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p515'),
('P.516', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p516'),
('P.517', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p517'),
('P.518', 2, 1, 900000, 2, 5, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 5', 'url_p518');

-- TẦNG 6
INSERT INTO room (room_number, category_id, status_id, price, capacity, floor, size_m2, bed_configuration, cancellation_policy, description, img_url) VALUES
('P.601', 1, 1, 600000, 1, 6, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 6', 'url_p601'),
('P.602', 1, 1, 600000, 1, 6, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 6', 'url_p602'),
('P.603', 1, 1, 600000, 1, 6, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 6', 'url_p603'),
('P.604', 1, 1, 600000, 1, 6, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 6', 'url_p604'),
('P.605', 1, 1, 600000, 1, 6, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 6', 'url_p605'),
('P.606', 1, 1, 600000, 1, 6, 22, '1 Single Bed', 'Hoàn tiền trước 24h', 'Phòng đơn tiêu chuẩn tầng 6', 'url_p606'),
('P.607', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p607'),
('P.608', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p608'),
('P.609', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p609'),
('P.610', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p610'),
('P.611', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p611'),
('P.612', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p612'),
('P.613', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p613'),
('P.614', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p614'),
('P.615', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p615'),
('P.616', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p616'),
('P.617', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p617'),
('P.618', 2, 1, 900000, 2, 6, 32, '1 Double Bed', 'Hoàn tiền trước 24h', 'Phòng đôi tiêu chuẩn tầng 6', 'url_p618');

-- TẦNG 7
INSERT INTO room (room_number, category_id, status_id, price, capacity, floor, size_m2, bed_configuration, cancellation_policy, description, img_url) VALUES
('P.701', 3, 1, 1500000, 1, 7, 40, '1 King Bed', 'Hoàn tiền trước 48h', 'Phòng đơn Deluxe tầng 7', 'url_p701'),
('P.702', 3, 1, 1500000, 1, 7, 40, '1 King Bed', 'Hoàn tiền trước 48h', 'Phòng đơn Deluxe tầng 7', 'url_p702'),
('P.703', 3, 1, 1500000, 1, 7, 40, '1 King Bed', 'Hoàn tiền trước 48h', 'Phòng đơn Deluxe tầng 7', 'url_p703'),
('P.704', 4, 1, 2200000, 2, 7, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 7', 'url_p704'),
('P.705', 4, 1, 2200000, 2, 7, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 7', 'url_p705'),
('P.706', 4, 1, 2200000, 2, 7, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 7', 'url_p706'),
('P.707', 4, 1, 2200000, 2, 7, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 7', 'url_p707'),
('P.708', 4, 1, 2200000, 2, 7, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 7', 'url_p708'),
('P.709', 4, 1, 2200000, 2, 7, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 7', 'url_p709'),
('P.710', 4, 1, 2200000, 2, 7, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 7', 'url_p710');

-- TẦNG 8
INSERT INTO room (room_number, category_id, status_id, price, capacity, floor, size_m2, bed_configuration, cancellation_policy, description, img_url) VALUES
('P.801', 3, 1, 1500000, 1, 8, 40, '1 King Bed', 'Hoàn tiền trước 48h', 'Phòng đơn Deluxe tầng 8', 'url_p801'),
('P.802', 3, 1, 1500000, 1, 8, 40, '1 King Bed', 'Hoàn tiền trước 48h', 'Phòng đơn Deluxe tầng 8', 'url_p802'),
('P.803', 3, 1, 1500000, 1, 8, 40, '1 King Bed', 'Hoàn tiền trước 48h', 'Phòng đơn Deluxe tầng 8', 'url_p803'),
('P.804', 4, 1, 2200000, 2, 8, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 8', 'url_p804'),
('P.805', 4, 1, 2200000, 2, 8, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 8', 'url_p805'),
('P.806', 4, 1, 2200000, 2, 8, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 8', 'url_p806'),
('P.807', 4, 1, 2200000, 2, 8, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 8', 'url_p807'),
('P.808', 4, 1, 2200000, 2, 8, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 8', 'url_p808'),
('P.809', 4, 1, 2200000, 2, 8, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 8', 'url_p809'),
('P.810', 4, 1, 2200000, 2, 8, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 8', 'url_p810');

-- TẦNG 9
INSERT INTO room (room_number, category_id, status_id, price, capacity, floor, size_m2, bed_configuration, cancellation_policy, description, img_url) VALUES
('P.901', 3, 1, 1500000, 1, 9, 40, '1 King Bed', 'Hoàn tiền trước 48h', 'Phòng đơn Deluxe tầng 9', 'url_p901'),
('P.902', 3, 1, 1500000, 1, 9, 40, '1 King Bed', 'Hoàn tiền trước 48h', 'Phòng đơn Deluxe tầng 9', 'url_p902'),
('P.903', 3, 1, 1500000, 1, 9, 40, '1 King Bed', 'Hoàn tiền trước 48h', 'Phòng đơn Deluxe tầng 9', 'url_p903'),
('P.904', 4, 1, 2200000, 2, 9, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 9', 'url_p904'),
('P.905', 4, 1, 2200000, 2, 9, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 9', 'url_p905'),
('P.906', 4, 1, 2200000, 2, 9, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 9', 'url_p906'),
('P.907', 4, 1, 2200000, 2, 9, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 9', 'url_p907'),
('P.908', 4, 1, 2200000, 2, 9, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 9', 'url_p908'),
('P.909', 4, 1, 2200000, 2, 9, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 9', 'url_p909'),
('P.910', 4, 1, 2200000, 2, 9, 55, '1 Super King Bed', 'Hoàn tiền trước 48h', 'Phòng đôi Deluxe tầng 9', 'url_p910');

-- TẦNG 10
INSERT INTO room (room_number, category_id, status_id, price, capacity, floor, size_m2, bed_configuration, cancellation_policy, description, img_url) VALUES
('P.1001', 5, 1, 10000000, 2, 10, 120, '1 Royal Bed', 'Không hoàn trả', 'President Suite - View panorama', 'url_p1001'),
('P.1002', 5, 1, 10000000, 2, 10, 120, '1 Royal Bed', 'Không hoàn trả', 'President Suite - Dịch vụ 24/7', 'url_p1002'),
('P.1003', 5, 1, 10000000, 2, 10, 120, '1 Royal Bed', 'Không hoàn trả', 'President Suite - Nội thất cao cấp', 'url_p1003'),
('P.1004', 5, 1, 10000000, 2, 10, 120, '1 Royal Bed', 'Không hoàn trả', 'President Suite - Sang trọng bậc nhất', 'url_p1004'),
('P.1005', 5, 1, 10000000, 2, 10, 120, '1 Royal Bed', 'Không hoàn trả', 'President Suite - Tiện nghi tối tân', 'url_p1005');

-- booking
INSERT INTO booking (
    user_id, room_id,
    guest_name, guest_email, guest_phone,
    guest_id_number, guest_nationality, guest_address,
    guest_count,
    checkin_time, checkout_time,
    status, total_price,
    special_request,
    created_at, updated_at
) VALUES (
    2, 2,  -- Giả sử user_id=2 là khách hàng, room_id=2 là phòng trống
    'Nguyen Van Test', 'test.guest@email.com', '0912345678',
    'CCCD123456789', 'Vietnam', '123 Duong Test, TP.HCM',
    2,
    CURDATE(), DATE_ADD(CURDATE(), INTERVAL 3 DAY), -- Check-in hôm nay, ở 3 ngày
    'Confirmed', 1500000.0,
    'Yêu cầu phòng yên tĩnh',
    NOW(), NOW()
);


-- Service Requests (For Maintenance/Cleaning)
CREATE TABLE service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NULL,
  
  type VARCHAR(50) NULL, -- MAINTENANCE, CLEANING
  description VARCHAR(500) NULL,
  
  items_image VARCHAR(500) NULL,
  
  priority VARCHAR(20) NULL, -- LIGHT, MEDIUM, HIGH, URGENT
  status VARCHAR(20) NULL, -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  
  resolution_notes VARCHAR(1000) NULL,
  
  reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_sr_room 
    FOREIGN KEY (room_id) REFERENCES room(room_id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO service_requests (room_id, type, description, priority, status, reported_at) VALUES 
(1, 'MAINTENANCE', 'Air conditioner leaking water', 'HIGH', 'PENDING', NOW()),
(2, 'CLEANING', 'Room needs deep cleaning', 'MEDIUM', 'IN_PROGRESS', NOW());
CREATE TABLE otp_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE
);
-- Guidelines
CREATE TABLE guidelines (
  guideline_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Rules
CREATE TABLE rules (
  rule_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
