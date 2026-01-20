-- V2__seed_initial_data.sql
-- 0. tạo bảng role_permissions
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE NO ACTION
);
-- 1. Tạo các Roles
INSERT INTO roles (name) VALUES
('ADMIN'),
('FRONT_DESK'),
('HOUSEKEEPING'),
('ACCOUNTING'),
('MAINTENANCE');

-- 2. Tạo các Permissions UNIQUE (chỉ insert mỗi tên 1 lần)
INSERT INTO permissions (name) VALUES
('USER_ACCOUNT_MANAGE'),
('EMPLOYEE_MANAGE'),
('CUSTOMER_MANAGE'),
('ROOM_RATE_STATUS_MANAGE'),
('REPORT_VIEW_ALL'),

('BOOKING_CREATE'),
('BOOKING_UPDATE'),
('CHECK_IN'),
('CHECK_OUT'),
('ROOM_VIEW_STATUS'),          -- Chỉ insert 1 lần
('CUSTOMER_INFO_VIEW'),
('REPORT_VIEW_BASIC'),

('ROOM_MODIFY_STATUS'),        -- Chỉ insert 1 lần
('CLEANING_REQUEST_CREATE'),
('CLEANING_REQUEST_VIEW'),

('REPORT_VIEW_FINANCE'),
('REPORT_INVOICE'),
('COST_TRACKING'),
('HOUSEKEEPING_INFO_VIEW'),

('MAINTENANCE_REQUEST_CREATE'),
('MAINTENANCE_REQUEST_VIEW'),
('PURCHASE_REQUEST_SUBMIT');

-- 3. Gán permissions cho từng role qua bảng trung gian role_permissions
-- ADMIN: tất cả permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN';

-- FRONT_DESK
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'FRONT_DESK'
  AND p.name IN (
    'BOOKING_CREATE', 'BOOKING_UPDATE', 'CHECK_IN', 'CHECK_OUT',
    'ROOM_VIEW_STATUS', 'CUSTOMER_INFO_VIEW', 'REPORT_VIEW_BASIC'
  );

-- HOUSEKEEPING
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'HOUSEKEEPING'
  AND p.name IN (
    'ROOM_MODIFY_STATUS', 'CLEANING_REQUEST_CREATE', 'CLEANING_REQUEST_VIEW',
    'ROOM_VIEW_STATUS'
  );

-- ACCOUNTING
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ACCOUNTING'
  AND p.name IN (
    'REPORT_VIEW_FINANCE', 'REPORT_INVOICE', 'COST_TRACKING', 'HOUSEKEEPING_INFO_VIEW'
  );

-- MAINTENANCE
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'MAINTENANCE'
  AND p.name IN (
    'MAINTENANCE_REQUEST_CREATE', 'MAINTENANCE_REQUEST_VIEW',
    'PURCHASE_REQUEST_SUBMIT', 'ROOM_MODIFY_STATUS'
  );

-- 4. Tạo tài khoản mẫu (password "123456" đã hash bằng BCrypt cost 10)
INSERT INTO users (username, password, role_id) VALUES
('admin',         '$2y$10$/x.zos./ezoad1QnYjVwZOxC1iP1JDnBcIMFhEEQN01oOFK7PIo/2', (SELECT id FROM roles WHERE name = 'ADMIN')),
('frontdesk',    '$2y$10$/x.zos./ezoad1QnYjVwZOxC1iP1JDnBcIMFhEEQN01oOFK7PIo/2', (SELECT id FROM roles WHERE name = 'FRONT_DESK')),
('housekeep',    '$2y$10$/x.zos./ezoad1QnYjVwZOxC1iP1JDnBcIMFhEEQN01oOFK7PIo/2', (SELECT id FROM roles WHERE name = 'HOUSEKEEPING')),
('accounting',   '$2y$10$/x.zos./ezoad1QnYjVwZOxC1iP1JDnBcIMFhEEQN01oOFK7PIo/2', (SELECT id FROM roles WHERE name = 'ACCOUNTING')),
('maintenance',  '$2y$10$/x.zos./ezoad1QnYjVwZOxC1iP1JDnBcIMFhEEQN01oOFK7PIo/2', (SELECT id FROM roles WHERE name = 'MAINTENANCE'));