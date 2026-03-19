# Acadia Connect (Capstone Project)

Acadia Connect is a beginner-friendly social platform concept for students at Acadia University.
It helps students create a profile, discover other students, get suggested matches, and message each other.
There’s also an admin dashboard for managing users.

This repository contains:
- A **static frontend** (plain HTML/CSS/JavaScript files you open in a browser)
- A **backend API** (Node.js + Express)
- A **MariaDB/MySQL database** (schema + seed scripts included)

---

## Big Picture (How the App Works)

**Frontend (your browser)** talks to **Backend (Express API)** over HTTP.
The backend reads/writes data in **MariaDB/MySQL**.

```
Browser (HTML/CSS/JS)  →  http://localhost:3001/api  →  Express server  →  MariaDB/MySQL
```

### What “logging in” means here

When you log in successfully:
- The backend returns a **JWT token** (a signed “proof” that you are logged in).
- The frontend saves it in your browser’s **localStorage** as:
  - `token` (the JWT)
  - `user` (a small user object like name/email/role/isAdmin)

After that, any API request that needs authentication sends:
```
Authorization: Bearer <token>
```

---

## Quick Start (Local Setup)

### 1) Database: create schema + seed data

The SQL scripts are in `backend/sql/`.

Option A — using the backend helper scripts (recommended):
1. Create `backend/.env` (see `backend/README.md` for the template).
2. From the `backend/` folder:
	```bash
	npm install
	npm run db:reset
	```

Option B — run SQL manually:
```bash
mysql -u root -p < backend/sql/001_schema.sql
mysql -u root -p acadia_connect < backend/sql/002_seed.sql
```

Seeded test login:
- Email: `admin@acadia.test`
- Password: `Password123!`

### 2) Start the backend API

The frontend is configured to call `http://localhost:3001/api`.
So make sure the backend runs on port **3001**.

From `acadia-connect/backend`:
```bash
npm install
npm run dev
```

You should see something like:
- `Server running on http://localhost:3001`
- `MariaDB/MySQL connected successfully`

### 3) Open the frontend

Since the frontend is static HTML, you can open `index.html` in a browser.

Tip: if you use a small static server (for example VS Code Live Server), password-reset links are easier to test because they have a consistent base URL.

---

## User Workflows (Beginner-Friendly Walkthrough)

### Workflow A — Register a new account

1. Open `register.html`.
2. Fill in:
	- Name, email
	- Role (International / Local)
	- Department, country
	- Password
3. The browser sends your data to the backend:
	- `POST /api/auth/register`
4. The backend:
	- Validates fields
	- Hashes the password with bcrypt
	- Saves the user in the `users` table
	- Returns a JWT token + basic user info
5. The frontend stores `token` + `user` in localStorage.

### Workflow B — Login (and automatic redirect)

1. Open `login.html`.
2. Enter your email + password.
3. The browser calls:
	- `POST /api/auth/login`
4. If the password matches, the backend returns `token` + `user`.
5. The frontend stores them in localStorage.
6. Redirect behavior:
	- If `user.isAdmin === true` → goes to **Admin Dashboard** (`admin-dashboard.html`)
	- Otherwise → goes to **Messages** (`messages.html`)

### Workflow C — Logout

Logging out is simply:
- Removing `token` and `user` from localStorage
- Redirecting you back to `index.html`

### Workflow D — View / Edit your profile

There are two “profile” experiences:

1) **Profile page (`profile.html`)**
- On load, the page checks you are logged in.
- It requests your profile from the backend:
  - `GET /api/profile/me`
- To save changes, it sends:
  - `PUT /api/profile/me`

2) **Student Detail (`student-detail.html`)**
- Shows another student’s profile by user id (from the URL query string).
- Fetches from:
  - `GET /api/profile/:userId`

Profile photos are stored as a Data URL (base64 image string) in the database.

### Workflow E — Find students (search + filters)

Page: `browse-students.html`

1. The page loads the full list:
	- `GET /api/profile/all`
2. Filtering and searching happen in the browser:
	- Role (International/Local)
	- Country
	- Department
	- Text search against name/department/country + interests/hobbies/languages
3. Clicking a student card navigates to:
	- `student-detail.html?id=<studentId>`

### Workflow F — Suggested connections (matching)

Page: `suggested-connections.html`

1. The frontend requests suggestions from the backend:
	- `GET /api/profile/suggestions/connections`
