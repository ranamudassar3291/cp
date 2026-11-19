import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const ENCRYPTED_SECRET_MASK = '••••••••ENCRYPTED••••••••';
const SCRYPT_PREFIX = '$scrypt$';
const AES_PREFIX = '$aes256gcm$';

function deriveMasterEncryptionKey(): Buffer {
  const rawSecret =
    process.env.APP_ENCRYPTION_SECRET ||
    process.env.DATABASE_URL ||
    process.env.GEMINI_API_KEY ||
    'cpcloudhost-ephemeral-dev-fallback-key-change-in-env';
  return crypto.createHash('sha256').update(rawSecret, 'utf8').digest();
}

export function isPasswordHashed(value?: string | null): boolean {
  return Boolean(value && value.startsWith(SCRYPT_PREFIX) && value.split('$').length === 4);
}

export function hashPassword(plain: string): string {
  const clean = (plain || '').trim();
  if (!clean) return '';
  if (isPasswordHashed(clean)) return clean;
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(clean, salt, 64).toString('hex');
  return `${SCRYPT_PREFIX}${salt}$${derived}`;
}

export function verifyPassword(plain: string, stored?: string | null): boolean {
  const candidate = (plain || '').trim();
  const target = (stored || '').trim();
  if (!candidate || !target) return false;

  if (isPasswordHashed(target)) {
    const parts = target.split('$');
    const salt = parts[2] || '';
    const expectedHex = parts[3] || '';
    if (!salt || !expectedHex) return false;
    try {
      const derivedBuf = crypto.scryptSync(candidate, salt, 64);
      const expectedBuf = Buffer.from(expectedHex, 'hex');
      if (derivedBuf.length !== expectedBuf.length) return false;
      return crypto.timingSafeEqual(derivedBuf, expectedBuf);
    } catch {
      return false;
    }
  }

  // Legacy plaintext compatibility with constant-time compare
  try {
    const a = Buffer.from(candidate, 'utf8');
    const b = Buffer.from(target, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isEncryptedSecret(value?: string | null): boolean {
  return Boolean(value && value.startsWith(AES_PREFIX) && value.split('$').length === 5);
}

export function isMaskedSecret(value?: string | null): boolean {
  return Boolean(value && value.trim() === ENCRYPTED_SECRET_MASK);
}

export function encryptSecret(plain?: string | null): string {
  const clean = (plain ?? '').trim();
  if (!clean) return '';
  if (isEncryptedSecret(clean)) return clean;
  const key = deriveMasterEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(clean, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${AES_PREFIX}${iv.toString('hex')}$${authTag.toString('hex')}$${encrypted.toString('hex')}`;
}

export function decryptSecret(payload?: string | null): string {
  const raw = (payload ?? '').trim();
  if (!raw) return '';
  if (!isEncryptedSecret(raw)) return raw;
  const parts = raw.split('$');
  const ivHex = parts[2] || '';
  const tagHex = parts[3] || '';
  const cipherHex = parts[4] || '';
  if (!ivHex || !tagHex || !cipherHex) return '';
  try {
    const key = deriveMasterEncryptionKey();
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipherHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

export function extractClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  let ip = '';
  if (typeof fwd === 'string' && fwd.trim()) {
    ip = fwd.split(',')[0].trim();
  } else if (Array.isArray(fwd) && fwd.length > 0) {
    ip = String(fwd[0]).split(',')[0].trim();
  } else if (typeof req.headers['x-real-ip'] === 'string') {
    ip = req.headers['x-real-ip'].trim();
  } else if (req.ip) {
    ip = req.ip;
  } else if (req.socket?.remoteAddress) {
    ip = req.socket.remoteAddress;
  }
  if (!ip) return '127.0.0.1';
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }
  return ip.slice(0, 64);
}

export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  next();
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = extractClientIp(req);
    const key = `${ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const current = hits.get(key);

    if (!current || now >= current.resetAt) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      // Periodic prune to prevent memory growth
      if (hits.size > 5000) {
        for (const [k, v] of hits.entries()) {
          if (now >= v.resetAt) hits.delete(k);
        }
      }
      next();
      return;
    }

    current.count += 1;
    if (current.count > options.maxRequests) {
      const retrySec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retrySec));
      res.status(429).json({
        ok: false,
        lockedSeconds: retrySec,
        error:
          options.message ||
          `Too many requests from your IP. Try again in ${retrySec}s.`,
      });
      return;
    }

    next();
  };
}
