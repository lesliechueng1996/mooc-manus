import { RedisClient as BunRedisClient } from 'bun';
import type { Logger } from '../logging';

const client = new BunRedisClient();

export class RedisClient {
  constructor(private readonly logger: Logger) {}

  async get(key: string) {
    return client.get(key);
  }

  async setWithExpiry(key: string, value: string, seconds: number) {
    return client.set(key, value, 'EX', seconds);
  }

  static async del(key: string) {
    return client.del(key);
  }
}
