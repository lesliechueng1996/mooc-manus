import type { Logger } from '@repo/common';
import {
  getDefaultRedisClient,
  RedisClient as RedisClientClass,
} from '@repo/redis-client';

const client = getDefaultRedisClient();

export class RedisClient extends RedisClientClass {
  constructor(logger: Logger) {
    super(client, logger);
  }

  async get(key: string) {
    return client.get(key);
  }

  async setex(key: string, seconds: number, value: string) {
    return client.setex(key, seconds, value);
  }

  async ping() {
    return client.ping();
  }

  async xadd(...args: Parameters<typeof client.xadd>) {
    return client.xadd(...args);
  }

  async xread(
    ...args: [
      millisecondsToken: 'BLOCK',
      milliseconds: number | string,
      streamsToken: 'STREAMS',
      ...args: string[],
    ]
  ) {
    return client.xread(...args);
  }

  async xrange(
    key: string,
    start: string,
    end: string,
    countToken: 'COUNT',
    count: number,
  ) {
    return client.xrange(key, start, end, countToken, count);
  }

  async xdel(...args: Parameters<typeof client.xdel>) {
    return client.xdel(...args);
  }

  async xtrim(key: string, maxlen: 'MAXLEN', threshold: number) {
    return client.xtrim(key, maxlen, threshold);
  }

  async xlen(key: string) {
    return client.xlen(key);
  }

  static async del(key: string) {
    return client.del(key);
  }
}
