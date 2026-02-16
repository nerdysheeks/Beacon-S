# Beacon-S Troubleshooting Guide

Common issues and their solutions.

## Installation Issues

### Issue: `npm install` fails

**Symptoms**: Error messages during dependency installation

**Solutions**:

1. **Check Node.js version**:
   ```bash
   node --version  # Should be 14.0.0 or higher
   npm --version   # Should be 6.0.0 or higher
   ```

2. **Clear npm cache**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use different registry** (if behind firewall):
   ```bash
   npm config set registry https://registry.npmjs.org/
   ```

### Issue: Permission errors on macOS/Linux

**Symptoms**: `EACCES` or permission denied errors

**Solution**:
```bash
# Don't use sudo! Instead, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

## Backend Issues

### Issue: Port 3001 already in use

**Symptoms**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solutions**:

1. **Find and kill the process**:
   ```bash
   # macOS/Linux
   lsof -ti:3001 | xargs kill -9
   
   # Or find the process ID
   lsof -i:3001
   kill -9 <PID>
   ```

2. **Change the port** (in `backend/server.js`):
   ```javascript
   const PORT = 3002; // Use different port
   ```

### Issue: Backend crashes immediately

**Symptoms**: Server starts then exits with error

**Solutions**:

1. **Check for syntax errors**:
   ```bash
   cd backend
   node --check server.js
   ```

2. **Check dependencies**:
   ```bash
   cd backend
   npm list
   # Look for missing or incompatible packages
   ```

3. **Run with verbose logging**:
   ```bash
   NODE_ENV=development node server.js
   ```

## Frontend Issues

### Issue: Port 5173 already in use

**Symptoms**: Vite fails to start, port conflict

**Solutions**:

1. **Kill existing process**:
   ```bash
   lsof -ti:5173 | xargs kill -9
   ```

2. **Use different port** (in `frontend/vite.config.js`):
   ```javascript
   export default defineConfig({
     server: {
       port: 5174 // Change port
     }
   });
   ```

### Issue: Blank white screen

**Symptoms**: App loads but shows nothing

**Solutions**:

1. **Check browser console** (F12):
   - Look for JavaScript errors
   - Check for failed network requests

2. **Verify backend is running**:
   ```bash
   curl http://localhost:3001
   # Should not get "connection refused"
   ```

3. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear cache in browser settings

4. **Check React errors**:
   ```bash
   cd frontend
   npm run build
   # Look for build errors
   ```

## Connection Issues

### Issue: "Waiting for peer..." forever

**Symptoms**: Chat shows "Waiting for peer" and never connects

**Solutions**:

1. **Verify both tabs use EXACT same room name**:
   - Case-sensitive: "Room1" ≠ "room1"
   - No extra spaces

2. **Check backend is running**:
   ```bash
   # Should see "Beacon-S signaling server running"
   ```

3. **Check browser console** (F12):
   - Look for WebSocket connection errors
   - Check for CORS errors

4. **Verify WebSocket connection**:
   - Open DevTools → Network → WS tab
   - Should see active WebSocket connection

5. **Try different browser**:
   - Some corporate firewalls block WebSocket
   - Try Chrome, Firefox, or Edge

### Issue: Peers connect then immediately disconnect

**Symptoms**: Brief connection, then "Peer disconnected"

**Solutions**:

1. **Check firewall settings**:
   - WebRTC requires UDP ports
   - May be blocked by corporate firewall

2. **Try on same machine**:
   - Open two tabs on same computer
   - Eliminates network issues

3. **Check STUN server**:
   - Default uses Google's STUN server
   - May be blocked in some networks

4. **Use local network only**:
   - Ensure both devices on same WiFi
   - Check router settings

### Issue: "Connected to peer" but messages don't appear

**Symptoms**: Status shows connected, but messages not received

**Solutions**:

1. **Check browser console for errors**:
   - Look for encryption/decryption errors
   - Check for DataChannel errors

2. **Verify Web Crypto API support**:
   ```javascript
   // In browser console:
   console.log(crypto.subtle); // Should not be undefined
   ```

3. **Try sending from other peer**:
   - May be one-way issue

4. **Refresh both tabs**:
   - Rejoin the room

## Encryption Issues

### Issue: "Failed to decrypt message"

**Symptoms**: Error in console about decryption failure

**Solutions**:

1. **Ensure key exchange completed**:
   - Both peers should show "Connected to peer (E2EE active)"
   - Wait a few seconds after connection

2. **Check for key mismatch**:
   - Refresh both tabs
   - Rejoin room to re-establish keys

3. **Verify browser support**:
   ```javascript
   // In browser console:
   crypto.subtle.generateKey({name: 'ECDH', namedCurve: 'P-256'}, true, ['deriveKey'])
     .then(() => console.log('✅ ECDH supported'))
     .catch(() => console.log('❌ ECDH not supported'));
   ```

### Issue: PoW computation takes too long

**Symptoms**: "Computing PoW..." for more than 30 seconds

**Solutions**:

1. **Normal behavior**:
   - Should take 5-15 seconds
   - Depends on device CPU

2. **If taking too long**:
   - Close other tabs/apps
   - Check CPU usage
   - Try on faster device

3. **Reduce difficulty** (for testing only):
   ```javascript
   // In frontend/src/utils/crypto.js
   export async function computeProofOfWork(message, difficulty = '000') {
     // Changed from '0000' to '000' (3 zeros instead of 4)
   ```

## Simulator Issues

### Issue: Nodes don't connect (no edges)

**Symptoms**: Drag nodes together but no green lines appear

**Solutions**:

1. **Check distance**:
   - Nodes must be within 250px
   - Try dragging very close together

2. **Check browser console**:
   - Look for JavaScript errors

3. **Refresh page**:
   - React Flow may need reset

### Issue: "Collect Messages" does nothing

**Symptoms**: Click button but nothing happens

**Solutions**:

1. **Verify drone is selected**:
   - Click on drone node first
   - Should see "Selected: drone-X" in right panel

2. **Check drone is in range**:
   - Must be within 250px of survivor
   - Green edge should be visible

3. **Verify survivor has messages**:
   - Click on survivor node
   - Should show 3 default messages

4. **Check browser console**:
   - Look for error messages

### Issue: Integrity check always shows "TAMPERED"

**Symptoms**: Even without tampering, shows red badge

**Solutions**:

1. **Don't modify messages manually**:
   - Only use "Tamper Data" button

2. **Collect fresh messages**:
   - Add new survivor node
   - Collect from new survivor

3. **Check browser console**:
   - Look for hash computation errors

## Browser Compatibility Issues

### Issue: App doesn't work in Safari

**Symptoms**: Features broken or not loading

**Solutions**:

1. **Update Safari**:
   - Requires Safari 15+ for full support
   - Update macOS if needed

2. **Enable experimental features**:
   - Safari → Preferences → Advanced
   - Check "Show Develop menu"
   - Develop → Experimental Features
   - Enable WebRTC features

### Issue: App doesn't work in Firefox

**Symptoms**: Connection issues or errors

**Solutions**:

1. **Update Firefox**:
   - Requires Firefox 88+

2. **Check privacy settings**:
   - Firefox → Preferences → Privacy
   - Ensure WebRTC is not blocked

3. **Disable tracking protection** (for localhost):
   - Click shield icon in address bar
   - Turn off Enhanced Tracking Protection

## Performance Issues

### Issue: UI freezes during PoW computation

**Symptoms**: Browser becomes unresponsive

**Solutions**:

1. **Expected behavior**:
   - Some lag is normal during PoW
   - Should still be usable

2. **If completely frozen**:
   - Close other tabs
   - Reduce difficulty (see above)

3. **Use Web Worker** (advanced):
   - Move PoW to background thread
   - Requires code modification

### Issue: Simulator is laggy

**Symptoms**: Slow dragging, choppy animations

**Solutions**:

1. **Reduce number of nodes**:
   - Start with 3-4 nodes
   - Add more gradually

2. **Close other tabs**:
   - Free up browser resources

3. **Disable animations**:
   ```javascript
   // In Simulator.jsx, change:
   animated: false  // Instead of true
   ```

## Network Issues

### Issue: CORS errors in console

**Symptoms**: "Access-Control-Allow-Origin" errors

**Solutions**:

1. **Verify backend CORS config**:
   ```javascript
   // In backend/server.js
   cors: {
     origin: "http://localhost:5173",  // Must match frontend URL
     methods: ["GET", "POST"]
   }
   ```

2. **Check frontend URL**:
   - Must access via `http://localhost:5173`
   - Not `127.0.0.1` or other IP

3. **Restart backend**:
   ```bash
   # Kill and restart
   cd backend
   npm start
   ```

### Issue: WebSocket connection fails

**Symptoms**: "WebSocket connection failed" in console

**Solutions**:

1. **Check backend is running**:
   ```bash
   curl http://localhost:3001
   ```

2. **Check firewall**:
   - Allow connections on port 3001
   - Disable firewall temporarily for testing

3. **Try different port**:
   - Change both backend and frontend config

## Testing Issues

### Issue: Can't test with two tabs

**Symptoms**: Second tab doesn't connect

**Solutions**:

1. **Use incognito/private window**:
   - Regular tab + incognito tab
   - Avoids session conflicts

2. **Use different browsers**:
   - Chrome + Firefox
   - Eliminates browser-specific issues

3. **Use different devices**:
   - Two computers on same network
   - Most realistic test

## Debug Mode

### Enable verbose logging

Add to browser console:
```javascript
// Enable debug mode
localStorage.setItem('debug', 'beacon:*');
location.reload();
```

### Check WebRTC stats

In browser console:
```javascript
// Get peer connection stats
peerConnectionRef.current.getStats().then(stats => {
  stats.forEach(report => console.log(report));
});
```

### Monitor WebSocket messages

In DevTools:
1. Open Network tab
2. Click WS (WebSocket) filter
3. Click on connection
4. View Messages tab

## Getting Help

### Information to provide

When asking for help, include:

1. **Environment**:
   - OS and version
   - Browser and version
   - Node.js version

2. **Error messages**:
   - Full error from console
   - Screenshot if helpful

3. **Steps to reproduce**:
   - What you did
   - What you expected
   - What actually happened

4. **Logs**:
   - Backend console output
   - Browser console errors

### Useful commands

```bash
# System info
node --version
npm --version
uname -a  # macOS/Linux

# Check processes
lsof -i:3001
lsof -i:5173

# Network test
curl http://localhost:3001
curl http://localhost:5173

# View logs
cd backend
npm start 2>&1 | tee backend.log

cd frontend
npm run dev 2>&1 | tee frontend.log
```

## Still Having Issues?

1. **Read the documentation**:
   - [README.md](README.md)
   - [ARCHITECTURE.md](ARCHITECTURE.md)
   - [TESTING_GUIDE.md](TESTING_GUIDE.md)

2. **Check browser console**:
   - Press F12
   - Look for red errors
   - Check Network tab

3. **Try the basics**:
   - Restart backend
   - Refresh frontend
   - Clear browser cache
   - Try different browser

4. **Start fresh**:
   ```bash
   # Clean install
   rm -rf backend/node_modules frontend/node_modules
   ./setup.sh
   ```

---

Most issues can be resolved by checking the browser console and ensuring both backend and frontend are running correctly.
