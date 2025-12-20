import { Elysia } from 'elysia';
import { logger as loggerPlugin } from './logger';

export const isApiPath = (url: string): boolean => {
  const pathname = new URL(url).pathname;
  return pathname.startsWith('/api');
};

export const httpLog = new Elysia({ name: 'httpLog' })
  .use(loggerPlugin)
  .derive(() => {
    return {
      startTime: performance.now(),
    };
  })
  .onRequest(({ request, logger }) => {
    if (!isApiPath(request.url)) {
      return;
    }

    logger.info('HTTP request received: \nURL: {url}\nMethod: {method}', {
      url: request.url,
      method: request.method,
      headers: request.headers,
    });
  })
  .onAfterResponse(({ logger, set: { status }, startTime, request }) => {
    if (!isApiPath(request.url)) {
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    logger.info(
      'HTTP request completed: \nStatus: {status}\nDuration: {duration}ms',
      {
        duration: duration.toFixed(2),
        status,
      },
    );
  })
  .as('scoped');
