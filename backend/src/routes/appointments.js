const express = require("express");
const { z } = require("zod");
const { dbAll, dbGet, dbRun } = require("../db");
const { authRequired } = require("../middleware/auth");
const { lookupCep } = require("../utils/cep");
const { getRainAlert } = require("../utils/weather");

const router = express.Router();

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().max(500).optional(),
  cep: z.string().regex(/^\d{8}$/),
  number: z.string().max(20).optional(),
  complement: z.string().max(60).optional(),
  patientId: z.number().int().positive().optional(),
});

const isPastDateTime = (dateValue, timeValue) => {
  const candidate = new Date(`${dateValue}T${timeValue}:00`);
  if (Number.isNaN(candidate.getTime())) {
    return true;
  }
  return candidate.getTime() < Date.now();
};

router.post("/", authRequired, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid data" });
    return;
  }

  const { date, time, reason, cep, number, complement, patientId } = parsed.data;

  if (isPastDateTime(date, time)) {
    res.status(400).json({ message: "Appointment must be in the future" });
    return;
  }

  let targetPatientId = req.user.id;
  if (req.user.role === "secretary") {
    if (!patientId) {
      res.status(400).json({ message: "Patient is required" });
      return;
    }

    const patient = await dbGet(
      "SELECT id FROM users WHERE id = ? AND role = 'patient'",
      [patientId]
    );
    if (!patient) {
      res.status(400).json({ message: "Patient not found" });
      return;
    }

    targetPatientId = patientId;
  }

  const existing = await dbGet(
    "SELECT id FROM appointments WHERE date = ? AND time = ? AND status != 'canceled'",
    [date, time]
  );
  if (existing) {
    res.status(409).json({ message: "Time slot not available" });
    return;
  }

  let address;
  try {
    address = await lookupCep(cep);
  } catch (error) {
    res.status(400).json({ message: "CEP lookup failed" });
    return;
  }

  const weather = await getRainAlert(address.city, date);

  try {
    const result = await dbRun(
      "INSERT INTO appointments (patient_id, secretary_id, date, time, reason, cep, street, neighborhood, city, state, number, complement, weather_rain, weather_summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        targetPatientId,
        req.user.role === "secretary" ? req.user.id : null,
        date,
        time,
        reason || null,
        address.cep,
        address.street,
        address.neighborhood,
        address.city,
        address.state,
        number || null,
        complement || null,
        weather.rain === null ? null : weather.rain ? 1 : 0,
        weather.summary || null,
      ]
    );

    const appointment = await dbGet(
      "SELECT * FROM appointments WHERE id = ?",
      [result.lastID]
    );

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Failed to create appointment" });
  }
});

router.get("/", authRequired, async (req, res) => {
  const { date } = req.query;
  let rows;

  if (req.user.role === "secretary") {
    if (date) {
      rows = await dbAll(
        "SELECT * FROM appointments WHERE date = ? ORDER BY time",
        [date]
      );
    } else {
      rows = await dbAll("SELECT * FROM appointments ORDER BY date, time");
    }
  } else {
    if (date) {
      rows = await dbAll(
        "SELECT * FROM appointments WHERE patient_id = ? AND date = ? ORDER BY time",
        [req.user.id, date]
      );
    } else {
      rows = await dbAll(
        "SELECT * FROM appointments WHERE patient_id = ? ORDER BY date, time",
        [req.user.id]
      );
    }
  }

  res.json(rows);
});

module.exports = router;
