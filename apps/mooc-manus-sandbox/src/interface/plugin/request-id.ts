import { randomUUIDv7 } from 'bun';
import { Elysia } from 'elysia';
import { isApiPath } from './http-log';
import { logger as loggerPlugin } from './logger';

export const requestId = new Elysia({ name: 'requestId' })
  .use(loggerPlugin)
  .onRequest(({ set, logger, request }) => {
    if (!isApiPath(request.url)) {
      return;
    }
    let requestId = request.headers.get('x-request-id');
    if (!requestId) {
      requestId = randomUUIDv7();
    }
    logger.setRequestId(requestId);
    set.headers['x-request-id'] = requestId;
  })
  .derive(({ set }) => {
    return {
      requestId: set.headers['x-request-id'],
    };
  })
  .as('scoped');
