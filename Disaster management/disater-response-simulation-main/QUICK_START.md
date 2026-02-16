# Beacon-S Quick Start Guide

Get up and running in 5 minutes.

## Installation

### Option 1: Automated Setup (Recommended)

```bash
./setup.sh
```

### Option 2: Manual Setup

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Running the Application

### Terminal 1: Start Backend

```bash
cd backend
npm start
```

Expected output:
```
Beacon-S signaling server running on port 3001
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

## Quick Test

### Test Beacon-Chat (2 minutes)

1. Open `http://localhost:5173/chat` in two browser tabs
2. Enter "test" as room name in both tabs
3. Click "Join Room" in both tabs
4. Wait for "🔒 Connected to peer (E2EE active)"
5. Type a message and click "Send"
6. ✅ Message appears in both tabs

### Test Beacon-Sim (2 minutes)

1. Open `http://localhost:5173/simulator`
2. Click "Add Survivor", "Add Drone", "Add Edge Hub"
3. Drag nodes close together → edges appear
4. Click drone, drag near survivor, click "Collect Messages"
5. Drag drone near edge hub, click "Deliver Messages"
6. ✅ See "VERIFIED - INTEGRITY OK"

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Connection Failed

- Ensure backend is running first
- Check firewall settings
- Try `http://localhost:5173` (not 127.0.0.1)

### Peers Not Connecting

- Use exact same room name
- Refresh both tabs
- Check browser console for errors

## Key Features

### Beacon-Chat

- 🔒 **E2EE**: AES-GCM 256-bit encryption
- 🌐 **P2P**: Direct WebRTC connection
- 🚨 **SOS**: Proof-of-Work spam prevention
- 📡 **Local**: Works without internet

### Beacon-Sim

- 🔗 **MANET**: Auto-connecting mesh network
- 🚁 **DTN**: Data mule simulation
- ✅ **Integrity**: SHA-256 verification
- 🎨 **Interactive**: Drag-and-drop nodes

## Next Steps

- Read [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Experiment with different trust levels
- Try tampering detection in simulator

## Support

Check browser console (F12) for error messages.

Common browser requirements:
- Chrome/Edge 90+
- Firefox 88+
- Safari 15+

## Demo Script (For Presentations)

### 1-Minute Demo

"Beacon-S enables secure communication in disaster zones. Watch as I connect two devices peer-to-peer with end-to-end encryption, no internet required. The simulator shows how drones can ferry messages between isolated groups."

### 5-Minute Demo

1. **Intro** (30s): Explain disaster scenario
2. **Chat Demo** (2m): Show P2P connection, E2EE, PoW
3. **Sim Demo** (2m): Show MANET, DTN, integrity check
4. **Wrap-up** (30s): Highlight innovation

### Key Talking Points

- ✅ Works offline (local network only)
- ✅ Military-grade encryption (AES-256)
- ✅ Spam-resistant (Proof-of-Work)
- ✅ Tamper-proof (SHA-256 hashing)
- ✅ Decentralized (no single point of failure)

## Project Structure

```
beacon-s/
├── backend/          # Signaling server
├── frontend/         # React application
├── README.md         # Overview
├── TESTING_GUIDE.md  # Comprehensive tests
├── ARCHITECTURE.md   # Technical details
└── QUICK_START.md    # This file
```

---

**Ready to go!** Open http://localhost:5173 and start exploring.
