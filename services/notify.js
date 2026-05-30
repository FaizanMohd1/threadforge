/**
 * services/notify.js
 * Handles email (Nodemailer/Gmail) and WhatsApp (Twilio) notifications.
 * Both are optional — if credentials are missing the app still runs,
 * it just logs to console instead.
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

// ── Email transporter ─────────────────────────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return null;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });
  return transporter;
}

async function sendEmail({ subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log('[EMAIL DISABLED] Would have sent:', subject);
    return;
  }
  await t.sendMail({
    from: `"ThreadForge" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_TO || process.env.MAIL_USER,
    subject,
    html,
    text,
  });
  console.log('[EMAIL SENT]', subject);
}

// ── WhatsApp via Twilio ───────────────────────────────────────────────────────
let twilioClient = null;

function getTwilio() {
  if (twilioClient) return twilioClient;
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilioClient;
}

async function sendWhatsApp(message) {
  const client = getTwilio();
  if (!client) {
    console.log('[WHATSAPP DISABLED] Would have sent:', message);
    return;
  }
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to:   process.env.TWILIO_WHATSAPP_TO,
    body: message,
  });
  console.log('[WHATSAPP SENT]');
}

// ── Notification templates ────────────────────────────────────────────────────

async function notifyNewInquiry(inquiry) {
  const subject = `🧵 New inquiry from ${inquiry.name}`;
  const html = `
    <h2 style="font-family:sans-serif;color:#e63a2e;">New ThreadForge Inquiry</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;color:#999;width:120px">Name</td><td style="padding:8px"><strong>${inquiry.name}</strong></td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#999">Email</td><td style="padding:8px"><a href="mailto:${inquiry.email}">${inquiry.email}</a></td></tr>
      <tr><td style="padding:8px;color:#999">Business</td><td style="padding:8px">${inquiry.business || '—'}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#999">Order type</td><td style="padding:8px">${inquiry.orderType || '—'}</td></tr>
      <tr><td style="padding:8px;color:#999;vertical-align:top">Message</td><td style="padding:8px">${inquiry.message}</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#999">Received</td><td style="padding:8px">${new Date().toLocaleString()}</td></tr>
    </table>
    <p style="font-family:sans-serif;font-size:12px;color:#ccc;margin-top:2rem">ThreadForge Admin · View all inquiries at /admin</p>
  `;
  const text = `New inquiry from ${inquiry.name} (${inquiry.email})\n\n${inquiry.message}`;
  await Promise.all([
    sendEmail({ subject, html, text }),
    sendWhatsApp(`🧵 New ThreadForge inquiry!\nFrom: ${inquiry.name} (${inquiry.email})\nType: ${inquiry.orderType || 'General'}\nMsg: ${inquiry.message.substring(0, 120)}`),
  ]);
}

async function notifyNewOrder(order) {
  const itemList = order.items.map(i => `• ${i.name} ×${i.qty} ($${(i.price * i.qty).toFixed(2)})`).join('\n');
  const subject  = `🛒 New order — $${order.total} from ${order.sessionId.substring(0, 8)}`;
  const html = `
    <h2 style="font-family:sans-serif;color:#e63a2e;">New ThreadForge Order</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;color:#999">Order ID</td><td style="padding:8px"><strong>${order.id || 'pending'}</strong></td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#999">Items</td><td style="padding:8px"><pre style="margin:0">${itemList}</pre></td></tr>
      <tr><td style="padding:8px;color:#999">Total</td><td style="padding:8px;font-size:18px;color:#e63a2e"><strong>$${order.total}</strong></td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#999">Note</td><td style="padding:8px">${order.note || '—'}</td></tr>
    </table>
  `;
  const text = `New order: $${order.total}\n\n${itemList}`;
  await Promise.all([
    sendEmail({ subject, html, text }),
    sendWhatsApp(`🛒 New ThreadForge order!\nTotal: $${order.total}\n${itemList.substring(0, 200)}`),
  ]);
}

async function notifyChatMessage({ sessionId, message }) {
  await sendWhatsApp(`💬 ThreadForge chat msg (session ${sessionId.substring(0, 8)}):\n"${message}"`);
}

module.exports = { notifyNewInquiry, notifyNewOrder, notifyChatMessage };
