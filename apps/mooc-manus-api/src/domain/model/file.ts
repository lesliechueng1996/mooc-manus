import { randomUUIDv7 } from 'bun';
import { z } from 'zod';

export const fileSchema = z.object({
  id: z.string().default(randomUUIDv7),
  filename: z.string().default(''),
  filepath: z.string().default(''),
  key: z.string().default(''),
  extension: z.string().default(''),
  mimeType: z.string().default(''),
  size: z.int().default(0),
});

export type File = z.infer<typeof fileSchema>;
