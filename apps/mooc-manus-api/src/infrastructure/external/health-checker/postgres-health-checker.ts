import type { HealthChecker } from '@/domain/external/health-checker';
import type { HealthStatus } from '@/domain/model/health-status';
import type { Logger } from '@/infrastructure/logging';
import { databaseClient } from '@/infrastructure/storage/database';

export class PostgresHealthChecker implements HealthChecker {
  readonly service = 'postgres';

  constructor(private readonly logger: Logger) {}

  async check(): Promise<HealthStatus> {
    try {
      await databaseClient.$queryRaw`SELECT 1`;
      return {
        service: this.service,
        status: 'ok',
        details: '',
      };
    } catch (error) {
      this.logger.error('Failed to check postgres health', { error });
      return {
        service: this.service,
        status: 'error',
        details: JSON.stringify(error),
      };
    }
  }
}
