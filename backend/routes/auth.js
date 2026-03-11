const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendPasswordResetEmail } = require('../utils/mailer');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function isDuplicateEmailError(err) {
  // MySQL: ER_DUP_ENTRY (errno 1062) for unique index violations
  const code = err?.code;
  const errno = err?.errno;
  const msg = String(err?.sqlMessage || err?.message || '');
  return (
    code === 'ER_DUP_ENTRY' ||
    errno === 1062 ||
    /duplicate entry/i.test(msg)
  ) && /email|uniq_users_email/i.test(msg);
}

function validateEmailFormat(email) {
  const value = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getResetTtlMinutes() {
  const n = Number(process.env.RESET_TOKEN_TTL_MINUTES || 60);
  return Number.isFinite(n) && n > 0 ? n : 60;
}

function computeFrontendBaseUrl(req) {
  const headerOrigin = req.headers.origin;
  const env = process.env.FRONTEND_URL;
  const base = headerOrigin || env || '';
  return String(base).replace(/\/$/, '');
}

function normalizeStringArray(value) {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    return value
      .map(v => String(v ?? '').trim())
      .filter(v => v.length > 0);
  }
  // Accept comma-separated strings as a convenience
  return String(value)
    .split(',')
    .map(v => v.trim())
    .filter(v => v.length > 0);
}

// Register
router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      gender,
      role,
      country,
      department,
      password,
      confirmPassword,
      photo,
      bio,
      hobbies,
      interests,
      year,
      languages,
    } = req.body;

    const normalizedEmail = String(email || '').toLowerCase().trim();
    const normalizedFirstName = String(firstName || '').trim();
    const normalizedLastName = String(lastName || '').trim();
    const normalizedGender = String(gender || '').trim();
    const normalizedRole = String(role || '').trim();
    const normalizedCountry = String(country || 'Canada').trim() || 'Canada';
    const normalizedDepartment = String(department || '').trim();

    const normalizedBio = bio !== undefined && bio !== null ? String(bio).trim() : undefined;
    const normalizedHobbies = normalizeStringArray(hobbies);
    const normalizedInterests = normalizeStringArray(interests);
    const normalizedYear = year !== undefined && year !== null ? String(year).trim() : undefined;
    const normalizedLanguages = normalizeStringArray(languages);

    // Validate input
    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !password || !normalizedGender || !normalizedRole || !normalizedDepartment) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (confirmPassword !== undefined && String(confirmPassword) !== String(password)) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Password: >= 6 chars, contains upper and lower
    const passwordStr = String(password);
    const passwordOk = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/.test(passwordStr);
    if (!passwordOk) {
      return res.status(400).json({ error: 'Password must be at least 6 characters and include at least one uppercase and one lowercase letter' });
    }

    if (!['male', 'female'].includes(normalizedGender)) {
      return res.status(400).json({ error: 'Invalid gender' });
    }

    if (!['international', 'local'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    let normalizedPhoto = null;
    if (photo !== undefined && photo !== null && String(photo).trim() !== '') {
      normalizedPhoto = String(photo);
      if (!normalizedPhoto.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid photo format' });
      }
      // Guardrail: avoid huge payloads (roughly 2MB base64-ish)
      if (normalizedPhoto.length > 3_000_000) {
        return res.status(400).json({ error: 'Photo is too large' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const userRow = await User.createUser({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
      password: passwordStr,
      role: normalizedRole,
      gender: normalizedGender,
      country: normalizedCountry,
      department: normalizedDepartment,
      photo: normalizedPhoto,
      bio: normalizedBio,
      hobbies: normalizedHobbies,
      interests: normalizedInterests,
      year: normalizedYear,
      languages: normalizedLanguages,
    });
    const publicUser = User.rowToPublicUser(userRow);

    // Generate JWT token
    const token = jwt.sign(
      { userId: userRow.id, email: userRow.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: publicUser._id,
        fullName: publicUser.fullName,
        email: publicUser.email,
        role: publicUser.role,
        isAdmin: publicUser.isAdmin,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    if (isDuplicateEmailError(error)) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email || '').toLowerCase().trim();

    // Find user
    const userRow = await User.findByEmail(normalizedEmail);
    if (!userRow) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await User.comparePassword(userRow, password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const publicUser = User.rowToPublicUser(userRow);

    // Generate JWT token
    const token = jwt.sign(
      { userId: userRow.id, email: userRow.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: publicUser._id,
        fullName: publicUser.fullName,
        email: publicUser.email,
        role: publicUser.role,
        isAdmin: publicUser.isAdmin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot password (request a reset link)
router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();

    // Always respond with a generic message to avoid account enumeration
    const genericResponse = { message: 'If the email exists, a password reset link has been sent' };

    if (!email || !validateEmailFormat(email)) {
      return res.json(genericResponse);
    }

    const userRow = await User.findByEmail(email);
    if (!userRow) {
      return res.json(genericResponse);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const ttlMinutes = getResetTtlMinutes();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await PasswordResetToken.createForUser(userRow.id, token, expiresAt);

    const baseUrl = computeFrontendBaseUrl(req);
    const resetPath = `/reset-password.html?token=${encodeURIComponent(token)}`;
    const resetUrl = baseUrl ? `${baseUrl}${resetPath}` : resetPath;

    await sendPasswordResetEmail({
      to: userRow.email,
      resetUrl,
    });

    return res.json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password (consume token)
router.post('/reset-password', async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const passwordOk = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/.test(password);
    if (!passwordOk) {
      return res.status(400).json({ error: 'Password must be at least 6 characters and include at least one uppercase and one lowercase letter' });
    }

    const consumed = await PasswordResetToken.consume(token);
    if (!consumed) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const updated = await User.adminUpdateUser(consumed.userId, { password });
    if (!updated) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Change password (logged-in user)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    const confirmNewPassword = String(req.body?.confirmNewPassword || '');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const passwordOk = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/.test(newPassword);
    if (!passwordOk) {
      return res.status(400).json({ error: 'Password must be at least 6 characters and include at least one uppercase and one lowercase letter' });
    }

    const userRow = await User.findById(req.user.userId);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ok = await User.comparePassword(userRow, currentPassword);
    if (!ok) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    await User.adminUpdateUser(userRow.id, { password: newPassword });
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
