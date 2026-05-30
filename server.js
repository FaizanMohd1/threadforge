/**
 * server.js — ThreadForge main server
 * Run: node server.js
 * Prod: NODE_ENV=production node server.js
 */
require('dotenv').config();
const express        = require('express');
const session        = require('express-session');
const cors           = require('cors');
const path           = require('path');
const fs             = require('fs');
const { v4: uuidv4 } = require('uuid');

const apiRouter   = require('./routes/api');
const adminRouter = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (stores in memory — swap for connect-sqlite3 / redis in production)
app.use(session({
  secret:            process.env.SESSION_SECRET || 'threadforge_dev_secret_change_me',
  resave:            false,
  saveUninitialized: true,
  cookie: {
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
  },
  genid: () => uuidv4(),
}));

// ── Static frontend ───────────────────────────────────────────────────────────
// Serve the upgraded ThreadForge HTML as the root page.
// Place threadforge-upgraded.html in the /public folder, or point this
// to wherever your built frontend lives.
const FRONTEND_PATH = path.join(__dirname, 'public', 'index.html');

app.get('/', (req, res) => {
  if (fs.existsSync(FRONTEND_PATH)) {
    res.sendFile(FRONTEND_PATH);
  } else {
    res.send(`
      <h2 style="font-family:sans-serif;padding:2rem">
        ThreadForge backend is running ✅<br>
        <small style="color:#999;font-size:14px">
          Put your <code>threadforge-upgraded.html</code> at
          <code>public/index.html</code> to serve the frontend here.
        </small>
      </h2>
    `);
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api',    apiRouter);
app.use('/admin',  adminRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │  ThreadForge server running              │
  │  http://localhost:${PORT}                    │
  │                                         │
  │  Admin panel → http://localhost:${PORT}/admin │
  │  API base    → http://localhost:${PORT}/api   │
  │  Health      → http://localhost:${PORT}/health│
  └─────────────────────────────────────────┘
  `);
});

module.exports = app;
// ... your existing server.js code ...

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ✅ ADD THIS BELOW — Keep-alive ping
setInterval(() => {
  fetch('https://YOUR-APP-NAME.onrender.com')
    .catch(() => {});
}, 10 * 60 * 1000);