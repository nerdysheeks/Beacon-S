# Beacon-S Testing Guide

Complete guide to test all features of the Beacon-S application.

## Prerequisites

1. Backend server running on `http://localhost:3001`
2. Frontend running on `http://localhost:5173`
3. Two browser tabs/windows for P2P testing

## Module 1: Beacon-Chat Testing

### Test 1: Basic P2P Connection

**Objective**: Verify WebRTC peer-to-peer connection establishment

1. Open Tab 1: `http://localhost:5173/chat`
2. Open Tab 2: `http://localhost:5173/chat`
3. In both tabs, enter the same room name (e.g., "shelter1")
4. Click "Join Room" in both tabs
5. **Expected**: Both tabs show "🔒 Connected to peer (E2EE active)"

### Test 2: End-to-End Encryption

**Objective**: Verify messages are encrypted using AES-GCM

1. With both tabs connected (from Test 1)
2. In Tab 1, type "Hello from Tab 1" and click "Send"
3. **Expected**: 
   - Tab 1 shows message on right (blue, "me")
   - Tab 2 shows message on left (gray, "peer")
4. Open browser DevTools → Network tab
5. **Expected**: No plain text messages visible in WebSocket traffic (only signaling)

### Test 3: Trust Level - Unverified (Proof of Work)

**Objective**: Verify PoW computation for unverified users

1. In Tab 1, ensure Trust Level is "Unverified"
2. Type "Emergency help needed" in the input
3. Click "Send SOS" button
4. **Expected**:
   - Button changes to "Computing PoW..."
   - Browser computes SHA-256 hash (takes 5-10 seconds)
   - Message sends with 🚨 SOS badge
   - Tab 2 receives and displays the SOS message

### Test 4: Trust Level - Vouched (Rate Limiting)

**Objective**: Verify rate limiting for vouched users

1. In Tab 1, change Trust Level to "Vouched"
2. Type "First SOS" and click "Send SOS"
3. **Expected**: Message sends immediately (no PoW)
4. Immediately type "Second SOS" and click "Send SOS"
5. **Expected**: Alert "Rate limited: Wait 1 minute between SOS messages"

### Test 5: Trust Level - Responder (Unlimited)

**Objective**: Verify unlimited SOS for responders

1. In Tab 1, change Trust Level to "Responder"
2. Send multiple SOS messages rapidly
3. **Expected**: All messages send immediately with no restrictions

### Test 6: PoW Verification

**Objective**: Verify receiving peer validates PoW

1. Tab 1: Set to "Unverified"
2. Tab 2: Open browser console (DevTools)
3. Tab 1: Send an SOS message (PoW will compute)
4. **Expected**: Tab 2 console shows no "Invalid PoW" message
5. Message displays correctly in Tab 2

## Module 2: Beacon-Sim Testing

### Test 7: MANET Visualization

**Objective**: Verify Mobile Ad-Hoc Network auto-connection

1. Navigate to `http://localhost:5173/simulator`
2. Click "Add Survivor" (creates blue node)
3. Click "Add Edge Hub" (creates green node)
4. Drag nodes far apart
5. **Expected**: No edge (connection line) between them
6. Drag nodes close together (within 250px)
7. **Expected**: Green animated edge appears automatically

### Test 8: Multiple Node Connections

**Objective**: Verify mesh network formation

1. Add 4 nodes: 2 Survivors, 1 Drone, 1 Edge Hub
2. Drag all nodes close together
3. **Expected**: Multiple edges form a mesh network
4. Drag one node away
5. **Expected**: Its edges disappear, others remain

### Test 9: DTN - Data Collection

**Objective**: Verify Data Mule message collection

1. Click "Add Survivor" (has 3 default messages)
2. Click "Add Drone"
3. Drag drone far from survivor
4. Click on the drone node (select it)
5. **Expected**: Right panel shows "Selected: drone-X"
6. Click "Collect Messages" button
7. **Expected**: Alert "No survivors in range"
8. Drag drone near survivor (within 250px)
9. Click "Collect Messages"
10. **Expected**: 
    - Alert "Collected 3 messages from survivor-X"
    - Right panel shows messages and hash