2. The backend scores other users based on:
	- Shared interests / hobbies (high weight)
	- Same department
	- Shared languages
	- Same year
	- Bonus if international/local roles differ *and* there is real overlap
3. The page shows the “best matches” as cards.
4. You can click to view a profile or start a message.

### Workflow G — Messaging (Direct Messages)

Page: `messages.html`

1) **Conversation list (left side)**
- The app calls:
  - `GET /api/messages/conversations`
- For each conversation, the backend calculates an `unreadCount`.

2) **Opening a chat (right side)**
- When you click a conversation, the app calls:
  - `GET /api/messages/conversation/:userId`
- The backend returns:
  - `otherUser`
  - `messages` (the history)
  - and it marks messages from that user as read in the DB.

3) **New messages while the chat is open**
- When a direct chat is active, the page refreshes that chat’s message list frequently so new incoming messages appear immediately in the open chat window.
- The “NEW (x)” badge is only shown for chats you are **not** currently viewing.

4) **Sending a message**
- The page calls:
  - `POST /api/messages/send`
  with `{ receiverId, content }`

### Workflow H — Group chat

Group chat is also on `messages.html` under the **Groups** mode.

Core endpoints:
- List your groups: `GET /api/groups`
- Create a group: `POST /api/groups` (creator auto-joins)
- Join a group by name: `POST /api/groups/join`
- Load group messages: `GET /api/groups/:groupId/messages`
- Send group message: `POST /api/groups/:groupId/messages`
- Add member (must already be a member): `POST /api/groups/:groupId/members`

### Workflow I — Password reset (Forgot password)

1. On `forgot-password.html`, enter your email.
2. The frontend calls:
	- `POST /api/auth/forgot-password`
3. The backend:
	- Creates a short-lived reset token
	- Sends an email (via SMTP settings in `.env`)
	- If SMTP isn’t configured, it logs the reset link to the backend console
4. The reset link opens `reset-password.html?token=...`.
5. Submitting the new password calls:
	- `POST /api/auth/reset-password`

### Workflow J — Admin dashboard

Page: `admin-dashboard.html`

**Who can access it?**
- Only users with `is_admin = 1` in the database.
- The backend protects admin endpoints using `middleware/admin.js`.

**How you reach it**
- Admin users are redirected to the dashboard right after login.
- The homepage and Messages page also show an “🔧 Admin” link for admins.

**What the dashboard does**
1) Loads statistics:
- `GET /api/admin/stats`

2) Loads user list:
- `GET /api/admin/users`

3) User management:
- Edit user: `PUT /api/admin/users/:id`
- Delete user: `DELETE /api/admin/users/:id`
- Promote to admin: `POST /api/admin/users/:id/make-admin`
- Revoke admin: `POST /api/admin/users/:id/remove-admin`

Note: the admin dashboard is a UI for admins; it does not replace backend authorization.
Even if someone types the URL manually, non-admin API calls will be rejected by the server.

---

## Folder Guide (Where to Look)

Frontend (root `acadia-connect/`):
- `index.html` — entry point (redirects logged-in users)
- `login.html` / `register.html` — auth UI
- `profile.html` — view/edit your profile
- `browse-students.html` / `student-detail.html` — discovery + profile viewing
- `suggested-connections.html` — matching UI
- `messages.html` — direct + group chat UI
- `admin-dashboard.html` — admin-only management UI
- `api.js` — browser-side API helper (adds JWT token header)
- `script.js` — form handlers (login/register/reset/change password)
- `style.css` — shared styles

Backend (`backend/`):
- `server.js` — Express app + routes
- `routes/` — API endpoints (auth/profile/messages/groups/admin)
- `models/` — DB queries and data shaping
- `middleware/auth.js` — requires a valid JWT
- `middleware/admin.js` — requires user `is_admin = 1`
- `sql/` — schema + seed + migrations

---

## Troubleshooting

**Frontend can’t reach the API**
- Check the backend is running on `http://localhost:3001`.
- The frontend uses `api.js` with `API_BASE_URL = 'http://localhost:3001/api'`.

**Password reset email doesn’t arrive**
- Configure SMTP in `backend/.env`.
- If SMTP isn’t configured, check the backend console output for the reset link.

**Database errors**
- Confirm MySQL/MariaDB is running.
- Confirm `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME` in `backend/.env`.

---

## More Details

- See `PROJECT_OVERVIEW.md` for a quick feature + file summary.
- See `backend/README.md` for backend configuration and endpoint details.