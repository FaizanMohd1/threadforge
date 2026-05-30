# ThreadForge — Full Stack

A complete Node.js + Express backend powering the ThreadForge POD manufacturer website.

---

## Stack

| Layer       | Tech                              |
|-------------|-----------------------------------|
| Server      | Node.js + Express                 |
| Database    | JSON file (swap for Postgres/MySQL) |
| Email       | Nodemailer (Gmail)                |
| WhatsApp    | Twilio WhatsApp API               |
| Sessions    | express-session (in-memory)       |
| Frontend    | Vanilla HTML/CSS/JS               |

---

## Project structure

```
threadforge/
├── server.js              ← Entry point
├── .env.example           ← Copy to .env and fill in
├── db/
│   ├── store.js           ← JSON file database
│   └── data.json          ← Auto-created on first run
├── routes/
│   ├── api.js             ← /api/* endpoints
│   └── admin.js           ← /admin dashboard
├── services/
│   └── notify.js          ← Email + WhatsApp notifications
└── public/
    └── index.html         ← Frontend (served at /)
```

---

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Set up Gmail App Password
1. Go to myaccount.google.com → Security → 2-Step Verification → App passwords
2. Generate a password for "Mail"
3. Paste it as `MAIL_PASS` in `.env`

### 4. Set up Twilio WhatsApp (optional)
1. Sign up at twilio.com
2. Go to Messaging → Try it out → Send a WhatsApp message
3. Follow the sandbox setup (send the join code from your phone)
4. Copy your Account SID, Auth Token, and numbers into `.env`

### 5. Run
```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

### 6. Open
- **Website** → http://localhost:3000
- **Admin panel** → http://localhost:3000/admin  (password: see `ADMIN_PASSWORD` in `.env`)

---

## API Endpoints

| Method | Path            | Description                        |
|--------|-----------------|------------------------------------|
| POST   | /api/inquiry    | Save contact form + notify         |
| POST   | /api/order      | Save cart order + notify           |
| GET    | /api/wishlist   | Get wishlist for current session   |
| POST   | /api/wishlist   | Save wishlist for current session  |
| POST   | /api/chat       | Handle chat message + notify       |
| GET    | /health         | Health check                       |
| GET    | /admin          | Admin dashboard (auth required)    |
| POST   | /admin/login    | Admin login                        |
| PATCH  | /admin/order/:id| Update order status                |

---

## Scaling up

When you outgrow the JSON file database, swap `db/store.js` for any of these — the rest of the app doesn't change:

- **Postgres** → use `pg` + connection pool
- **MySQL** → use `mysql2`
- **MongoDB** → use `mongoose`
- **Supabase** → drop-in Postgres with a hosted dashboard

For production deployment, consider:
- **Railway** or **Render** for free Node.js hosting
- **Vercel** (serverless) for the frontend + API routes
- **PM2** for process management on a VPS

---

## Default credentials
- Admin password: `threadforge_admin_2026` (change in `.env`)
