const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./p2p.db');

const app = express();
app.use(express.json()); // Para parsear application/json
const port = process.argv[2] || 3000;
const portGrpc = process.argv[3] || 50051;


const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('file_service.proto', {});
const fileService = grpc.loadPackageDefinition(packageDefinition).fileshare;

function announceFiles(call, callback) {
  const peerId = call.request.peerId;
  const files = call.request.files.join(', ');
  console.log(`Peer ${peerId} ha anunciado los siguientes archivos: ${files}`);
  callback(null, { success: true, message: "Archivos anunciados con éxito" });
}

const server = new grpc.Server();
server.addService(fileService.FileService.service, { AnnounceFiles: announceFiles });
server.bindAsync(`0.0.0.0:${portGrpc}`, grpc.ServerCredentials.createInsecure(), () => {
  server.start();
  console.log(`Servidor gRPC escuchando en el puerto ${portGrpc}`);
});










// Endpoint para registro/login de peer
app.post('/peer/login', (req, res) => {
  const { peerName, ip } = req.body;
  // Actualización de la consulta para utilizar UPSERT
  const query = `
    INSERT INTO peers (peerName, ip, active) VALUES (?, ?, 1)
    ON CONFLICT(peerName) DO UPDATE SET
      ip = excluded.ip,
      lastSeen = CURRENT_TIMESTAMP,
      active = 1;
  `;
  db.run(query, [peerName, ip], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Peer registrado/actualizado con éxito' });
  });
});


// Endpoint para logout de peer
app.post('/peer/logout', (req, res) => {
    const { peerName } = req.body;
    const query = `UPDATE peers SET active = 0 WHERE peerName = ?`;
    db.run(query, [peerName], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Peer no encontrado o ya inactivo' });
      }
      res.json({ message: 'Peer marcado como inactivo exitosamente' });
    });
  });

// Endpoint para listar peers activos
app.get('/peers', (req, res) => {
  const query = `SELECT * FROM peers WHERE active = 1;`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ peers: rows });
  });
});

app.post('/peer/heartbeat', (req, res) => {
  const { peerName } = req.body;
  const query = `UPDATE peers SET lastSeen = CURRENT_TIMESTAMP WHERE peerName = ?`;
  db.run(query, [peerName], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Peer no encontrado' });
    }
    res.json({ message: 'Heartbeat recibido' });
  });
});

app.listen(port, () => {
  console.log(`PServidor escuchando en http://localhost:${port}`);
});

const CHECK_INTERVAL = 60000; // 60 segundos
const TIMEOUT = 300000; // 5 minutos

setInterval(() => {
  const query = `UPDATE peers SET active = 0 WHERE (strftime('%s', 'now') - strftime('%s', lastSeen)) > ?`;
  db.run(query, [TIMEOUT / 1000], function(err) {
    if (err) {
      console.error('Error actualizando estados de inactividad:', err);
    } else {
      console.log(`Peers inactivos actualizados: ${this.changes}`);
    }
  });
}, CHECK_INTERVAL);
