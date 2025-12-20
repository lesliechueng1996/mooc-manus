import { randomUUIDv7 } from 'bun';
import { Elysia } from 'elysia';
import { logger as loggerPlugin } from './logger';
import { isApiPath } from './http-log';

export const requestId = new Elysia({ name: 'requestId' })
  .use(loggerPlugin)
  .onRequest(({ set, logger, request }) => {
    if (!isApiPath(request.url)) {
      return;
    }
    const reqId = randomUUIDv7();
    logger.setRequestId(reqId);
    set.headers['X-Request-Id'] = reqId;
  })
  .derive(({ set }) => {
    return {
      requestId: set.headers['X-Request-Id'],
    };
  })
  .as('scoped');
