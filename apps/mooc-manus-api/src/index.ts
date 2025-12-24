import { fromTypes, openapi } from '@elysiajs/openapi';
import {
  BaseException,
  createAPILoggerConfiguration,
  createErrorResponse,
  getLogger,
  type LogLevel,
} from '@repo/common';
import { Elysia } from 'elysia';
import { z } from 'zod';
import { appConfigRouter } from '@/interface/endpoint/app-config-router';
import { statusRouter } from './interface/endpoint/status-router';
import { httpLog } from './interface/plugin/http-log';
import { logger as loggerPlugin } from './interface/plugin/logger';
import { requestId } from './interface/plugin/request-id';
import { userId } from './interface/plugin/user-id';

await createAPILoggerConfiguration(process.env.LOG_LEVEL as LogLevel);
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
      .get('/', ({ logger }) => {
        logger.info('Hello Elysia');
        return 'Hello Elysia';
      })
      .use(appConfigRouter)
      .use(statusRouter);
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
          title: 'Mooc Manus API',
          version: '1.0.0',
          description: 'Mooc Manus API',
        },
      },
    }),
  )
  .use(apiRouter)
  .listen(8080);

logger.info(
  `🦊 Mooc Manus API is running at ${app.server?.hostname}:${app.server?.port}`,
);
