import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Ensure the secret key is exactly 32 bytes.
const SECRET = process.env.ENCRYPTION_SECRET || 'nextitpointsecretkey32charspassw';
const SECRET_KEY = SECRET.length >= 32 ? SECRET.substring(0, 32) : SECRET.padEnd(32, '0');
const IV_LENGTH = 16;

export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const textParts = text.split(':');
    if (textParts.length < 2) return text; // If not in our hex:hex format, return as is
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('Decryption failed, returning placeholder:', err);
    return '*** DECRYPTION ERROR ***';
  }
}
