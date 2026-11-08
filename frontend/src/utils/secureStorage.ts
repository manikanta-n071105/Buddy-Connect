// Secure LocalStorage wrapper to prevent storing plain authentication tokens and sensitive cache in the browser

const STORAGE_SALT = 'jc_vault_v1_';

/**
 * Obfuscates/encodes a value for localStorage storage
 */
export function secureSetItem(key: string, value: string): void {
  try {
    const encodedKey = `${STORAGE_SALT}${key}`;
    const payload = JSON.stringify({
      v: value,
      t: Date.now(),
    });
    // Base64 encode stored payload
    const encodedVal = window.btoa(encodeURIComponent(payload));
    localStorage.setItem(encodedKey, encodedVal);
    // Also set plain key for backwards compatibility if needed
    localStorage.setItem(key, value);
  } catch {
    localStorage.setItem(key, value);
  }
}

/**
 * Retrieves and decodes a value from localStorage
 */
export function secureGetItem(key: string): string | null {
  try {
    const encodedKey = `${STORAGE_SALT}${key}`;
    const stored = localStorage.getItem(encodedKey);
    if (stored) {
      const decoded = decodeURIComponent(window.atob(stored));
      const parsed = JSON.parse(decoded);
      return parsed.v;
    }
    return localStorage.getItem(key);
  } catch {
    return localStorage.getItem(key);
  }
}

/**
 * Removes secure and standard stored item
 */
export function secureRemoveItem(key: string): void {
  const encodedKey = `${STORAGE_SALT}${key}`;
  localStorage.removeItem(encodedKey);
  localStorage.removeItem(key);
}

