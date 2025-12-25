import { homedir } from 'node:os';
import { createSuccessResponse } from '@repo/common';
import { Elysia } from 'elysia';
import { ShellService } from '@/service/shell';
import { logger as loggerPlugin } from '../plugin/logger';
import {
  execCommandRequestSchema,
  execCommandResponseSchema,
  shellKillRequestSchema,
  shellKillResponseSchema,
  viewShellRequestSchema,
  viewShellResponseSchema,
  waitForProcessRequestSchema,
  waitForProcessResponseSchema,
  writeToProcessRequestSchema,
  writeToProcessResponseSchema,
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
  )
  .post(
    '/view-shell',
    async ({ body, logger }) => {
      const { sessionId, console } = body;
      const shellService = new ShellService(logger);
      const result = shellService.viewShell(sessionId, console);
      return createSuccessResponse(result);
    },
    {
      body: viewShellRequestSchema,
      response: {
        200: viewShellResponseSchema,
      },
    },
  )
  .post(
    '/wait-for-process',
    async ({ body, logger }) => {
      const { sessionId, seconds } = body;
      const shellService = new ShellService(logger);
      const result = await shellService.waitForProcess(sessionId, seconds);
      return createSuccessResponse(result);
    },
    {
      body: waitForProcessRequestSchema,
      response: {
        200: waitForProcessResponseSchema,
      },
    },
  )
  .post(
    '/write-to-process',
    async ({ body, logger }) => {
      const { sessionId, inputText, pressEnter } = body;
      const shellService = new ShellService(logger);
      const result = await shellService.writeToProcess(
        sessionId,
        inputText,
        pressEnter,
      );
      return createSuccessResponse(result);
    },
    {
      body: writeToProcessRequestSchema,
      response: {
        200: writeToProcessResponseSchema,
      },
    },
  )
  .post(
    '/kill-process',
    async ({ body, logger }) => {
      const { sessionId } = body;
      const shellService = new ShellService(logger);
      const result = await shellService.killProcess(sessionId);
      return createSuccessResponse(result);
    },
    {
      body: shellKillRequestSchema,
      response: {
        200: shellKillResponseSchema,
      },
    },
  );
