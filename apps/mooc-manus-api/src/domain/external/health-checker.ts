import type { HealthStatus } from '../model/health-status';

export interface HealthChecker {
  check(): Promise<HealthStatus>;
}
