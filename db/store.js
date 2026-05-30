/**
 * db/store.js — lightweight JSON file database
 * Drop-in replacement for SQLite; swap for Postgres/MySQL in production
 * by changing only this file.
 */
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

// ── Schema ──────────────────────────────────────────────────────────────────
const DEFAULTS = {
  orders:    [],   // cart checkouts / quote requests
  inquiries: [],   // contact form submissions
  sessions:  {},   // wishlist per session id
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULTS, null, 2));
    return structuredClone(DEFAULTS);
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── Public API ───────────────────────────────────────────────────────────────

// INQUIRIES (contact form)
function saveInquiry(inquiry) {
  const db = load();
  const record = { id: Date.now(), createdAt: new Date().toISOString(), ...inquiry };
  db.inquiries.unshift(record);
  save(db);
  return record;
}

function getInquiries() {
  return load().inquiries;
}

// ORDERS (cart)
function saveOrder(order) {
  const db = load();
  const record = {
    id: Date.now(),
    status: 'new',
    createdAt: new Date().toISOString(),
    ...order,
  };
  db.orders.unshift(record);
  save(db);
  return record;
}

function getOrders() {
  return load().orders;
}

function updateOrderStatus(id, status) {
  const db = load();
  const order = db.orders.find(o => o.id === Number(id));
  if (order) { order.status = status; save(db); }
  return order;
}

// WISHLIST (per session)
function getWishlist(sessionId) {
  const db = load();
  return db.sessions[sessionId]?.wishlist || [];
}

function setWishlist(sessionId, items) {
  const db = load();
  if (!db.sessions[sessionId]) db.sessions[sessionId] = {};
  db.sessions[sessionId].wishlist = items;
  db.sessions[sessionId].updatedAt = new Date().toISOString();
  save(db);
}

module.exports = { saveInquiry, getInquiries, saveOrder, getOrders, updateOrderStatus, getWishlist, setWishlist };
