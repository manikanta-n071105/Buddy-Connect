// Frontend End-to-End Encryption (E2EE) using Web Crypto API (AES-256-GCM)
const E2EE_SECRET =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_E2EE_SECRET_KEY) ||
  'juniorconnect_e2ee_secure_payload_vault_2026_super_key!';

let cachedCryptoKey: CryptoKey | null = null;

// Base64 Helpers
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives a 256-bit AES-GCM key from the shared secret passphrase using SHA-256.
 */
async function getCryptoKey(): Promise<CryptoKey | null> {
  if (cachedCryptoKey) return cachedCryptoKey;

  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  const enc = new TextEncoder();
  const keyMaterial = enc.encode(E2EE_SECRET);
  const keyHash = await window.crypto.subtle.digest('SHA-256', keyMaterial);

  cachedCryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  return cachedCryptoKey;
}

export interface EncryptedPayload {
  __e2ee: true;
  iv: string;
  data: string;
}

/**
 * Encrypt a JSON-serializable object into an AES-256-GCM E2EE payload.
 */
export async function encryptPayload(data: any): Promise<EncryptedPayload | any> {
  try {
    const key = await getCryptoKey();
    if (!key) return data; // Fallback to plain if Web Crypto is unavailable

    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const enc = new TextEncoder();
    const encodedData = enc.encode(jsonString);

    // Generate random 12-byte IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // In Web Crypto AES-GCM, the 16-byte auth tag is appended to the ciphertext automatically
    const encryptedBuf = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    return {
      __e2ee: true,
      iv: arrayBufferToBase64(iv),
      data: arrayBufferToBase64(encryptedBuf),
    };
  } catch (err) {
    console.warn('[E2EE] Client payload encryption error, sending plain payload:', err);
    return data;
  }
}

/**
 * Decrypt an incoming AES-256-GCM E2EE payload back to original JavaScript value.
 */
export async function decryptPayload(payload: any): Promise<any> {
  try {
    if (!payload || typeof payload !== 'object' || !payload.data || !payload.iv) {
      return payload; // Not an encrypted packet
    }

    const key = await getCryptoKey();
    if (!key) return payload;

    const iv = base64ToArrayBuffer(payload.iv);
    const combined = base64ToArrayBuffer(payload.data);

    const decryptedBuf = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      combined
    );

    const dec = new TextDecoder();
    const decryptedStr = dec.decode(decryptedBuf);

    try {
      return JSON.parse(decryptedStr);
    } catch {
      return decryptedStr;
    }
  } catch (err) {
    console.error('[E2EE] Client payload decryption failed:', err);
    return payload;
  }
}
