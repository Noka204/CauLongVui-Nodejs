console.log('>>> SERVER BOOTING - VERSION 1.0.1 <<<');
const app = require('./app');
const connectDB = require('./config/db');

const http = require('http');
const { Server } = require('socket.io');
const socketService = require('./services/socket.service');
const { initWatchers } = require('./watchers/change-stream.watcher');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
  }
});
socketService.init(io);

// Connect to Database
connectDB().then(() => {
  // MUST start watchers AFTER DB connection is ready
  // initWatchers(); // Disabled: Requires MongoDB replica set
  console.log('⚠️  Change Stream watchers disabled (requires replica set)');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
