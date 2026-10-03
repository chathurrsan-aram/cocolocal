// The only storage operations the wheel needs. Upstash Redis in production (redis-store.ts),
// an in-memory map for tests and the labelled preview demo (memory-store.ts).
export interface WheelStore {
  get(key: string): Promise<string | null>;
  /** Returns false when `nx` is set and the key already exists. `ex` is seconds. */
  set(key: string, value: string, opts?: { nx?: boolean; ex?: number }): Promise<boolean>;
  /** Returns how many keys were deleted (0 or 1) — used as an atomic "consume once". */
  del(key: string): Promise<number>;
  /** Increments and, on first increment, sets the expiry in seconds. */
  incr(key: string, ex: number): Promise<number>;
  hincrby(key: string, field: string, by?: number, ex?: number): Promise<void>;
  hgetall(key: string): Promise<Record<string, string>>;
  rpush(key: string, value: string): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  mget(keys: string[]): Promise<(string | null)[]>;
}
