import type { HealthChecker } from '@/domain/external/health-checker';
import { PostgresHealthChecker } from '@/infrastructure/external/health-checker/postgres-health-checker';
import { RedisHealthChecker } from '@/infrastructure/external/health-checker/redis-health-checker';
import type { Logger } from '@/infrastructure/logging';

export class StatusService {
  private readonly healthCheckers: Array<HealthChecker> = [];

  constructor(private readonly logger: Logger) {
    const pgHealthChecker = new PostgresHealthChecker(this.logger);
    const redisHealthChecker = new RedisHealthChecker(this.logger);
    this.healthCheckers.push(pgHealthChecker, redisHealthChecker);
  }

  async checkAll() {
    return Promise.all(
      this.healthCheckers.map((checker) =>
        checker.check().catch((error) => {
          return {
            service: checker.service,
            status: 'error',
            details: JSON.stringify(error),
          };
        }),
      ),
    );
  }
}
