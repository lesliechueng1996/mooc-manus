import { getLogger } from '@repo/pino-log';
import { Redis } from 'ioredis';

const logger = getLogger();

let redisClient: Redis | undefined;

const ensureRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error(
      'Redis client has not been initialized. Call createRedisClient first.',
    );
  }

  return redisClient;
};

export const createRedisClient = (url: string): Redis => {
  redisClient = new Redis(url);

  redisClient.on('error', (error) => {
    logger.error(error, 'Redis error occurred');
  });

  return redisClient;
};

export const getRedisClient = (): Redis => ensureRedisClient();

export const connectRedis = async (): Promise<void> => {
  const client = ensureRedisClient();

  await client.ping();
  logger.info('Redis connected');
};

export const disconnectRedis = async (): Promise<void> => {
  const redisClient = ensureRedisClient();

  redisClient.disconnect();
  logger.info('Redis disconnected');
};

export { acquireLock, releaseLock } from './lock.js';
