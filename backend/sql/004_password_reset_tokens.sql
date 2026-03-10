-- Add password reset token table (for existing databases)
-- NOTE: Not needed for fresh DB creation; the base schema already includes this table.
-- Run with: mysql -u root -p acadia_connect < backend/sql/004_password_reset_tokens.sql

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
