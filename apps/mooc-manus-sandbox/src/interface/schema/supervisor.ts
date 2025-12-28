import { createSuccessResponseSchema } from '@repo/common/schemas';
import { z } from 'zod';

export const getProcessInfoResponseSchema = createSuccessResponseSchema(
  z.array(
    z.object({
      name: z.string().describe('Process name'),
      group: z.string().describe('Process group'),
      description: z.string().describe('Process description'),
      start: z.number().describe('Process start time'),
      stop: z.number().describe('Process stop time'),
      now: z.number().describe('Current timestamp'),
      state: z.number().describe('Process state'),
      statename: z.string().describe('Process state name'),
      spawnerr: z.string().describe('Process spawn error'),
      exitstatus: z.number().describe('Process exit status'),
      logfile: z.string().describe('Process log file'),
      stdoutLogfile: z.string().describe('Process stdout log file'),
      stderrLogfile: z.string().describe('Process stderr log file'),
      pid: z.number().describe('Process PID'),
    }),
  ),
);

const supervisorActionResult = z.object({
  status: z.string().describe('Execution status'),
  result: z.any().describe('Execution result'),
  stopResult: z.any().describe('Stop result'),
  startResult: z.any().describe('Start result'),
  shutdownResult: z.any().describe('Shutdown result'),
});

export const stopAllProcessesResponseSchema = createSuccessResponseSchema(
  supervisorActionResult,
);

export const shutdownResponseSchema = createSuccessResponseSchema(
  supervisorActionResult,
);

export const restartResponseSchema = createSuccessResponseSchema(
  supervisorActionResult,
);
