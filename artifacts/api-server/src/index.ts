import express from 'express';
import dotenv from 'dotenv';

import { WhatsAppConnector } from './whatsapp.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api/messages', (req, res) => {
  res.json({
    messages: [
      { id: 1, text: 'Hello from ZapAuto API!', timestamp: new Date() }
    ]
  });
});

app.post('/api/messages', express.json(), (req, res) => {
  const { text } = req.body;
  res.json({
    id: Math.random(),
    text,
    timestamp: new Date()
  });
});

// WhatsApp init
const waAuthDir = process.env.WHATSAPP_AUTH_DIR || './whatsapp-session';
const wa = new WhatsAppConnector(waAuthDir);
wa.init().catch((err) => {
  console.error('WhatsApp init failed:', err);
});

// WhatsApp routes
app.get('/wa/status', (req, res) => {
  res.json(wa.getStatus());
});

app.get('/wa/qr', (req, res) => {
  const qr = wa.getQR();
  if (!qr) {
    return res.status(404).json({ error: 'QR not available' });
  }
  return res.json({ qr });
});

app.post('/wa/send', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: 'to and message are required' });
  }

  try {
    await wa.sendMessage(to, message);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// Dashboard proxy indicator
app.get('/api/status', (req, res) => {
  res.json({
    api: 'running',
    version: process.env.APP_VERSION || '0.0.0',
    uptime: process.uptime(),
    dashboard: process.env.DASHBOARD_URL || 'http://localhost:5173'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ZapAuto API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard available at http://0.0.0.0:5173`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);

  // Most Codespaces environments provide a public forward URL in these vars.
  const codespace = process.env.CODESPACE_NAME;
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  if (codespace && domain) {
    console.log(`📡 Public URLs:`);
    console.log(`   API: https://${codespace}-${PORT}.${domain}`);
    console.log(`   Dashboard: https://${codespace}-5173.${domain}`);
  }
});
