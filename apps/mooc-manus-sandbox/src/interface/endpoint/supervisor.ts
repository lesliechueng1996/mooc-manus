import { createSuccessResponse } from '@repo/common';
import { Elysia } from 'elysia';
import { SupervisorService } from '@/service/supervisor';
import { logger as loggerPlugin } from '../plugin/logger';
import { getProcessInfoResponseSchema } from '../schema/supervisor';

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
      return createSuccessResponse(processInfo.map((item) => item.format()));
    },
    {
      response: {
        200: getProcessInfoResponseSchema,
      },
      detail: {
        summary: 'Get process info',
      },
    },
  );
