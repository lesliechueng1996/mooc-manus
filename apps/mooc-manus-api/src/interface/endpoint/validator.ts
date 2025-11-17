import { zValidator as zv } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { z } from 'zod';
import { BadRequestException } from '@/application/error/exception';

export const zValidator = <
  T extends z.ZodTypeAny,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) =>
  zv(target, schema, (result) => {
    if (!result.success) {
      throw new BadRequestException(result.error.message);
    }
  });
