/**
 * routes/admin.js — password-protected admin dashboard
 * Visit /admin  →  prompts for password
 * Visit /admin/login (POST) with { password }
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db/store');

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

// ── GET /admin/login ──────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ThreadForge Admin</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=Inter:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#0a0a0a;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Inter',sans-serif;}
.box{background:#111;border:1px solid #222;padding:3rem;width:360px;}
.logo{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:0.5rem;}
.logo span{color:#e63a2e;}
.sub{font-size:12px;color:#555;margin-bottom:2rem;letter-spacing:1px;text-transform:uppercase;}
label{font-size:11px;color:#666;letter-spacing:1.5px;text-transform:uppercase;display:block;margin-bottom:6px;}
input{width:100%;background:#1a1a1a;border:1px solid #2a2a2a;color:#fff;padding:12px;font-size:14px;font-family:'Inter',sans-serif;outline:none;margin-bottom:1rem;}
input:focus{border-color:#444;}
button{width:100%;background:#e63a2e;color:#fff;border:none;padding:13px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:0.3px;}
button:hover{opacity:0.9;}
.err{color:#e63a2e;font-size:13px;margin-bottom:1rem;}
</style>
</head>
<body>
<div class="box">
  <div class="logo">Thread<span>Forge</span></div>
  <div class="sub">Admin Panel</div>
  ${req.query.err ? '<div class="err">Incorrect password.</div>' : ''}
  <form method="POST" action="/admin/login">
    <label>Password</label>
    <input type="password" name="password" autofocus placeholder="Enter admin password">
    <button type="submit">Sign in →</button>
  </form>
</div>
</body>
</html>`);
});

// ── POST /admin/login ─────────────────────────────────────────────────────────
router.post('/login', express.urlencoded({ extended: false }), (req, res) => {
  if (req.body.password === (process.env.ADMIN_PASSWORD || 'threadforge_admin_2026')) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.redirect('/admin/login?err=1');
  }
});

// ── GET /admin/logout ─────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ── PATCH /admin/order/:id ────────────────────────────────────────────────────
router.patch('/order/:id', requireAdmin, (req, res) => {
  const updated = db.updateOrderStatus(req.params.id, req.body.status);
  res.json({ ok: !!updated, order: updated });
});

// ── GET /admin ────────────────────────────────────────────────────────────────
router.get('/', requireAdmin, (req, res) => {
  const orders    = db.getOrders();
  const inquiries = db.getInquiries();

  const statusBadge = s => {
    const map = { new:'#e63a2e', processing:'#f59e0b', shipped:'#3b82f6', done:'#22c55e' };
    return `<span style="background:${map[s]||'#555'};color:#fff;font-size:10px;font-weight:700;letter-spacing:1px;padding:2px 8px;text-transform:uppercase">${s}</span>`;
  };

  const orderRows = orders.length
    ? orders.map(o => `
      <tr>
        <td>${o.id}</td>
        <td>${new Date(o.createdAt).toLocaleString()}</td>
        <td>${(o.items||[]).map(i=>`${i.name}×${i.qty}`).join(', ')}</td>
        <td style="color:#e63a2e;font-weight:700">$${o.total}</td>
        <td>${statusBadge(o.status)}
          <select onchange="updateStatus(${o.id},this.value)" style="margin-left:8px;background:#1a1a1a;color:#fff;border:1px solid #333;padding:3px 6px;font-size:12px">
            ${['new','processing','shipped','done'].map(s=>`<option value="${s}"${o.status===s?' selected':''}>${s}</option>`).join('')}
          </select>
        </td>
        <td style="color:#555;font-size:12px">${o.note||'—'}</td>
      </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:#444;padding:2rem">No orders yet</td></tr>';

  const inquiryRows = inquiries.length
    ? inquiries.map(i => `
      <tr>
        <td>${i.id}</td>
        <td>${new Date(i.createdAt).toLocaleString()}</td>
        <td><strong>${i.name}</strong></td>
        <td><a href="mailto:${i.email}" style="color:#e63a2e">${i.email}</a></td>
        <td>${i.orderType||'—'}</td>
        <td style="max-width:300px;color:#aaa;font-size:12px">${i.message}</td>
      </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:#444;padding:2rem">No inquiries yet</td></tr>';

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ThreadForge Admin</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#0a0a0a;color:#e0e0e0;font-family:'Inter',sans-serif;font-size:14px;}
nav{background:#111;border-bottom:1px solid #1e1e1e;padding:0 2rem;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;}
.nav-logo{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#fff;}.nav-logo span{color:#e63a2e;}
.nav-links{display:flex;gap:1.5rem;align-items:center;}
.nav-links a{font-size:12px;color:#555;text-decoration:none;letter-spacing:0.5px;}.nav-links a:hover{color:#fff;}
.logout{background:#1a1a1a;border:1px solid #2a2a2a;color:#aaa;padding:6px 14px;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;}
.logout:hover{color:#fff;}
main{max-width:1300px;margin:0 auto;padding:2.5rem 2rem;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2.5rem;}
.stat{background:#111;border:1px solid #1e1e1e;padding:1.5rem;}
.stat-n{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#e63a2e;}
.stat-l{font-size:11px;color:#555;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;}
h2{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;margin-bottom:1.25rem;color:#fff;}
.section{margin-bottom:3rem;}
.table-wrap{overflow-x:auto;border:1px solid #1e1e1e;}
table{width:100%;border-collapse:collapse;}
th{background:#111;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#444;padding:12px 16px;text-align:left;font-weight:600;border-bottom:1px solid #1e1e1e;}
td{padding:12px 16px;border-bottom:1px solid #151515;vertical-align:middle;}
tr:hover td{background:#0e0e0e;}
.empty{text-align:center;color:#333;padding:3rem;}
select{background:#1a1a1a;color:#fff;border:1px solid #2a2a2a;padding:3px 6px;font-size:12px;font-family:'Inter',sans-serif;}
</style>
</head>
<body>
<nav>
  <div class="nav-logo">Thread<span>Forge</span> <span style="font-size:12px;color:#333;font-family:'Inter',sans-serif;font-weight:400">Admin</span></div>
  <div class="nav-links">
    <a href="#orders">Orders</a>
    <a href="#inquiries">Inquiries</a>
    <a href="/" target="_blank">View site ↗</a>
    <a href="/admin/logout"><button class="logout">Sign out</button></a>
  </div>
</nav>
<main>
  <div class="stats">
    <div class="stat"><div class="stat-n">${orders.length}</div><div class="stat-l">Total orders</div></div>
    <div class="stat"><div class="stat-n">${orders.filter(o=>o.status==='new').length}</div><div class="stat-l">New orders</div></div>
    <div class="stat"><div class="stat-n">${inquiries.length}</div><div class="stat-l">Inquiries</div></div>
    <div class="stat"><div class="stat-n">$${orders.reduce((a,b)=>a+(parseFloat(b.total)||0),0).toFixed(0)}</div><div class="stat-l">Total value</div></div>
  </div>

  <div class="section" id="orders">
    <h2>Orders</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Note</th></tr></thead>
        <tbody>${orderRows}</tbody>
      </table>
    </div>
  </div>

  <div class="section" id="inquiries">
    <h2>Inquiries</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Date</th><th>Name</th><th>Email</th><th>Type</th><th>Message</th></tr></thead>
        <tbody>${inquiryRows}</tbody>
      </table>
    </div>
  </div>
</main>
<script>
async function updateStatus(id, status) {
  await fetch('/admin/order/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}
// Auto-refresh every 30s
setTimeout(() => location.reload(), 30000);
</script>
</body>
</html>`);
});

module.exports = router;
