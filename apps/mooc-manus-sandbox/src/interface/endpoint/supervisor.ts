import { createSuccessResponse } from '@repo/common';
import { Elysia } from 'elysia';
import { disableExpand, SupervisorService } from '@/service/supervisor';
import { logger as loggerPlugin } from '../plugin/logger';
import {
  activateTimeoutRequestSchema,
  activateTimeoutResponseSchema,
  cancelTimeoutResponseSchema,
  extendTimeoutRequestSchema,
  extendTimeoutResponseSchema,
  getProcessInfoResponseSchema,
  getTimeoutStatusResponseSchema,
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
  )
  .post(
    '/activate-timeout',
    async ({ body, logger }) => {
      const supervisorService = new SupervisorService(logger);
      const result = await supervisorService.activateTimeout(body.minutes);
      disableExpand();
      return createSuccessResponse(result);
    },
    {
      body: activateTimeoutRequestSchema,
      response: {
        200: activateTimeoutResponseSchema,
      },
      detail: {
        summary: 'Activate timeout',
      },
    },
  )
  .post(
    '/extend-timeout',
    async ({ body, logger }) => {
      const supervisorService = new SupervisorService(logger);
      const result = await supervisorService.extendTimeout(body.minutes);
      disableExpand();
      return createSuccessResponse(result);
    },
    {
      body: extendTimeoutRequestSchema,
      response: {
        200: extendTimeoutResponseSchema,
      },
      detail: {
        summary: 'Extend timeout',
      },
    },
  )
  .post(
    '/cancel-timeout',
    async ({ logger }) => {
      const supervisorService = new SupervisorService(logger);
      const result = await supervisorService.cancelTimeout();
      return createSuccessResponse(result);
    },
    {
      response: {
        200: cancelTimeoutResponseSchema,
      },
      detail: {
        summary: 'Cancel timeout',
      },
    },
  )
  .get(
    '/timeout-status',
    async ({ logger }) => {
      const supervisorService = new SupervisorService(logger);
      const result = await supervisorService.getTimeoutStatus();
      return createSuccessResponse(result);
    },
    {
      response: {
        200: getTimeoutStatusResponseSchema,
      },
      detail: {
        summary: 'Get timeout status',
      },
    },
  );
