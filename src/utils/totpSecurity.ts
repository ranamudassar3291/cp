const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return bytes;
  }
  for (let i = 0; i < length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function generateBase32Secret(charLength = 32): string {
  const bytes = getRandomBytes(charLength);
  let out = '';
  for (let i = 0; i < charLength; i += 1) {
    out += BASE32_ALPHABET[bytes[i] % BASE32_ALPHABET.length];
  }
  return out;
}

function base32ToBytes(base32: string): Uint8Array {
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i += 1) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

export function buildOtpAuthUri(
  accountEmail: string,
  secret: string,
  issuer = 'cpcloudhost.com'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedLabel = encodeURIComponent(`${issuer}:${accountEmail}`);
  return `otpauth://totp/${encodedLabel}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

export function getTotpSecondsRemaining(stepSeconds = 30): number {
  const nowSec = Math.floor(Date.now() / 1000);
  return stepSeconds - (nowSec % stepSeconds);
}

export async function generateTotpCode(
  secretBase32: string,
  timestampMs = Date.now(),
  stepSeconds = 30
): Promise<string> {
  const keyBytes = base32ToBytes(secretBase32);
  if (keyBytes.length === 0 || typeof window === 'undefined' || !window.crypto?.subtle) {
    return '000000';
  }

  const counter = Math.floor(timestampMs / 1000 / stepSeconds);
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  view.setUint32(0, high, false);
  view.setUint32(4, low, false);

  const keyCopy = new Uint8Array(keyBytes.length);
  keyCopy.set(keyBytes);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyCopy.buffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hmac = new Uint8Array(signature);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binary % 1_000_000).toString().padStart(6, '0');
  return otp;
}

export async function verifyTotpCode(
  secretBase32: string,
  candidateCode: string,
  windowSkew = 1,
  stepSeconds = 30
): Promise<boolean> {
  const clean = candidateCode.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;

  const now = Date.now();
  for (let delta = -windowSkew; delta <= windowSkew; delta += 1) {
    const code = await generateTotpCode(
      secretBase32,
      now + delta * stepSeconds * 1000,
      stepSeconds
    );
    if (code === clean) return true;
  }
  return false;
}

export function generateBackupCodes(count = 8): string[] {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const bytes = getRandomBytes(8);
    let left = '';
    let right = '';
    for (let j = 0; j < 4; j += 1) {
      left += chars[bytes[j] % chars.length];
      right += chars[bytes[j + 4] % chars.length];
    }
    codes.push(`${left}-${right}`);
  }
  return codes;
}

export function generateSupportPin(): {
  pin: string;
  createdAtUtc: string;
} {
  const bytes = getRandomBytes(4);
  const num =
    ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  const pin = (100000 + (num % 900000)).toString();
  const createdAtUtc = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  return {
    pin,
    createdAtUtc,
  };
}
