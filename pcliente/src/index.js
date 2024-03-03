const axios = require('axios');
const os = require('os');

// Configuración inicial
const SERVER_URL = process.argv[2] || 'http://localhost:3000'; // Permite especificar el servidor como argumento
const peerName = `peer${Math.floor(Math.random() * 100)}`;
const ip = getLocalIP();
const HEARTBEAT_INTERVAL = 60000; // 60 segundos
const portGrpc = process.argv[3] || 50051;



const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('file_service.proto', {});
const fileService = grpc.loadPackageDefinition(packageDefinition).fileshare;

const client = new fileService.FileService(`localhost:${portGrpc}`, grpc.credentials.createInsecure());

const peerId = peerName; // Este sería el identificador único del peer
const files = ["ejemplo.txt", "archivo.txt"]; // Los archivos que el peer quiere anunciar

client.AnnounceFiles({ peerId, files }, (error, response) => {
  if (!error) {
    console.log('Respuesta del servidor:', response.message);
  } else {
    console.error('Error:', error.message);
  }
});





function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '0.0.0.0';
}

// Función para registrar el peer en el PServidor
function registerPeer() {
  axios.post(`${SERVER_URL}/peer/login`, { peerName, ip })
    .then(() => console.log(`${peerName} registrado con IP ${ip}`))
    .catch(err => console.error('Error registrando el peer:', err));
}

// Función para enviar heartbeats periódicos
function sendHeartbeat() {
  axios.post(`${SERVER_URL}/peer/heartbeat`, { peerName })
    .then(() => console.log(`Heartbeat enviado por ${peerName}`))
    .catch(err => console.error('Error enviando heartbeat:', err));
}

// Función para marcar el peer como inactivo en el PServidor
function logoutPeer() {
  axios.post(`${SERVER_URL}/peer/logout`, { peerName })
    .then(() => console.log(`${peerName} marcado como inactivo`))
    .catch(err => console.error('Error al marcar el peer como inactivo:', err));
}

process.on('SIGINT', () => {
  console.log('\nRecibida señal de interrupción, cerrando peer...');
  logoutPeer();
});

// Llamar a registerPeer al iniciar el PCliente
registerPeer();

// Enviar heartbeats periódicamente
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
