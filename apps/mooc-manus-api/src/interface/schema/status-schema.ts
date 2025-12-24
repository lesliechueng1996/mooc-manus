import { z } from 'zod';
import { createSuccessResponseSchema } from './common';

export const getStatusResponseSchema = createSuccessResponseSchema(
  z.array(
    z.object({
      service: z.string().describe('The name of the service'),
      status: z
        .string()
        .describe('The status of the service, one of ok, error'),
      details: z.string().describe('The details of the service'),
    }),
  ),
);