### Test 10: DTN - Data Delivery with Integrity

**Objective**: Verify store-and-forward with hash verification

1. Continue from Test 9 (drone has messages)
2. Click "Add Edge Hub"
3. Drag edge hub far from drone
4. With drone selected, click "Deliver Messages"
5. **Expected**: Alert "No edge hub in range"
6. Drag drone near edge hub
7. Click "Deliver Messages"
8. **Expected**:
   - Alert shows "Delivered 3 messages" and "Integrity: ✅ VERIFIED"
   - Click on edge hub node
   - Right panel shows "✅ VERIFIED - INTEGRITY OK"

### Test 11: Data Tampering Detection

**Objective**: Verify SHA-256 integrity check detects tampering

1. Add Survivor, Drone, Edge Hub
2. Drone collects messages from survivor
3. With drone selected, click "Tamper Data" button
4. **Expected**: Alert "Data tampered! Hash verification will fail"
5. Drag drone near edge hub
6. Click "Deliver Messages"
7. **Expected**:
   - Alert shows "Integrity: ❌ TAMPERED"
   - Edge hub shows "❌ TAMPERED - DATA CORRUPT"

### Test 12: React Flow Interactions

**Objective**: Verify interactive canvas features

1. Use mouse wheel to zoom in/out
2. Click and drag background to pan
3. Use minimap (bottom-left) to navigate
4. Use controls (bottom-right) to zoom/fit view
5. **Expected**: All interactions work smoothly

## Advanced Testing Scenarios

### Scenario A: Multi-Peer Chat Room

1. Open 3 browser tabs
2. All join the same room
3. **Expected**: Each peer connects to others (mesh topology)
4. Send messages from each tab
5. **Expected**: All tabs receive all messages

### Scenario B: Reconnection After Disconnect

1. Two tabs connected in a room
2. Close one tab
3. **Expected**: Other tab shows "Peer disconnected"
4. Reopen closed tab and rejoin same room
5. **Expected**: Peers reconnect successfully

### Scenario C: Complex DTN Network

1. Create 2 Survivors (far apart)
2. Create 2 Drones
3. Create 1 Edge Hub (in center)
4. Drone 1 collects from Survivor 1
5. Drone 2 collects from Survivor 2
6. Both drones deliver to Edge Hub
7. **Expected**: Edge Hub receives messages from both survivors

## Performance Testing

### Load Test: Message Throughput

1. Connect two peers
2. Send 50 messages rapidly
3. **Expected**: All messages encrypted, sent, and decrypted successfully

### Stress Test: PoW Computation

1. Set trust level to "Unverified"
2. Send SOS message
3. Monitor browser CPU usage
4. **Expected**: PoW completes in 5-15 seconds without freezing UI

## Security Verification

### Verify E2EE

1. Open browser DevTools → Network tab
2. Send messages between peers
3. Inspect WebSocket frames
4. **Expected**: Only see signaling messages (SDP, ICE), no chat content

### Verify PoW Difficulty

1. Open browser console
2. Send SOS as unverified user
3. Check console for hash output
4. **Expected**: Hash starts with "0000" (4 zeros)

## Troubleshooting

### Issue: "Waiting for peer..." forever

**Solution**: 
- Ensure both tabs use exact same room name
- Check backend server is running
- Check browser console for errors

### Issue: Messages not appearing

**Solution**:
- Verify status shows "🔒 Connected to peer"
- Check both peers completed key exchange
- Refresh both tabs and rejoin

### Issue: Edges not appearing in simulator

**Solution**:
- Ensure nodes are within 250px range
- Try dragging nodes closer
- Check browser console for errors

## Success Criteria

✅ All tests pass without errors  
✅ E2EE verified (no plain text in network traffic)  
✅ PoW computation completes in reasonable time  
✅ MANET edges auto-connect/disconnect based on range  
✅ DTN data mule successfully transfers messages  
✅ SHA-256 integrity check detects tampering  
✅ UI remains responsive during all operations
