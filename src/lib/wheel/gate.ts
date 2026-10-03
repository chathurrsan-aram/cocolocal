// Password gate for the giveaway page (/wheel) while it is in a private preview.
// Edge-safe (Web Crypto only) so the middleware can use it.
//
// The password is never stored in plain text: this file holds a salted SHA-256 of it.
// To change it, set WHEEL_GATE_PASSWORD in Vercel (that overrides the default below).
// The unlock cookie is a hash of the password hash plus WHEEL_SECRET, so it can't be
// forged from the public source code once WHEEL_SECRET is set.
// To remove the gate entirely, delete src/middleware.ts.

export const GATE_COOKIE = 'coco_wheel_gate';
export const GATE_DAYS = 30;

/** sha256("coco-wheel-gate:" + password) for the default password. */
const DEFAULT_HASH = '5c0cc9a44600441f9b90a7e355e6333312661c0cfda43b5ee80b188188951366';

async function sha256(text: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

const normalise = (password: string) => password.trim().toLowerCase();

async function passwordHash() {
  const custom = process.env.WHEEL_GATE_PASSWORD;
  return custom ? sha256(`coco-wheel-gate:${normalise(custom)}`) : DEFAULT_HASH;
}

/** Case-insensitive, ignores surrounding spaces ("Sullivan " works). */
export async function checkGatePassword(input: string) {
  return (await sha256(`coco-wheel-gate:${normalise(String(input ?? '').slice(0, 200))}`)) === (await passwordHash());
}

/** The cookie value that proves the password was entered. */
export async function gateToken() {
  return sha256(`gate-cookie:${await passwordHash()}:${process.env.WHEEL_SECRET ?? 'demo-mode-secret'}`);
}
