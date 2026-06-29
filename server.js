require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim());

if (!JWT_SECRET) {
  console.error('Missing JWT_SECRET in .env');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// In-memory "database" — replace with a real DB (Postgres, Mongo, etc) later.
// ---------------------------------------------------------------------------
const users = []; // { id, email, passwordHash, name }
let nextId = 1;

// ---------------------------------------------------------------------------
// Core middleware
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(cookieParser());

// credentials: true is required so the browser sends/receives cookies
// cross-origin (needed when Angular runs on a different port/domain).
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));

const ACCESS_TOKEN_COOKIE = 'access_token';
const XSRF_COOKIE = 'XSRF-TOKEN';
const XSRF_HEADER = 'x-xsrf-token';

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------
function setAuthCookies(res, user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const csrfToken = crypto.randomBytes(32).toString('hex');

  // 1) The JWT itself: httpOnly so client-side JS (and any XSS payload)
  //    can never read it. Sent automatically by the browser on every request.
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,      // true in production (HTTPS only)
    sameSite: 'lax',            // 'none' + secure:true if frontend is on a different domain
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  // 2) The CSRF token: deliberately NOT httpOnly. Angular's HttpClientXsrfModule
  //    (or your own JS) reads this cookie and echoes it back as a header on
  //    every state-changing request. An attacker's cross-site form can't read
  //    cookies from your domain, so it can't forge that header -> CSRF blocked.
  res.cookie(XSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_TOKEN_COOKIE);
  res.clearCookie(XSRF_COOKIE);
}

// ---------------------------------------------------------------------------
// Auth middleware: verifies the JWT cookie on every protected request
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  const token = req.cookies[ACCESS_TOKEN_COOKIE];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// ---------------------------------------------------------------------------
// CSRF middleware: only needed on state-changing methods (POST/PUT/PATCH/DELETE).
// Compares the XSRF cookie value against a header the client must set manually.
// This is the "double submit cookie" pattern.
// ---------------------------------------------------------------------------
function requireCsrf(req, res, next) {
  const cookieToken = req.cookies[XSRF_COOKIE];
  const headerToken = req.headers[XSRF_HEADER];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Create account
app.post('/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (users.find(u => u.email === email.toLowerCase())) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: nextId++,
    email: email.toLowerCase(),
    passwordHash,
    name: name || ''
  };
  users.push(user);

  setAuthCookies(res, user);
  res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } });
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(u => u.email === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  setAuthCookies(res, user);
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// Logout — state-changing, so it goes through CSRF check too
app.post('/auth/logout', requireAuth, requireCsrf, (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true });
});

// Current logged-in user — read-only, no CSRF check needed
app.get('/auth/me', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// Example of a protected, state-changing route to show the CSRF pattern in use
app.put('/account/name', requireAuth, requireCsrf, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.name = req.body.name || user.name;
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
