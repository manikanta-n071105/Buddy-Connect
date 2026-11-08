import crypto from 'crypto';

// Shared secret passphrase for Application-Layer End-to-End Encryption (E2EE)
const E2EE_SECRET = process.env.E2EE_SECRET_KEY || 'juniorconnect_e2ee_secure_payload_vault_2026_super_key!';
// Secret key for Database Data-at-Rest Encryption (AES-256-GCM)
const DB_SECRET = process.env.DB_ENCRYPTION_KEY || 'juniorconnect_db_vault_data_at_rest_key_2026_super_secret!';

// Derive 32-byte (256-bit) keys via SHA-256
const e2eeKey = crypto.createHash('sha256').update(E2EE_SECRET).digest();
const dbKey = crypto.createHash('sha256').update(DB_SECRET).digest();

export interface EncryptedPayload {
  __e2ee: true;
  iv: string; // Base64 12-byte IV
  data: string; // Base64 ciphertext + 16-byte auth tag
}

/**
 * Encrypt any JSON-serializable JavaScript value into an AES-256-GCM E2EE payload.
 * Compatible with Web Crypto API (AES-GCM 12-byte IV, 16-byte tag appended).
 */
export function encryptPayload(data: any): EncryptedPayload {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', e2eeKey, iv);

  const ciphertext = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([ciphertext, tag]);

  return {
    __e2ee: true,
    iv: iv.toString('base64'),
    data: combined.toString('base64'),
  };
}

/**
 * Decrypt an incoming AES-256-GCM E2EE payload back to original JavaScript object/value.
 */
export function decryptPayload(payload: any): any {
  if (!payload || typeof payload !== 'object' || !payload.data || !payload.iv) {
    return payload; // Already decrypted or not an encrypted wrapper
  }

  const iv = Buffer.from(payload.iv, 'base64');
  const combined = Buffer.from(payload.data, 'base64');

  if (combined.length < 16) {
    throw new Error('Encrypted payload too short (invalid auth tag)');
  }

  const tag = combined.subarray(combined.length - 16);
  const ciphertext = combined.subarray(0, combined.length - 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', e2eeKey, iv);
  decipher.setAuthTag(tag);

  const decryptedStr = decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8');

  try {
    return JSON.parse(decryptedStr);
  } catch {
    return decryptedStr;
  }
}

/**
 * Encrypt sensitive database fields at rest (e.g. phone numbers, counseling notes).
 * Returns compact format: "enc:<base64-iv>:<base64-ciphertext+tag>"
 */
export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return plaintext as any;
  }
  // Avoid double encrypting
  if (typeof plaintext === 'string' && plaintext.startsWith('enc:')) {
    return plaintext;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', dbKey, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([ciphertext, tag]);

  return `enc:${iv.toString('base64')}:${combined.toString('base64')}`;
}

/**
 * Decrypt sensitive database fields at rest.
 * Gracefully returns plain text if field was not encrypted (for backwards compatibility).
 */
export function decryptField(storedValue: string | null | undefined): string | null {
  if (!storedValue || typeof storedValue !== 'string' || !storedValue.startsWith('enc:')) {
    return storedValue as any;
  }

  try {
    const parts = storedValue.split(':');
    if (parts.length !== 3) return storedValue;

    const iv = Buffer.from(parts[1], 'base64');
    const combined = Buffer.from(parts[2], 'base64');
    const tag = combined.subarray(combined.length - 16);
    const ciphertext = combined.subarray(0, combined.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', dbKey, iv);
    decipher.setAuthTag(tag);

    return decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    return storedValue; // Return raw value if decryption fails
  }
}

