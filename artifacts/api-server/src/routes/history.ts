import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { historyTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/history", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query["limit"] ?? 50), 200);
    const phone = req.query["phone"] as string | undefined;

    let query = db.select().from(historyTable).orderBy(desc(historyTable.createdAt)).limit(limit);

    let rows;
    if (phone) {
      rows = await db.select().from(historyTable).where(eq(historyTable.phone, phone)).orderBy(desc(historyTable.createdAt)).limit(limit);
    } else {
      rows = await query;
    }

    res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
