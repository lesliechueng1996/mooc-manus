import type { HealthStatus } from '../model/health-status';

export interface HealthChecker {
  service: string;
  check(): Promise<HealthStatus>;
}
