import { createClient } from 'redis';
import { env } from '@/config/env.js';

export const redisClient = createClient({
  url: env.redisUrl,
});

export const connectRedis = async () => {
  await redisClient.connect();
  await redisClient.ping();
  console.log('Redis connected');
};

export const disconnectRedis = async () => {
  redisClient.close();
  console.log('Redis disconnected');
};
