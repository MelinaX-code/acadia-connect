-- Acadia Connect - DROP + RECREATE database, tables, and seed data
-- WARNING: This will delete ALL data in the acadia_connect database.
-- Run with: mysql -u root -p < backend/sql/000_drop_and_recreate.sql

DROP DATABASE IF EXISTS acadia_connect;

CREATE DATABASE IF NOT EXISTS acadia_connect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE acadia_connect;

-- =========================
-- Schema
-- =========================

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

CREATE TABLE IF NOT EXISTS chat_groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uniq_chat_groups_name (name),
  KEY idx_chat_groups_created_by (created_by),

  CONSTRAINT fk_chat_groups_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_group_members (
  group_id BIGINT UNSIGNED NOT NULL,
  user_id CHAR(36) NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (group_id, user_id),
  KEY idx_group_members_user (user_id),

  CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  group_id BIGINT UNSIGNED NOT NULL,
  sender_id CHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_group_messages_group_created (group_id, created_at),
  KEY idx_group_messages_sender (sender_id),

  CONSTRAINT fk_group_messages_group FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
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

-- =========================
-- Seed data
-- =========================

-- Password for all seeded accounts: Password123!
-- bcrypt hash generated with bcrypt(10)
SET @PASSWORD_HASH = '$2b$10$w8X5zxfbEGyCr7MYFQ5ZIeh1zl0bq/H4lRjPPXH/jdeMkhsdTU8qm';

INSERT INTO users (
  id, first_name, last_name, full_name, email, password_hash, role, gender, department, is_admin,
  profile_bio, profile_hobbies_json, profile_interests_json,
  profile_year, profile_country, profile_languages_json, profile_photo
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Admin',
  'User',
  'Admin User',
  'admin@acadia.test',
  @PASSWORD_HASH,
  'local',
  'male',
  'Computer Science',
  1,
  'Admin account for testing.',
  JSON_ARRAY('reading', 'hiking'),
  JSON_ARRAY('student support', 'community'),
  '4th Year',
  'Canada',
  JSON_ARRAY('English'),
  NULL
),
(
  '22222222-2222-2222-2222-222222222222',
  'Amina',
  'Yusuf',
  'Amina Yusuf',
  'amina@acadia.test',
  @PASSWORD_HASH,
  'international',
  'female',
  'Computer Science',
  0,
  'New to campus and excited to meet people.',
  JSON_ARRAY('photography', 'cooking'),
  JSON_ARRAY('AI', 'web development'),
  '2nd Year',
  'Nigeria',
  JSON_ARRAY('English', 'Hausa'),
  NULL
),
(
  '33333333-3333-3333-3333-333333333333',
  'Liam',
  'Chen',
  'Liam Chen',
  'liam@acadia.test',
  @PASSWORD_HASH,
  'local',
  'male',
  'Business Administration',
  0,
  'Local student, happy to help newcomers.',
  JSON_ARRAY('gaming', 'basketball'),
  JSON_ARRAY('startups', 'machine learning'),
  '3rd Year',
  'Canada',
  JSON_ARRAY('English', 'Mandarin'),
  NULL
),
(
  '44444444-4444-4444-4444-444444444444',
  'Sofia',
  'Alvarez',
  'Sofia Alvarez',
  'sofia@acadia.test',
  @PASSWORD_HASH,
  'international',
  'female',
  'Psychology',
  0,
  'Love meeting people and exploring Nova Scotia.',
  JSON_ARRAY('running', 'music'),
  JSON_ARRAY('design', 'community'),
  '1st Year',
  'Mexico',
  JSON_ARRAY('Spanish', 'English'),
  NULL
),
(
  '55555555-5555-5555-5555-555555555555',
  'Noah',
  'Brown',
  'Noah Brown',
  'noah@acadia.test',
  @PASSWORD_HASH,
  'local',
  'male',
  'Kinesiology',
  0,
  'Into sports and volunteering.',
  JSON_ARRAY('soccer', 'volunteering'),
  JSON_ARRAY('community', 'travel'),
  '2nd Year',
  'Canada',
  JSON_ARRAY('English'),
  NULL
);

INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at) VALUES
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Hi Liam! Any tips for settling in?', 0, NOW() - INTERVAL 2 DAY),
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Welcome! Check out the student center events this week.', 0, NOW() - INTERVAL 2 DAY + INTERVAL 10 MINUTE),
('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'Hey Noah, do you know any good running routes?', 0, NOW() - INTERVAL 1 DAY),
('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Yes! The trail near campus is great in the morning.', 1, NOW() - INTERVAL 1 DAY + INTERVAL 15 MINUTE);

-- Sample group chat
INSERT INTO chat_groups (name, created_by) VALUES
('Campus Friends', '22222222-2222-2222-2222-222222222222');

SET @CAMPUS_FRIENDS_GROUP_ID = LAST_INSERT_ID();

INSERT INTO chat_group_members (group_id, user_id) VALUES
(@CAMPUS_FRIENDS_GROUP_ID, '22222222-2222-2222-2222-222222222222'),
(@CAMPUS_FRIENDS_GROUP_ID, '33333333-3333-3333-3333-333333333333'),
(@CAMPUS_FRIENDS_GROUP_ID, '44444444-4444-4444-4444-444444444444');

INSERT INTO group_messages (group_id, sender_id, content, created_at) VALUES
(@CAMPUS_FRIENDS_GROUP_ID, '22222222-2222-2222-2222-222222222222', 'Hey everyone! Welcome to the group 👋', NOW() - INTERVAL 3 HOUR),
(@CAMPUS_FRIENDS_GROUP_ID, '33333333-3333-3333-3333-333333333333', 'Glad to be here. Anyone going to the student center event?', NOW() - INTERVAL 2 HOUR + INTERVAL 5 MINUTE),
(@CAMPUS_FRIENDS_GROUP_ID, '44444444-4444-4444-4444-444444444444', 'I might! Would love to meet up.', NOW() - INTERVAL 2 HOUR);
