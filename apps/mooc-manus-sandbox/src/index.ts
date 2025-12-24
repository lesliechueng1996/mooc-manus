import openapi, { fromTypes } from '@elysiajs/openapi';
import { BaseException } from '@/interface/error/exception';
import {
  createErrorResponse,
  createSandboxLoggerConfiguration,
  getLogger,
  type LogLevel,
} from '@repo/common';
import { Elysia } from 'elysia';
import { z } from 'zod';
import { fileRouter } from './interface/endpoint/file-router';
import { shellRouter } from './interface/endpoint/shell-router';
import { supervisorRouter } from './interface/endpoint/supervisor';
import { userId } from './interface/plugin/user-id';
import { requestId } from './interface/plugin/request-id';
import { httpLog } from './interface/plugin/http-log';
import { logger as loggerPlugin } from './interface/plugin/logger';

await createSandboxLoggerConfiguration(process.env.LOG_LEVEL as LogLevel);
const logger = getLogger();

const apiRouter = new Elysia({ name: 'api-router' }).group(
  '/api',
  {
    headers: z.object({
      'x-user-id': z.string(),
      'x-request-id': z.string().optional(),
    }),
  },
  (app) => {
    return app
      .use(loggerPlugin)
      .use(requestId)
      .use(httpLog)
      .use(userId)
      .onError(({ code, error, status, logger }) => {
        if (code === 'VALIDATION') {
          logger.error('Validation error occurred', { error });
          return status(
            400,
            createErrorResponse(400, JSON.parse(error.message).summary),
          );
        }

        if (error instanceof BaseException) {
          logger.error('App error occurred', { error });
          return status(
            error.code,
            createErrorResponse(error.code, error.message),
          );
        }

        logger.error('Unhandled error occurred', { error });
        return status(500, createErrorResponse(500, 'Internal server error'));
      })
      .get('/', () => 'Hello Elysia')
      .use(supervisorRouter)
      .use(fileRouter)
      .use(shellRouter);
  },
);

const app = new Elysia()
  .use(
    openapi({
      references: fromTypes(),
      mapJsonSchema: {
        zod: z.toJSONSchema,
      },
      documentation: {
        info: {
          title: 'Mooc Manus Sandbox',
          version: '1.0.0',
          description: 'Mooc Manus Sandbox',
        },
      },
    }),
  )
  .use(apiRouter)
  .listen(8081);

logger.info(
  `🦊 Mooc Manus Sandbox is running at ${app.server?.hostname}:${app.server?.port}`,
);
