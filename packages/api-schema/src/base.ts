import { z } from 'zod';

export const responseSchema = z.object({
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export type ResponseSchema = z.infer<typeof responseSchema>;

export const createSuccessResponse = (data: object) => {
  return responseSchema.parse({
    message: 'success',
    data,
  });
};
