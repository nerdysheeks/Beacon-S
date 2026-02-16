# Beacon-S: Secure Ad-Hoc Communication Suite

A full-stack disaster response application featuring real P2P encrypted chat and network simulation.

## Project Structure

```
beacon-s/
├── backend/           # Node.js signaling server
│   ├── server.js      # WebSocket signaling logic
│   └── package.json
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   └── Simulator/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
└── README.md
```

## Features

### Beacon-Chat
- **P2P WebRTC**: Direct peer-to-peer communication via RTCDataChannel
- **E2EE**: AES-GCM 256-bit encryption using Web Crypto API
- **WoT-PoW**: Web-of-Trust with Proof-of-Work spam prevention
- **Local-First**: Works without internet (local network only)

### Beacon-Sim
- **MANET Visualizer**: Interactive node-based network simulation
- **DTN Simulation**: Data Mule store-and-forward demonstration
- **Integrity Verification**: SHA-256 hash verification with tampering detection

## Installation & Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Start the Backend Server

```bash
cd backend
npm start
```

Server runs on `http://localhost:3001`

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

App runs on `http://localhost:5173`

## Testing Guide

### Testing Beacon-Chat

1. Open two browser tabs/windows at `http://localhost:5173/chat`
2. Enter the same room name in both tabs (e.g., "shelter1")
3. Click "Join Room" in both tabs
4. Wait for "Connected to peer" status
5. Send messages - they're encrypted end-to-end!

**Testing Trust Levels:**
- Default users are "Unverified"
- Click "Send SOS" as Unverified - watch the PoW computation
- Change trust level to "Vouched" or "Responder" to see different behaviors

### Testing Beacon-Sim

1. Navigate to `http://localhost:5173/simulator`
2. Click "Add Survivor", "Add Drone", "Add Edge Hub" to create nodes
3. Drag nodes close together - edges auto-connect when in range
4. **DTN Test:**
   - Place Survivor and Edge Hub far apart
   - Drag Drone near Survivor - messages transfer to drone
   - Drag Drone near Edge Hub - messages deliver with integrity check
5. Click "Tamper Data" on drone to simulate data corruption

## Technology Stack

- **Frontend**: React 18, React Router, React Flow
- **Backend**: Node.js, Express, Socket.IO
- **Security**: Web Crypto API (SubtleCrypto)
- **P2P**: WebRTC (RTCDataChannel)
- **Styling**: CSS Modules

## Architecture Notes

- Signaling server only facilitates WebRTC handshake
- All chat data flows P2P via RTCDataChannel (never through server)
- Encryption keys derived via ECDH key exchange
- PoW difficulty: SHA-256 hash must start with "0000"
