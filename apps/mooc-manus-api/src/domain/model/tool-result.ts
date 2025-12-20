import { z } from 'zod';

export const createToolResultSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
) => {
  return z.object({
    success: z.boolean().default(true),
    message: z.string().nullable().default(null),
    data: dataSchema,
  });
};

export type ToolResult = z.infer<ReturnType<typeof createToolResultSchema>>;
