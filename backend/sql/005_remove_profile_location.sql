-- Acadia Connect - Migration helper
-- NOTE: This file is only needed if you already created the DB with profile_location.
-- Run if your DB was created with profile_location and you want to remove it.
-- Run with: mysql -u root -p acadia_connect < backend/sql/005_remove_profile_location.sql

USE acadia_connect;

ALTER TABLE users
  DROP COLUMN profile_location;
