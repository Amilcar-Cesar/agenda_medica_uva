const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "..", "data.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(
    "CREATE TABLE IF NOT EXISTS users (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "name TEXT NOT NULL, " +
      "email TEXT NOT NULL UNIQUE, " +
      "password_hash TEXT NOT NULL, " +
      "role TEXT NOT NULL, " +
      "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
      ")"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS appointments (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "patient_id INTEGER NOT NULL, " +
      "secretary_id INTEGER, " +
      "date TEXT NOT NULL, " +
      "time TEXT NOT NULL, " +
      "reason TEXT, " +
      "cep TEXT NOT NULL, " +
      "street TEXT NOT NULL, " +
      "neighborhood TEXT NOT NULL, " +
      "city TEXT NOT NULL, " +
      "state TEXT NOT NULL, " +
      "number TEXT, " +
      "complement TEXT, " +
      "weather_rain INTEGER, " +
      "weather_summary TEXT, " +
      "status TEXT NOT NULL DEFAULT 'scheduled', " +
      "created_at TEXT NOT NULL DEFAULT (datetime('now')), " +
      "FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE, " +
      "FOREIGN KEY (secretary_id) REFERENCES users(id) ON DELETE SET NULL, " +
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
