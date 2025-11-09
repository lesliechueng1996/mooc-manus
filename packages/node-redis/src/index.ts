import { getLogger } from '@repo/pino-log';
import { createClient, type RedisClientType } from 'redis';

const logger = getLogger();

let redisClient: RedisClientType | undefined;

const ensureRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error(
      'Redis client has not been initialized. Call createRedisClient first.',
    );
  }

  return redisClient;
};

export const createRedisClient = (url: string): RedisClientType => {
  redisClient = createClient({
    url,
  });

  return redisClient;
};

export const getRedisClient = (): RedisClientType => ensureRedisClient();

export const connectRedis = async (): Promise<void> => {
  const client = ensureRedisClient();

  if (!client.isOpen) {
    await client.connect();
  }

  await client.ping();
  logger.info('Redis connected');
};

export const disconnectRedis = async (): Promise<void> => {
  const client = ensureRedisClient();

  if (client.isOpen) {
    await client.quit();
  }

  logger.info('Redis disconnected');
};
