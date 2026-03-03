# Acadia Connect Backend

Backend API for the Acadia Connect platform built with Express and MongoDB.

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

Update `.env` with your MongoDB connection string and JWT secret:
```
MONGODB_URI=mongodb://localhost:27017/acadia-connect
JWT_SECRET=your-super-secret-key
PORT=5000
```

### 3. Start MongoDB

**Option 1: Local MongoDB**
```bash
# Make sure MongoDB is installed and running
mongod
```

**Option 2: MongoDB Atlas (Cloud)**
- Create a free account at https://www.mongodb.com/cloud/atlas
- Create a cluster and get your connection string
- Update MONGODB_URI in `.env`

### 4. Run the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

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
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "international"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
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
  "major": "Computer Science",
  "year": "2nd Year",
  "location": "Wolfville"
}
```

## Frontend Integration

Update your frontend API calls to use:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
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
