import { Router, type IRouter } from "express";
import {
  startWhatsappClient,
  disconnectWhatsappClient,
  getWhatsappStatus,
  getWhatsappQrBase64,
} from "../lib/whatsapp.js";

const router: IRouter = Router();

router.get("/whatsapp/status", (_req, res) => {
  res.json(getWhatsappStatus());
});

router.get("/whatsapp/qr", async (_req, res) => {
  const qr = await getWhatsappQrBase64();
  if (!qr) {
    res.status(404).json({ ok: false, error: "QR not available. POST /connect first." });
    return;
  }
  res.json({ qr });
});

router.post("/whatsapp/connect", async (_req, res) => {
  await startWhatsappClient();
  res.json({ ok: true, message: "WhatsApp initialization started. Check GET /whatsapp/qr for the QR code." });
});

router.post("/whatsapp/disconnect", async (_req, res) => {
  await disconnectWhatsappClient();
  res.json({ ok: true });
});

export default router;
