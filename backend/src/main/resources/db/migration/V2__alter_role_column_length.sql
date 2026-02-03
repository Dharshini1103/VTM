-- Alter the role column to accommodate longer role names like SUPER_ADMIN
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';
