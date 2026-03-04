const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { dbGet, dbRun } = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["user", "patient", "secretary"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid data" });
    return;
  }

  const { name, email, password, role } = parsed.data;
  const existing = await dbGet("SELECT id FROM usuario WHERE email = ?", [email]);
  if (existing) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userRole = role || "user";

  const result = await dbRun(
    "INSERT INTO usuario (nome, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name, email, passwordHash, userRole]
  );

  if (userRole !== "secretary") {
    await dbRun("INSERT OR IGNORE INTO pacientes (id, nome) VALUES (?, ?)", [
      result.lastID,
      name,
    ]);
  }

  res.status(201).json({
    id: result.lastID,
    name,
    email,
    role: userRole,
  });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid data" });
    return;
  }

  const { email, password } = parsed.data;
  const user = await dbGet(
    "SELECT id, nome AS name, email, password_hash, role FROM usuario WHERE email = ?",
    [email]
  );

  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.get("/me", authRequired, async (req, res) => {
  const user = await dbGet(
    "SELECT id, nome AS name, email, role FROM usuario WHERE id = ?",
    [req.user.id]
  );
  res.json(user);
});

module.exports = router;
