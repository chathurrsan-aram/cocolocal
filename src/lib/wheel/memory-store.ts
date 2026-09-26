// In-memory WheelStore. Used by the tests and, when no Redis is configured, by preview
// deployments in "demo mode" (data lives in one server instance and is lost on restart).
import type { WheelStore } from './store.ts';

type Entry = { value: unknown; expires: number | null };

export class MemoryStore implements WheelStore {
  private data = new Map<string, Entry>();
  private clock: () => Date;
  constructor(clock: () => Date = () => new Date()) { this.clock = clock; }

  private live(key: string) {
    const entry = this.data.get(key);
    if (entry && entry.expires !== null && entry.expires <= this.clock().getTime()) { this.data.delete(key); return undefined; }
    return entry;
  }
  private expiry(ex?: number) { return ex ? this.clock().getTime() + ex * 1000 : null; }

  async get(key: string) { const e = this.live(key); return e ? String(e.value) : null; }
  async set(key: string, value: string, opts: { nx?: boolean; ex?: number } = {}) {
    if (opts.nx && this.live(key)) return false;
    this.data.set(key, { value, expires: this.expiry(opts.ex) });
    return true;
  }
  async del(key: string) { const had = this.live(key) ? 1 : 0; this.data.delete(key); return had; }
  async incr(key: string, ex: number) {
    const e = this.live(key);
    const next = Number(e?.value ?? 0) + 1;
    this.data.set(key, { value: next, expires: e ? e.expires : this.expiry(ex) });
    return next;
  }
  async hincrby(key: string, field: string, by = 1, ex?: number) {
    const e = this.live(key);
    const hash = (e?.value as Record<string, number>) ?? {};
    hash[field] = (hash[field] ?? 0) + by;
    this.data.set(key, { value: hash, expires: e ? e.expires : this.expiry(ex) });
  }
  async hgetall(key: string) {
    const hash = (this.live(key)?.value as Record<string, number>) ?? {};
    return Object.fromEntries(Object.entries(hash).map(([k, v]) => [k, String(v)]));
  }
  async rpush(key: string, value: string) {
    const e = this.live(key);
    const list = (e?.value as string[]) ?? [];
    list.push(value);
    this.data.set(key, { value: list, expires: e?.expires ?? null });
  }
  async lrange(key: string, start: number, stop: number) {
    const list = (this.live(key)?.value as string[]) ?? [];
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }
  async mget(keys: string[]) { return Promise.all(keys.map(k => this.get(k))); }
}
