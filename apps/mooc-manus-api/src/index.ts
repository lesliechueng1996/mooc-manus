import { fromTypes, openapi } from '@elysiajs/openapi';
import {
  BaseException,
  createAPILoggerConfiguration,
  createErrorResponse,
  getLogger,
} from '@repo/common';
import { Elysia } from 'elysia';
import { appConfigRouter } from '@/interface/endpoint/app-config-router';
import { httpLog } from './interface/plugin/http-log';
import { logger as loggerPlugin } from './interface/plugin/logger';
import { requestId } from './interface/plugin/request-id';
import { userId } from './interface/plugin/user-id';

await createAPILoggerConfiguration();
const logger = getLogger();

const apiRouter = new Elysia({
  prefix: '/api',
})
  .use(loggerPlugin)
  .use(requestId)
  .use(httpLog)
  .use(userId)
  .onError(({ error, status, logger }) => {
    if (error instanceof BaseException) {
      logger.error('App error occurred', { error });
      return status(error.code, createErrorResponse(error.code, error.message));
    }

    logger.error('Unhandled error occurred', { error });
    return status(500, createErrorResponse(500, 'Internal server error'));
  })
  .get('/', () => {
    logger.info('Hello Elysia');
    return 'Hello Elysia';
  })
  .use(appConfigRouter);

const app = new Elysia()
  .use(
    openapi({
      references: fromTypes(),
    }),
  )
  .use(apiRouter)
  .listen(3000);

logger.info(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
