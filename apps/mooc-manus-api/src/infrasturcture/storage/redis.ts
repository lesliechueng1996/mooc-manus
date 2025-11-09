import { createRedisClient } from '@repo/node-redis';
import { env } from '@/config/env.js';

export { connectRedis, disconnectRedis } from '@repo/node-redis';

export const redisClient = createRedisClient(env.redisUrl);
