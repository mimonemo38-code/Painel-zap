import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { whitelistTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/whitelist", async (_req, res) => {
  try {
    const rows = await db.select().from(whitelistTable).orderBy(whitelistTable.createdAt);
    res.json(rows.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

router.post("/whitelist", async (req, res) => {
  const { phone, name } = req.body as { phone?: string; name?: string };
  if (!phone) {
    res.status(400).json({ ok: false, error: "phone is required" });
    return;
  }
  try {
    const rows = await db.insert(whitelistTable).values({
      phone: phone.replace(/\D/g, ""),
      name: name ?? "",
      active: true,
    }).returning();
    const row = rows[0]!;
    res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

router.patch("/whitelist/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const { active, name } = req.body as { active?: boolean; name?: string };
  try {
    const updateData: { active?: boolean; name?: string } = {};
    if (active !== undefined) updateData.active = active;
    if (name !== undefined) updateData.name = name;
    const rows = await db.update(whitelistTable).set(updateData).where(eq(whitelistTable.id, id)).returning();
    const row = rows[0];
    if (!row) {
      res.status(404).json({ ok: false, error: "Not found" });
      return;
    }
    res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

router.delete("/whitelist/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  try {
    await db.delete(whitelistTable).where(eq(whitelistTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
