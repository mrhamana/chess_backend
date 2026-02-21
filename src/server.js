const http = require('http');
const app = require('./app');
const env = require('./config/environment');
const initializeSocket = require('./sockets');

const server = http.createServer(app);

// Attach Socket.IO
initializeSocket(server);

server.listen(env.port, () => {
  console.log(`🚀 Server running on port ${env.port}`);
  console.log(`🎮 Chess backend ready – NO DATABASE MODE`);
  console.log(`🌐 CORS enabled for: ${env.frontendUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server…');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
