// Authorization middleware.
const pool = require('./db');

// Requires a valid session. Loads the user fresh from the DB on every request,
// so role changes take effect immediately (no stale session role).
async function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Please log in first.' });
    }
    const { rows } = await pool.query(
      'SELECT id, username, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = rows[0];
    if (!user) {
      req.session = null; // account was deleted — clean up the stale session
      return res.status(401).json({ error: 'Please log in first.' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Requires the logged-in user to be a teacher. Use after requireAuth.
function requireTeacher(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Please log in first.' });
  }
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Teacher access only.' });
  }
  next();
}

module.exports = { requireAuth, requireTeacher };
