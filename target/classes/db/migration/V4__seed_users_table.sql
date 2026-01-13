-- V5__reset_and_seed_users.sql
-- PURPOSE:
-- 1. Reset all existing users (DEV only)
-- 2. Seed users with correct BCrypt password (Hashed version of 123456)

--------------------------------------------------
-- STEP 1: DELETE ALL EXISTING USERS
--------------------------------------------------
DELETE FROM users;

--------------------------------------------------
-- STEP 2: SEED USERS AGAIN (NO NUMERIC SUFFIX)
--------------------------------------------------

INSERT INTO users (username, password, role_id)
SELECT 'admin',
       '$2y$10$/x.zos./ezoad1QnYjVwZOxC1iP1JDnBcIMFhEEQN01oOFK7PIo/2',
       r.id
FROM roles r
WHERE r.name = 'ADMIN';

INSERT INTO users (username, password, role_id)
SELECT 'frontdesk',
       '$2y$10$/x.zos./ezoad1QnYjVwZOxC1iP1JDnBcIMFhEEQN01oOFK7PIo/2',
       r.id
FROM roles r
WHERE r.name = 'FRONT_DESK';

INSERT INTO users (username, password, role_id)
SELECT 'housekeeping',
       '$2y$10$/x.zos./ezoad1QnYjVwZOxC1iP1JDnBcIMFhEEQN01oOFK7PIo/2',
       r.id
FROM roles r
WHERE r.name = 'HOUSEKEEPING';

INSERT INTO users (username, password, role_id)
SELECT 'accounting',
       '$2y$10$/x.zos./ezoad1QnYjVwZOxC1iP1JDnBcIMFhEEQN01oOFK7PIo/2',
       r.id
FROM roles r
WHERE r.name = 'ACCOUNTING';

INSERT INTO users (username, password, role_id)
SELECT 'maintenance',
       '$2y$10$/x.zos./ezoad1QnYjVwZOxC1iP1JDnBcIMFhEEQN01oOFK7PIo/2',
       r.id
FROM roles r
WHERE r.name = 'MAINTENANCE';