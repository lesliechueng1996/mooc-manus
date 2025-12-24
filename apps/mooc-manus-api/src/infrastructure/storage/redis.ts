import { RedisClient as BunRedisClient, randomUUIDv7 } from 'bun';
import type { Logger } from '../logging';

const client = new BunRedisClient();

const luaScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export class RedisClient {
  constructor(private readonly logger: Logger) {}

  async get(key: string) {
    return client.get(key);
  }

  async setex(key: string, seconds: number, value: string) {
    return client.setex(key, seconds, value);
  }

  async ping() {
    return client.ping();
  }

  async xadd(...args: string[]) {
    return client.send('XADD', args);
  }

  async xread(
    ...args: [
      millisecondsToken: 'BLOCK',
      milliseconds: number | string,
      streamsToken: 'STREAMS',
      ...args: string[],
    ]
  ) {
    return client.send(
      'XREAD',
      args.map((arg) => arg.toString()),
    );
  }

  async xrange(
    key: string,
    start: string,
    end: string,
    countToken: 'COUNT',
    count: number,
  ) {
    return client.send('XRANGE', [key, start, end, countToken, `${count}`]);
  }

  async xdel(...args: string[]) {
    return client.send('XDEL', args);
  }

  async xtrim(key: string, maxlen: 'MAXLEN', threshold: number) {
    return client.send('XTRIM', [key, maxlen, `${threshold}`]);
  }

  async xlen(key: string) {
    return client.send('XLEN', [key]);
  }

  async acquireLock(
    key: string,
    lockExpireSeconds: number,
    timeoutSeconds: number,
  ): Promise<string | null> {
    const lockValue = randomUUIDv7();
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;
    const retryIntervalMs = 100;

    while (Date.now() - startTime < timeoutMs) {
      const result = await client.set(
        key,
        lockValue,
        'EX',
        `${lockExpireSeconds}`,
        'NX',
      );

      if (result) {
        return lockValue;
      }

      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    }

    return null;
  }

  async releaseLock(key: string, lockValue: string) {
    try {
      const result = await client.send('EVAL', [
        luaScript,
        '1',
        key,
        lockValue,
      ]);
      this.logger.info(`Released lock ${key}`, { result });
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to release lock ${key}`, { error });
      return false;
    }
  }

  static async del(key: string) {
    return client.del(key);
  }
}
