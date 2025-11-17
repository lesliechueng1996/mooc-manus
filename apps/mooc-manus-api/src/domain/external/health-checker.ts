import type { HealthStatus } from '../models/health-status';

export type HealthChecker = {
  service: string;
  check: () => Promise<HealthStatus>;
};
