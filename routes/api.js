/**
 * routes/api.js — all REST endpoints consumed by the frontend
 */
const express  = require('express');
const router   = express.Router();
const db       = require('../db/store');
const notify   = require('../services/notify');

// ── POST /api/inquiry ─────────────────────────────────────────────────────────
// Saves contact form submission and fires email + WhatsApp
router.post('/inquiry', async (req, res) => {
  const { name, email, business, orderType, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email and message are required' });
  }
  try {
    const record = db.saveInquiry({ name, email, business, orderType, message });
    // Fire notifications in background — don't block the response
    notify.notifyNewInquiry(record).catch(err => console.error('[notify]', err.message));
    res.json({ ok: true, id: record.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save inquiry' });
  }
});

// ── POST /api/order ───────────────────────────────────────────────────────────
// Saves a cart checkout / quote request
router.post('/order', async (req, res) => {
  const { items, total, note } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'items array is required' });
  }
  try {
    const sessionId = req.session.id;
    const record = db.saveOrder({ items, total, note, sessionId });
    notify.notifyNewOrder({ ...record, sessionId }).catch(err => console.error('[notify]', err.message));
    res.json({ ok: true, orderId: record.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

// ── GET  /api/wishlist ────────────────────────────────────────────────────────
router.get('/wishlist', (req, res) => {
  const items = db.getWishlist(req.session.id);
  res.json({ items });
});

// ── POST /api/wishlist ────────────────────────────────────────────────────────
// Body: { items: [1, 3, 5] }  (array of product ids)
router.post('/wishlist', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });
  db.setWishlist(req.session.id, items);
  res.json({ ok: true });
});

// ── POST /api/chat ────────────────────────────────────────────────────────────
// Receives a customer chat message and fires WhatsApp notification
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  const sessionId = req.session.id;
  notify.notifyChatMessage({ sessionId, message }).catch(err => console.error('[notify]', err.message));

  // Simple bot reply logic
  const msg = message.toLowerCase();
  let reply = "Thanks for your message! Our team will get back to you shortly. For urgent orders, WhatsApp us directly.";
  if (msg.includes('price') || msg.includes('cost') || msg.includes('quote'))
    reply = "For pricing, try our calculator on this page! For a custom quote, fill the contact form and we'll reply within 24h.";
  else if (msg.includes('moq') || msg.includes('minimum'))
    reply = "No minimum! You can order as little as 1 piece. Volume discounts start at 50+ units.";
  else if (msg.includes('ship') || msg.includes('deliver'))
    reply = "We ship worldwide! Dropshipping direct to your customers is also available with your branding.";
  else if (msg.includes('embroid'))
    reply = "Our embroidery starts from $4/piece. We accept DST, EMB, PNG files. Turnaround is 48–72h.";
  else if (msg.includes('print'))
    reply = "We do DTG, screen print, and sublimation. Minimum 300 DPI artwork needed. From $2/print.";
  else if (msg.includes('label') || msg.includes('white label') || msg.includes('private'))
    reply = "Yes! Full white label & private label — custom tags, packaging, everything under your brand.";
  else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey'))
    reply = "Hey! 👋 Welcome to ThreadForge. Ask me anything about our products, pricing or services!";

  res.json({ ok: true, reply });
});

module.exports = router;
