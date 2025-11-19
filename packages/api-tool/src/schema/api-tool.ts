import { z } from 'zod';

export const createApiToolReqSchema = z.object({
  name: z
    .string({ message: 'Tool name should be a string' })
    .min(1, { message: 'Tool name is required' })
    .max(30, { message: 'Tool name should be less than 30 characters' }),
  icon: z.url({ message: 'Tool icon should be a url' }),
  openapiSchema: z.string({ message: 'openapiSchema should be a string' }),
  headers: z.array(
    z.object({
      key: z.string({ message: 'Header key should be a string' }),
      value: z.string({ message: 'Header value should be a string' }),
    }),
  ),
});

export type CreateApiToolReq = z.infer<typeof createApiToolReqSchema>;
