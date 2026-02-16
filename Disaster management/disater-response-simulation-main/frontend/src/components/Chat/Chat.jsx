import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  computeProofOfWork,
  verifyProofOfWork
} from '../../utils/crypto';
import './Chat.css';

const TRUST_LEVELS = {
  UNVERIFIED: 'unverified',
  VOUCHED: 'vouched',
  RESPONDER: 'responder'
};

function Chat() {
  const [roomName, setRoomName] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [trustLevel, setTrustLevel] = useState(TRUST_LEVELS.UNVERIFIED);
  const [computing, setComputing] = useState(false);
  const [lastSosTime, setLastSosTime] = useState(0);

  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const keyPairRef = useRef(null);
  const sharedKeyRef = useRef(null);
  const peerIdRef = useRef(null);

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, []);

  const joinRoom = async () => {
    if (!roomName.trim()) return;

    setStatus('Connecting to signaling server...');
    
    // Generate ECDH key pair
    keyPairRef.current = await generateKeyPair();
    
    // Connect to signaling server
    socketRef.current = io('http://localhost:8001');
    
    socketRef.current.on('connect', () => {
      setStatus('Connected to server. Joining room...');
      socketRef.current.emit('join-room', roomName);
    });

    socketRef.current.on('existing-peers', async (peers) => {
      if (peers.length > 0) {
        // Create offer to first peer
        await createPeerConnection(peers[0], true);
      } else {
        setStatus('Waiting for peer...');
      }
    });

    socketRef.current.on('peer-joined', async (peerId) => {
      setStatus('Peer joined. Waiting for connection...');
      peerIdRef.current = peerId;
    });

    socketRef.current.on('webrtc-offer', async ({ from, offer, publicKey }) => {
      peerIdRef.current = from;
      await createPeerConnection(from, false);
      await peerConnectionRef.current.setRemoteDescription(offer);
      
      // Import peer's public key and derive shared key
      const peerPublicKey = await importPublicKey(publicKey);
      sharedKeyRef.current = await deriveSharedKey(keyPairRef.current.privateKey, peerPublicKey);
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      const myPublicKey = await exportPublicKey(keyPairRef.current.publicKey);
      socketRef.current.emit('webrtc-answer', {
        target: from,
        answer,
        publicKey: myPublicKey
      });
    });

    socketRef.current.on('webrtc-answer', async ({ from, answer, publicKey }) => {
      await peerConnectionRef.current.setRemoteDescription(answer);
      
      // Import peer's public key and derive shared key
      const peerPublicKey = await importPublicKey(publicKey);
      sharedKeyRef.current = await deriveSharedKey(keyPairRef.current.privateKey, peerPublicKey);
    });

    socketRef.current.on('webrtc-ice-candidate', async ({ from, candidate }) => {
      if (peerConnectionRef.current && candidate) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    });

    socketRef.current.on('peer-left', () => {
      setStatus('Peer disconnected');
      if (dataChannelRef.current) dataChannelRef.current.close();
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    });

    setJoined(true);
  };

  const createPeerConnection = async (peerId, isInitiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('webrtc-ice-candidate', {
          target: peerId,
          candidate: event.candidate
        });
      }
    };

    if (isInitiator) {
      const dataChannel = pc.createDataChannel('chat');
      setupDataChannel(dataChannel);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      const myPublicKey = await exportPublicKey(keyPairRef.current.publicKey);
      socketRef.current.emit('webrtc-offer', {
        target: peerId,
        offer,
        publicKey: myPublicKey
      });
    } else {
      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };
    }

    peerConnectionRef.current = pc;
  };

  const setupDataChannel = (channel) => {
    dataChannelRef.current = channel;

    channel.onopen = () => {
      setStatus('🔒 Connected to peer (E2EE active)');
    };

    channel.onclose = () => {
      setStatus('Peer disconnected');
    };

    channel.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      // Decrypt message
      const decrypted = await decryptMessage(
        sharedKeyRef.current,
        data.ciphertext,
        data.iv
      );
      
      const msg = JSON.parse(decrypted);
      
      // Verify PoW for SOS messages from unverified users
      if (msg.type === 'sos' && msg.trustLevel === TRUST_LEVELS.UNVERIFIED) {
        const valid = await verifyProofOfWork(
          msg.text,
          msg.pow.timestamp,
          msg.pow.nonce
        );
        
        if (!valid) {
          console.log('Invalid PoW - message rejected');
          return;
        }
      }
      
      setMessages(prev => [...prev, {
        text: msg.text,
        type: msg.type,
        sender: 'peer',
        timestamp: new Date().toLocaleTimeString()
      }]);
    };
  };

  const sendMessage = async (type = 'normal') => {
    if (!inputMessage.trim() || !dataChannelRef.current || computing) return;

    let pow = null;
    
    // Handle SOS message based on trust level
    if (type === 'sos') {
      if (trustLevel === TRUST_LEVELS.UNVERIFIED) {
        setComputing(true);
        pow = await computeProofOfWork(inputMessage);
        setComputing(false);
      } else if (trustLevel === TRUST_LEVELS.VOUCHED) {
        const now = Date.now();
        if (now - lastSosTime < 60000) {
          alert('Rate limited: Wait 1 minute between SOS messages');
          return;
        }
        setLastSosTime(now);
      }
      // RESPONDER has no limits
    }

    const message = {
      text: inputMessage,
      type,
      trustLevel,
      pow
    };

    // Encrypt message
    const encrypted = await encryptMessage(
      sharedKeyRef.current,
      JSON.stringify(message)
    );

    // Send via WebRTC data channel
    dataChannelRef.current.send(JSON.stringify(encrypted));

    setMessages(prev => [...prev, {
      text: inputMessage,
      type,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString()
    }]);

    setInputMessage('');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>💬 Beacon-Chat</h2>
        <div className="status">{status}</div>
      </div>

      {!joined ? (
        <div className="join-form">
          <h3>Join a Room</h3>
          <input
            type="text"
            placeholder="Enter room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
          />
          <button onClick={joinRoom}>Join Room</button>
          <p className="info">
            💡 Open another tab with the same room name to test P2P chat
          </p>
        </div>
      ) : (
        <>
          <div className="trust-selector">
            <label>Trust Level:</label>
            <select value={trustLevel} onChange={(e) => setTrustLevel(e.target.value)}>
              <option value={TRUST_LEVELS.UNVERIFIED}>Unverified (PoW required)</option>
              <option value={TRUST_LEVELS.VOUCHED}>Vouched (Rate limited)</option>
              <option value={TRUST_LEVELS.RESPONDER}>Responder (Unlimited)</option>
            </select>
          </div>

          <div className="messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender} ${msg.type}`}>
                <div className="message-content">
                  {msg.type === 'sos' && <span className="sos-badge">🚨 SOS</span>}
                  {msg.text}
                </div>
                <div className="message-time">{msg.timestamp}</div>
              </div>
            ))}
          </div>

          <div className="input-area">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={computing || status !== '🔒 Connected to peer (E2EE active)'}
            />
            <button 
              onClick={() => sendMessage('normal')}
              disabled={computing || status !== '🔒 Connected to peer (E2EE active)'}
            >
              Send
            </button>
            <button 
              onClick={() => sendMessage('sos')}
              disabled={computing || status !== '🔒 Connected to peer (E2EE active)'}
              className="sos-btn"
            >
              {computing ? 'Computing PoW...' : 'Send SOS'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Chat;
