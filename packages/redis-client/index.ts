import { randomUUID } from 'node:crypto';
import type { Logger } from '@repo/common';
import { Redis, type RedisOptions } from 'ioredis';

export { Redis };

export const createRedisClient = (options?: RedisOptions) => {
  let config: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_DB || '0', 10),
  };
  if (options) {
    config = {
      ...config,
      ...options,
    };
  }
  return new Redis(config);
};

const luaScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export class RedisClient {
  constructor(
    private readonly client: Redis,
    private readonly logger: Logger,
  ) {}

  async acquireLock(
    key: string,
    value: string = randomUUID(),
    lockExpireSeconds: number = 600,
    timeoutSeconds: number = 30,
  ): Promise<string | null> {
    const lockValue = value;
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;
    const retryIntervalMs = 100;

    while (Date.now() - startTime < timeoutMs) {
      const result = await this.client.set(
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
      const result = await this.client.eval(luaScript, 1, key, lockValue);
      this.logger.info(`Released lock ${key}`, { result });
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to release lock ${key}`, { error });
      return false;
    }
  }
}

let defaultRedisClient: Redis | null = null;

export const getDefaultRedisClient = () => {
  if (!defaultRedisClient) {
    defaultRedisClient = createRedisClient();
  }
  return defaultRedisClient;
};
