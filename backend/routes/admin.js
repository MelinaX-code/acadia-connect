const express = require('express');
const User = require('../models/User');
const adminAuth = require('../middleware/admin');
const pool = require('../db/pool');

const router = express.Router();

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const rows = await User.listAll();
    res.json(rows.map(User.rowToPublicUser));
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const row = await User.findById(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(User.rowToPublicUser(row));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin can update any field)
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { firstName, lastName, fullName, email, gender, country, department, role, isAdmin, password } = req.body;

    const patch = {};
    if (firstName) patch.firstName = firstName;
    if (lastName) patch.lastName = lastName;
    if (fullName) patch.fullName = fullName;
    if (email) patch.email = email;
    if (gender) patch.gender = gender;
    if (country) patch.country = country;
    if (department) patch.department = department;
    if (role) patch.role = role;
    if (isAdmin !== undefined) patch.isAdmin = isAdmin;
    if (password) {
      const passwordOk = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/.test(String(password));
      if (!passwordOk) {
        return res.status(400).json({ error: 'Password must be at least 6 characters and include at least one uppercase and one lowercase letter' });
      }
      patch.password = password;
    }

    const updatedRow = await User.adminUpdateUser(req.params.id, patch);

    if (!updatedRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: User.rowToPublicUser(updatedRow),
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

    const deletedRow = await User.deleteUser(req.params.id);

    if (!deletedRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully',
      deletedUser: deletedRow.full_name,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Make user an admin
router.post('/users/:id/make-admin', adminAuth, async (req, res) => {
  try {
    const updatedRow = await User.adminUpdateUser(req.params.id, { isAdmin: true });

    if (!updatedRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User is now an admin',
      user: User.rowToPublicUser(updatedRow),
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

    const updatedRow = await User.adminUpdateUser(req.params.id, { isAdmin: false });

    if (!updatedRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Admin status removed from user',
      user: User.rowToPublicUser(updatedRow),
    });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({ error: 'Failed to update user admin status' });
  }
});

// Get admin dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [[totalUsersRow]] = await pool.execute('SELECT COUNT(*) AS c FROM users');
    const [[adminUsersRow]] = await pool.execute('SELECT COUNT(*) AS c FROM users WHERE is_admin = 1');
    const [[internationalRow]] = await pool.execute("SELECT COUNT(*) AS c FROM users WHERE role = 'international'");
    const [[localRow]] = await pool.execute("SELECT COUNT(*) AS c FROM users WHERE role = 'local'");

    res.json({
      totalUsers: Number(totalUsersRow.c || 0),
      adminUsers: Number(adminUsersRow.c || 0),
      internationalStudents: Number(internationalRow.c || 0),
      localStudents: Number(localRow.c || 0),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
