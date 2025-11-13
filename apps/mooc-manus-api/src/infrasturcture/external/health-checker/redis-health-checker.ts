import type { HealthChecker } from '@/domain/external/health-checker.js';
import type { HealthStatus } from '@/domain/models/health-status.js';
import { getContextLogger } from '@/infrasturcture/logging/index.js';
import { redisClient } from '@/infrasturcture/storage/redis.js';

export const createRedisHealthChecker = (): HealthChecker => {
  const logger = getContextLogger();

  const service = 'redis';
  const check = async (): Promise<HealthStatus> => {
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const timeoutMs = 5000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Redis ping timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      await Promise.race([redisClient.ping(), timeoutPromise]);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      return {
        service,
        status: 'ok',
        details: '',
      };
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      logger.error(error, 'Failed to check redis health');
      const details = error instanceof Error ? error.message : 'Unknown error';
      return {
        service,
        status: 'error',
        details,
      };
    }
  };

  return {
    service,
    check,
  };
};
