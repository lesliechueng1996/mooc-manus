import type { HealthChecker } from '@/domain/external/health-checker.js';
import type { HealthStatus } from '@/domain/models/health-status.js';
import { getContextLogger } from '@/infrasturcture/logging/index.js';
import { redisClient } from '@/infrasturcture/storage/redis.js';

export const createRedisHealthChecker = (): HealthChecker => {
  const logger = getContextLogger();

  const service = 'redis';
  const check = async (): Promise<HealthStatus> => {
    try {
      await redisClient.ping();
      return {
        service,
        status: 'ok',
        details: '',
      };
    } catch (error) {
      logger.error(error, 'Failed to check redis health');
      return {
        service,
        status: 'error',
        details: JSON.stringify(error),
      };
    }
  };

  return {
    service,
    check,
  };
};
