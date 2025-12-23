import { createResponse, createSuccessResponse } from '@repo/common';
import Elysia from 'elysia';
import { StatusService } from '@/application/services/status-service';
import { logger as loggerPlugin } from '../plugin/logger';
import { getStatusResponseSchema } from '../schema/status-schema';

export const statusRouter = new Elysia({
  prefix: '/status',
  tags: ['Status'],
})
  .use(loggerPlugin)
  .get(
    '/',
    async ({ logger, status: returnStatus }) => {
      const statusService = new StatusService(logger);
      const status = await statusService.checkAll();
      if (status.some((s) => s.status === 'error')) {
        return returnStatus(
          503,
          createResponse(503, 'Service is not available', status),
        );
      }
      return createSuccessResponse(status);
    },
    {
      response: {
        200: getStatusResponseSchema,
        503: getStatusResponseSchema,
      },
      detail: {
        summary: 'Get status of all services',
      },
    },
  );
