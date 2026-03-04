const express = require("express");
const { z } = require("zod");
const { dbAll, dbGet, dbRun } = require("../db");
const { authRequired } = require("../middleware/auth");
const { lookupCep } = require("../utils/cep");
const { getRainAlert } = require("../utils/weather");

const router = express.Router();

const appointmentSelect =
  "SELECT c.id, c.paciente_id, c.usuario_id, c.date, c.time, c.razao, c.previsao_chuva, c.clima, c.status, c.created_at, p.cep, p.rua, p.bairro, p.cidade, p.estado, p.numero, " +
  "c.paciente_id AS patient_id, c.usuario_id AS secretary_id, c.razao AS reason, c.previsao_chuva AS weather_rain, c.clima AS weather_summary, p.cidade AS city, p.estado AS state " +
  "FROM consultas c JOIN pacientes p ON p.id = c.paciente_id";

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

const upsertPatient = async (patientId, patientName, address, number) => {
  const existing = await dbGet("SELECT id FROM pacientes WHERE id = ?", [patientId]);
  if (existing) {
    await dbRun(
      "UPDATE pacientes SET nome = COALESCE(?, nome), cep = ?, rua = ?, bairro = ?, cidade = ?, estado = ?, numero = ? WHERE id = ?",
      [
        patientName || null,
        address.cep,
        address.street,
        address.neighborhood,
        address.city,
        address.state,
        number || null,
        patientId,
      ]
    );
    return;
  }

  await dbRun(
    "INSERT INTO pacientes (id, nome, cep, rua, bairro, cidade, estado, numero) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      patientId,
      patientName || `Paciente ${patientId}`,
      address.cep,
      address.street,
      address.neighborhood,
      address.city,
      address.state,
      number || null,
    ]
  );
};

router.post("/", authRequired, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid data" });
    return;
  }

  const { date, time, reason, cep, number, patientId } = parsed.data;

  if (isPastDateTime(date, time)) {
    res.status(400).json({ message: "Appointment must be in the future" });
    return;
  }

  let targetPatientId = req.user.id;
  let targetPatientName = req.user.name || null;
  if (req.user.role === "secretary") {
    if (!patientId) {
      res.status(400).json({ message: "Patient is required" });
      return;
    }

    const patient = await dbGet(
      "SELECT id, nome FROM usuario WHERE id = ? AND role != 'secretary'",
      [patientId]
    );
    if (!patient) {
      res.status(400).json({ message: "Patient not found" });
      return;
    }

    targetPatientId = patientId;
    targetPatientName = patient.nome;
  }

  const existing = await dbGet(
    "SELECT id FROM consultas WHERE date = ? AND time = ? AND status != 'cancelado'",
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
    await upsertPatient(targetPatientId, targetPatientName, address, number);

    const result = await dbRun(
      "INSERT INTO consultas (paciente_id, usuario_id, date, time, razao, previsao_chuva, clima) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        targetPatientId,
        req.user.role === "secretary" ? req.user.id : null,
        date,
        time,
        reason || null,
        weather.rain === null ? null : weather.rain ? 1 : 0,
        weather.summary || null,
      ]
    );

    const appointment = await dbGet(
      `${appointmentSelect} WHERE c.id = ?`,
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
        `${appointmentSelect} WHERE c.date = ? ORDER BY c.time`,
        [date]
      );
    } else {
      rows = await dbAll(`${appointmentSelect} ORDER BY c.date, c.time`);
    }
  } else {
    if (date) {
      rows = await dbAll(
        `${appointmentSelect} WHERE c.paciente_id = ? AND c.date = ? ORDER BY c.time`,
        [req.user.id, date]
      );
    } else {
      rows = await dbAll(
        `${appointmentSelect} WHERE c.paciente_id = ? ORDER BY c.date, c.time`,
        [req.user.id]
      );
    }
  }

  res.json(rows);
});

module.exports = router;
