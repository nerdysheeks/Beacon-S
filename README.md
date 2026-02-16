# Beacon-S: Secure Ad-Hoc Communication Suite 
**P2P Encrypted Disaster-Response Communication & Network Simulation Platform**

Beacon-S is a full-stack disaster-response communication system designed to enable **secure peer-to-peer messaging and resilient ad-hoc network simulation** in environments where traditional infrastructure is unavailable. The platform combines **WebRTC-based encrypted chat (Beacon-Chat)** with an interactive **MANET/DTN simulation engine (Beacon-Sim)** for testing emergency communication scenarios.

---

##  Overview
In disaster scenarios, centralized communication networks often fail. Beacon-S provides a **local-first, infrastructure-independent communication solution** where devices communicate directly using peer-to-peer encrypted channels while simultaneously simulating real-world mobile ad-hoc network behavior for planning and training purposes.

---

##  Features

### Beacon-Chat
- **P2P WebRTC Communication:** Direct messaging using RTCDataChannel  
- **End-to-End Encryption:** AES-GCM 256-bit encryption via Web Crypto API  
- **Web-of-Trust + Proof-of-Work:** Spam prevention and trust-based messaging  
- **Local-First Operation:** Works over local networks without internet connectivity  

### Beacon-Sim
- **MANET Visualizer:** Interactive node-based network topology simulation  
- **DTN Demonstration:** Store-and-forward “data mule” communication model  
- **Integrity Verification:** SHA-256 hash validation with tampering detection  

---

## Project Structure

```text
beacon-s/
├── backend/           
│   ├── server.js
│   └── package.json
├── frontend/          
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

---

## Technology Stack
- **Frontend:** React 18, React Router, React Flow  
- **Backend:** Node.js, Express, Socket.IO  
- **Peer-to-Peer:** WebRTC (RTCDataChannel)  
- **Security:** Web Crypto API (SubtleCrypto), AES-GCM, ECDH Key Exchange  
- **Integrity:** SHA-256 Hash Verification  
- **Styling:** CSS Modules  

---

## Installation & Setup

### 1. Install Dependencies

**Backend**
```bash
cd backend
npm install
```

**Frontend**
```bash
cd frontend
npm install
```

---

### 2. Start the Backend Server
```bash
cd backend
npm start
```
Server runs on **http://localhost:3001**

---

### 3. Start the Frontend
```bash
cd frontend
npm run dev
```
App runs on **http://localhost:5173**


## Testing Guide

### Testing Beacon-Chat
1. Open two browser tabs/windows at `http://localhost:5173/chat`
2. Enter the same room name in both tabs (e.g., **"shelter1"**)
3. Click **"Join Room"** in both tabs
4. Wait for **"Connected to peer"** status
5. Send messages — they're encrypted end-to-end!

**Testing Trust Levels**
- Default users are **"Unverified"**
- Click **"Send SOS"** as Unverified — watch the PoW computation
- Change trust level to **"Vouched"** or **"Responder"** to see different behaviors

---

### Testing Beacon-Sim
1. Navigate to `http://localhost:5173/simulator`
2. Click **"Add Survivor"**, **"Add Drone"**, **"Add Edge Hub"** to create nodes
3. Drag nodes close together — edges auto-connect when in range

**DTN Test**
- Place Survivor and Edge Hub far apart
- Drag Drone near Survivor — messages transfer to drone
- Drag Drone near Edge Hub — messages deliver with integrity check
- Click **"Tamper Data"** on drone to simulate data corruption

---

## Technology Stack
- **Frontend:** React 18, React Router, React Flow  
- **Backend:** Node.js, Express, Socket.IO  
- **Security:** Web Crypto API (SubtleCrypto)  
- **P2P:** WebRTC (RTCDataChannel)  
- **Styling:** CSS Modules  

---

## Architecture Notes
- Signaling server only facilitates **WebRTC handshake**
- All chat data flows **P2P via RTCDataChannel** (never through server)
- Encryption keys derived via **ECDH key exchange**
- PoW difficulty: **SHA-256 hash must start with "0000"**
