DROP DATABASE IF EXISTS hms_db;
CREATE DATABASE hms_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE hms_db;

SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- Role 
CREATE TABLE role (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO role(name) VALUES ('admin'),('receptionist'),('customer'),('maintenance');

-- Users 
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  mobile_phone VARCHAR(20) NULL,
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50) NULL,
  last_name VARCHAR(50) NOT NULL,
  birthday DATE NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_black_list BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url VARCHAR(500) NULL,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES role(role_id),

  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_mobile UNIQUE (mobile_phone)
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

  checkin_time DATETIME NOT NULL,
  checkout_time DATETIME NOT NULL,

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
  status ENUM('New','In Progress','On Hold','Completed','Rejected') NOT NULL DEFAULT 'New',

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
CREATE INDEX idx_booking_user_id ON booking(user_id);
CREATE INDEX idx_booking_room_id ON booking(room_id);
CREATE INDEX idx_booking_status ON booking(status);
CREATE INDEX idx_invoice_booking_id ON invoice(booking_id);
CREATE INDEX idx_payment_invoice_id ON payment(invoice_id);
CREATE INDEX idx_mr_booking_id ON maintenance_request(booking_id);
CREATE INDEX idx_mr_status_priority ON maintenance_request(status, priority);
CREATE INDEX idx_feedback_booking_id ON feedback(booking_id);

USE hms_db;
-- 1 customer
INSERT INTO users (
  role_id, mobile_phone, first_name, middle_name, last_name,
  birthday, email, password, is_black_list, is_active, avatar_url
) VALUES (
  3, '0901234567', 'Nguyen', NULL, 'An',
  '2002-05-14', 'customer1@example.com', '$2a$10$WVUjIHe8jOAvMwzIYVTNROypIQN.fOtyFdG5W.vx9fxj84w.NEGZq', -- 123456
  FALSE, TRUE, NULL
);

-- 1 admin
INSERT INTO users (
  role_id, mobile_phone, first_name, middle_name, last_name,
  birthday, email, password, is_black_list, is_active, avatar_url
) VALUES (
  1, '0909998888', 'Tran', NULL, 'Admin',
  '1998-01-20', 'admin1@example.com', '$2a$10$WVUjIHe8jOAvMwzIYVTNROypIQN.fOtyFdG5W.vx9fxj84w.NEGZq',-- 123456
  FALSE, TRUE, NULL
);
