const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// Load environment variables before importing modules that read from process.env
dotenv.config({ override: true });

const pool = require('./db/pool');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

async function connectDB() {
  try {
    await pool.query('SELECT 1');
    console.log('MariaDB/MySQL connected successfully');
  } catch (error) {
    console.error('MariaDB/MySQL connection failed:', error);
    process.exit(1);
  }
}

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
