import { z } from 'zod';

export const messageSchema = z.object({
  message: z.string().default(''),
  attachments: z.array(z.string()).default([]),
});

export type Message = z.infer<typeof messageSchema>;
