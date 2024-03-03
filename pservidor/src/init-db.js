const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./p2p.db', (err) => {
  if (err) {
    console.error('Error al abrir la base de datos', err);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

db.serialize(() => {
  // Crear tabla de peers
  db.run(`CREATE TABLE IF NOT EXISTS peers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    peerName TEXT NOT NULL UNIQUE,
    ip TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `);
});

db.close();
