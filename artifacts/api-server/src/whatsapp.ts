import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';

interface ILogger {
  level: string;
  child(obj: Record<string, unknown>): ILogger;
  trace(obj: unknown, msg?: string): any;
  debug(obj: unknown, msg?: string): any;
  info(obj: unknown, msg?: string): any;
  warn(obj: unknown, msg?: string): any;
  error(obj: unknown, msg?: string): any;
}

// Simple logger placeholder. Replace with a proper logger (e.g., pino) if desired.
const logger: ILogger = {
  level: 'info',
  child: () => logger,
  trace: () => {},
  debug: console.debug.bind(console),
  info: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

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
        const reason = (lastDisconnect?.error as any)?.output?.statusCode;
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
