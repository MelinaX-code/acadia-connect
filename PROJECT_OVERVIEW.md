# Acadia Connect - Project Overview

## What We Have Built ✅

### **Architecture Overview**
```
Frontend (HTML/CSS/JS) ← API Calls → Backend (Express.js) ← Database (MongoDB)
```

### **Frontend Files:**
- `index.html` - Login/Register page
- `home.html` - Home page
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
- `.env` - Configuration (MongoDB connection)
- `models/User.js` - Database schema (with admin field)
- `routes/auth.js` - Register/Login endpoints
- `routes/profile.js` - Get/Update profile endpoints
- `routes/messages.js` - Messaging endpoints
- `routes/admin.js` - Admin management endpoints (NEW! ✨)
- `middleware/auth.js` - JWT token verification
- `middleware/admin.js` - Admin-only route protection (NEW! ✨)

### **Database:**
- MongoDB (running in Docker)
- Stores: Users with email, password (hashed), and profile info

---

## Authentication System Explained

### **How It Works:**
1. User registers → Password hashed with Bcrypt → Saved to MongoDB
2. User logs in → Password compared → JWT token generated → Stored in browser
3. User accesses profile → JWT token sent with request → Backend verifies → Returns data

### **Technology:**
- **JWT (JSON Web Tokens)** - For session management
- **Bcrypt** - For password hashing
- **MongoDB** - For data storage
- **Express.js** - For backend API

---

## Current Features ✅

### **Working:**
- ✅ User Registration
- ✅ User Login
- ✅ View Profile (Full Name, Email, Year, Major, Country, Languages, Bio, Hobbies, Interests)
- ✅ Edit Profile
- ✅ Upload Profile Photo
- ✅ User Logout
- ✅ Protected Profile Page (only accessible if logged in)

### **NOT Yet Implemented:**
- ❌ View Other Students' Profiles
- ❌ Find/Match Students by Interests
- ❌ Messaging System
- ❌ Create/Join Groups/Meetups

---

## Project Structure

```
Capstone Project/
├── frontend files:
│   ├── index.html
│   ├── home.html
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
    ├── .env (MongoDB connection)
    ├── models/
    │   └── User.js (UPDATED with more fields)
    ├── routes/
    │   ├── auth.js
    │   └── profile.js
    └── middleware/
        └── auth.js
```

---

## To Run Everything

### **Step 1: Start MongoDB Docker**
MongoDB should already be running in Docker (port 27017)

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
4. Backend hashes password + saves to MongoDB
5. Backend returns JWT token
6. Frontend stores token in `localStorage`
7. Frontend redirects to `profile.html`
8. Page loads and shows user's profile

### **Login Flow:**
1. User enters email + password
2. Clicks "Login"
3. Frontend sends data to `POST /api/auth/login`
4. Backend verifies password against MongoDB record
5. Backend returns JWT token if password correct
6. Frontend stores token in `localStorage`
7. Frontend redirects to `profile.html`

---

## User Data in MongoDB

When a user registers, this is saved:
```json
{
  "_id": "auto-generated-id",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "hashed-bcrypt-password",
  "role": "international",
  "profile": {
    "bio": "I love...",
    "hobbies": ["gaming", "reading"],
    "interests": ["CS", "AI"],
    "major": "Computer Science",
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
2. **Search/Filter** - Find students by major, interests, languages, etc.
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
