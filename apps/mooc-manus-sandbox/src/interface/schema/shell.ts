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

export const viewShellRequestSchema = z.object({
  sessionId: z
    .string()
    .min(1)
    .describe('Unique identifier for the target shell session'),
  console: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include console records'),
});

export const viewShellResponseSchema = createSuccessResponseSchema(
  z.object({
    sessionId: z
      .string()
      .describe('Unique identifier for the target shell session'),
    output: z.string().describe('The output of the shell session'),
    consoleRecords: z
      .array(
        z.object({
          ps1: z.string().describe('The PS1 of the console record'),
          command: z.string().describe('The command of the console record'),
          output: z.string().describe('The output of the console record'),
        }),
      )
      .describe('The console records of the shell session'),
  }),
);

export const waitForProcessRequestSchema = z.object({
  sessionId: z
    .string()
    .min(1)
    .describe('Unique identifier for the target shell session'),
  seconds: z
    .int()
    .min(1)
    .optional()
    .default(60)
    .describe('The duration to wait for the process to finish'),
});

export const waitForProcessResponseSchema = createSuccessResponseSchema(
  z.object({
    sessionId: z
      .string()
      .describe('Unique identifier for the target shell session'),
    returnCode: z.int().nullable().describe('The return code of the process'),
  }),
);

export const writeToProcessRequestSchema = z.object({
  sessionId: z
    .string()
    .min(1)
    .describe('Unique identifier for the target shell session'),
  inputText: z
    .string()
    .min(1)
    .describe('The input text to write to the process'),
  pressEnter: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to press the Enter key after input'),
});

export const writeToProcessResponseSchema = createSuccessResponseSchema(
  z.object({
    sessionId: z
      .string()
      .describe('Unique identifier for the target shell session'),
    status: z.string().describe('The status of the process'),
  }),
);

export const shellKillRequestSchema = z.object({
  sessionId: z
    .string()
    .min(1)
    .describe('Unique identifier for the target shell session'),
});

export const shellKillResponseSchema = createSuccessResponseSchema(
  z.object({
    sessionId: z
      .string()
      .describe('Unique identifier for the target shell session'),
    status: z.string().describe('The status of the process'),
    returnCode: z.int().nullable().describe('The return code of the process'),
  }),
);
