const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const PORT = process.env.PORT || config.port || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const LOG_FILE = path.join(__dirname, 'server.log');
const SESSION_MS = config.sessionTimeoutMinutes * 60 * 1000;
const COOKIE_NAME = 'sid';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- logging (shown on the admin portal) ---------- */
const logs = [];
function log(level, message) {
  const entry = { timestamp: new Date().toISOString(), level, message };
  logs.push(entry);
  if (logs.length > 200) logs.shift();
  console.log(`[${entry.timestamp}] [${level}] ${message}`);
  fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', () => {});
}

/* ---------- user storage (simple JSON file) ---------- */
function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
  catch (e) { return []; }
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* ---------- password hashing ---------- */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), candidate);
}

/* ---------- sessions + cookies ---------- */
const sessions = new Map(); // token -> { username, role, expires }

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}
function setSessionCookie(res, token, maxAgeSeconds) {
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`);
}
function createSession(res, user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username: user.username, role: user.role, expires: Date.now() + SESSION_MS });
  setSessionCookie(res, token, SESSION_MS / 1000);
}

/* ---------- middleware ---------- */
function requireAuth(req, res, next) {
  const token = parseCookies(req)[COOKIE_NAME];
  const session = token && sessions.get(token);
  if (!session || session.expires < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: 'Not logged in or session expired.' });
  }
  session.expires = Date.now() + SESSION_MS; // sliding expiry
  req.session = session;
  req.token = token;
  next();
}
function requireAdmin(req, res, next) {
  if (req.session.role !== 'admin') {
    log('WARN', `Forbidden admin access attempt by ${req.session.username}`);
    return res.status(403).json({ error: 'Admin access only.' });
  }
  next();
}

/* ---------- brute-force protection ---------- */
const failedLogins = new Map(); // username -> { count, lockedUntil }

/* ---------- routes ---------- */
app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(username))
    return res.status(400).json({ error: 'Username must be 3-20 letters, numbers or underscores.' });
  if (typeof password !== 'string' || password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const users = loadUsers();
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase()))
    return res.status(409).json({ error: 'That username is already taken.' });

  const user = {
    id: users.length + 1,
    username,
    passwordHash: hashPassword(password),
    role: users.length === 0 ? 'admin' : 'player', // first account becomes admin
    stats: { attempts: 0, solved: 0, bestStreak: 0, streak: 0 },
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  log('INFO', `New user registered: ${username} (${user.role})`);
  createSession(res, user);
  res.status(201).json({ username: user.username, role: user.role, stats: user.stats });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string')
    return res.status(400).json({ error: 'Username and password required.' });

  const record = failedLogins.get(username.toLowerCase());
  if (record && record.lockedUntil > Date.now()) {
    log('WARN', `Login blocked (locked out): ${username}`);
    return res.status(429).json({ error: 'Too many failed attempts. Try again in a minute.' });
  }

  const user = loadUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    const r = record || { count: 0, lockedUntil: 0 };
    r.count += 1;
    if (r.count >= config.maxFailedLogins) {
      r.lockedUntil = Date.now() + config.lockoutMinutes * 60 * 1000;
      r.count = 0;
    }
    failedLogins.set(username.toLowerCase(), r);
    log('WARN', `Failed login for: ${username}`);
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  failedLogins.delete(username.toLowerCase());
  createSession(res, user);
  log('INFO', `User logged in: ${user.username}`);
  res.json({ username: user.username, role: user.role, stats: user.stats });
});

app.post('/api/logout', requireAuth, (req, res) => {
  sessions.delete(req.token);
  setSessionCookie(res, '', 0);
  log('INFO', `User logged out: ${req.session.username}`);
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  const user = loadUsers().find(u => u.username === req.session.username);
  if (!user) return res.status(401).json({ error: 'Unknown user.' });
  res.json({ username: user.username, role: user.role, stats: user.stats });
});

// The browser reports the outcome of a puzzle; the server keeps the player's stats.
app.post('/api/result', requireAuth, (req, res) => {
  const { correct } = req.body || {};
  if (typeof correct !== 'boolean') return res.status(400).json({ error: 'correct must be true/false.' });
  const users = loadUsers();
  const user = users.find(u => u.username === req.session.username);
  if (!user) return res.status(401).json({ error: 'Unknown user.' });

  user.stats.attempts += 1;
  if (correct) {
    user.stats.solved += 1;
    user.stats.streak += 1;
    user.stats.bestStreak = Math.max(user.stats.bestStreak, user.stats.streak);
  } else {
    user.stats.streak = 0;
  }
  saveUsers(users);
  log('INFO', `${user.username} answered ${correct ? 'correctly' : 'incorrectly'}`);
  res.json({ stats: user.stats });
});

app.get('/api/admin/logs', requireAuth, requireAdmin, (req, res) => {
  const users = loadUsers().map(u => ({ username: u.username, role: u.role, stats: u.stats, createdAt: u.createdAt }));
  res.json({ logs: logs.slice(-100).reverse(), users, activeSessions: sessions.size });
});

app.listen(PORT, () => {
  log('INFO', `${config.appName} v${config.version} running on http://localhost:${PORT}`);
});
