// Email / UK mobile handling shared by the server (core.ts) and the entry form.
// No Node imports here, so the browser can use the same rules the server enforces.

export type ContactKind = 'email' | 'mobile';

export function normaliseEmail(raw: string) {
  const email = String(raw ?? '').trim().toLowerCase();
  if (email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email) ? email : null;
}

export function normaliseUkMobile(raw: string) {
  let digits = String(raw ?? '').trim().replace(/\(0\)/g, '').replace(/[\s().-]/g, '');
  if (!/^\+?\d+$/.test(digits)) return null;
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `44${digits.slice(1)}`;
  return /^447\d{9}$/.test(digits) ? `+${digits}` : null;
}

/** "+447700900123" → "07700 900123" (how people write it in the UK). */
export function formatUkMobile(e164: string) {
  const local = `0${e164.slice(3)}`;
  return `${local.slice(0, 5)} ${local.slice(5)}`;
}

export type ContactGuess = {
  /** What the person seems to be typing. null while it could be either (or nothing yet). */
  kind: ContactKind | null;
  /** The normalised value the server will store, when it is complete and valid. */
  value: string | null;
  /** A friendly display of the valid value (the mobile in UK format, the email lower-cased). */
  display: string | null;
};

/**
 * One box for "email or mobile": decide which one it is as the person types.
 * Anything with an @ or a letter is an email; only digits, spaces, + ( ) - is a phone number.
 */
export function detectContact(raw: string): ContactGuess {
  const text = String(raw ?? '').trim();
  if (!text) return { kind: null, value: null, display: null };
  if (/[@a-z]/i.test(text)) {
    const value = normaliseEmail(text);
    return { kind: 'email', value, display: value };
  }
  if (/^[+\d\s().-]+$/.test(text) && /\d/.test(text)) {
    const value = normaliseUkMobile(text);
    return { kind: 'mobile', value, display: value && formatUkMobile(value) };
  }
  return { kind: null, value: null, display: null };
}
