-- Acadia Connect - Migration helper
-- NOTE: This file is only needed if you already created the DB with an older schema.
-- If you already created the DB with an older schema, run this to add the new registration fields.
-- Run with: mysql -u root -p acadia_connect < backend/sql/003_alter_users_add_registration_fields.sql

USE acadia_connect;

ALTER TABLE users
  ADD COLUMN first_name VARCHAR(100) NOT NULL DEFAULT '' AFTER id,
  ADD COLUMN last_name VARCHAR(100) NOT NULL DEFAULT '' AFTER first_name,
  ADD COLUMN gender ENUM('male', 'female') NULL AFTER role,
  ADD COLUMN department VARCHAR(255) NULL AFTER gender;

ALTER TABLE users
  MODIFY COLUMN profile_country VARCHAR(100) NULL DEFAULT 'Canada';

-- Best-effort backfill for existing users
UPDATE users
SET
  first_name = CASE
    WHEN first_name <> '' THEN first_name
    WHEN LOCATE(' ', full_name) > 0 THEN SUBSTRING_INDEX(full_name, ' ', 1)
    ELSE full_name
  END,
  last_name = CASE
    WHEN last_name <> '' THEN last_name
    WHEN LOCATE(' ', full_name) > 0 THEN SUBSTRING(full_name, LOCATE(' ', full_name) + 1)
    ELSE ''
  END
WHERE first_name = '' OR last_name = '';

-- Backfill/recompute full_name from first_name + last_name
UPDATE users
SET full_name = TRIM(CONCAT(first_name, ' ', last_name))
WHERE (full_name IS NULL OR full_name = '')
  AND (first_name <> '' OR last_name <> '');
