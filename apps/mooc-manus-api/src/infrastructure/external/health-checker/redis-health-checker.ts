import type { HealthChecker } from '@/domain/external/health-checker';
import type { HealthStatus } from '@/domain/model/health-status';
import type { Logger } from '@/infrastructure/logging';
import { RedisClient } from '@/infrastructure/storage/redis';

export class RedisHealthChecker implements HealthChecker {
  readonly service = 'redis';
  private readonly redisClient: RedisClient;

  constructor(private readonly logger: Logger) {
    this.redisClient = new RedisClient(logger);
  }

  async check(): Promise<HealthStatus> {
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const timeoutMs = 5000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Redis ping timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      await Promise.race([this.redisClient.ping(), timeoutPromise]);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      return {
        service: this.service,
        status: 'ok',
        details: '',
      };
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      this.logger.error('Failed to check redis health', { error });
      const details = error instanceof Error ? error.message : 'Unknown error';
      return {
        service: this.service,
        status: 'error',
        details,
      };
    }
  }
}
