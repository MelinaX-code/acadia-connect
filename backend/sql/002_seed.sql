-- Acadia Connect - Seed data
-- Run after schema: mysql -u root -p acadia_connect < backend/sql/002_seed.sql

USE acadia_connect;

-- Password for all seeded accounts: Password123!
-- bcrypt hash generated with bcrypt(10)
SET @PASSWORD_HASH = '$2b$10$w8X5zxfbEGyCr7MYFQ5ZIeh1zl0bq/H4lRjPPXH/jdeMkhsdTU8qm';

-- Clean existing data (optional)
DELETE FROM messages;
DELETE FROM users;

-- Users
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

-- Messages
INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at) VALUES
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Hi Liam! Any tips for settling in?', 0, NOW() - INTERVAL 2 DAY),
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Welcome! Check out the student center events this week.', 0, NOW() - INTERVAL 2 DAY + INTERVAL 10 MINUTE),
('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'Hey Noah, do you know any good running routes?', 0, NOW() - INTERVAL 1 DAY),
('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Yes! The trail near campus is great in the morning.', 1, NOW() - INTERVAL 1 DAY + INTERVAL 15 MINUTE);
