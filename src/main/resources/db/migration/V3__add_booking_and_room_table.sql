-- Bảng phòng
CREATE TABLE rooms (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    room_number NVARCHAR(20) NOT NULL UNIQUE,
    room_type NVARCHAR(50) NOT NULL,        -- SINGLE, DOUBLE, SUITE,...
    status NVARCHAR(20) DEFAULT 'READY'     -- READY, OCCUPIED, DIRTY, MAINTENANCE, CLEANING
        CHECK (status IN ('READY', 'OCCUPIED', 'DIRTY', 'MAINTENANCE', 'CLEANING')),
    floor INT,
    price DECIMAL(10,2)
);

-- Bảng booking
CREATE TABLE bookings (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    booking_code NVARCHAR(50) UNIQUE,
    guest_name NVARCHAR(100) NOT NULL,
    guest_phone NVARCHAR(20),
    guest_id_card NVARCHAR(50),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_id BIGINT NULL,                    -- NULL cho đến khi assign phòng
    status NVARCHAR(20) DEFAULT 'CONFIRMED' -- PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED
        CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED')),
    created_by BIGINT NOT NULL,             -- user FrontDesk tạo
    created_date DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);