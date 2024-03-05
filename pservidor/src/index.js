const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./p2p.db');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json()); // Para parsear application/json
const port = process.argv[2] || 3000;
const portGrpc = process.argv[3] || 50051;


const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('file_service.proto', {});
const fileService = grpc.loadPackageDefinition(packageDefinition).fileshare;

function uploadFiles(call, callback) {
  const peerId = call.request.peerId;
  const files = call.request.files;
  
  files.forEach((file) => {
    db.run(`INSERT INTO available_files (peerId, fileName) VALUES (?, ?)`, [peerId, file], (err) => {
      if (err) {
        return callback(err);
      }
    });
  });
  
  console.log(`Peer ${peerId} ha subido los siguientes archivos: ${files.join(', ')}`);
  callback(null, { success: true, message: "Archivos subidos con éxito" });
}

const server = new grpc.Server();
server.addService(fileService.FileService.service, { UploadFiles: uploadFiles });
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


app.get('/list-files', (req, res) => {
  const query = `
    SELECT fileName, GROUP_CONCAT(peerId) AS peers
    FROM available_files
    GROUP BY fileName;
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
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


app.post('/download-file', (req, res) => {
  const { requestingPeerId, fileName } = req.body;
  const filePath = path.join(__dirname, 'files', fileName); // Asume que cada PCliente tiene una carpeta 'files'

  // Simula la "descarga" creando un archivo dummy si no existe
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, 'Contenido simulado del archivo.');
  }

  // Inserta o actualiza la base de datos para reflejar que el peer ahora tiene este archivo
  const query = `
    INSERT INTO available_files (peerId, fileName) VALUES (?, ?)
    ON CONFLICT(peerId, fileName) DO UPDATE SET
    peerId = excluded.peerId;
  `;

  db.run(query, [requestingPeerId, fileName], (err) => {
    if (err) {
      console.error('Error al actualizar la base de datos', err);
      res.status(500).json({ error: 'Error al procesar la solicitud de descarga' });
      return;
    }
    res.json({ message: `El archivo ${fileName} ha sido simulado como descargado por ${requestingPeerId}` });
  });
});

app.post('/upload-files', (req, res) => {
  const { peerId, files } = req.body;
  console.log(files)
  const filesDirectory = path.join(__dirname, 'files');
  console.log(peerId)
  if (!fs.existsSync(filesDirectory)){
      fs.mkdirSync(filesDirectory);
  }

  const insertPromises = files.map((fileName) => {
      const filePath = path.join(filesDirectory, fileName);
      
      // Crea el archivo si no existe
      if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, 'Contenido simulado del archivo. Este contenido es dummy.');
          //console.log(`Archivo ${fileName} creado.`);
      }

      // Prepara la inserción en la base de datos
      return new Promise((resolve, reject) => {
          const query = `INSERT INTO available_files (peerId, fileName) VALUES (?, ?)
              ON CONFLICT(peerId, fileName) DO UPDATE SET fileName = excluded.fileName;`;
          db.run(query, [peerId, fileName], (err) => {
              if (err) {
                  reject(err);
              } else {
                  resolve(fileName);
              }
          });
      });
  });

  Promise.all(insertPromises).then((completed) => {
      res.json({ message: `Proceso de subida completado. Archivos anunciados: ${completed.join(', ')}` });
  }).catch((error) => {
      console.error('Error durante la subida de archivos:', error);
      res.status(500).json({ error: 'Error al procesar la subida de archivos' });
  });
});