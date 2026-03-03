const express = require('express');
const User = require('../models/User');
const adminAuth = require('../middleware/admin');

const router = express.Router();

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin can update any field)
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { fullName, email, role, isAdmin, password } = req.body;
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (password) {
      updateData.password = password;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully',
      deletedUser: user.fullName,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Make user an admin
router.post('/users/:id/make-admin', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User promoted to admin',
      user,
    });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({ error: 'Failed to update user admin status' });
  }
});

// Remove admin from user
router.post('/users/:id/remove-admin', adminAuth, async (req, res) => {
  try {
    // Prevent admin from removing their own admin status
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot remove your own admin status' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Admin status removed from user',
      user,
    });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({ error: 'Failed to update user admin status' });
  }
});

// Get admin dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ isAdmin: true });
    const internationalStudents = await User.countDocuments({ role: 'international' });
    const localStudents = await User.countDocuments({ role: 'local' });

    res.json({
      totalUsers,
      adminUsers,
      internationalStudents,
      localStudents,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
