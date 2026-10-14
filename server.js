// QuizWhiz server — one Express server serves the static frontend AND the API.
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');

const authRouter = require('./src/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---------------------------------------------------------
app.use(express.json());

// Signed cookie sessions (httpOnly so JS in the page can't read the cookie).
app.use(
  cookieSession({
    name: 'quizwhiz-session',
    keys: [process.env.SESSION_SECRET || 'dev-only-not-for-production'],
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // one week
  })
);

// --- API routes ---------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'QuizWhiz' });
});

app.use('/api/auth', authRouter);

// --- Static frontend ----------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// --- Error handler (Express 5 forwards async errors here automatically) -
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.publicMessage || 'Something went wrong. Try again.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('QuizWhiz listening on port ' + PORT);
});
