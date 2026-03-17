import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { configTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_CONFIG = {
  autoRespond: true,
  respondToGroups: false,
  maxDailyMessages: 100,
  welcomeMessage: "Olá! Este é o ZapAuto MRP Bot. Envie o código do material ou OP para consulta.",
};

async function getConfigFromDb() {
  try {
    const rows = await db.select().from(configTable);
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return {
      autoRespond: map["autoRespond"] !== undefined ? map["autoRespond"] === "true" : DEFAULT_CONFIG.autoRespond,
      respondToGroups: map["respondToGroups"] !== undefined ? map["respondToGroups"] === "true" : DEFAULT_CONFIG.respondToGroups,
      maxDailyMessages: map["maxDailyMessages"] !== undefined ? Number(map["maxDailyMessages"]) : DEFAULT_CONFIG.maxDailyMessages,
      welcomeMessage: map["welcomeMessage"] ?? DEFAULT_CONFIG.welcomeMessage,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

router.get("/config", async (_req, res) => {
  res.json(await getConfigFromDb());
});

router.put("/config", async (req, res) => {
  const { autoRespond, respondToGroups, maxDailyMessages, welcomeMessage } = req.body;
  try {
    const entries: Array<{ key: string; value: string }> = [
      { key: "autoRespond", value: String(autoRespond ?? DEFAULT_CONFIG.autoRespond) },
      { key: "respondToGroups", value: String(respondToGroups ?? DEFAULT_CONFIG.respondToGroups) },
      { key: "maxDailyMessages", value: String(maxDailyMessages ?? DEFAULT_CONFIG.maxDailyMessages) },
      { key: "welcomeMessage", value: welcomeMessage ?? DEFAULT_CONFIG.welcomeMessage },
    ];
    for (const entry of entries) {
      await db.insert(configTable).values(entry).onConflictDoUpdate({
        target: configTable.key,
        set: { value: entry.value },
      });
    }
    res.json(await getConfigFromDb());
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
