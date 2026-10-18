// Shared ticks for the cash and carry list: { itemId: tickedAtMs }.
//
// With automaticDeserialization off (as the site's Redis clients are set up),
// @upstash/redis returns HGETALL as a flat [field, value, field, value] array.
// With it on, it returns an object. Accept both, so a client setting can never
// make every tick read back as missing again.
export type Ticks = Record<string, number>;

export const ITEM_ID = /^i\d{2}$/;

export function ticksFromHash(raw: unknown, now = Date.now()): Ticks {
  const pairs: [unknown, unknown][] = [];
  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) pairs.push([raw[i], raw[i + 1]]);
  } else if (raw && typeof raw === 'object') {
    pairs.push(...Object.entries(raw));
  }
  const out: Ticks = {};
  for (const [id, at] of pairs) {
    if (typeof id === 'string' && ITEM_ID.test(id)) out[id] = Number(at) || now;
  }
  return out;
}
