# Acadia Connect Backend

Backend API for the Acadia Connect platform built with Express and MariaDB/MySQL.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update `.env` with your MariaDB/MySQL connection and JWT secret:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=acadia_connect
JWT_SECRET=your-super-secret-key
PORT=3001

# Used to build links in password reset emails
FRONTEND_URL=http://127.0.0.1:5500/acadia-connect

# Password reset token TTL in minutes
RESET_TOKEN_TTL_MINUTES=60

# SMTP settings (Nodemailer)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### 3. Create Database + Tables (SQL)

If you want a clean reset (DROP + RECREATE + SEED) in one command:
```bash
mysql -u root -p < backend/sql/000_drop_and_recreate.sql
```

Or using the Node helper (reads `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD` from `.env`):
```bash
npm run db:reset
```

If your `.sql` file includes `DROP DATABASE` / `CREATE DATABASE`, you typically need admin/root privileges.
You can provide separate admin credentials without changing the app credentials:

```
DB_ADMIN_USER=root
DB_ADMIN_PASSWORD=<your-root-password>
```

Then run:
```bash
npm run db:reset
```

Windows PowerShell (one-time, not saved to disk):
```powershell
$env:DB_ADMIN_USER='root'
$env:DB_ADMIN_PASSWORD='<your-root-password>'
npm run db:init-user
npm run db:reset
npm start
```

To run any SQL file:
```bash
npm run db:run -- sql/001_schema.sql
```

Optional (recommended): create a dedicated DB user for the app instead of using `root`:

```sql
-- Run in MySQL as an admin/root user
CREATE DATABASE IF NOT EXISTS acadia_connect;
CREATE USER IF NOT EXISTS 'acadia_connect_app'@'localhost' IDENTIFIED BY '<CHOOSE_A_PASSWORD>';
GRANT ALL PRIVILEGES ON acadia_connect.* TO 'acadia_connect_app'@'localhost';
FLUSH PRIVILEGES;
```

Then set `DB_USER` / `DB_PASSWORD` in `.env` accordingly.

Alternatively, you can let Node initialize/grant the app DB user (requires admin creds):
```bash
npm run db:init-user
```

Run the schema script:
```bash
mysql -u root -p < backend/sql/001_schema.sql
```

Seed sample users/messages:
```bash
mysql -u root -p acadia_connect < backend/sql/002_seed.sql
```

If you already created the DB with an older schema, run the migration helper(s):
```bash
mysql -u root -p acadia_connect < backend/sql/003_alter_users_add_registration_fields.sql
```

If you created the DB before password reset support was added, also run:
```bash
mysql -u root -p acadia_connect < backend/sql/004_password_reset_tokens.sql
```

If you created the DB with `profile_location` and want it removed, run:
```bash
mysql -u root -p acadia_connect < backend/sql/005_remove_profile_location.sql
```

Seeded login:
- Email: `admin@acadia.test`
- Password: `Password123!`

### 4. Run the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will run on `http://localhost:3001` when `PORT=3001`.

Note: the frontend in this repo is configured to call `http://localhost:3001/api` (see `api.js`), so using `PORT=3001` is the easiest option.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request a password reset link (sends email)
- `POST /api/auth/reset-password` - Reset password using token

### Profile
- `GET /api/profile/me` - Get current user profile (requires auth token)
- `PUT /api/profile/me` - Update current user profile (requires auth token)
- `GET /api/profile/:userId` - Get specific user's profile

### Health Check
- `GET /api/health` - Check if backend is running

## Request Examples

### Register
```json
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "gender": "male",
  "role": "international",
  "country": "Canada",
  "department": "Computer Science",
  "photo": "data:image/png;base64,iVBORw0K...",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

Password policy:
- Minimum 6 characters
- Must include at least one uppercase and one lowercase letter

Photo upload:
- Optional `photo` field can be sent as a Data URL (example: `data:image/jpeg;base64,...`)
- Stored in the `users.profile_photo` column

### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Forgot Password
```json
POST /api/auth/forgot-password
{
  "email": "john@example.com"
}
```

Notes:
- The API always returns a generic success message to avoid account enumeration.
- If SMTP is not configured, the backend logs the reset URL to the console.

### Reset Password
```json
POST /api/auth/reset-password
{
  "token": "<token from email>",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

### Update Profile
```json
PUT /api/profile/me
Authorization: Bearer <token>
{
  "bio": "Computer Science student",
  "hobbies": ["gaming", "reading"],
  "interests": ["web development", "AI"],
  "department": "Computer Science",
  "year": "2nd Year"
}
```

## Frontend Integration

Update your frontend API calls to use:
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

Example:
```javascript
// Register
fetch(`${API_BASE_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'international'
  })
})

// Login
fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
})
```
