import { createPostgresHealthChecker } from '@/infrasturcture/external/health-checker/postgres-health-checker';
import { createRedisHealthChecker } from '@/infrasturcture/external/health-checker/redis-health-checker';

export const checkAll = async () => {
  const checkers = [createPostgresHealthChecker(), createRedisHealthChecker()];

  const results = await Promise.all(
    checkers.map((checker) =>
      checker.check().catch((error) => {
        return {
          service: checker.service,
          status: 'error',
          details: JSON.stringify(error),
        };
      }),
    ),
  );
  return results;
};
