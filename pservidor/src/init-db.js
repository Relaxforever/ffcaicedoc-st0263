const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./p2p.db', (err) => {
  if (err) {
    console.error('Error al abrir la base de datos', err);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Crear la tabla de peers si no existe
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS peers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    peerName TEXT NOT NULL UNIQUE,
    ip TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, [], (err) => {
    if (err) {
      console.error("Error al crear la tabla 'peers'", err);
    } else {
      console.log("Tabla 'peers' creada o ya existente.");
    }
  });

  // Crear la tabla de available_files si no existe
  db.run(`CREATE TABLE IF NOT EXISTS available_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    peerId TEXT NOT NULL,
    fileName TEXT NOT NULL,
    UNIQUE(peerId, fileName) ON CONFLICT REPLACE
  )`, [], (err) => {
    if (err) {
      console.error("Error al crear la tabla 'available_files'", err);
    } else {
      console.log("Tabla 'available_files' creada o ya existente.");
    }
  });
});

db.close();
