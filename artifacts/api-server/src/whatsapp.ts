import { Boom } from '@hapi/boom';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import type { WAMessage } from '@whiskeysockets/baileys';
import pino from 'pino';

const logger = pino({ level: 'warn' });

export type WhatsAppStatus = {
  connected: boolean;
  qr?: string;
  phoneNumber?: string;
  statusText?: string;
};

export class WhatsAppConnector {
  private socket: ReturnType<typeof makeWASocket> | null = null;
  private status: WhatsAppStatus = { connected: false };
  private authDir: string;

  constructor(authDir: string) {
    this.authDir = authDir;
  }

  async init() {
    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
    const { version } = await fetchLatestBaileysVersion();

    this.socket = makeWASocket({
      logger,
      auth: state,
      version,
      printQRInTerminal: false,
      browser: ['ZapAuto', 'Chrome', '1.0'],
    });

    this.socket.ev.on('creds.update', saveCreds);

    this.socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        this.status = { connected: false, qr, statusText: 'QR code generated' };
      }

      if (connection === 'open') {
        this.status = {
          connected: true,
          qr: undefined,
          statusText: 'Connected',
          phoneNumber: this.socket?.user?.id ?? undefined,
        };
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          this.status = { connected: false, statusText: 'Logged out, remove session and restart' };
        } else {
          this.status = { connected: false, statusText: `Disconnected (${reason})` };
        }
      }
    });
  }

  getStatus(): WhatsAppStatus {
    return this.status;
  }

  getQR(): string | undefined {
    return this.status.qr;
  }

  async sendMessage(to: string, message: string) {
    if (!this.socket) throw new Error('WhatsApp socket not initialized');
    await this.socket.sendMessage(to, { text: message });
  }
}
