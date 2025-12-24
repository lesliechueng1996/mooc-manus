import { z } from 'zod';

export const healthStatusSchema = z.object({
  service: z.string().default(''),
  status: z.enum(['ok', 'error']).default('ok'),
  details: z.string().default(''),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
