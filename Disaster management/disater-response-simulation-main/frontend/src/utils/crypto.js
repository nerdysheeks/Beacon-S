// Web Crypto API utilities for E2EE

// Generate ECDH key pair for key exchange
export async function generateKeyPair() {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey']
  );
}

// Export public key to send to peer
export async function exportPublicKey(publicKey) {
  const exported = await crypto.subtle.exportKey('raw', publicKey);
  return arrayBufferToBase64(exported);
}

// Import peer's public key
export async function importPublicKey(base64Key) {
  const buffer = base64ToArrayBuffer(base64Key);
  return await crypto.subtle.importKey(
    'raw',
    buffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    []
  );
}

// Derive shared AES-GCM key from ECDH
export async function deriveSharedKey(privateKey, peerPublicKey) {
  return await crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: peerPublicKey
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt message with AES-GCM
export async function encryptMessage(sharedKey, message) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(message);
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    sharedKey,
    encoded
  );
  
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv)
  };
}

// Decrypt message with AES-GCM
export async function decryptMessage(sharedKey, ciphertext, iv) {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    sharedKey,
    ciphertextBuffer
  );
  
  return new TextDecoder().decode(decrypted);
}

// Proof of Work for spam prevention
export async function computeProofOfWork(message, difficulty = '0000') {
  const timestamp = Date.now();
  let nonce = 0;
  
  while (true) {
    const data = `${message}${timestamp}${nonce}`;
    const hash = await sha256(data);
    
    if (hash.startsWith(difficulty)) {
      return { nonce, timestamp, hash };
    }
    
    nonce++;
    
    // Yield to UI every 1000 iterations
    if (nonce % 1000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// Verify proof of work
export async function verifyProofOfWork(message, timestamp, nonce, difficulty = '0000') {
  const data = `${message}${timestamp}${nonce}`;
  const hash = await sha256(data);
  return hash.startsWith(difficulty);
}

// SHA-256 hash
export async function sha256(message) {
  const encoded = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
