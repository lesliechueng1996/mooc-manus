import { getLogger } from '@repo/pino-log';
import type { Callback, Redis, Result } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from './index.js';

const logger = getLogger();

let redis: Redis | undefined;

const getRedis = (): Redis => {
  if (!redis) {
    redis = getRedisClient();
  }
  return redis;
};

export const acquireLock = async (
  key: string,
  lockExpireSeconds: number,
  timeoutSeconds: number,
): Promise<string | null> => {
  const redisClient = getRedis();
  const lockValue = uuidv4();
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;
  const retryIntervalMs = 100;

  while (Date.now() - startTime < timeoutMs) {
    const result = await redisClient.set(
      key,
      lockValue,
      'EX',
      lockExpireSeconds,
      'NX',
    );

    if (result) {
      return lockValue;
    }

    await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
  }

  return null;
};

const luaScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

// Define the command lazily when first needed
let commandDefined = false;
const ensureCommandDefined = (): void => {
  if (!commandDefined) {
    getRedis().defineCommand('releaseLock', {
      numberOfKeys: 1,
      lua: luaScript,
    });
    commandDefined = true;
  }
};

declare module 'ioredis' {
  interface RedisCommander<Context> {
    releaseLock(
      key: string,
      argv: string,
      callback?: Callback<number>,
    ): Result<number, Context>;
  }
}

export const releaseLock = async (
  key: string,
  lockValue: string,
): Promise<boolean> => {
  try {
    ensureCommandDefined();
    const redisClient = getRedis();
    const result = await redisClient.releaseLock(key, lockValue);
    return result === 1;
  } catch (error) {
    logger.error(error, 'Failed to release lock');
    return false;
  }
};
