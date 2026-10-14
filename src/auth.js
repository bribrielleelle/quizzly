// Authentication routes: register, login, logout, me.
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const { requireAuth } = require('./middleware');

const router = express.Router();

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const body = req.body || {};
    const username = (body.username || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const inviteCode = (body.inviteCode || '').trim();

    // --- Validation with friendly messages ---
    if (!USERNAME_PATTERN.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-20 letters, numbers, or underscores.' });
    }
    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Invite code (optional) upgrades the account to teacher.
    const role =
      inviteCode && process.env.TEACHER_INVITE_CODE && inviteCode === process.env.TEACHER_INVITE_CODE
        ? 'teacher'
        : 'player';

    // --- Hash the password BEFORE it goes anywhere near the database ---
    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, role',
      [username, email, passwordHash, role]
    );

    const user = rows[0];
    req.session.userId = user.id; // auto-login after registering
    res.status(201).json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    // Unique-constraint violations get friendly messages instead of a raw 500.
    if (err.code === '23505') {
      if (err.constraint === 'users_username_key') {
        return res.status(409).json({ error: 'That username is already taken — try another.' });
      }
      if (err.constraint === 'users_email_key') {
        return res.status(409).json({ error: 'An account with that email already exists. Try logging in.' });
      }
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const body = req.body || {};
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Enter your email and password.' });
    }

    const { rows } = await pool.query(
      'SELECT id, username, role, password_hash FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];

    // Same message either way: don't reveal whether the email exists.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    req.session.userId = user.id;
    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

// GET /api/auth/me — who am I? (used by the frontend on every page load)
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user); // { id, username, role }
});

module.exports = { authRouter: router };
