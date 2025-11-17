import type { HealthChecker } from '@/domain/external/health-checker';
import type { HealthStatus } from '@/domain/models/health-status';
import { getContextLogger } from '@/infrasturcture/logging/index';
import { databaseClient } from '@/infrasturcture/storage/database';

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
