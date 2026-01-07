// core/auth/setupCodes.ts
import crypto from 'crypto';

export const SETUP_CODE_TTL_HOURS = 24 * 7; // 7 days

export function generateSetupCode(): string {
  // 6-digit numeric code (kid-friendly)
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
}

export function expiresAtFromNowHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function hashSetupCode(code: string): string {
  // Store only a hash (never plaintext)
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function constantTimeEqualHex(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
