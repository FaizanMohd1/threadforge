require('dotenv').config();

// ── Email via Resend (works on Render free plan) ──────────────────────────────
async function sendEmail({ subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[EMAIL DISABLED] Set RESEND_API_KEY to enable emails');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ThreadForge <onboarding@resend.dev>',
      to: [process.env.MAIL_TO || process.env.MAIL_USER],
      subject,
      html,
      text,
    }),
  });
  const data = await res.json();
  if (res.ok) {
    console.log('[EMAIL SENT]', subject);
  } else {
    console.error('[EMAIL ERROR]', data);
  }
}

// ── WhatsApp via Twilio ───────────────────────────────────────────────────────
async function sendWhatsApp(message) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log('[WHATSAPP DISABLED]');
    return;
  }
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to:   process.env.TWILIO_WHATSAPP_TO,
    body: message,
  });
  console.log('[WHATSAPP SENT]');
}

// ── Templates ─────────────────────────────────────────────────────────────────
async function notifyNewInquiry(inquiry) {
  const subject = `New inquiry from ${inquiry.name}`;
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
  `;
  const text = `New inquiry from ${inquiry.name} (${inquiry.email})\n\n${inquiry.message}`;
  await Promise.all([
    sendEmail({ subject, html, text }),
    sendWhatsApp(`New ThreadForge inquiry!\nFrom: ${inquiry.name} (${inquiry.email})\nType: ${inquiry.orderType || 'General'}\nMsg: ${inquiry.message.substring(0, 120)}`),
  ]);
}

async function notifyNewOrder(order) {
  const itemList = order.items.map(i => `- ${i.name} x${i.qty}`).join('\n');
  const subject  = `New order - Rs.${order.total}`;
  const html = `
    <h2 style="font-family:sans-serif;color:#e63a2e;">New ThreadForge Order</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;color:#999">Items</td><td style="padding:8px"><pre>${itemList}</pre></td></tr>
      <tr style="background:#f9f9f9"><td style="padding:8px;color:#999">Total</td><td style="padding:8px;color:#e63a2e;font-size:18px"><strong>Rs. ${order.total}</strong></td></tr>
      <tr><td style="padding:8px;color:#999">Note</td><td style="padding:8px">${order.note || '—'}</td></tr>
    </table>
  `;
  const text = `New order: Rs.${order.total}\n\n${itemList}`;
  await Promise.all([
    sendEmail({ subject, html, text }),
    sendWhatsApp(`New order!\nTotal: Rs.${order.total}\n${itemList}`),
  ]);
}

async function notifyChatMessage({ sessionId, message }) {
  await sendWhatsApp(`Chat message:\n"${message}"`);
}

module.exports = { notifyNewInquiry, notifyNewOrder, notifyChatMessage };
