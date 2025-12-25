import { createSuccessResponseSchema } from '@repo/common';
import { z } from 'zod';

export const execCommandRequestSchema = z.object({
  sessionId: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe('Unique identifier for the target shell session'),
  execDir: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe(
      'Working directory for command execution (must be an absolute path)',
    ),
  command: z.string().describe('The shell command to execute'),
});

export const execCommandResponseSchema = createSuccessResponseSchema(
  z.object({
    sessionId: z
      .string()
      .describe('Unique identifier for the target shell session'),
    command: z.string().describe('The shell command to execute'),
    status: z.string().describe('The status of the command execution'),
    returnCode: z
      .int()
      .optional()
      .describe(
        'The return code of the process, only available when the process is finished',
      ),
    output: z
      .string()
      .optional()
      .describe(
        'The output of the process, only available when the process is finished',
      ),
  }),
);
