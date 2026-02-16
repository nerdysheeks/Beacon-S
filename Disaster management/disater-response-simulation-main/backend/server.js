import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Store rooms and their members
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomName) => {
    console.log(`${socket.id} joining room: ${roomName}`);
    
    // Leave any previous rooms
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    socket.join(roomName);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomName)) {
      rooms.set(roomName, new Set());
    }

    const room = rooms.get(roomName);
    
    // Notify existing peers about new peer
    socket.to(roomName).emit('peer-joined', socket.id);
    
    // Send list of existing peers to new peer
    const existingPeers = Array.from(room);
    socket.emit('existing-peers', existingPeers);
    
    // Add this peer to room
    room.add(socket.id);

    console.log(`Room ${roomName} now has ${room.size} peers`);
  });

  // WebRTC signaling messages
  socket.on('webrtc-offer', ({ target, offer, publicKey }) => {
    console.log(`Forwarding offer from ${socket.id} to ${target}`);
    io.to(target).emit('webrtc-offer', {
      from: socket.id,
      offer,
      publicKey
    });
  });

  socket.on('webrtc-answer', ({ target, answer, publicKey }) => {
    console.log(`Forwarding answer from ${socket.id} to ${target}`);
    io.to(target).emit('webrtc-answer', {
      from: socket.id,
      answer,
      publicKey
    });
  });

  socket.on('webrtc-ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('webrtc-ice-candidate', {
      from: socket.id,
      candidate
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove from all rooms
    rooms.forEach((peers, roomName) => {
      if (peers.has(socket.id)) {
        peers.delete(socket.id);
        socket.to(roomName).emit('peer-left', socket.id);
        
        if (peers.size === 0) {
          rooms.delete(roomName);
        }
      }
    });
  });
});

const PORT = 8001;
httpServer.listen(PORT, () => {
  console.log(`Beacon-S signaling server running on port ${PORT}`);
});
