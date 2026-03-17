import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode";
import pino from "pino";
import { db } from "@workspace/db";
import { whitelistTable, historyTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const logger = pino({ level: "silent" });

let sock: WASocket | null = null;
let lastQrRaw: string | null = null;
let connected = false;
let statusText = "disconnected";
let currentNumber: string | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

function inferTipo(texto: string): "material" | "op" | "urgente" {
  const t = texto.trim();
  if (t.startsWith("!")) return "urgente";
  if (/^op\s*\d+/i.test(t) || /^\d{6,}$/.test(t.replace(/\s/g, ""))) return "op";
  return "material";
}

async function getWhitelistByPhone(phone: string) {
  try {
    const rows = await db.select().from(whitelistTable).where(eq(whitelistTable.phone, phone));
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function saveQueryHistory(data: {
  phone: string;
  type: string;
  query: string;
  found: boolean;
  response: string;
}) {
  try {
    await db.insert(historyTable).values(data);
  } catch (err) {
    console.error("[WhatsApp] Failed to save history:", err);
  }
}

async function handleMessage(phone: string, texto: string, from: string) {
  const contato = await getWhitelistByPhone(phone);
  if (!contato || !contato.active) {
    console.log(`[WhatsApp] ${phone} not in whitelist — ignoring`);
    return;
  }

  const resposta = `ZapAuto recebeu sua mensagem: "${texto}"\n\nEste bot está configurado. Adicione sua lógica de MRP em src/lib/whatsapp.ts`;
  const found = false;

  try {
    await sock?.sendMessage(from, { text: resposta });
    console.log(`[WhatsApp] Reply sent to ${phone}`);

    await saveQueryHistory({
      phone,
      type: inferTipo(texto),
      query: texto,
      found,
      response: resposta,
    });
  } catch (err) {
    console.error("[WhatsApp] Error sending reply:", err);
  }
}

export async function startWhatsappClient(): Promise<void> {
  if (sock && connected) {
    console.log("[WhatsApp] Already connected");
    return;
  }

  const { state, saveCreds } = await useMultiFileAuthState(".baileys_auth");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    printQRInTerminal: false,
    browser: ["ZapAuto", "Chrome", "120.0.0"],
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
    keepAliveIntervalMs: 25_000,
    markOnlineOnConnect: false,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      lastQrRaw = qr;
      statusText = "qr_ready";
      console.log("[WhatsApp] QR generated — scan in the panel");
    }

    if (connection === "open") {
      connected = true;
      statusText = "connected";
      lastQrRaw = null;
      reconnectAttempts = 0;
      currentNumber = sock?.user?.id?.split(":")[0] ?? null;
      console.log("[WhatsApp] Connected! Number:", currentNumber);
    }

    if (connection === "close") {
      connected = false;
      currentNumber = null;
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      console.log("[WhatsApp] Disconnected. Reason:", reason);

      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      if (shouldReconnect && reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        statusText = "reconnecting";
        console.log(`[WhatsApp] Reconnecting (attempt ${reconnectAttempts})...`);
        setTimeout(() => startWhatsappClient(), 5000);
      } else if (reason === DisconnectReason.loggedOut) {
        statusText = "logged_out";
        sock = null;
        console.log("[WhatsApp] Session ended. Scan QR again.");
      } else {
        statusText = "disconnected";
        sock = null;
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (msg.key.remoteJid?.endsWith("@g.us")) continue;

      const from = msg.key.remoteJid ?? "";
      const phone = from.replace("@s.whatsapp.net", "").replace("@c.us", "");
      const texto =
        msg.message?.conversation ??
        msg.message?.extendedTextMessage?.text ??
        "";

      if (!texto.trim()) continue;

      console.log(`[WhatsApp] Message from ${phone}: "${texto}"`);
      await handleMessage(phone, texto, from);
    }
  });
}

export async function disconnectWhatsappClient(): Promise<void> {
  if (!sock) return;
  try {
    await sock.logout();
  } catch {}
  sock = null;
  connected = false;
  statusText = "disconnected";
  currentNumber = null;
  lastQrRaw = null;
  console.log("[WhatsApp] Manually disconnected");
}

export function getWhatsappStatus() {
  return { connected, status: statusText, number: currentNumber ?? null };
}

export async function getWhatsappQrBase64(): Promise<string | null> {
  if (!lastQrRaw) return null;
  const dataUrl = await qrcode.toDataURL(lastQrRaw, { width: 300, margin: 2 });
  return dataUrl.replace("data:image/png;base64,", "");
}
