import { z } from 'zod';

export const createSuccessResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
) => {
  return z.object({
    code: z.number(),
    msg: z.string().optional(),
    data: dataSchema,
  });
};
