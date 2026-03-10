-- Acadia Connect - MariaDB/MySQL schema
-- Run with: mysql -u root -p < backend/sql/001_schema.sql

CREATE DATABASE IF NOT EXISTS acadia_connect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE acadia_connect;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('international', 'local') NOT NULL,
  gender ENUM('male', 'female') NULL,
  department VARCHAR(255) NULL,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,

  profile_bio TEXT NULL,
  profile_hobbies_json JSON NULL,
  profile_interests_json JSON NULL,
  profile_year VARCHAR(50) NULL,
  profile_country VARCHAR(100) NULL DEFAULT 'Canada',
  profile_languages_json JSON NULL,
  profile_photo LONGTEXT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uniq_users_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_messages_sender_receiver_created (sender_id, receiver_id, created_at),
  KEY idx_messages_receiver_read (receiver_id, is_read),

  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uniq_reset_token_hash (token_hash),
  KEY idx_reset_user (user_id),
  KEY idx_reset_expires (expires_at),

  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
