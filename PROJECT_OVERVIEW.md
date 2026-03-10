# Acadia Connect - Project Overview

## What We Have Built ✅

### **Architecture Overview**
```
Frontend (HTML/CSS/JS) ← API Calls → Backend (Express.js) ← Database (MariaDB/MySQL)
```

### **Frontend Files:**
- `login.html` - Login/Register page
- `index.html` - Home page (site entry point)
- `home.html` - Legacy redirect stub → `index.html`
- `admin-dashboard.html` - Admin panel (NEW! ✨)
- `resources.html` - Resources page
- `about.html` - About page
- `profile.html` - User profile page (VIEW & EDIT)
- `browse-students.html` - Find students
- `suggested-connections.html` - Suggested matches
- `messages.html` - Messaging system
- `student-detail.html` - Student profile view
- `style.css` - All styling (modernized design)
- `script.js` - Form handling
- `api.js` - All API calls to backend

### **Backend Files:**
Located in `/backend` folder:
- `server.js` - Express server (runs on port 3001)
- `package.json` - Dependencies
- `.env` - Configuration (DB_* connection settings)
- `db/pool.js` - MariaDB/MySQL connection pool
- `models/User.js` - SQL-backed user model (with admin field)
- `models/Message.js` - SQL-backed message model
- `routes/auth.js` - Register/Login endpoints
- `routes/profile.js` - Get/Update profile endpoints
- `routes/messages.js` - Messaging endpoints
- `routes/admin.js` - Admin management endpoints (NEW! ✨)
- `middleware/auth.js` - JWT token verification
- `middleware/admin.js` - Admin-only route protection (NEW! ✨)

### **Database:**
- MariaDB/MySQL
- Schema + seed scripts live in `backend/sql/`
- Stores: Users (UUID id) with email/password (bcrypt), profile info, and messages

---

## Authentication System Explained

### **How It Works:**
1. User registers → Password hashed with Bcrypt → Saved to MariaDB/MySQL
2. User logs in → Password compared → JWT token generated → Stored in browser
3. User accesses profile → JWT token sent with request → Backend verifies → Returns data

### **Technology:**
- **JWT (JSON Web Tokens)** - For session management
- **Bcrypt** - For password hashing
- **MariaDB/MySQL** - For data storage
- **Express.js** - For backend API

---

## Current Features ✅

### **Working:**
- ✅ User Registration
- ✅ User Login
- ✅ Home page entry (logged-out landing / logged-in experience)
- ✅ View & Edit Profile (Full Name, Email, Year, Department, Country, Languages, Bio, Hobbies, Interests)
- ✅ Upload Profile Photo
- ✅ User Logout
- ✅ Protected Profile Page (only accessible if logged in)
- ✅ Browse Students + Student Detail pages
- ✅ Suggested Connections
- ✅ Messaging System
- ✅ Admin Dashboard (admin-only)

### **NOT Yet Implemented:**
- ❌ Create/Join Groups/Meetups (if desired)

---

## Project Structure

```
Capstone Project/
├── frontend files:
│   ├── index.html
│   ├── login.html
│   ├── home.html (redirect stub)
│   ├── resources.html
│   ├── about.html
│   ├── profile.html (NEW)
│   ├── style.css
│   ├── script.js
│   └── api.js (UPDATED)
│
└── backend/
    ├── server.js
    ├── package.json
  ├── .env (DB connection)
  ├── db/
  │   └── pool.js
  ├── sql/
  │   ├── 001_schema.sql
  │   └── 002_seed.sql
    ├── models/
  │   ├── User.js
  │   └── Message.js
    ├── routes/
    │   ├── auth.js
  │   ├── profile.js
  │   ├── messages.js
  │   └── admin.js
    └── middleware/
    ├── auth.js
    └── admin.js
```

---

## To Run Everything

### **Step 1: Start MariaDB/MySQL**
Make sure MariaDB/MySQL is running locally.

Create the database + tables and seed sample data using the SQL scripts in `backend/sql/`.

### **Step 2: Start Backend**
```bash
cd "Capstone Project/backend"
npm run dev
```
Backend runs on: `http://localhost:3001`

### **Step 3: Open Frontend**
Open any `.html` file in your browser

---

## What Happens When User Registers/Logs In

### **Registration Flow:**
1. User fills form (name, email, password, role)
2. Clicks "Register"
3. Frontend sends data to `POST /api/auth/register`
4. Backend hashes password + saves to MariaDB/MySQL
5. Backend returns JWT token
6. Frontend stores token in `localStorage`
7. Frontend redirects to `index.html`
8. Home page shows the logged-in experience

### **Login Flow:**
1. User enters email + password
2. Clicks "Login"
3. Frontend sends data to `POST /api/auth/login`
4. Backend verifies password against MariaDB/MySQL record
5. Backend returns JWT token if password correct
6. Frontend stores token in `localStorage`
7. Frontend redirects to `index.html`

---

## User Data (stored in SQL)

When a user registers, this is the *shape* the frontend works with:
```json
{
  "_id": "uuid",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "department": "Computer Science",
  "password": "hashed-bcrypt-password",
  "role": "international",
  "profile": {
    "bio": "I love...",
    "hobbies": ["gaming", "reading"],
    "interests": ["CS", "AI"],
    "year": "2nd Year",
    "country": "India",
    "languages": ["English", "Hindi"],
    "photo": "base64-image-data"
  },
  "createdAt": "2026-02-16T...",
  "updatedAt": "2026-02-16T..."
}
```

---

## Next Steps (What We Should Build)

1. **Browse Students** - See profiles of other students
2. **Search/Filter** - Find students by department, interests, languages, etc.
3. **Messaging** - Send messages to other students
4. **Groups/Meetups** - Create or join study groups, social events
5. **Save Favorites** - Save favorite student profiles
6. **Notifications** - Get notified of messages, new friends

---

## Questions to Ask Yourself

- Do you want students to be able to see each other's profiles?
- How should students find each other? (Search bar? Recommendation algorithm?)
- Should there be a messaging system?
- Do you want group creation features?

Let me know which feature you want to build next! 🚀
