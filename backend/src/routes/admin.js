const express = require("express");
const { z } = require("zod");
const { dbAll, dbGet, dbRun } = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

const statusSchema = z.object({
  status: z.enum(["scheduled", "completed", "canceled"]),
});

const assignSchema = z.object({
  secretaryId: z.number().int().positive(),
});

router.use(authRequired);
router.use(requireRole(["secretary"]));

router.get("/appointments", async (req, res) => {
  const { status } = req.query;
  let rows;

  if (status) {
    rows = await dbAll(
      "SELECT * FROM appointments WHERE status = ? ORDER BY date, time",
      [status]
    );
  } else {
    rows = await dbAll("SELECT * FROM appointments ORDER BY date, time");
  }

  res.json(rows);
});

router.put("/appointments/:id/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  const { id } = req.params;
  await dbRun("UPDATE appointments SET status = ? WHERE id = ?", [
    parsed.data.status,
    id,
  ]);

  const updated = await dbGet("SELECT * FROM appointments WHERE id = ?", [id]);
  res.json(updated);
});

router.put("/appointments/:id/assign", async (req, res) => {
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid data" });
    return;
  }

  const { id } = req.params;
  const secretary = await dbGet(
    "SELECT id FROM users WHERE id = ? AND role = 'secretary'",
    [parsed.data.secretaryId]
  );
  if (!secretary) {
    res.status(400).json({ message: "Secretary not found" });
    return;
  }

  await dbRun("UPDATE appointments SET secretary_id = ? WHERE id = ?", [
    parsed.data.secretaryId,
    id,
  ]);

  const updated = await dbGet("SELECT * FROM appointments WHERE id = ?", [id]);
  res.json(updated);
});

module.exports = router;
