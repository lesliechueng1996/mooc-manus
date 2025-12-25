import { homedir } from 'node:os';
import { createSuccessResponse } from '@repo/common';
import { Elysia } from 'elysia';
import { ShellService } from '@/service/shell';
import { logger as loggerPlugin } from '../plugin/logger';
import {
  execCommandRequestSchema,
  execCommandResponseSchema,
} from '../schema/shell';

export const shellRouter = new Elysia({
  name: 'shell-router',
  prefix: '/shell',
  tags: ['Shell'],
})
  .use(loggerPlugin)
  .post(
    '/exec-command',
    async ({ body, logger }) => {
      const { sessionId, execDir, command } = body;
      let finalSessionId = sessionId;
      if (!finalSessionId) {
        finalSessionId = ShellService.createSessionId({ logger });
      }

      let finalExecDir = execDir;
      if (!finalExecDir) {
        finalExecDir = homedir();
      }

      const shellService = new ShellService(logger);

      const result = await shellService.execCommand(
        finalSessionId,
        finalExecDir,
        command,
      );
      return createSuccessResponse(result);
    },
    {
      body: execCommandRequestSchema,
      response: {
        200: execCommandResponseSchema,
      },
    },
  );
