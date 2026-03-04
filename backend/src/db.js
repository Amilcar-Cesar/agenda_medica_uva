const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "..", "data.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(
    "CREATE TABLE IF NOT EXISTS usuario (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "nome TEXT NOT NULL, " +
      "email TEXT NOT NULL UNIQUE, " +
      "password_hash TEXT NOT NULL, " +
      "role TEXT NOT NULL DEFAULT 'user', " +
      "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
      ")"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS pacientes (" +
      "id INTEGER PRIMARY KEY, " +
      "nome TEXT NOT NULL, " +
      "data_nasc TEXT, " +
      "cpf TEXT, " +
      "cep TEXT, " +
      "rua TEXT, " +
      "bairro TEXT, " +
      "cidade TEXT, " +
      "estado TEXT, " +
      "numero TEXT, " +
      "FOREIGN KEY (id) REFERENCES usuario(id) ON DELETE CASCADE" +
      ")"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS consultas (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "paciente_id INTEGER NOT NULL, " +
      "usuario_id INTEGER, " +
      "date TEXT NOT NULL, " +
      "time TEXT NOT NULL, " +
      "razao TEXT, " +
      "previsao_chuva INTEGER, " +
      "clima TEXT, " +
      "status TEXT NOT NULL DEFAULT 'agendado', " +
      "created_at TEXT NOT NULL DEFAULT (datetime('now')), " +
      "FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE, " +
      "FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE SET NULL, " +
      "UNIQUE(date, time)" +
      ")"
  );
});

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
};
