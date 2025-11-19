import { z } from 'zod';

export const generateCredentialReqSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
});
