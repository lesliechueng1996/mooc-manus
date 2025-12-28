import { createSuccessResponse } from '@repo/common';
import { Elysia } from 'elysia';
import { SupervisorService } from '@/service/supervisor';
import { logger as loggerPlugin } from '../plugin/logger';
import {
  getProcessInfoResponseSchema,
  restartResponseSchema,
  shutdownResponseSchema,
  stopAllProcessesResponseSchema,
} from '../schema/supervisor';

export const supervisorRouter = new Elysia({
  name: 'supervisor-router',
  prefix: '/supervisor',
  tags: ['Supervisor'],
})
  .use(loggerPlugin)
  .get(
    '/status',
    async ({ logger }) => {
      const supervisorService = new SupervisorService(logger);
      const processInfo = await supervisorService.getAllProcessInfo();
      return createSuccessResponse(processInfo);
    },
    {
      response: {
        200: getProcessInfoResponseSchema,
      },
      detail: {
        summary: 'Get process info',
      },
    },
  )
  .post(
    '/stop-all-processes',
    async ({ logger }) => {
      const supervisorService = new SupervisorService(logger);
      const result = await supervisorService.stopAllProcesses();
      return createSuccessResponse(result);
    },
    {
      response: {
        200: stopAllProcessesResponseSchema,
      },
      detail: {
        summary: 'Stop all processes',
      },
    },
  )
  .post(
    '/shutdown',
    async ({ logger }) => {
      const supervisorService = new SupervisorService(logger);
      const result = await supervisorService.shutdown();
      return createSuccessResponse(result);
    },
    {
      response: {
        200: shutdownResponseSchema,
      },
      detail: {
        summary: 'Shutdown supervisor',
      },
    },
  )
  .post(
    '/restart',
    async ({ logger }) => {
      const supervisorService = new SupervisorService(logger);
      const result = await supervisorService.restart();
      return createSuccessResponse(result);
    },
    {
      response: {
        200: restartResponseSchema,
      },
      detail: {
        summary: 'Restart supervisor',
      },
    },
  );
