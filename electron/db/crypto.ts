import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// AES-256-GCM authenticated encryption implementation
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

let encryptionKey: Buffer | null = null;

export function initializeMasterKey(dataDir: string): void {
  const keyPath = path.join(dataDir, '.app_secret.key');
  try {
    if (fs.existsSync(keyPath)) {
      const hex = fs.readFileSync(keyPath, 'utf8').trim();
      if (hex.length === 64) {
        encryptionKey = Buffer.from(hex, 'hex');
        return;
      }
    }
    // Generate new secure 256-bit random key
    const newKey = crypto.randomBytes(32);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(keyPath, newKey.toString('hex'), { mode: 0o600 });
    encryptionKey = newKey;
  } catch (err) {
    // Fallback key derived from machine parameters
    const fallbackSeed = `${process.env.USER || process.env.USERNAME || 'coldmail'}-local-vault-${process.platform}`;
    encryptionKey = crypto.createHash('sha256').update(fallbackSeed).digest();
  }
}

function getKey(): Buffer {
  if (!encryptionKey) {
    const fallbackSeed = `${process.env.USER || process.env.USERNAME || 'coldmail'}-local-vault-${process.platform}`;
    encryptionKey = crypto.createHash('sha256').update(fallbackSeed).digest();
  }
  return encryptionKey;
}

/**
 * Encrypts a plaintext password using AES-256-GCM.
 * Output format: iv_hex:tag_hex:ciphertext_hex
 */
export function encryptPassword(plainText: string): string {
  if (!plainText) return '';
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted password string.
 */
export function decryptPassword(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  
  // Format check: iv:tag:ciphertext
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    // If not in 3-part format, return as is (e.g. unencrypted legacy or test value)
    return encryptedPayload;
  }

  const [ivHex, tagHex, cipherHex] = parts;
  try {
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt password payload:', err);
    return '';
  }
}
