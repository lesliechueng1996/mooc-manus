import type { HealthChecker } from '@/domain/external/health-checker.js';
import type { HealthStatus } from '@/domain/models/health-status.js';
import { getContextLogger } from '@/infrasturcture/logging/index.js';
import { databaseClient } from '@/infrasturcture/storage/database.js';

export const createPostgresHealthChecker = (): HealthChecker => {
  const logger = getContextLogger();

  const service = 'postgres';
  const check = async (): Promise<HealthStatus> => {
    try {
      await databaseClient.$queryRaw`SELECT 1`;
      return {
        service,
        status: 'ok',
        details: '',
      };
    } catch (error) {
      logger.error(error, 'Failed to check postgres health');
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
