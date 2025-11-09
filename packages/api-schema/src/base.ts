import { z } from 'zod';

export const responseSchema = z.object({
  code: z.number(),
  msg: z.string().optional(),
  data: z.unknown().nullable().optional(),
});

export type ResponseSchema = z.infer<typeof responseSchema>;

export const createSuccessResponse = (data: object) => {
  return createResponse(200, 'success', data);
};

export const createErrorResponse = (code: number, msg: string) => {
  return createResponse(code, msg, null);
};

export const createResponse = (
  code: number,
  msg: string,
  data: object | null,
) => {
  return responseSchema.parse({
    code,
    msg,
    data,
  });
};
