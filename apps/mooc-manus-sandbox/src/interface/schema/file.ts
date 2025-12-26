import { z } from 'zod';
import { createSuccessResponseSchema } from '@repo/common';

export const readFileRequestSchema = z.object({
  filepath: z.string().describe('Absolute path of the file to read'),
  startLine: z
    .int()
    .optional()
    .nullable()
    .default(null)
    .describe('Starting line to read, index starts from 0'),
  endLine: z
    .int()
    .optional()
    .nullable()
    .default(null)
    .describe('Ending line number, exclusive'),
  sudo: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to use sudo permission to read the file'),
  maxLength: z
    .int()
    .optional()
    .nullable()
    .default(10000)
    .describe('Maximum length of file content to read, default is 10000'),
});

export const readFileResponseSchema = createSuccessResponseSchema(
  z.object({
    filepath: z.string().describe('The path of the file to read'),
    content: z.string().describe('The content of the file'),
  }),
);
