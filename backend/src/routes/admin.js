const express = require("express");
const { z } = require("zod");
const { dbAll, dbGet, dbRun } = require("../db");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

const adminAppointmentSelect =
  "SELECT c.id, c.paciente_id, c.usuario_id, c.date, c.time, c.razao, c.previsao_chuva, c.clima, c.status, c.created_at, p.cep, p.rua, p.bairro, p.cidade, p.estado, p.numero, " +
  "c.paciente_id AS patient_id, c.usuario_id AS secretary_id, c.razao AS reason, c.previsao_chuva AS weather_rain, c.clima AS weather_summary, p.cidade AS city, p.estado AS state " +
  "FROM consultas c JOIN pacientes p ON p.id = c.paciente_id";

const statusSchema = z.object({
  status: z.enum(["agendado", "concluido", "cancelado"]),
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
      `${adminAppointmentSelect} WHERE c.status = ? ORDER BY c.date, c.time`,
      [status]
    );
  } else {
    rows = await dbAll(`${adminAppointmentSelect} ORDER BY c.date, c.time`);
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
  await dbRun("UPDATE consultas SET status = ? WHERE id = ?", [
    parsed.data.status,
    id,
  ]);

  const updated = await dbGet(`${adminAppointmentSelect} WHERE c.id = ?`, [id]);
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
    "SELECT id FROM usuario WHERE id = ? AND role = 'secretary'",
    [parsed.data.secretaryId]
  );
  if (!secretary) {
    res.status(400).json({ message: "Secretary not found" });
    return;
  }

  await dbRun("UPDATE consultas SET usuario_id = ? WHERE id = ?", [
    parsed.data.secretaryId,
    id,
  ]);

  const updated = await dbGet(`${adminAppointmentSelect} WHERE c.id = ?`, [id]);
  res.json(updated);
});

module.exports = router;
