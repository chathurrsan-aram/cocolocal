// WheelStore backed by Upstash Redis (added to the Vercel project from the Marketplace).
import { Redis } from '@upstash/redis';
import type { WheelStore } from './store.ts';

export class RedisStore implements WheelStore {
  private redis: Redis;
  constructor(url: string, token: string) { this.redis = new Redis({ url, token, automaticDeserialization: false }); }

  async get(key: string) { const v = await this.redis.get<string>(key); return v == null ? null : String(v); }
  async set(key: string, value: string, opts: { nx?: boolean; ex?: number } = {}) {
    const res = opts.nx
      ? await this.redis.set(key, value, opts.ex ? { nx: true, ex: opts.ex } : { nx: true })
      : await this.redis.set(key, value, opts.ex ? { ex: opts.ex } : undefined);
    return res === 'OK';
  }
  async del(key: string) { return this.redis.del(key); }
  async incr(key: string, ex: number) {
    const [n] = await this.redis.multi().incr(key).expire(key, ex, 'NX').exec<[number, number]>();
    return n;
  }
  async hincrby(key: string, field: string, by = 1, ex?: number) {
    const tx = this.redis.multi().hincrby(key, field, by);
    if (ex) tx.expire(key, ex, 'NX');
    await tx.exec();
  }
  async hgetall(key: string) {
    const h = await this.redis.hgetall<Record<string, string>>(key);
    return Object.fromEntries(Object.entries(h ?? {}).map(([k, v]) => [k, String(v)]));
  }
  async rpush(key: string, value: string) { await this.redis.rpush(key, value); }
  async lrange(key: string, start: number, stop: number) { return (await this.redis.lrange<string>(key, start, stop)).map(String); }
  async mget(keys: string[]) { return (await this.redis.mget<(string | null)[]>(...keys)).map(v => (v == null ? null : String(v))); }
}
