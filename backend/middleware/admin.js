const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      const foundUserRow = await User.findById(user.userId);
      
      if (!foundUserRow) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!Boolean(foundUserRow.is_admin)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      req.user = user;
      req.adminUser = User.rowToPublicUser(foundUserRow);
      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
};

module.exports = adminAuth;
