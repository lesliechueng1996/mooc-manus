import type { HealthStatus } from '../models/health-status.js';

export type HealthChecker = {
  service: string;
  check: () => Promise<HealthStatus>;
};
